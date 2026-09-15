package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

type Subscription struct{ ent.Schema }

func (Subscription) Fields() []ent.Field {
	return []ent.Field{
		field.Int("user_id"),
		field.Time("start_date").Optional().Nillable(),
		field.Time("end_date").Optional().Nillable(),
		field.String("status").Optional().Nillable(),
		field.String("rc_app_user_id").Optional().Nillable(),
		field.String("rc_environment").Optional().Nillable(),
		field.String("rc_product_id").Optional().Nillable(),
		field.String("rc_store").Optional().Nillable(),
		field.Int("credit"),
		field.Time("created_at").Default(time.Now),
		field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
	}
}

func (Subscription) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).Ref("subscriptions").Field("user_id").Unique().Required().Annotations(entsql.OnDelete(entsql.Cascade)),
	}
}

func (Subscription) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("user_id").Unique(),
		index.Fields("rc_app_user_id").Unique(),
	}
}
