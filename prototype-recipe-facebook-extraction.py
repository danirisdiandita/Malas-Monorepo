#!/usr/bin/env python3
"""Extract a database-ready recipe from a local Facebook Reel Apify run."""

import argparse
import base64
import importlib.util
import json
import os
import subprocess
import tempfile
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


def collect_text(value, output):
    if isinstance(value, dict):
        for key, child in value.items():
            if isinstance(child, str) and key.lower() in {
                "text",
                "title",
                "description",
                "caption",
                "name",
                "owner_name",
            }:
                text = " ".join(child.split())
                if text and text not in output:
                    output.append(text)
            else:
                collect_text(child, output)
    elif isinstance(value, list):
        for child in value:
            collect_text(child, output)


def first_item(dataset):
    if isinstance(dataset, list) and dataset and isinstance(dataset[0], dict):
        return dataset[0]
    if isinstance(dataset, dict):
        return dataset
    raise SystemExit("Facebook dataset does not contain a result")


def preprocess_video(path):
    temporary = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
    temporary.close()
    command = [
        "ffmpeg", "-y", "-i", str(path), "-map", "0:v:0", "-map", "0:a?",
        "-vf", "scale=720:-2,fps=24",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "31",
        "-c:a", "aac", "-b:a", "48k", "-movflags", "+faststart", temporary.name,
    ]
    result = subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=False)
    if result.returncode != 0 or not Path(temporary.name).is_file():
        Path(temporary.name).unlink(missing_ok=True)
        raise SystemExit(f"Unable to preprocess video: {result.stderr.decode(errors='replace')[-500:]}")
    if Path(temporary.name).stat().st_size > 14 * 1024 * 1024:
        compact_command = [
            "ffmpeg", "-y", "-i", str(path), "-map", "0:v:0", "-map", "0:a?",
            "-vf", "scale=480:-2,fps=18", "-c:v", "libx264", "-preset", "veryfast",
            "-crf", "34", "-c:a", "aac", "-b:a", "32k", "-movflags", "+faststart", temporary.name,
        ]
        result = subprocess.run(compact_command, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=False)
        if result.returncode != 0:
            Path(temporary.name).unlink(missing_ok=True)
            raise SystemExit(f"Unable to compact video: {result.stderr.decode(errors='replace')[-500:]}")
    return Path(temporary.name)


def media_part(folder, item):
    videos = sorted((folder / "assets").glob("*.mp4"))
    if videos:
        original = videos[0]
        compressed = preprocess_video(original)
        encoded = base64.b64encode(compressed.read_bytes()).decode("ascii")
        return {"type": "video_url", "video_url": {"url": f"data:video/mp4;base64,{encoded}"}}, original, compressed

    video_url = item.get("video_url_hd") or item.get("video_url_sd")
    if isinstance(video_url, str) and video_url:
        return {"type": "video_url", "video_url": {"url": video_url}}, None, None

    raise SystemExit("No local MP4 or Facebook video_url_hd/video_url_sd found")


def call_openrouter(api_key, prompt, video):
    body = {
        "model": os.environ.get("OPENROUTER_VIDEO_MODEL", "google/gemini-3.5-flash-lite"),
        "messages": [{"role": "user", "content": [{"type": "text", "text": prompt}, video]}],
        "response_format": {
            "type": "json_schema",
            "json_schema": {"name": "recipe", "strict": True, "schema": prototype.SCHEMA},
        },
    }
    request = urllib.request.Request(
        os.environ.get("OPENROUTER_URL", "https://openrouter.ai/api/v1/chat/completions"),
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
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
        raise SystemExit(f"Unexpected OpenRouter response: {json.dumps(result, indent=2)}") from error


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("folder", nargs="?", default="api/debug/apify/facebook_jpJKGvNeoztueXTqd")
    parser.add_argument("-o", "--output", help="output JSON path; defaults to <folder>/recipe.json")
    args = parser.parse_args()

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise SystemExit("OPENROUTER_API_KEY is required")

    folder = Path(args.folder)
    dataset = read_json(folder / "dataset.json")
    item = first_item(dataset)
    run = read_json(folder / "run.json")
    webhook = read_json(folder / "webhook.json")
    final_path = folder / "final.json"
    final = read_json(final_path) if final_path.is_file() else {}

    text = []
    collect_text(dataset, text)
    url = run.get("redirected_url") or run.get("requested_url") or item.get("topLevelReelUrl")
    webhook_id = webhook.get("resource", {}).get("id") or folder.name.rsplit("_", 1)[-1]
    video, local_video, compressed_video = media_part(folder, item)
    prompt = f"""Extract a recipe from this Facebook Reel. Inspect the video frames and audio/transcript when available.
Do not invent ingredients, quantities, timings, or instructions. If the Reel is not a recipe,
return an honest minimal recipe with empty ingredients and instructions where the schema permits.
The output is inserted into a recipes table. Keep instructions as ordered step strings and use
process_minutes for total cooking/preparation time.

Post title: {item.get("text", "")}
Post description: {item.get("text", "")}
Detected source: facebook
Detected URL: {url or ""}
Final Apify extraction JSON, when available:
{json.dumps(final, ensure_ascii=False, indent=2)}
Useful text found in the Apify payload:
{json.dumps(text, ensure_ascii=False, indent=2)}"""

    (folder / "prompt.json").write_text(
        json.dumps(
            {"model": os.environ.get("OPENROUTER_VIDEO_MODEL", "google/gemini-3.5-flash-lite"), "prompt": prompt},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    try:
        recipe = call_openrouter(api_key, prompt, video)
    finally:
        if compressed_video:
            compressed_video.unlink(missing_ok=True)
    recipe.update(
        {
            "image_s3_key": None,
            "url": url,
            "source": "facebook",
            "webhook_id": webhook_id,
            "raw_source_payload": dataset,
        }
    )
    if local_video:
        recipe["video"] = str(local_video.relative_to(folder))
    output = Path(args.output) if args.output else folder / "recipe.json"
    output.write_text(json.dumps(recipe, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(output)


if __name__ == "__main__":
    main()
