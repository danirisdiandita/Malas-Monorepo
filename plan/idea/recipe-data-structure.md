# `recipes` table data structure

The main table/entity is named `recipes`.

## Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | identifier | yes | Recipe identifier. |
| `user_id` | identifier | yes | Foreign key to `users.id`; the recipe owner. |
| `name` | string | yes | Recipe name. |
| `servings` | integer | yes | Number of servings. Must be greater than zero. |
| `process_minutes` | integer | yes | Total recipe process time in minutes. |
| `ingredients` | JSONB array | yes | Ingredients used by the recipe. |
| `instructions` | array of strings | yes | Ordered cooking steps. |
| `tags` | array of strings | no | Flexible labels such as `quick`, `vegetarian`, or `breakfast`. |
| `rating` | number or null | no | Rating from `1` to `5`, or `null` when unrated. |
| `notes` | string or null | no | Personal notes or extra recipe information. |
| `image_s3_key` | string or null | no | S3 object key for the recipe image. Store the key, not a permanent URL. |
| `url` | string or null | no | Original recipe or source URL. |

## Ingredient structure

For the MVP, store ingredients as a PostgreSQL `JSONB` array inside
`recipes.ingredients`. This keeps recipe imports and reads simple without an
additional join table.

Each item in `recipe.ingredients` should contain:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | yes | Ingredient name. |
| `quantity` | number or null | no | Amount of the ingredient. `null` is useful for items such as “salt to taste”. |
| `unit` | string | yes | Normalized unit such as `cup`, `tbsp`, `tsp`, `unit`, `clove`, `lb`, or `g`. |
| `notes` | string or null | no | Preparation details such as `diced` or `room temperature`. |

Use singular, normalized units in storage. Convert display text such as `cups` to `cup` and `cloves` to `clove` in the UI.

Create a separate `recipe_ingredients` table later only if the product needs
ingredient search, grocery aggregation across recipes, unit conversion, or
pantry matching.

## Example

```json
{
  "name": "Creamy lemon pasta",
  "servings": 2,
  "process_minutes": 25,
  "ingredients": [
    {
      "name": "spaghetti",
      "quantity": 200,
      "unit": "g",
      "notes": null
    },
    {
      "name": "garlic",
      "quantity": 2,
      "unit": "clove",
      "notes": "minced"
    },
    {
      "name": "salt",
      "quantity": null,
      "unit": "to_taste",
      "notes": null
    }
  ],
  "instructions": [
    "Boil the pasta until al dente.",
    "Cook the garlic and lemon in a pan.",
    "Toss the pasta with the sauce and serve."
  ],
  "tags": ["quick", "dinner"],
  "rating": null,
  "notes": null,
  "image_s3_key": "recipes/cream-lemon-pasta/cover.jpg",
  "url": "https://example.com/creamy-lemon-pasta"
}
```

## `groceries` table

The `groceries` table stores ingredients for shopping. A grocery item may be
standalone or optionally linked to a recipe through `recipe_id`.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | identifier | yes | Grocery item identifier. |
| `user_id` | identifier | yes | Foreign key to `users.id`; the grocery item owner. |
| `ingredient_name` | string | yes | Name of the ingredient. |
| `quantity` | number or null | no | Amount to buy. |
| `unit` | string | yes | Normalized unit such as `cup`, `tbsp`, `unit`, `clove`, or `lb`. |
| `is_purchased` | boolean | yes | Checklist state. Defaults to `false` and becomes `true` after purchase. |
| `recipe_id` | identifier or null | no | Optional foreign key to `recipes.id`. `null` means the item is standalone. |

### Relationship

```text
recipes 1 ──── many groceries
```

Both tables belong to a user:

```text
users 1 ──── many recipes
users 1 ──── many groceries
```

Deleting a recipe should not delete standalone grocery items. Recipe-linked
items may be deleted or detached when the recipe is removed.

Every query must filter by the authenticated `user_id` so users can only read
and modify their own recipes and groceries.

The grocery list should display `is_purchased` as a checkbox. Purchased items
can remain in the list as completed items, for example with a strikethrough.
