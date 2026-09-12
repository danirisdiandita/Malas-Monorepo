package imports

import (
	"bytes"
	"context"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	"github.com/danirisdiandita/malas-monorepo/api/ent/recipe"
	"github.com/danirisdiandita/malas-monorepo/api/internal/config"
	"github.com/danirisdiandita/malas-monorepo/api/internal/recipes"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/h2non/bimg"
	"github.com/lib/pq"
)

type Pipeline struct {
	DB      *ent.Client
	Config  *config.Config
	Storage *recipes.Storage
	Client  *http.Client
}

func (p *Pipeline) Create(r *http.Request, source, link string) (*ent.Recipe, error) {
	owner, err := recipes.OwnerID(p.DB, r)
	if err != nil {
		return nil, err
	}
	return p.DB.Recipe.Create().SetUserID(owner).SetName("Importing recipe").
		SetServings(0).SetProcessMinutes(0).SetIngredients(json.RawMessage("[]")).
		SetInstructions(pq.StringArray{}).SetTags(pq.StringArray{}).
		SetURL(link).SetSource(source).SetImportStatus(recipe.ImportStatusLooking).Save(r.Context())
}

// Receive acknowledges only after PostgreSQL has stored the callback. The worker
// resumes from these rows after a restart, independently of HTTP request timeouts.
func (p *Pipeline) Receive(w http.ResponseWriter, r *http.Request) {
	secret := r.Header.Get("X-Webhook-Secret")
	if secret == "" {
		secret = r.URL.Query().Get("secret")
	}
	if p.Config.ImportWebhookSecret == "" || subtle.ConstantTimeCompare([]byte(secret), []byte(p.Config.ImportWebhookSecret)) != 1 {
		http.Error(w, "unauthorized", 401)
		return
	}
	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 1<<20))
	var hook apifyWebhook
	if err != nil || json.Unmarshal(body, &hook) != nil || hook.Resource.ID == "" {
		http.Error(w, "invalid webhook", 400)
		return
	}
	var row *ent.Recipe
	if hook.RecipeID != "" {
		id, parseErr := uuid.Parse(hook.RecipeID)
		if parseErr != nil {
			http.Error(w, "invalid recipe ID", 400)
			return
		}
		row, err = p.DB.Recipe.Get(r.Context(), id)
	} else {
		row, err = p.DB.Recipe.Query().Where(recipe.WebhookID(hook.Resource.ID)).Only(r.Context())
	}
	if ent.IsNotFound(err) && hook.RecipeID == "" {
		r.Body = io.NopCloser(bytes.NewReader(body))
		HandleImportWebhook(p.Config.Apify.APIToken, p.Config.Apify.DebugDir, p.Config.ImportWebhookSecret)(w, r)
		return
	}
	if ent.IsNotFound(err) {
		http.NotFound(w, r)
		return
	}
	if err != nil {
		http.Error(w, "unable to load import", 500)
		return
	}
	if (row.WebhookID != "" && row.WebhookID != hook.Resource.ID) || row.Source != hook.Source {
		http.Error(w, "webhook does not match import", 409)
		return
	}
	if row.ImportStatus == recipe.ImportStatusDone {
		w.WriteHeader(204)
		return
	}
	terminalFailure := hook.Resource.Status == "FAILED" || hook.Resource.Status == "ABORTED" || hook.Resource.Status == "TIMED-OUT" || hook.Event == "ACTOR.RUN.FAILED"
	if !terminalFailure && hook.Resource.Status != "SUCCEEDED" {
		w.WriteHeader(204)
		return
	}
	if !terminalFailure && hook.Resource.DefaultDatasetID == "" {
		http.Error(w, "missing dataset ID", 400)
		return
	}
	update := p.DB.Recipe.Update().Where(recipe.ID(row.ID), recipe.ImportStatusEQ(recipe.ImportStatusLooking),
		recipe.ImportWebhookIsNil()).SetWebhookID(hook.Resource.ID).SetImportWebhook(body)
	if terminalFailure {
		update.SetImportStatus(recipe.ImportStatusFailed).SetImportError("The source could not be downloaded. Please try another link.")
	}
	if _, err = update.Save(r.Context()); err != nil {
		http.Error(w, "unable to save webhook", 500)
		return
	}
	w.WriteHeader(http.StatusAccepted)
}

