package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

type Session struct { ent.Schema }

func (Session) Fields() []ent.Field {
	return []ent.Field{
		field.String("token_hash").Unique(),
		field.Time("expires_at"),
		field.String("ip_address").Optional(),
		field.String("user_agent").Optional(),
		field.Time("created_at").Default(time.Now),
		field.Time("last_seen_at").Default(time.Now).UpdateDefault(time.Now),
		field.Time("revoked_at").Optional().Nillable(),
	}
}

func (Session) Edges() []ent.Edge {
	return []ent.Edge{edge.From("user", User.Type).Ref("sessions").Unique().Required()}
}
