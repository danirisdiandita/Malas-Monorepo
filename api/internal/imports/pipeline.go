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

type ImportPreferences struct {
	LanguageCode string
	FolderID     *uuid.UUID
}

func (p *Pipeline) Create(r *http.Request, source, link string, preferences ...ImportPreferences) (*ent.Recipe, error) {
	owner, err := recipes.OwnerID(p.DB, r)
	if err != nil {
		return nil, err
	}
	create := p.DB.Recipe.Create().SetUserID(owner).SetName("Importing recipe").
		SetServings(0).SetProcessMinutes(0).SetIngredients(json.RawMessage("[]")).
		SetInstructions(pq.StringArray{}).SetTags(pq.StringArray{}).
		SetURL(link).SetSource(source).SetImportStatus(recipe.ImportStatusLooking)
	if len(preferences) > 0 {
		if preferences[0].FolderID != nil {
			create.SetFolderID(*preferences[0].FolderID)
		}
		if preferences[0].LanguageCode != "" {
			create.SetLanguageCode(preferences[0].LanguageCode)
		}
	}
	return create.Save(r.Context())
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
	if !sameImportSource(row.Source, hook.Source) {
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
		recipe.ImportWebhookIsNil()).SetImportWebhook(body)
	// Keep the launch run ID used by the mobile status poller. The recipe_id in
	// the signed webhook payload identifies the import row; callbacks may carry
	// a different resource ID after an Apify retry/resurrection.
	if row.WebhookID == "" {
		update.SetWebhookID(hook.Resource.ID)
	}
	if terminalFailure {
		update.SetImportStatus(recipe.ImportStatusFailed).SetImportError("The source could not be downloaded. Please try another link.")
	}
	if _, err = update.Save(r.Context()); err != nil {
		http.Error(w, "unable to save webhook", 500)
		return
	}
	w.WriteHeader(http.StatusAccepted)
}

func sameImportSource(left, right string) bool {
	left = strings.ToLower(strings.TrimSpace(left))
	right = strings.ToLower(strings.TrimSpace(right))
	if left == right {
		return true
	}
	left, _, _ = strings.Cut(left, ":")
	right, _, _ = strings.Cut(right, ":")
	return left != "" && left == right
}

