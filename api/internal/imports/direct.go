package imports

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/danirisdiandita/malas-monorepo/api/ent/recipe"
	"github.com/danirisdiandita/malas-monorepo/api/internal/recipes"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

func (p *Pipeline) HandlePhoto(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 15<<20)
	file, _, err := r.FormFile("photo")
	if err != nil {
		http.Error(w, "photo is required", http.StatusBadRequest)
		return
	}
	defer file.Close()
	input, err := io.ReadAll(file)
	if err != nil || len(input) == 0 {
		http.Error(w, "invalid photo", http.StatusBadRequest)
		return
	}
	p.saveDirect(w, r, "photo", map[string]any{"content_type": "photo", "description": "Recipe photo uploaded by the user."}, input)
}

func (p *Pipeline) HandleText(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var body struct {
		Text string `json:"text"`
	}
	if json.NewDecoder(io.LimitReader(r.Body, 64<<10)).Decode(&body) != nil || strings.TrimSpace(body.Text) == "" {
		http.Error(w, "text is required", http.StatusBadRequest)
		return
	}
	p.saveDirect(w, r, "text", map[string]any{"content_type": "text", "description": body.Text}, nil)
}

func (p *Pipeline) saveDirect(w http.ResponseWriter, r *http.Request, source string, final map[string]any, input []byte) {
	owner, err := recipes.OwnerID(p.DB, r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	id := uuid.New()
	folder := filepath.Join(p.Config.Apify.DebugDir, source+"_"+id.String())
	if err = os.MkdirAll(folder, 0700); err == nil {
		data, _ := json.MarshalIndent(final, "", "  ")
		_ = os.WriteFile(filepath.Join(folder, "input.json"), append(data, '\n'), 0600)
	}
	extracted, err := p.extract(r.Context(), final, input, nil, filepath.Join(folder, "prompt.json"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	cover, err := compressImage(input)
	if err != nil {
		http.Error(w, fmt.Sprintf("compress photo: %v", err), http.StatusBadRequest)
		return
	}
	if p.Storage == nil {
		http.Error(w, "image storage is not configured", http.StatusInternalServerError)
		return
	}
	created := make([]string, 0, len(extracted))
	for _, item := range extracted {
		ingredients, marshalErr := json.Marshal(item.Ingredients)
		if marshalErr != nil {
			http.Error(w, "invalid ingredients", http.StatusInternalServerError)
			return
		}
		row, createErr := p.DB.Recipe.Create().SetUserID(owner).SetName(strings.TrimSpace(item.Name)).
			SetServings(item.Servings).SetProcessMinutes(item.ProcessMinutes).SetIngredients(ingredients).
			SetInstructions(pq.StringArray(item.Instructions)).SetTags(pq.StringArray(item.Tags)).
			SetNotes(item.Notes).SetSource(source).SetImportStatus(recipe.ImportStatusDone).Save(r.Context())
		if createErr != nil {
			http.Error(w, "unable to save recipe", http.StatusInternalServerError)
			return
		}
		key := fmt.Sprintf("recipes/%d/%s/cover.webp", owner, row.ID)
		if err = p.Storage.Upload(r.Context(), key, bytes.NewReader(cover), int64(len(cover)), "image/webp"); err != nil {
			http.Error(w, "unable to save recipe image", http.StatusInternalServerError)
			return
		}
		if err = p.DB.Recipe.UpdateOneID(row.ID).SetImageS3Key(key).SetRawSourcePayload(json.RawMessage(mustJSON(final))).Exec(r.Context()); err != nil {
			http.Error(w, "unable to finish recipe", http.StatusInternalServerError)
			return
		}
		created = append(created, row.ID.String())
	}
	if strings.EqualFold(p.Config.Environment, "production") {
		_ = os.RemoveAll(folder)
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"recipe_id": created[0]})
}

func mustJSON(value any) []byte {
	data, _ := json.Marshal(value)
	return data
}
