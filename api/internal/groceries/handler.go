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
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	Unit           string   `json:"unit"`
	Quantity       *float64 `json:"quantity,omitempty"`
	Tag            string   `json:"tag,omitempty"`
	RecipeID       *string  `json:"recipe_id,omitempty"`
	RecipeName     string   `json:"recipe_name,omitempty"`
	RecipeImageURL string   `json:"recipe_image_url,omitempty"`
	Checked        bool     `json:"checked"`
}

func List(db *ent.Client, storage *recipes.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner, err := recipes.OwnerID(db, r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		rows, err := db.Grocery.Query().Where(grocery.UserID(owner)).WithRecipe().Order(ent.Asc(grocery.FieldTag), ent.Asc(grocery.FieldName)).All(r.Context())
		if err != nil {
			http.Error(w, "unable to load groceries", http.StatusInternalServerError)
			return
		}
		items := make([]Item, 0, len(rows))
		imageURLs := make(map[uuid.UUID]string)
		for _, row := range rows {
			var recipeID *string
			if row.RecipeID != nil {
				value := row.RecipeID.String()
				recipeID = &value
			}
			recipeName := ""
			if row.Edges.Recipe != nil {
				recipeName = row.Edges.Recipe.Name
			}
			recipeImageURL := ""
			if row.Edges.Recipe != nil && row.Edges.Recipe.ImageS3Key != "" && storage != nil {
				if signed, ok := imageURLs[row.Edges.Recipe.ID]; ok {
					recipeImageURL = signed
				} else if signed, err := storage.ImageURL(r.Context(), row.Edges.Recipe.ImageS3Key); err == nil {
					imageURLs[row.Edges.Recipe.ID] = signed
					recipeImageURL = signed
				}
			}
			items = append(items, Item{ID: row.ID.String(), Name: row.Name, Unit: row.Unit, Quantity: row.Quantity, Tag: row.Tag, RecipeID: recipeID, RecipeName: recipeName, RecipeImageURL: recipeImageURL, Checked: row.Checked})
		}
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "private, no-store")
		_ = json.NewEncoder(w).Encode(items)
	}
}

func Clear(db *ent.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner, err := recipes.OwnerID(db, r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		if _, err := db.Grocery.Delete().Where(grocery.UserID(owner)).Exec(r.Context()); err != nil {
			http.Error(w, "unable to clear groceries", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
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
		creates := make([]*ent.GroceryCreate, 0, len(ingredients))
		for _, item := range ingredients {
			if strings.TrimSpace(item.Name) == "" {
				continue
			}
			create := db.Grocery.Create().SetUserID(owner).SetName(strings.TrimSpace(item.Name)).SetUnit(strings.TrimSpace(item.Unit)).SetRecipeID(row.ID)
			if item.Quantity != nil {
				create.SetQuantity(*item.Quantity)
			}
			creates = append(creates, create)
		}
		if len(creates) > 0 {
			if _, err := db.Grocery.CreateBulk(creates...).Save(r.Context()); err != nil {
				http.Error(w, "unable to add groceries", 500)
				return
			}
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]int{"count": len(creates)})
	}
}