func (p *Pipeline) Status(w http.ResponseWriter, r *http.Request) {
	owner, err := recipes.OwnerID(p.DB, r)
	if err != nil {
		http.Error(w, "unauthorized", 401)
		return
	}
	rows, err := p.DB.Recipe.Query().Where(recipe.UserID(owner), recipe.WebhookID(chi.URLParam(r, "runID"))).Order(ent.Asc(recipe.FieldCreatedAt)).All(r.Context())
	if ent.IsNotFound(err) || len(rows) == 0 {
		http.NotFound(w, r)
		return
	}
	if err != nil {
		http.Error(w, "unable to load import", 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	status, importError := string(rows[0].ImportStatus), rows[0].ImportError
	recipes := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		if row.ImportStatus == recipe.ImportStatusFailed {
			status, importError = "failed", row.ImportError
		} else if row.ImportStatus != recipe.ImportStatusDone && status != "failed" {
			status = "making"
		}
		if row.ImportStatus == recipe.ImportStatusDone {
			item := map[string]any{"id": row.ID.String(), "name": row.Name}
			if row.ImageS3Key != "" && p.Storage != nil {
				if imageURL, signErr := p.Storage.ImageURL(r.Context(), row.ImageS3Key); signErr == nil {
					item["image_url"] = imageURL
				}
			}
			recipes = append(recipes, item)
		}
	}
	_ = json.NewEncoder(w).Encode(map[string]any{"run_id": rows[0].WebhookID, "recipe_id": rows[0].ID,
		"status": status, "error": importError, "recipes": recipes})
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
	isYouTube := strings.EqualFold(hook.ContentType, string(YouTubeVideo)) || strings.EqualFold(hook.ContentType, string(YouTubeShort))
	isInstagramReel := strings.EqualFold(hook.ContentType, string(InstagramReel))
	isPinterestPin := strings.EqualFold(hook.ContentType, string(PinterestPin))
	isWebPage := strings.EqualFold(hook.ContentType, string(WebPage))
	isVideo := strings.EqualFold(hook.ContentType, string(TikTokVideo)) || isFacebookReelContentType(hook.ContentType)
	assets := collectImagePostAssetURLs(items)
	if isVideo {
		assets = collectVideoAssetURLs(items)
	} else if isInstagramReel {
		assets = collectInstagramReelAssetURLs(items)
	} else if strings.EqualFold(hook.ContentType, "facebook:post") {
		assets = collectFacebookPostAssetURLs(items)
	} else if strings.EqualFold(hook.ContentType, string(InstagramPost)) {
		assets = collectInstagramAssetURLs(items)
	} else if isPinterestPin {
		assets = collectPinterestAssetURLs(items)
		for index := range assets {
			if isVideoAsset(assets[index].URL) {
				assets = []asset{assets[index]}
				break
			}
		}
	}
	if isYouTube {
		assets = nil
	}
	if len(assets) == 0 && !isYouTube && !isWebPage {
		return fmt.Errorf("post contains no downloadable media")
	}
	for i := range assets {
		assets[i].File, assets[i].Error = downloadAsset(ctx, p.Client, assets[i].URL, filepath.Join(folder, "assets"), i)
		if assets[i].Error != "" {
			return fmt.Errorf("download image %d failed", i+1)
		}
	}
	final := buildFinalJSON(items, hook.ContentType, assets)
	if row.LanguageCode != nil && *row.LanguageCode != "" {
		final["language_code"] = *row.LanguageCode
	}
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
	var extractionImage, coverSource, videoData []byte
	var err error
	if isYouTube {
		thumbnail := stringValue(final, "thumbnail_url")
		if thumbnail == "" {
			return fmt.Errorf("YouTube result contains no thumbnail")
		}
		extractionImage, err = fetchBytes(ctx, p.Client, thumbnail, 20<<20)
		if err != nil {
			return fmt.Errorf("fetch YouTube thumbnail: %w", err)
		}
		coverSource = extractionImage
	} else if isVideo {
		videoData, err = compressVideo(ctx, paths[0])
		if err != nil {
			return fmt.Errorf("prepare video for extraction: %w", err)
		}
		extractionImage, err = firstVideoFrame(ctx, paths[0])
		if err != nil {
			return err
		}
		coverSource = extractionImage
		if err = os.WriteFile(filepath.Join(folder, "assets", "first-frame.jpg"), extractionImage, 0600); err != nil {
			return fmt.Errorf("save first video frame: %w", err)
		}
	} else if isInstagramReel {
		if len(paths) == 0 {
			return fmt.Errorf("Instagram Reel contains no downloadable video")
		}
		extractionImage, err = firstVideoFrame(ctx, paths[0])
		if err != nil {
			return err
		}
		coverSource = extractionImage
		if err = os.WriteFile(filepath.Join(folder, "assets", "first-frame.jpg"), extractionImage, 0600); err != nil {
			return fmt.Errorf("save first video frame: %w", err)
		}
		// Instagram Reel extraction intentionally sends only text to GPT Luna.
		extractionImage = nil
	} else if isPinterestPin && len(assets) > 0 && isVideoAsset(assets[0].URL) {
		videoData, err = compressVideo(ctx, paths[0])
		if err != nil {
			return fmt.Errorf("prepare Pinterest video for extraction: %w", err)
		}
		extractionImage, err = firstVideoFrame(ctx, paths[0])
		if err != nil {
			return err
		}
		coverSource = extractionImage
	} else if isWebPage {
		// Website imports use crawler text/markdown and may have no image.
	} else {
		extractionImage, err = stackPhotos(paths)
		if err != nil {
			return err
		}
		coverSource, err = os.ReadFile(paths[0])
		if err != nil {
			return err
		}
	}
	extracted, err := p.extract(ctx, final, extractionImage, videoData, filepath.Join(folder, "prompt.json"))
	if err != nil {
		return err
	}
	var compressed []byte
	if len(coverSource) > 0 {
		compressed, err = compressImage(coverSource)
		if err != nil {
			return fmt.Errorf("compress cover: %w", err)
		}
	}
	if p.Storage == nil && len(compressed) > 0 {
		return fmt.Errorf("image storage is not configured")
	}
	for index, extractedRecipe := range extracted {
		target := row
		if index > 0 {
			create := p.DB.Recipe.Create().SetUserID(row.UserID).
				SetName("Importing recipe").SetServings(0).SetProcessMinutes(0).
				SetIngredients(json.RawMessage("[]")).SetInstructions(pq.StringArray{}).
				SetTags(pq.StringArray{}).SetURL(row.URL).SetSource(row.Source).
				SetWebhookID(hook.Resource.ID).SetImportWebhook(row.ImportWebhook).
				SetRawSourcePayload(dataset).SetImportStatus(recipe.ImportStatusDone)
			if row.FolderID != nil {
				create.SetFolderID(*row.FolderID)
			}
			if row.LanguageCode != nil {
				create.SetLanguageCode(*row.LanguageCode)
			}
			target, err = create.Save(ctx)
			if err != nil {
				return fmt.Errorf("create recipe %d: %w", index+1, err)
			}
		}
		ingredients, err := json.Marshal(extractedRecipe.Ingredients)
		if err != nil {
			return err
		}
		key := fmt.Sprintf("recipes/%d/%s/cover.webp", target.UserID, target.ID)
		if len(compressed) > 0 {
			if err = p.Storage.Upload(ctx, key, bytes.NewReader(compressed), int64(len(compressed)), "image/webp"); err != nil {
				return fmt.Errorf("upload cover: %w", err)
			}
		}
		update := p.DB.Recipe.UpdateOneID(target.ID).SetName(strings.TrimSpace(extractedRecipe.Name)).
			SetServings(extractedRecipe.Servings).SetProcessMinutes(extractedRecipe.ProcessMinutes).
			SetIngredients(ingredients).SetInstructions(pq.StringArray(extractedRecipe.Instructions)).
			SetTags(pq.StringArray(extractedRecipe.Tags)).SetNotes(extractedRecipe.Notes).
			SetImportStatus(recipe.ImportStatusDone).ClearImportError()
		if len(compressed) > 0 {
			update.SetImageS3Key(key)
		}
		if index == 0 {
			update.ClearProcessingAt()
		}
		if err = update.Exec(ctx); err != nil {
			return fmt.Errorf("save recipe %d: %w", index+1, err)
		}
	}
	if strings.EqualFold(p.Config.Environment, "production") {
		if err := os.RemoveAll(folder); err != nil {
			log.Printf("remove import debug folder %s: %v", folder, err)
		}
	}
	return nil
}

func fetchBytes(ctx context.Context, client *http.Client, rawURL string, maxBytes int64) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return nil, err
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("HTTP %s", resp.Status)
	}
	return io.ReadAll(io.LimitReader(resp.Body, maxBytes))
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
