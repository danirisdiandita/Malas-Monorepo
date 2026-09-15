package groceries

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	"github.com/danirisdiandita/malas-monorepo/api/ent/grocery"
	"github.com/danirisdiandita/malas-monorepo/api/ent/recipe"
	"github.com/danirisdiandita/malas-monorepo/api/internal/imports"
	"github.com/danirisdiandita/malas-monorepo/api/internal/recipes"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

const groceryParseSchema = `{"type":"object","additionalProperties":false,"properties":{"items":{"type":"array","items":{"type":"object","additionalProperties":false,"properties":{"name":{"type":"string"},"quantity":{"type":["number","null"]},"unit":{"type":"string"}},"required":["name","quantity","unit"]}}},"required":["items"]}`

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

func AddManual(db *ent.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner, err := recipes.OwnerID(db, r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		var input struct {
			Name     string   `json:"name"`
			Quantity *float64 `json:"quantity"`
			Unit     string   `json:"unit"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 1024)).Decode(&input) != nil || strings.TrimSpace(input.Name) == "" {
			http.Error(w, "name is required", http.StatusBadRequest)
			return
		}
		create := db.Grocery.Create().SetUserID(owner).SetName(strings.TrimSpace(input.Name)).SetUnit(strings.TrimSpace(input.Unit))
		if input.Quantity != nil {
			if *input.Quantity < 0 {
				http.Error(w, "quantity cannot be negative", http.StatusBadRequest)
				return
			}
			create.SetQuantity(*input.Quantity)
		}
		row, err := create.Save(r.Context())
		if err != nil {
			http.Error(w, "unable to add grocery", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(Item{ID: row.ID.String(), Name: row.Name, Unit: row.Unit, Quantity: row.Quantity, Checked: row.Checked})
	}
}

func ParseText(p *imports.Pipeline) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner, err := recipes.OwnerID(p.DB, r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		var input struct {
			Text string `json:"text"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 64<<10)).Decode(&input) != nil || strings.TrimSpace(input.Text) == "" {
			http.Error(w, "text is required", http.StatusBadRequest)
			return
		}
		payload := map[string]any{"model": p.Config.OpenRouterModel, "messages": []any{
			map[string]string{"role": "system", "content": "Parse the user's pasted grocery list into individual grocery items. Ignore headings and unrelated text. Preserve explicit quantities and units; use null quantity when missing and an empty unit when missing. Return only the JSON schema output."},
			map[string]string{"role": "user", "content": input.Text},
		}, "response_format": map[string]any{"type": "json_schema", "json_schema": map[string]any{"name": "groceries", "strict": true, "schema": json.RawMessage(groceryParseSchema)}}}
		data, _ := json.Marshal(payload)
		req, err := http.NewRequestWithContext(r.Context(), http.MethodPost, p.Config.OpenRouterURL, bytes.NewReader(data))
		if err != nil {
			http.Error(w, "unable to parse groceries", 500)
			return
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+p.Config.OpenRouterKey)
		resp, err := p.Client.Do(req)
		if err != nil {
			http.Error(w, "unable to parse groceries", 502)
			return
		}
		defer resp.Body.Close()
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 2<<20))
		if resp.StatusCode != http.StatusOK {
			http.Error(w, fmt.Sprintf("OpenRouter returned HTTP %d", resp.StatusCode), 502)
			return
		}
		var envelope struct {
			Choices []struct {
				Message struct {
					Content string `json:"content"`
				} `json:"message"`
			} `json:"choices"`
		}
		var result struct {
			Items []struct {
				Name     string   `json:"name"`
				Quantity *float64 `json:"quantity"`
				Unit     string   `json:"unit"`
			} `json:"items"`
		}
		if json.Unmarshal(body, &envelope) != nil || len(envelope.Choices) != 1 || json.Unmarshal([]byte(envelope.Choices[0].Message.Content), &result) != nil {
			http.Error(w, "invalid grocery parser response", 502)
			return
		}
		creates := make([]*ent.GroceryCreate, 0, len(result.Items))
		for _, item := range result.Items {
			if name := strings.TrimSpace(item.Name); name != "" {
				create := p.DB.Grocery.Create().SetUserID(owner).SetName(name).SetUnit(strings.TrimSpace(item.Unit))
				if item.Quantity != nil {
					create.SetQuantity(*item.Quantity)
				}
				creates = append(creates, create)
			}
		}
		if len(creates) > 0 {
			if _, err = p.DB.Grocery.CreateBulk(creates...).Save(r.Context()); err != nil {
				http.Error(w, "unable to save groceries", 500)
				return
			}
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]int{"count": len(creates)})
	}
}

