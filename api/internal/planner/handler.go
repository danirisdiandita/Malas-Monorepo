package planner

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	"github.com/danirisdiandita/malas-monorepo/api/ent/mealcalendarentry"
	"github.com/danirisdiandita/malas-monorepo/api/ent/recipe"
	"github.com/danirisdiandita/malas-monorepo/api/internal/recipes"
	"github.com/google/uuid"
)

type Entry struct {
	ID            string `json:"id"`
	PlannedDate   string `json:"planned_date"`
	MealSlot      string `json:"meal_slot"`
	ScheduledTime string `json:"scheduled_time,omitempty"`
	Timezone      string `json:"timezone"`
	Notes         string `json:"notes,omitempty"`
	RecipeID      string `json:"recipe_id,omitempty"`
	RecipeName    string `json:"recipe_name,omitempty"`
	ImageURL      string `json:"image_url,omitempty"`
}

func List(db *ent.Client, storage *recipes.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner, err := recipes.OwnerID(db, r)
		if err != nil {
			http.Error(w, "unauthorized", 401)
			return
		}
		query := db.MealCalendarEntry.Query().Where(mealcalendarentry.UserID(owner)).WithRecipe().Order(ent.Asc(mealcalendarentry.FieldPlannedDate), ent.Asc(mealcalendarentry.FieldScheduledTime))
		if date := strings.TrimSpace(r.URL.Query().Get("date")); date != "" {
			if _, err := time.Parse("2006-01-02", date); err != nil {
				http.Error(w, "invalid date", 400)
				return
			}
			query = query.Where(mealcalendarentry.PlannedDateEQ(date))
		}
		rows, err := query.All(r.Context())
		if err != nil {
			http.Error(w, "unable to load meal plan", 500)
			return
		}
		items := make([]Entry, 0, len(rows))
		for _, row := range rows {
			item := Entry{ID: row.ID.String(), PlannedDate: row.PlannedDate, MealSlot: row.MealSlot, ScheduledTime: row.ScheduledTime, Timezone: row.Timezone, Notes: row.Notes}
			if row.Edges.Recipe != nil {
				item.RecipeID, item.RecipeName = row.Edges.Recipe.ID.String(), row.Edges.Recipe.Name
				if row.Edges.Recipe.ImageS3Key != "" && storage != nil {
					item.ImageURL, _ = storage.ImageURL(r.Context(), row.Edges.Recipe.ImageS3Key)
				}
			}
			items = append(items, item)
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(items)
	}
}

func Create(db *ent.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		owner, err := recipes.OwnerID(db, r)
		if err != nil {
			http.Error(w, "unauthorized", 401)
			return
		}
		var input struct {
			PlannedDate   string  `json:"planned_date"`
			MealSlot      string  `json:"meal_slot"`
			ScheduledTime string  `json:"scheduled_time"`
			Timezone      string  `json:"timezone"`
			Notes         string  `json:"notes"`
			RecipeID      *string `json:"recipe_id"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 2048)).Decode(&input) != nil || strings.TrimSpace(input.MealSlot) == "" || strings.TrimSpace(input.Timezone) == "" {
			http.Error(w, "invalid meal entry", 400)
			return
		}
		if _, err := time.Parse("2006-01-02", input.PlannedDate); err != nil {
			http.Error(w, "invalid planned_date", 400)
			return
		}
		create := db.MealCalendarEntry.Create().SetUserID(owner).SetPlannedDate(input.PlannedDate).SetMealSlot(strings.TrimSpace(input.MealSlot)).SetTimezone(strings.TrimSpace(input.Timezone)).SetNotes(strings.TrimSpace(input.Notes))
		if input.ScheduledTime != "" {
			if _, err := time.Parse("15:04", input.ScheduledTime); err != nil {
				http.Error(w, "invalid scheduled_time", 400)
				return
			}
			create.SetScheduledTime(input.ScheduledTime)
		}
		if input.RecipeID != nil {
			id, err := uuid.Parse(*input.RecipeID)
			if err != nil {
				http.Error(w, "invalid recipe_id", 400)
				return
			}
			if _, err := db.Recipe.Query().Where(recipe.ID(id), recipe.UserID(owner)).Only(r.Context()); err != nil {
				http.Error(w, "recipe not found", 404)
				return
			}
			create.SetRecipeID(id)
		}
		row, err := create.Save(r.Context())
		if err != nil {
			http.Error(w, "unable to create meal entry", 500)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(201)
		_ = json.NewEncoder(w).Encode(Entry{ID: row.ID.String(), PlannedDate: row.PlannedDate, MealSlot: row.MealSlot, ScheduledTime: row.ScheduledTime, Timezone: row.Timezone, Notes: row.Notes})
	}
}
