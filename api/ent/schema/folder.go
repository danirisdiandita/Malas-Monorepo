package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

type Folder struct {
	ent.Schema
}

func (Folder) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.Int("user_id"),
		field.String("name"),
	}
}

func (Folder) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).Ref("folders").Field("user_id").Unique().Required(),
		edge.To("recipes", Recipe.Type),
	}
}

func (Folder) Indexes() []ent.Index {
	return []ent.Index{index.Fields("user_id")}
}
