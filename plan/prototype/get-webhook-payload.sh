#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
payload_id="${1:-5efb63d0-50ec-4a53-b580-5ec8fd194541}"

if [[ ! "$payload_id" =~ ^[0-9a-fA-F-]{36}$ ]]; then
  echo "invalid webhook payload UUID: $payload_id" >&2
  exit 1
fi

payload_file="$repo_root/api/debug/webhooks/$payload_id.json"
if [[ ! -f "$payload_file" ]]; then
  echo "webhook payload not found: $payload_file" >&2
  exit 1
fi

jq . "$payload_file"
