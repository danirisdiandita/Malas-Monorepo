#!/usr/bin/env python3
"""Download a Facebook post's media and extract every recipe into final.json."""

import argparse
import base64
import importlib.util
import json
import os
import urllib.error
import urllib.request
from pathlib import Path

from dotenv import load_dotenv


load_dotenv()


def load_image_prototype():
    path = Path(__file__).with_name("prototype-recipe-extraction.py")
    spec = importlib.util.spec_from_file_location("recipe_extraction", path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"Unable to load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


prototype = load_image_prototype()


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def media_urls(dataset):
    seen = set()
    urls = []
    for item in dataset if isinstance(dataset, list) else [dataset]:
        for media in item.get("media", []) if isinstance(item, dict) else []:
            for value in (media.get("photo_image", {}).get("uri"), media.get("thumbnail")):
                if isinstance(value, str) and value.startswith("https://") and value not in seen:
                    seen.add(value)
                    urls.append(value)
    return urls


def download_media(folder, dataset):
    assets = folder / "assets"
    assets.mkdir(parents=True, exist_ok=True)
    existing = sorted(
        path for path in assets.iterdir()
        if path.is_file() and path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    )
    if existing:
        return existing

    downloaded = []
    for index, url in enumerate(media_urls(dataset), 1):
        request = urllib.request.Request(url, headers={"User-Agent": "Malas recipe importer"})
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                data = response.read()
        except (urllib.error.URLError, TimeoutError) as error:
            raise SystemExit(f"Unable to download Facebook media: {error}") from error
        path = assets / f"{index:03d}.jpg"
        path.write_bytes(data)
        downloaded.append(path)
    if not downloaded:
        raise SystemExit("Facebook dataset contains no downloadable media")
    return downloaded


def batch_schema():
    return {
        "type": "object",
        "additionalProperties": False,
        "required": ["recipes"],
        "properties": {
            "recipes": {
                "type": "array",
                "minItems": 1,
                "maxItems": 50,
                "items": prototype.SCHEMA,
            }
        },
    }


def call_openrouter(api_key, prompt, image):
    body = {
        "model": os.environ.get("OPENROUTER_MODEL", "openai/gpt-5.6-luna"),
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image}"}},
        ]}],
        "reasoning": {"enabled": True},
        "response_format": {
            "type": "json_schema",
            "json_schema": {"name": "recipes", "strict": True, "schema": batch_schema()},
        },
    }
    request = urllib.request.Request(
        os.environ.get("OPENROUTER_URL", "https://openrouter.ai/api/v1/chat/completions"),
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        raise SystemExit(f"OpenRouter error {error.code}: {error.read().decode(errors='replace')}") from error
    try:
        return json.loads(result["choices"][0]["message"]["content"])
    except (KeyError, IndexError, TypeError, json.JSONDecodeError) as error:
        raise SystemExit(f"Unexpected OpenRouter response: {json.dumps(result, indent=2)}") from error


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("folder")
    parser.add_argument("-o", "--output", help="output JSON path; defaults to <folder>/final.json")
    args = parser.parse_args()
    if not os.environ.get("OPENROUTER_API_KEY"):
        raise SystemExit("OPENROUTER_API_KEY is required")

    folder = Path(args.folder)
    dataset = read_json(folder / "dataset.json")
    run = read_json(folder / "run.json")
    webhook = read_json(folder / "webhook.json")
    item = dataset[0] if isinstance(dataset, list) and dataset else {}
    assets = download_media(folder, dataset)
    combined = prototype.combined_image(folder)
    if combined is None:
        raise SystemExit("Unable to combine Facebook media")

    url = run.get("redirected_url") or run.get("requested_url") or item.get("url")
    webhook_id = webhook.get("resource", {}).get("id") or folder.name.rsplit("_", 1)[-1]
    prompt = f"""Extract every distinct recipe in this Facebook post caption and image.
Return one object per recipe in recipes. Do not merge separate numbered recipes.
Do not invent ingredients, quantities, timings, or instructions. Preserve the source language.
The output is inserted into a recipes table.

Facebook post caption:
{item.get("text", "")}

Source URL: {url or ""}
Source: facebook
Webhook ID: {webhook_id}
Full Apify dataset:
{json.dumps(dataset, ensure_ascii=False, indent=2)}"""
    (folder / "prompt.json").write_text(
        json.dumps({"model": os.environ.get("OPENROUTER_MODEL", "openai/gpt-5.6-luna"), "prompt": prompt}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    try:
        image = base64.b64encode(combined.read_bytes()).decode("ascii")
        result = call_openrouter(os.environ["OPENROUTER_API_KEY"], prompt, image)
    finally:
        combined.unlink(missing_ok=True)

    for recipe in result.get("recipes", []):
        recipe.update({
            "image_s3_key": f"assets/{assets[0].name}",
            "url": url,
            "source": "facebook",
            "webhook_id": webhook_id,
        })
    output = Path(args.output) if args.output else folder / "final.json"
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(output)


if __name__ == "__main__":
    main()
