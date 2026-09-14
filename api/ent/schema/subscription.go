package schema

import (
	"time"

	"entgo.io/ent"
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
		field.String("status"),
		field.String("rc_app_user_id"),
		field.String("rc_environment"),
		field.String("rc_product_id"),
		field.String("rc_store"),
		field.Int("credit"),
		field.Time("created_at").Default(time.Now),
		field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
	}
}

func (Subscription) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).Ref("subscriptions").Field("user_id").Unique().Required(),
	}
}

func (Subscription) Indexes() []ent.Index {
	return []ent.Index{index.Fields("user_id")}
}
