package imports

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	"github.com/danirisdiandita/malas-monorepo/api/ent/recipe"
	"github.com/danirisdiandita/malas-monorepo/api/internal/config"
	"github.com/danirisdiandita/malas-monorepo/api/internal/recipes"
	"github.com/go-chi/chi/v5"
	"github.com/go-pkgz/auth/v2/token"
	"github.com/google/uuid"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestStackPhotosOrder(t *testing.T) {
	dir := t.TempDir()
	paths := []string{}
	for i, c := range []color.RGBA{{R: 255, A: 255}, {B: 255, A: 255}} {
		img := image.NewRGBA(image.Rect(0, 0, 20, 20))
		for y := 0; y < 20; y++ {
			for x := 0; x < 20; x++ {
				img.Set(x, y, c)
			}
		}
		path := filepath.Join(dir, fmt.Sprintf("%d.png", i))
		f, err := os.Create(path)
		if err != nil {
			t.Fatal(err)
		}
		err = png.Encode(f, img)
		f.Close()
		if err != nil {
			t.Fatal(err)
		}
		paths = append(paths, path)
	}
	data, err := stackPhotos(paths)
	if err != nil {
		t.Fatal(err)
	}
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		t.Fatal(err)
	}
	if img.Bounds().Dx() != 20 || img.Bounds().Dy() != 40 {
		t.Fatal(img.Bounds())
	}
	r, _, b, _ := img.At(10, 5).RGBA()
	if r <= b {
		t.Fatal("first photo was not on top")
	}
	r, _, b, _ = img.At(10, 35).RGBA()
	if b <= r {
		t.Fatal("second photo was not on bottom")
	}
	if _, err := stackPhotos(nil); err == nil {
		t.Fatal("accepted empty photos")
	}
}

