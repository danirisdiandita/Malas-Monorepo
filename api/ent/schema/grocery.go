package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

type Grocery struct {
	ent.Schema
}

func (Grocery) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.Int("user_id"),
		field.String("name"),
		field.String("unit"),
		field.Float("quantity").Optional().Nillable(),
		field.String("tag").Optional(),
		field.UUID("recipe_id", uuid.UUID{}).Optional().Nillable(),
		field.Bool("checked").Default(false),
	}
}

func (Grocery) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).Ref("groceries").Field("user_id").Unique().Required(),
		edge.From("recipe", Recipe.Type).Ref("groceries").Field("recipe_id").Unique(),
	}
}

func (Grocery) Indexes() []ent.Index {
	return []ent.Index{index.Fields("user_id")}
}
