package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

type Recipe struct {
	ent.Schema
}

func (Recipe) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.String("name"),
		field.Int("servings"),
		field.Int("process_minutes"),
		field.JSON("ingredients", []string{}).SchemaType(map[string]string{dialect.Postgres: "jsonb"}),
		field.Strings("instructions"),
		field.Strings("tags").Optional(),
		field.Float("rating").Optional().Nillable(),
		field.String("notes").Optional(),
		field.String("image_s3_key").Optional(),
		field.String("url").Optional(),
		field.String("source").Optional(),
		field.String("webhook_id").Optional(),
		field.JSON("raw_source_payload", map[string]any{}).Optional().SchemaType(map[string]string{dialect.Postgres: "jsonb"}),
	}
}

func (Recipe) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).Ref("recipes").Unique().Required(),
		edge.From("folder", Folder.Type).Ref("recipes").Unique(),
	}
}

func (Recipe) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("user_id"),
		index.Fields("folder_id"),
		index.Fields("webhook_id"),
	}
}