func (p *Pipeline) Status(w http.ResponseWriter, r *http.Request) {
	owner, err := recipes.OwnerID(p.DB, r)
	if err != nil {
		http.Error(w, "unauthorized", 401)
		return
	}
	row, err := p.DB.Recipe.Query().Where(recipe.UserID(owner), recipe.WebhookID(chi.URLParam(r, "runID"))).Only(r.Context())
	if ent.IsNotFound(err) {
		http.NotFound(w, r)
		return
	}
	if err != nil {
		http.Error(w, "unable to load import", 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	_ = json.NewEncoder(w).Encode(map[string]any{"run_id": row.WebhookID, "recipe_id": row.ID,
		"status": row.ImportStatus, "error": row.ImportError})
}

func (p *Pipeline) Retry(w http.ResponseWriter, r *http.Request) {
	owner, err := recipes.OwnerID(p.DB, r)
	if err != nil {
		http.Error(w, "unauthorized", 401)
		return
	}
	n, err := p.DB.Recipe.Update().Where(recipe.UserID(owner), recipe.WebhookID(chi.URLParam(r, "runID")),
		recipe.ImportStatusEQ(recipe.ImportStatusFailed), recipe.ImportWebhookNotNil(), recipe.RawSourcePayloadNotNil()).
		SetImportStatus(recipe.ImportStatusMaking).ClearImportError().ClearProcessingAt().Save(r.Context())
	if err != nil {
		http.Error(w, "unable to retry", 500)
		return
	}
	if n == 0 {
		http.Error(w, "This import cannot be retried. Please submit the link again.", 409)
		return
	}
	w.WriteHeader(202)
}

func (p *Pipeline) Run(ctx context.Context) {
	// ponytail: one extraction at a time per API process; add dedicated workers if queue volume grows.
	timer := time.NewTicker(2 * time.Second)
	defer timer.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-timer.C:
		}
		_, err := p.DB.Recipe.Update().Where(recipe.ImportStatusEQ(recipe.ImportStatusLooking),
			recipe.ImportWebhookIsNil(), recipe.CreatedAtLT(time.Now().Add(-20*time.Minute))).
			SetImportStatus(recipe.ImportStatusFailed).SetImportError("The source took too long to respond. Please submit the link again.").Save(ctx)
		if err != nil {
			log.Printf("import timeout check: %v", err)
			continue
		}
		available := recipe.Or(recipe.ProcessingAtIsNil(), recipe.ProcessingAtLT(time.Now().Add(-10*time.Minute)))
		row, err := p.DB.Recipe.Query().Where(recipe.ImportWebhookNotNil(),
			recipe.ImportStatusIn(recipe.ImportStatusLooking, recipe.ImportStatusMaking), available).Order(ent.Asc(recipe.FieldCreatedAt)).First(ctx)
		if ent.IsNotFound(err) {
			continue
		}
		if err != nil {
			log.Printf("import queue: %v", err)
			continue
		}
		n, err := p.DB.Recipe.Update().Where(recipe.ID(row.ID), available,
			recipe.ImportStatusIn(recipe.ImportStatusLooking, recipe.ImportStatusMaking)).
			SetProcessingAt(time.Now()).Save(ctx)
		if err != nil || n == 0 {
			continue
		}
		jobCtx, cancel := context.WithTimeout(ctx, 5*time.Minute)
		err = p.process(jobCtx, row)
		cancel()
		if err != nil {
			log.Printf("recipe import %s failed: %v", row.ID, err)
			if ctx.Err() != nil {
				cleanup, stop := context.WithTimeout(context.Background(), 5*time.Second)
				_ = p.DB.Recipe.UpdateOneID(row.ID).ClearProcessingAt().Exec(cleanup)
				stop()
				return
			}
			p.Fail(ctx, row.ID, "We couldn't create this recipe. Try again or use another link.")
		}
	}
}

func (p *Pipeline) Fail(ctx context.Context, id uuid.UUID, message string) {
	if err := p.DB.Recipe.UpdateOneID(id).SetImportStatus(recipe.ImportStatusFailed).
		SetImportError(message).ClearProcessingAt().Exec(ctx); err != nil {
		log.Printf("save failed import %s: %v", id, err)
	}
}

