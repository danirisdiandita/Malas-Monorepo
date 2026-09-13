#!/usr/bin/env python3
"""Extract a recipe from an Instagram Reel debug run using Gemini."""

import argparse
import importlib.util
import json
import os
import subprocess
import tempfile
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


def load_video_prototype():
    path = Path(__file__).with_name("prototype-recipe-video-extraction.py")
    spec = importlib.util.spec_from_file_location("recipe_video_extraction", path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"Unable to load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


prototype = load_video_prototype()


def compress_video(source):
    handle, raw_path = tempfile.mkstemp(prefix="yuzu-instagram-reel-", suffix=".mp4")
    os.close(handle)
    compressed = Path(raw_path)
    command = [
        "ffmpeg", "-y", "-i", str(source),
        "-vf", "scale=min(720\\,iw):-2",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "30",
        "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart",
        str(compressed),
    ]
    try:
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    except FileNotFoundError as error:
        compressed.unlink(missing_ok=True)
        raise SystemExit("ffmpeg is required to compress the Reel video") from error
    except subprocess.CalledProcessError as error:
        compressed.unlink(missing_ok=True)
        raise SystemExit(error.stderr.decode("utf-8", errors="replace")) from error
    return compressed


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("folder", nargs="?", default="api/debug/apify/instagram_FRzz9kTNrg2VbTvDp")
    parser.add_argument("-o", "--output", help="output JSON path; defaults to <folder>/recipe.json")
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
    prototype.prototype.collect_text(dataset, text)
    url = run.get("redirected_url") or run.get("requested_url")
    webhook_id = webhook.get("resource", {}).get("id") or folder.name.rsplit("_", 1)[-1]
    prompt = f"""Extract a recipe from this Instagram Reel. Inspect video frames and audio/transcript when available.
Do not invent ingredients, quantities, timings, or instructions. If it is not a recipe, return a minimal honest result.
The output is inserted into a recipes table. Keep instructions as ordered step strings.

Source: Instagram Reel
Detected URL: {url or ""}
Final Apify extraction JSON:
{json.dumps(final, ensure_ascii=False, indent=2)}
Useful text found in Apify payload:
{json.dumps(text, ensure_ascii=False, indent=2)}"""
    (folder / "prompt.json").write_text(
        json.dumps({"model": "google/gemini-3.5-flash-lite", "prompt": prompt}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    compressed = compress_video(video_path)
    try:
        recipe = prototype.call_openrouter(api_key, prompt, prototype.video_part(compressed))
    finally:
        compressed.unlink(missing_ok=True)

    recipe.update({
        "image_s3_key": None,
        "url": url,
        "source": "instagram",
        "webhook_id": webhook_id,
        "raw_source_payload": dataset,
        "video": str(video_path.relative_to(folder)),
    })
    output = Path(args.output) if args.output else folder / "recipe.json"
    output.write_text(json.dumps(recipe, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(output)


if __name__ == "__main__":
    main()
