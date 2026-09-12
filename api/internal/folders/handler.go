package folders

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	"github.com/danirisdiandita/malas-monorepo/api/ent/folder"
	"github.com/danirisdiandita/malas-monorepo/api/internal/recipes"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Item struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func List(db *ent.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner, err := recipes.OwnerID(db, r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		rows, err := db.Folder.Query().Where(folder.UserID(owner)).Order(ent.Asc(folder.FieldName)).All(r.Context())
		if err != nil {
			http.Error(w, "unable to load folders", http.StatusInternalServerError)
			return
		}
		items := make([]Item, 0, len(rows))
		for _, row := range rows {
			items = append(items, Item{ID: row.ID.String(), Name: row.Name})
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(items)
	}
}

func Create(db *ent.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner, err := recipes.OwnerID(db, r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		name, ok := decodeName(w, r)
		if !ok {
			return
		}
		row, err := db.Folder.Create().SetUserID(owner).SetName(name).Save(r.Context())
		if err != nil {
			http.Error(w, "unable to create folder", http.StatusInternalServerError)
			return
		}
		writeItem(w, http.StatusCreated, row)
	}
}

func Update(db *ent.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner, err := recipes.OwnerID(db, r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		id, err := uuid.Parse(chi.URLParam(r, "id"))
		if err != nil {
			http.NotFound(w, r)
			return
		}
		name, ok := decodeName(w, r)
		if !ok {
			return
		}
		row, err := db.Folder.UpdateOneID(id).Where(folder.UserID(owner)).SetName(name).Save(r.Context())
		if ent.IsNotFound(err) {
			http.NotFound(w, r)
			return
		}
		if err != nil {
			http.Error(w, "unable to update folder", http.StatusInternalServerError)
			return
		}
		writeItem(w, http.StatusOK, row)
	}
}

func Delete(db *ent.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner, err := recipes.OwnerID(db, r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		id, err := uuid.Parse(chi.URLParam(r, "id"))
		if err != nil {
			http.NotFound(w, r)
			return
		}
		n, err := db.Folder.Delete().Where(folder.ID(id), folder.UserID(owner)).Exec(r.Context())
		if err != nil {
			http.Error(w, "unable to delete folder", http.StatusInternalServerError)
			return
		}
		if n == 0 {
			http.NotFound(w, r)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}

func decodeName(w http.ResponseWriter, r *http.Request) (string, bool) {
	var input struct {
		Name string `json:"name"`
	}
	if json.NewDecoder(http.MaxBytesReader(w, r.Body, 1024)).Decode(&input) != nil {
		http.Error(w, "invalid folder", http.StatusBadRequest)
		return "", false
	}
	name := strings.TrimSpace(input.Name)
	if name == "" || len(name) > 100 {
		http.Error(w, "folder name must be 1-100 characters", http.StatusBadRequest)
		return "", false
	}
	return name, true
}

func writeItem(w http.ResponseWriter, status int, row *ent.Folder) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(Item{ID: row.ID.String(), Name: row.Name})
}
