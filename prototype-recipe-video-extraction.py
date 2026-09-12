#!/usr/bin/env python3
"""Extract a database-ready recipe from a local Apify video run."""

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


def video_part(path):
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return {
        "type": "video_url",
        "video_url": {"url": f"data:video/mp4;base64,{encoded}"},
    }


def call_openrouter(api_key, prompt, video):
    body = {
        "model": "google/gemini-3.5-flash-lite",
        "messages": [
            {
                "role": "user",
                "content": [{"type": "text", "text": prompt}, video],
            }
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "recipe",
                "strict": True,
                "schema": prototype.SCHEMA,
            },
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
        "folder", nargs="?", default="api/debug/apify/tiktok_D2ZrRRW23kPRlcH4Q"
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
    video_name = final.get("video")
    video_path = folder / video_name if isinstance(video_name, str) else None
    if video_path is None or not video_path.is_file():
        videos = sorted((folder / "assets").glob("*.mp4"))
        video_path = videos[0] if videos else None
    if video_path is None:
        raise SystemExit(f"No local MP4 found in {folder / 'assets'}")

    text = []
    prototype.collect_text(dataset, text)
    source = final.get("content_type", "unknown").split(":", 1)[0]
    webhook_id = webhook.get("resource", {}).get("id") or folder.name.rsplit("_", 1)[-1]
    url = run.get("redirected_url") or run.get("requested_url")
    prompt = f"""Extract a recipe from this social video. Inspect the video frames and audio/transcript when available.
Do not invent ingredients, quantities, timings, or instructions. If the video is not a recipe,
return an honest minimal recipe with empty ingredients and instructions where the schema permits.
The output is inserted into a recipes table. Keep instructions as ordered step strings and use
process_minutes for total cooking/preparation time.

Post title: {final.get("title", "")}
Post description: {final.get("description", "")}
Detected source: {source}
Detected URL: {url or ""}
Final Apify extraction JSON:
{json.dumps(final, ensure_ascii=False, indent=2)}
Useful text found in Apify payload:
{json.dumps(text, ensure_ascii=False, indent=2)}"""
    (folder / "prompt.json").write_text(
        json.dumps(
            {"model": "google/gemini-3.5-flash-lite", "prompt": prompt},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    recipe = call_openrouter(api_key, prompt, video_part(video_path))
    recipe.update(
        {
            "image_s3_key": None,
            "url": url,
            "source": source,
            "webhook_id": webhook_id,
            "raw_source_payload": dataset,
            "video": str(video_path.relative_to(folder)),
        }
    )
    output = Path(args.output) if args.output else folder / "recipe.json"
    output.write_text(
        json.dumps(recipe, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(output)


if __name__ == "__main__":
    main()
