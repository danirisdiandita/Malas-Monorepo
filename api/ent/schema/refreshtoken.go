package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// RefreshToken holds the schema definition for the RefreshToken entity.
type RefreshToken struct {
	ent.Schema
}

// Fields of the RefreshToken.
func (RefreshToken) Fields() []ent.Field {
	return []ent.Field{
		field.String("token").
			Unique(),
		field.Time("expires_at"),
		field.Time("created_at").
			Default(time.Now),
	}
}

// Edges of the RefreshToken.
func (RefreshToken) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("owner", User.Type).
			Ref("refresh_tokens").
			Unique().
			Required(),
	}
}