func (p *Pipeline) process(ctx context.Context, row *ent.Recipe) error {
	var hook apifyWebhook
	if err := json.Unmarshal(row.ImportWebhook, &hook); err != nil {
		return err
	}
	dataset := row.RawSourcePayload
	if len(dataset) == 0 {
		data, err := getJSON(ctx, p.Client, "https://api.apify.com/v2/datasets/"+url.PathEscape(hook.Resource.DefaultDatasetID)+"/items?clean=true", p.Config.Apify.APIToken)
		if err != nil {
			return fmt.Errorf("fetch dataset: %w", err)
		}
		dataset = data
	}
	var items []any
	if err := json.Unmarshal(dataset, &items); err != nil || len(items) == 0 {
		return fmt.Errorf("empty or invalid dataset")
	}
	if err := p.DB.Recipe.UpdateOneID(row.ID).SetRawSourcePayload(dataset).
		SetImportStatus(recipe.ImportStatusMaking).Exec(ctx); err != nil {
		return err
	}
	folder := filepath.Join(p.Config.Apify.DebugDir, safeName(row.Source)+"_"+safeName(hook.Resource.ID))
	if err := os.MkdirAll(filepath.Join(folder, "assets"), 0700); err != nil {
		return err
	}
	for name, data := range map[string][]byte{"dataset.json": dataset, "webhook.json": row.ImportWebhook} {
		if err := os.WriteFile(filepath.Join(folder, name), data, 0600); err != nil {
			return err
		}
	}
	if hook.ContentType != string(TikTokPhoto) {
		return fmt.Errorf("recipe extraction currently requires a TikTok photo post")
	}
	assets := collectImagePostAssetURLs(items)
	if len(assets) == 0 {
		return fmt.Errorf("post contains no recipe photos")
	}
	for i := range assets {
		assets[i].File, assets[i].Error = downloadAsset(ctx, p.Client, assets[i].URL, filepath.Join(folder, "assets"), i)
		if assets[i].Error != "" {
			return fmt.Errorf("download image %d failed", i+1)
		}
	}
	final := buildFinalJSON(items, hook.ContentType, assets)
	for name, value := range map[string]any{"assets.json": assets, "final.json": final} {
		data, err := json.MarshalIndent(value, "", "  ")
		if err != nil {
			return err
		}
		if err = os.WriteFile(filepath.Join(folder, name), data, 0600); err != nil {
			return err
		}
	}
	paths := make([]string, len(assets))
	for i, a := range assets {
		paths[i] = filepath.Join(folder, a.File)
	}
	combined, err := stackPhotos(paths)
	if err != nil {
		return err
	}
	extracted, err := p.extract(ctx, final, combined)
	if err != nil {
		return err
	}
	original, err := os.ReadFile(paths[0])
	if err != nil {
		return err
	}
	compressed, err := compressImage(original)
	if err != nil {
		return fmt.Errorf("compress cover: %w", err)
	}
	if p.Storage == nil {
		return fmt.Errorf("image storage is not configured")
	}
	key := fmt.Sprintf("recipes/%d/%s/cover.webp", row.UserID, row.ID)
	if err = p.Storage.Upload(ctx, key, bytes.NewReader(compressed), int64(len(compressed)), "image/webp"); err != nil {
		return fmt.Errorf("upload cover: %w", err)
	}
	ingredients, err := json.Marshal(extracted.Ingredients)
	if err != nil {
		return err
	}
	return p.DB.Recipe.UpdateOneID(row.ID).SetName(strings.TrimSpace(extracted.Name)).
		SetServings(extracted.Servings).SetProcessMinutes(extracted.ProcessMinutes).
		SetIngredients(ingredients).SetInstructions(pq.StringArray(extracted.Instructions)).
		SetTags(pq.StringArray(extracted.Tags)).SetNotes(extracted.Notes).SetImageS3Key(key).
		SetImportStatus(recipe.ImportStatusDone).ClearImportError().ClearProcessingAt().Exec(ctx)
}

func compressImage(input []byte) ([]byte, error) {
	size, err := bimg.Size(input)
	if err != nil {
		return nil, err
	}
	const maxDimension = 1600
	width, height := size.Width, size.Height
	if width > maxDimension || height > maxDimension {
		scale := float64(maxDimension) / float64(width)
		if height > width {
			scale = float64(maxDimension) / float64(height)
		}
		width, height = int(float64(width)*scale), int(float64(height)*scale)
	}
	return bimg.NewImage(input).Process(bimg.Options{
		Width: width, Height: height, Quality: 80, Type: bimg.WEBP,
		StripMetadata: true, Enlarge: false,
	})
}
