package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

type RevenueCatIdentity struct{ ent.Schema }

func (RevenueCatIdentity) Fields() []ent.Field {
	return []ent.Field{
		field.Int("user_id"),
		field.String("rc_app_user_id"),
		field.Time("created_at").Default(time.Now),
		field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
	}
}

func (RevenueCatIdentity) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).Ref("revenue_cat_identities").Field("user_id").Unique().Required().Annotations(entsql.OnDelete(entsql.Cascade)),
	}
}

func (RevenueCatIdentity) Indexes() []ent.Index {
	return []ent.Index{index.Fields("user_id")}
}
