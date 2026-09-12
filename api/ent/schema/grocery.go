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
		field.String("name"),
		field.String("unit"),
		field.String("tag").Optional(),
	}
}

func (Grocery) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).Ref("groceries").Unique().Required(),
	}
}

func (Grocery) Indexes() []ent.Index {
	return []ent.Index{index.Fields("user_id")}
}
