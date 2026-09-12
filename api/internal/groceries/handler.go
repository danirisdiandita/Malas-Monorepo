package groceries

import (
	"encoding/json"
	"net/http"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	"github.com/danirisdiandita/malas-monorepo/api/ent/grocery"
	"github.com/danirisdiandita/malas-monorepo/api/internal/recipes"
)

type Item struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Unit string `json:"unit"`
	Tag  string `json:"tag,omitempty"`
}

func List(db *ent.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner, err := recipes.OwnerID(db, r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		rows, err := db.Grocery.Query().Where(grocery.UserID(owner)).Order(ent.Asc(grocery.FieldTag), ent.Asc(grocery.FieldName)).All(r.Context())
		if err != nil {
			http.Error(w, "unable to load groceries", http.StatusInternalServerError)
			return
		}
		items := make([]Item, 0, len(rows))
		for _, row := range rows {
			items = append(items, Item{ID: row.ID.String(), Name: row.Name, Unit: row.Unit, Tag: row.Tag})
		}
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "private, no-store")
		_ = json.NewEncoder(w).Encode(items)
	}
}
