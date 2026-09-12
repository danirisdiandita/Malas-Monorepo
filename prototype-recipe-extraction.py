#!/usr/bin/env python3
"""Extract one database-ready recipe from an Apify debug run."""

import argparse
import base64
import json
import mimetypes
import os
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps
from dotenv import load_dotenv

load_dotenv()


SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "name",
        "servings",
        "process_minutes",
        "ingredients",
        "instructions",
        "tags",
        "rating",
        "notes",
        "image_s3_key",
        "url",
        "source",
        "webhook_id",
    ],
    "properties": {
        "name": {"type": "string"},
        "servings": {"type": "integer", "minimum": 1},
        "process_minutes": {"type": "integer", "minimum": 0},
        "ingredients": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["name", "quantity", "unit"],
                "properties": {
                    "name": {"type": "string"},
                    "quantity": {"type": ["number", "string", "null"]},
                    "unit": {"type": ["string", "null"]},
                },
            },
        },
        "instructions": {"type": "array", "items": {"type": "string"}},
        "tags": {"type": "array", "items": {"type": "string"}},
        "rating": {"type": ["number", "null"]},
        "notes": {"type": ["string", "null"]},
        "image_s3_key": {"type": ["string", "null"]},
        "url": {"type": ["string", "null"]},
        "source": {"type": "string"},
        "webhook_id": {"type": ["string", "null"]},
    },
}


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def collect_text(value, output, key=""):
    if isinstance(value, dict):
        for child_key, child_value in value.items():
            collect_text(child_value, output, child_key)
    elif isinstance(value, list):
        for child in value:
            collect_text(child, output, key)
    elif (
        isinstance(value, str)
        and value.strip()
        and key.lower()
        in {
            "desc",
            "description",
            "title",
            "text",
            "markup_text",
            "label",
            "share_title",
            "share_desc",
            "alt",
            "caption",
        }
    ):
        text = " ".join(value.split())
        if text not in output:
            output.append(text)


def combined_image(folder):
    paths = [
        path
        for path in sorted((folder / "assets").glob("*"))
        if path.is_file() and path.suffix.lower() in {".webp", ".jpg", ".jpeg", ".png"}
    ]
    if not paths:
        return None
    images = [ImageOps.exif_transpose(Image.open(path)).convert("RGB") for path in paths]
    width = max(image.width for image in images)
    height = sum(image.height for image in images)
    combined = Image.new("RGB", (width, height), "white")
    y = 0
    for image in images:
        combined.paste(image, ((width - image.width) // 2, y))
        y += image.height
    temporary = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
    temporary.close()
    combined.save(temporary.name, format="JPEG", quality=88, optimize=True)
    return Path(temporary.name)


def image_parts(folder):
    path = combined_image(folder)
    if path is None:
        return [], None
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return [{"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded}"}}], path


def call_openrouter(api_key, model, prompt, images):
    body = {
        "model": model,
        "messages": [
            {"role": "user", "content": [{"type": "text", "text": prompt}, *images]}
        ],
        "reasoning": {"enabled": True},
        "response_format": {
            "type": "json_schema",
            "json_schema": {"name": "recipe", "strict": True, "schema": SCHEMA},
        },
    }
    request = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        raise SystemExit(
            f"OpenRouter error {error.code}: {error.read().decode('utf-8', errors='replace')}"
        ) from error
    try:
        return json.loads(result["choices"][0]["message"]["content"])
    except (KeyError, IndexError, TypeError, json.JSONDecodeError) as error:
        raise SystemExit(
            f"Unexpected OpenRouter response: {json.dumps(result, indent=2)}"
        ) from error


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "folder", nargs="?", default="api/debug/apify/tiktok_hBDJyHdrcqs9K4S7r"
    )
    parser.add_argument(
        "-o", "--output", help="output JSON path; defaults to <folder>/recipe.json"
    )
    args = parser.parse_args()

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise SystemExit("OPENROUTER_API_KEY is required")
    folder = Path(args.folder)
    final = read_json(folder / "final.json")
    dataset = read_json(folder / "dataset.json")
    run = read_json(folder / "run.json")
    webhook = read_json(folder / "webhook.json")
    text = []
    collect_text(dataset, text)
    source = final.get("content_type", "unknown").split(":", 1)[0]
    webhook_id = webhook.get("resource", {}).get("id") or folder.name.rsplit("_", 1)[-1]
    url = run.get("redirected_url") or run.get("requested_url")
    local_images = sorted((folder / "assets").glob("*"))
    prompt = f"""Extract a recipe from the supplied social post. Use the caption and images as evidence.
Do not invent ingredients, quantities, timings, or instructions. If the images are not a recipe,
return an honest minimal recipe with empty ingredients and instructions where the schema permits.
The output is inserted into a recipes table. Keep instructions as ordered step strings and use
process_minutes for total cooking/preparation time.

Post title: {final.get("title", "")}
Post description: {final.get("description", "")}
Detected source: {source}
Detected URL: {url or ""}
Useful text found in Apify payload:
{json.dumps(text, ensure_ascii=False, indent=2)}"""
    images, combined = image_parts(folder)
    try:
        recipe = call_openrouter(
            api_key,
            os.environ.get("OPENROUTER_MODEL", "openai/gpt-5.6-luna"),
            prompt,
            images,
        )
    finally:
        if combined:
            combined.unlink(missing_ok=True)
    recipe.update(
        {
            "image_s3_key": f"assets/{local_images[0].name}" if local_images else None,
            "url": url,
            "source": source,
            "webhook_id": webhook_id,
            "raw_source_payload": dataset,
        }
    )
    output = Path(args.output) if args.output else folder / "recipe.json"
    output.write_text(
        json.dumps(recipe, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(output)


if __name__ == "__main__":
    main()