// TEST_DATABASE_URL must identify a test database. Each run uses an isolated
// schema, executes the actual migrations, and removes only that schema.
func TestWebhookRecipeIntegration(t *testing.T) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("set TEST_DATABASE_URL for PostgreSQL integration")
	}
	root, err := sql.Open("postgres", dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer root.Close()
	namespace := "import_test_" + strings.ReplaceAll(uuid.NewString(), "-", "")
	if _, err = root.Exec("CREATE SCHEMA " + namespace); err != nil {
		t.Fatal(err)
	}
	defer root.Exec("DROP SCHEMA " + namespace + " CASCADE")
	u, err := url.Parse(dsn)
	if err != nil {
		t.Fatal(err)
	}
	q := u.Query()
	q.Set("search_path", namespace+",public")
	u.RawQuery = q.Encode()
	conn, err := sql.Open("postgres", u.String())
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	migrations, err := filepath.Glob("../../ent/migrate/migrations/*.sql")
	if err != nil {
		t.Fatal(err)
	}
	for _, path := range migrations {
		data, err := os.ReadFile(path)
		if err != nil {
			t.Fatal(err)
		}
		if _, err = conn.Exec(string(data)); err != nil {
			t.Fatalf("%s: %v", path, err)
		}
	}
	db, err := ent.Open("postgres", u.String())
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	ctx := context.Background()
	owner, err := db.User.Create().SetEmail("owner@example.test").SetName("Owner").Save(ctx)
	if err != nil {
		t.Fatal(err)
	}
	_, err = db.Account.Create().SetProvider("test").SetProviderAccountID("test_owner").SetUserID(owner.ID).Save(ctx)
	if err != nil {
		t.Fatal(err)
	}
	stranger, err := db.User.Create().SetEmail("other@example.test").SetName("Other").Save(ctx)
	if err != nil {
		t.Fatal(err)
	}
	_, err = db.Account.Create().SetProvider("test").SetProviderAccountID("test_other").SetUserID(stranger.ID).Save(ctx)
	if err != nil {
		t.Fatal(err)
	}
	var calls, puts atomic.Int32
	var imageData bytes.Buffer
	_ = png.Encode(&imageData, image.NewRGBA(image.Rect(0, 0, 20, 20)))
	fake := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "PUT" {
			puts.Add(1)
			b, _ := io.ReadAll(r.Body)
			if !bytes.Equal(b, imageData.Bytes()) {
				t.Error("cover must be the original first photo")
			}
			w.Header().Set("ETag", "\"test\"")
			w.WriteHeader(200)
			return
		}
		calls.Add(1)
		var req struct {
			Messages       []struct{ Content json.RawMessage }
			ResponseFormat struct {
				JSONSchema struct{ Schema json.RawMessage } `json:"json_schema"`
			} `json:"response_format"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Error(err)
		}
		if !bytes.Contains(req.ResponseFormat.JSONSchema.Schema, []byte("additionalProperties")) {
			t.Error("missing strict schema")
		}
		var parts []struct {
			Type     string
			ImageURL struct{ URL string } `json:"image_url"`
		}
		_ = json.Unmarshal(req.Messages[1].Content, &parts)
		if len(parts) != 2 || parts[1].Type != "image_url" {
			t.Error("expected one image")
		} else {
			b, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(parts[1].ImageURL.URL, "data:image/jpeg;base64,"))
			if err != nil {
				t.Error(err)
			}
			c, _, err := image.DecodeConfig(bytes.NewReader(b))
			if err != nil || c.Height != 40 {
				t.Error("collage missing a photo")
			}
		}
		content := `{"name":"Test chicken","servings":2,"process_minutes":20,"ingredients":[{"name":"Chicken","quantity":200,"unit":"g"}],"instructions":["Cook the chicken."],"tags":["dinner"],"notes":""}`
		_ = json.NewEncoder(w).Encode(map[string]any{"choices": []any{map[string]any{"finish_reason": "stop", "message": map[string]string{"content": content}}}})
	}))
	defer fake.Close()
	storage, err := recipes.NewStorage(config.S3Config{Endpoint: fake.URL, Bucket: "test", AccessKey: "test", SecretKey: "test", Region: "auto"})
	if err != nil {
		t.Fatal(err)
	}
	cfg := &config.Config{ImportWebhookSecret: "secret", OpenRouterKey: "test", OpenRouterModel: "test", OpenRouterURL: fake.URL, Apify: config.ApifyConfig{DebugDir: t.TempDir()}}
	transport := roundTripFunc(func(r *http.Request) (*http.Response, error) {
		var data []byte
		switch r.URL.Host {
		case "api.apify.com":
			data = []byte(`[{"desc":"Test chicken","image_post_info":{"images":[{"thumbnail":{"url_list":["https://cdn.example/1.webp"]}},{"thumbnail":{"url_list":["https://cdn.example/2.webp"]}}]}}]`)
		case "cdn.example":
			data = imageData.Bytes()
		default:
			return http.DefaultTransport.RoundTrip(r)
		}
		return &http.Response{StatusCode: 200, Body: io.NopCloser(bytes.NewReader(data)), Header: make(http.Header), Request: r}, nil
	})
	p := &Pipeline{DB: db, Config: cfg, Storage: storage, Client: &http.Client{Transport: transport, Timeout: 5 * time.Second}}
	request := token.SetUserInfo(httptest.NewRequest("POST", "/imports/link", nil), token.User{ID: "test_owner"})
	row, err := p.Create(request, "tiktok", "https://www.tiktok.com/@cook/photo/1234567890123")
	if err != nil {
		t.Fatal(err)
	}
	hook := fmt.Sprintf(`{"recipe_id":"%s","source":"tiktok","content_type":"tiktok:photo","resource":{"id":"run-test","status":"SUCCEEDED","defaultDatasetId":"dataset-test"}}`, row.ID)
	deliver := func(secret string) int {
		r := httptest.NewRequest("POST", "/webhooks/import", strings.NewReader(hook))
		r.Header.Set("X-Webhook-Secret", secret)
		w := httptest.NewRecorder()
		p.Receive(w, r)
		return w.Code
	}
	if code := deliver("wrong"); code != 401 {
		t.Fatal(code)
	}
	if code := deliver("secret"); code != 202 {
		t.Fatal(code)
	}
	// Callback arrives before the launch request has saved its run ID.
	row, err = db.Recipe.Get(ctx, row.ID)
	if err != nil || row.WebhookID != "run-test" {
		t.Fatalf("%v %v", row, err)
	}
	if code := deliver("secret"); code != 202 {
		t.Fatal(code)
	}
	router := chi.NewRouter()
	router.Get("/imports/{runID}", p.Status)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, token.SetUserInfo(httptest.NewRequest("GET", "/imports/run-test", nil), token.User{ID: "test_other"}))
	if w.Code != 404 {
		t.Fatalf("cross-user status: %d", w.Code)
	}
	// A fresh Pipeline instance processes the persisted inbox, as after a restart.
	p = &Pipeline{DB: db, Config: cfg, Storage: storage, Client: p.Client}
	workerCtx, stop := context.WithCancel(ctx)
	stopped := make(chan struct{})
	go func() { defer close(stopped); p.Run(workerCtx) }()
	defer func() { stop(); <-stopped }()
	deadline := time.Now().Add(10 * time.Second)
	for {
		row, err = db.Recipe.Get(ctx, row.ID)
		if err != nil {
			t.Fatal(err)
		}
		if row.ImportStatus == recipe.ImportStatusDone {
			break
		}
		if row.ImportStatus == recipe.ImportStatusFailed || time.Now().After(deadline) {
			t.Fatalf("import %s: %s", row.ImportStatus, row.ImportError)
		}
		time.Sleep(50 * time.Millisecond)
	}
	if len(row.RawSourcePayload) == 0 || row.ImageS3Key == "" || len(row.Instructions) != 1 {
		t.Fatalf("incomplete saved recipe: %v", row)
	}
	if code := deliver("secret"); code != 204 {
		t.Fatal(code)
	}
	if calls.Load() != 1 || puts.Load() != 1 {
		t.Fatalf("duplicate extraction/upload: %d %d", calls.Load(), puts.Load())
	}
	router.Get("/recipes/{id}", recipes.StoredGet(db, storage))
	w = httptest.NewRecorder()
	router.ServeHTTP(w, token.SetUserInfo(httptest.NewRequest("GET", "/recipes/"+row.ID.String(), nil), token.User{ID: "test_owner"}))
	var result recipes.Recipe
	if err = json.Unmarshal(w.Body.Bytes(), &result); err != nil || w.Code != 200 {
		t.Fatalf("get recipe: %d %s", w.Code, w.Body.String())
	}
	signed, err := url.Parse(result.ImageURL)
	if err != nil || signed.Query().Get("X-Amz-Signature") == "" || signed.Query().Get("X-Amz-Expires") != "900" {
		t.Fatal("missing presigned URL")
	}
	w = httptest.NewRecorder()
	router.ServeHTTP(w, token.SetUserInfo(httptest.NewRequest("GET", "/recipes/"+row.ID.String(), nil), token.User{ID: "test_other"}))
	if w.Code != 404 {
		t.Fatal("cross-user recipe disclosure")
	}
}