func ParsePhoto(p *imports.Pipeline) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner, err := recipes.OwnerID(p.DB, r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, 15<<20)
		file, _, err := r.FormFile("photo")
		if err != nil {
			http.Error(w, "photo is required", http.StatusBadRequest)
			return
		}
		defer file.Close()
		image, err := io.ReadAll(file)
		if err != nil || len(image) == 0 {
			http.Error(w, "invalid photo", http.StatusBadRequest)
			return
		}
		payload := map[string]any{"model": p.Config.OpenRouterModel, "messages": []any{
			map[string]string{"role": "system", "content": "Read this grocery-list photo and extract every visible grocery item. Ignore unrelated text. Preserve quantities and units; use null quantity when missing and an empty unit when missing. Return only the JSON schema output."},
			map[string]any{"role": "user", "content": []any{map[string]string{"type": "text", "text": "Parse the groceries in this image."}, map[string]any{"type": "image_url", "image_url": map[string]string{"url": "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString(image)}}}},
		}, "response_format": map[string]any{"type": "json_schema", "json_schema": map[string]any{"name": "groceries", "strict": true, "schema": json.RawMessage(groceryParseSchema)}}}
		data, _ := json.Marshal(payload)
		req, err := http.NewRequestWithContext(r.Context(), http.MethodPost, p.Config.OpenRouterURL, bytes.NewReader(data))
		if err != nil {
			http.Error(w, "unable to parse groceries", 500)
			return
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+p.Config.OpenRouterKey)
		resp, err := p.Client.Do(req)
		if err != nil {
			http.Error(w, "unable to parse groceries", 502)
			return
		}
		defer resp.Body.Close()
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 2<<20))
		if resp.StatusCode != http.StatusOK {
			http.Error(w, fmt.Sprintf("OpenRouter returned HTTP %d", resp.StatusCode), 502)
			return
		}
		var envelope struct {
			Choices []struct {
				Message struct {
					Content string `json:"content"`
				} `json:"message"`
			} `json:"choices"`
		}
		var result struct {
			Items []struct {
				Name     string   `json:"name"`
				Quantity *float64 `json:"quantity"`
				Unit     string   `json:"unit"`
			} `json:"items"`
		}
		if json.Unmarshal(body, &envelope) != nil || len(envelope.Choices) != 1 || json.Unmarshal([]byte(envelope.Choices[0].Message.Content), &result) != nil {
			http.Error(w, "invalid grocery parser response", 502)
			return
		}
		creates := make([]*ent.GroceryCreate, 0, len(result.Items))
		for _, item := range result.Items {
			if name := strings.TrimSpace(item.Name); name != "" {
				create := p.DB.Grocery.Create().SetUserID(owner).SetName(name).SetUnit(strings.TrimSpace(item.Unit))
				if item.Quantity != nil {
					create.SetQuantity(*item.Quantity)
				}
				creates = append(creates, create)
			}
		}
		if len(creates) > 0 {
			if _, err = p.DB.Grocery.CreateBulk(creates...).Save(r.Context()); err != nil {
				http.Error(w, "unable to save groceries", 500)
				return
			}
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]int{"count": len(creates)})
	}
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

func UpdateChecked(db *ent.Client) http.HandlerFunc {
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
		var input struct {
			Checked bool `json:"checked"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 1024)).Decode(&input) != nil {
			http.Error(w, "invalid checked value", http.StatusBadRequest)
			return
		}
		n, err := db.Grocery.Update().Where(grocery.ID(id), grocery.UserID(owner)).SetChecked(input.Checked).Save(r.Context())
		if err != nil {
			http.Error(w, "unable to update grocery", http.StatusInternalServerError)
			return
		}
		if n == 0 {
			http.NotFound(w, r)
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
