package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

type Account struct { ent.Schema }

func (Account) Fields() []ent.Field {
	return []ent.Field{
		field.String("provider"),
		field.String("provider_account_id"),
		field.String("access_token").Optional().Sensitive(),
		field.String("refresh_token").Optional().Sensitive(),
		field.String("scope").Optional(),
	}
}

func (Account) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).Ref("accounts").Unique().Required(),
	}
}

func (Account) Indexes() []ent.Index {
	return []ent.Index{index.Fields("provider", "provider_account_id").Unique()}
}
