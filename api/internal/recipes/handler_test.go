package recipes

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
)

func TestHandleListReturnsMockRecipes(t *testing.T) {
	response := httptest.NewRecorder()
	HandleList(response, httptest.NewRequest(http.MethodGet, "/recipes", nil))

	var got []Recipe
	if err := json.NewDecoder(response.Body).Decode(&got); err != nil {
		t.Fatal(err)
	}
	if response.Code != http.StatusOK || len(got) != len(mockRecipes) {
		t.Fatalf("unexpected response: status=%d recipes=%d", response.Code, len(got))
	}
}

func TestHandleGetReturnsRecipeByID(t *testing.T) {
	router := chi.NewRouter()
	router.Get("/recipes/{id}", HandleGet)
	response := httptest.NewRecorder()
	router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/recipes/recipe-1", nil))

	var got Recipe
	if err := json.NewDecoder(response.Body).Decode(&got); err != nil {
		t.Fatal(err)
	}
	if response.Code != http.StatusOK || got.ID != "recipe-1" {
		t.Fatalf("unexpected response: status=%d id=%q", response.Code, got.ID)
	}
}
