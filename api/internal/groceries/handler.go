package groceries

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	"github.com/danirisdiandita/malas-monorepo/api/ent/grocery"
	"github.com/danirisdiandita/malas-monorepo/api/ent/recipe"
	"github.com/danirisdiandita/malas-monorepo/api/internal/recipes"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Item struct {
	ID       string   `json:"id"`
	Name     string   `json:"name"`
	Unit     string   `json:"unit"`
	Quantity *float64 `json:"quantity,omitempty"`
	Tag      string   `json:"tag,omitempty"`
	RecipeID *string  `json:"recipe_id,omitempty"`
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
			var recipeID *string
			if row.RecipeID != nil {
				value := row.RecipeID.String()
				recipeID = &value
			}
			items = append(items, Item{ID: row.ID.String(), Name: row.Name, Unit: row.Unit, Quantity: row.Quantity, Tag: row.Tag, RecipeID: recipeID})
		}
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "private, no-store")
		_ = json.NewEncoder(w).Encode(items)
	}
}

func AddFromRecipe(db *ent.Client) http.HandlerFunc {
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
		row, err := db.Recipe.Query().Where(recipe.ID(id), recipe.UserID(owner), recipe.ImportStatusEQ(recipe.ImportStatusDone)).Only(r.Context())
		if ent.IsNotFound(err) {
			http.NotFound(w, r)
			return
		}
		if err != nil {
			http.Error(w, "unable to load recipe", 500)
			return
		}
		var ingredients []struct {
			Name     string   `json:"name"`
			Quantity *float64 `json:"quantity"`
			Unit     string   `json:"unit"`
		}
		if err := json.Unmarshal(row.Ingredients, &ingredients); err != nil {
			http.Error(w, "recipe ingredients are invalid", 500)
			return
		}
		for _, item := range ingredients {
			if strings.TrimSpace(item.Name) == "" {
				continue
			}
			create := db.Grocery.Create().SetUserID(owner).SetName(strings.TrimSpace(item.Name)).SetUnit(strings.TrimSpace(item.Unit)).SetRecipeID(row.ID)
			if item.Quantity != nil {
				create.SetQuantity(*item.Quantity)
			}
			if _, err := create.Save(r.Context()); err != nil {
				http.Error(w, "unable to add groceries", 500)
				return
			}
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]int{"count": len(ingredients)})
	}
}
