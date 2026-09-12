package schema

import (
	"encoding/json"
	"entgo.io/ent"
	"entgo.io/ent/dialect"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"time"
)

type Recipe struct {
	ent.Schema
}

func (Recipe) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.Int("user_id"),
		field.UUID("folder_id", uuid.UUID{}).Optional().Nillable(),
		field.String("name"),
		field.Int("servings"),
		field.Int("process_minutes"),
		field.JSON("ingredients", json.RawMessage{}),
		field.Other("instructions", pq.StringArray{}).SchemaType(map[string]string{dialect.Postgres: "text[]"}),
		field.Other("tags", pq.StringArray{}).SchemaType(map[string]string{dialect.Postgres: "text[]"}).Optional(),
		field.Enum("import_status").Values("looking", "making", "done", "failed").Default("done"),
		field.String("import_error").Optional(),
		field.Time("processing_at").Optional().Nillable(),
		field.JSON("import_webhook", json.RawMessage{}).Optional().Sensitive(),
		field.Time("created_at").Default(time.Now),
		field.Float("rating").Optional().Nillable(),
		field.String("notes").Optional(),
		field.String("image_s3_key").Optional(),
		field.String("url").Optional(),
		field.String("source").Optional(),
		field.String("webhook_id").Optional(),
		field.JSON("raw_source_payload", json.RawMessage{}).Optional(),
	}
}

func (Recipe) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).Ref("recipes").Field("user_id").Unique().Required(),
		edge.From("folder", Folder.Type).Ref("recipes").Field("folder_id").Unique(),
	}
}

func (Recipe) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("user_id"),
		index.Fields("folder_id"),
		index.Fields("webhook_id"),
	}
}
