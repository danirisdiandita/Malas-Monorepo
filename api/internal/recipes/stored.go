package recipes

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	"github.com/danirisdiandita/malas-monorepo/api/ent/recipe"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func presentation(row *ent.Recipe) Recipe {
	ingredients := []string{}
	var values []json.RawMessage
	_ = json.Unmarshal(row.Ingredients, &values)
	for _, raw := range values {
		var text string
		if json.Unmarshal(raw, &text) == nil {
			ingredients = append(ingredients, text)
			continue
		}
		var item struct {
			Name     string
			Quantity any
			Unit     string
		}
		if json.Unmarshal(raw, &item) == nil {
			amount := ""
			if item.Quantity != nil {
				amount = fmt.Sprint(item.Quantity)
			}
			ingredients = append(ingredients, strings.TrimSpace(item.Name+" · "+amount+" "+item.Unit))
		}
	}
	tags := append([]string{}, row.Tags...)
	steps := append([]string{}, row.Instructions...)
	return Recipe{ID: row.ID.String(), Name: row.Name, Servings: row.Servings, ProcessMinutes: row.ProcessMinutes,
		Difficulty: "", Source: row.Source, Tags: tags, Ingredients: ingredients, Instructions: steps,
		Notes: row.Notes, URL: row.URL, Rating: valueOrZero(row.Rating)}
}

func valueOrZero(value *float64) float64 {
	if value == nil {
		return 0
	}
	return *value
}

func Rate(db *ent.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner, err := OwnerID(db, r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		id, err := uuid.Parse(chi.URLParam(r, "id"))
		if err != nil {
			http.NotFound(w, r)
			return
		}
		var input struct {
			Rating float64 `json:"rating"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 1024)).Decode(&input) != nil || input.Rating < 1 || input.Rating > 5 || input.Rating != float64(int(input.Rating)) {
			http.Error(w, "rating must be an integer from 1 to 5", http.StatusBadRequest)
			return
		}
		n, err := db.Recipe.Update().Where(recipe.ID(id), recipe.UserID(owner), recipe.ImportStatusEQ(recipe.ImportStatusDone)).SetRating(input.Rating).Save(r.Context())
		if err != nil {
			http.Error(w, "unable to save rating", http.StatusInternalServerError)
			return
		}
		if n == 0 {
			http.NotFound(w, r)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}

func StoredList(db *ent.Client, storage *Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner, err := OwnerID(db, r)
		if err != nil {
			http.Error(w, "unauthorized", 401)
			return
		}
		page, _ := strconv.Atoi(r.URL.Query().Get("page"))
		if page < 1 {
			page = 1
		}
		pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
		if pageSize < 1 || pageSize > 50 {
			pageSize = 20
		}
		q := strings.TrimSpace(r.URL.Query().Get("q"))
		query := db.Recipe.Query().Where(recipe.UserID(owner), recipe.ImportStatusEQ(recipe.ImportStatusDone))
		if q != "" {
			query = query.Where(recipe.NameContainsFold(q))
		}
		rows, err := query.Order(ent.Desc(recipe.FieldCreatedAt)).Offset((page - 1) * pageSize).Limit(pageSize + 1).All(r.Context())
		if err != nil {
			http.Error(w, "unable to load recipes", 500)
			return
		}
		nextPage := 0
		if len(rows) > pageSize {
			nextPage = page + 1
			rows = rows[:pageSize]
		}
		results := make([]Recipe, 0, len(rows))
		for _, row := range rows {
			result, err := withImage(r.Context(), row, storage)
			if err != nil {
				http.Error(w, "unable to sign recipe image", 503)
				return
			}
			results = append(results, result)
		}
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "private, no-store")
		_ = json.NewEncoder(w).Encode(map[string]any{"items": results, "next_page": nextPage})
	}
}

func StoredGet(db *ent.Client, storage *Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner, err := OwnerID(db, r)
		if err != nil {
			http.Error(w, "unauthorized", 401)
			return
		}
		id, err := uuid.Parse(chi.URLParam(r, "id"))
		if err != nil {
			http.NotFound(w, r)
			return
		}
		row, err := db.Recipe.Query().Where(recipe.ID(id), recipe.UserID(owner), recipe.ImportStatusEQ(recipe.ImportStatusDone)).Only(r.Context())
		if ent.IsNotFound(err) {
			http.NotFound(w, r)
			return
		}
		if err != nil {
			http.Error(w, "unable to load recipe", 500)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "private, no-store")
		result, err := withImage(r.Context(), row, storage)
		if err != nil {
			http.Error(w, "unable to sign recipe image", 503)
			return
		}
		_ = json.NewEncoder(w).Encode(result)
	}
}

func Delete(db *ent.Client, storage *Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner, err := OwnerID(db, r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		id, err := uuid.Parse(chi.URLParam(r, "id"))
		if err != nil {
			http.NotFound(w, r)
			return
		}
		row, err := db.Recipe.Query().Where(recipe.ID(id), recipe.UserID(owner)).Only(r.Context())
		if ent.IsNotFound(err) {
			http.NotFound(w, r)
			return
		}
		if err != nil {
			http.Error(w, "unable to load recipe", http.StatusInternalServerError)
			return
		}
		if err := db.Recipe.DeleteOne(row).Exec(r.Context()); err != nil {
			http.Error(w, "unable to delete recipe", http.StatusInternalServerError)
			return
		}
		if row.ImageS3Key != "" && storage != nil {
			_ = storage.Delete(r.Context(), row.ImageS3Key)
		}
		w.WriteHeader(http.StatusNoContent)
	}
}

func withImage(ctx context.Context, row *ent.Recipe, storage *Storage) (Recipe, error) {
	result := presentation(row)
	if row.ImageS3Key == "" {
		return result, nil
	}
	if storage == nil {
		return result, fmt.Errorf("image storage unavailable")
	}
	signed, err := storage.ImageURL(ctx, row.ImageS3Key)
	result.ImageURL = signed
	return result, err
}
