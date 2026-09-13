package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

type MealCalendarEntry struct { ent.Schema }

func (MealCalendarEntry) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.Int("user_id"),
		field.String("planned_date"),
		field.String("meal_slot"),
		field.String("scheduled_time").Optional(),
		field.UUID("recipe_id", uuid.UUID{}).Optional().Nillable(),
		field.String("timezone"),
		field.String("notes").Optional(),
	}
}

func (MealCalendarEntry) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).Ref("meal_calendar_entries").Field("user_id").Unique().Required(),
		edge.From("recipe", Recipe.Type).Ref("meal_calendar_entries").Field("recipe_id").Unique(),
	}
}

func (MealCalendarEntry) Indexes() []ent.Index {
	return []ent.Index{index.Fields("user_id", "planned_date")}
}
