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
	prefs, err := pipelinePreferences(r, p, r.FormValue("language_code"), r.FormValue("folder_id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	p.saveDirect(w, r, "photo", map[string]any{"content_type": "photo", "description": "Recipe photo uploaded by the user.", "language_code": prefs.LanguageCode}, input, prefs)
}

func (p *Pipeline) HandleText(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var body struct {
		Text         string `json:"text"`
		Mode         string `json:"mode"`
		LanguageCode string `json:"language_code"`
		FolderID     string `json:"folder_id"`
	}
	if json.NewDecoder(io.LimitReader(r.Body, 64<<10)).Decode(&body) != nil || strings.TrimSpace(body.Text) == "" {
		http.Error(w, "text is required", http.StatusBadRequest)
		return
	}
	if body.Mode == "" {
		body.Mode = "text"
	}
	if body.Mode != "text" && body.Mode != "ai" {
		http.Error(w, "invalid text import mode", http.StatusBadRequest)
		return
	}
	prefs, err := pipelinePreferences(r, p, body.LanguageCode, body.FolderID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	p.saveDirect(w, r, body.Mode, map[string]any{"content_type": body.Mode, "description": body.Text, "language_code": prefs.LanguageCode}, nil, prefs)
}

func (p *Pipeline) saveDirect(w http.ResponseWriter, r *http.Request, source string, final map[string]any, input []byte, prefs ImportPreferences) {
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
	var cover []byte
	if len(input) > 0 {
		cover, err = compressImage(input)
		if err != nil {
			http.Error(w, fmt.Sprintf("compress photo: %v", err), http.StatusBadRequest)
			return
		}
	}
	if len(cover) > 0 && p.Storage == nil {
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
		create := p.DB.Recipe.Create().SetUserID(owner).SetName(strings.TrimSpace(item.Name)).
			SetServings(item.Servings).SetProcessMinutes(item.ProcessMinutes).SetIngredients(ingredients).
			SetInstructions(pq.StringArray(item.Instructions)).SetTags(pq.StringArray(item.Tags)).
			SetNotes(item.Notes).SetSource(source).SetImportStatus(recipe.ImportStatusDone)
		if prefs.FolderID != nil {
			create.SetFolderID(*prefs.FolderID)
		}
		if prefs.LanguageCode != "" {
			create.SetLanguageCode(prefs.LanguageCode)
		}
		row, createErr := create.Save(r.Context())
		if createErr != nil {
			http.Error(w, "unable to save recipe", http.StatusInternalServerError)
			return
		}
		update := p.DB.Recipe.UpdateOneID(row.ID).SetRawSourcePayload(json.RawMessage(mustJSON(final)))
		if len(cover) > 0 {
			key := fmt.Sprintf("recipes/%d/%s/cover.webp", owner, row.ID)
			if err = p.Storage.Upload(r.Context(), key, bytes.NewReader(cover), int64(len(cover)), "image/webp"); err != nil {
				http.Error(w, "unable to save recipe image", http.StatusInternalServerError)
				return
			}
			update.SetImageS3Key(key)
		}
		if err = update.Exec(r.Context()); err != nil {
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
