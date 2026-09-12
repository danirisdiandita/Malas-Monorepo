package recipes

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Recipe struct {
	ImageURL       string   `json:"image_url,omitempty"`
	Notes          string   `json:"notes,omitempty"`
	URL            string   `json:"url,omitempty"`
	Rating         float64  `json:"rating,omitempty"`
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	ProcessMinutes int      `json:"process_minutes"`
	Servings       int      `json:"servings"`
	Difficulty     string   `json:"difficulty"`
	Source         string   `json:"source"`
	Tags           []string `json:"tags"`
	Ingredients    []string `json:"ingredients"`
	Instructions   []string `json:"instructions"`
}

var mockRecipes = []Recipe{
	{ID: "recipe-1", Name: "Creamy lemon pasta", ProcessMinutes: 20, Servings: 2, Difficulty: "Easy", Source: "tiktok", Tags: []string{"quick", "dinner"}, Ingredients: []string{"Spaghetti · 200 g", "Lemon · 1", "Parmesan · 50 g", "Olive oil · 2 tbsp"}, Instructions: []string{"Boil the pasta until al dente.", "Cook the lemon and garlic in a pan.", "Toss the pasta with the sauce and serve."}},
	{ID: "recipe-2", Name: "Crispy chili eggs", ProcessMinutes: 15, Servings: 1, Difficulty: "Easy", Source: "instagram", Tags: []string{"breakfast", "quick"}, Ingredients: []string{"Eggs · 2", "Chili crisp · 1 tbsp", "Spring onion · 1"}, Instructions: []string{"Fry the eggs until the edges are crisp.", "Spoon chili crisp over the eggs.", "Top with spring onion and serve."}},
}

func HandleGet(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", http.MethodGet)
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	for _, recipe := range mockRecipes {
		if recipe.ID == chi.URLParam(r, "id") {
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(recipe)
			return
		}
	}
	http.NotFound(w, r)
}

func HandleList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", http.MethodGet)
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(mockRecipes)
}
