#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
SCRIPT_PATH="$ROOT_DIR/scripts/import_trendradar.sh"

usage() {
  cat <<'USAGE'
Usage: scripts/import_trendradar.sh (--from-dir /path/to/TrendRadar) [--force]
       scripts/import_trendradar.sh --clone https://github.com/ezanzu7559-del/TrendRadar [--force]

Options:
  --from-dir PATH  Copy TrendRadar contents from a local directory (already unpacked).
  --clone URL      Clone TrendRadar from the given URL into this repository.
  --force          Replace existing files (except .git and this script) without prompting.
  -h, --help       Show this help message.

Examples:
  # Import from a directory that contains the unpacked archive
  scripts/import_trendradar.sh --from-dir /tmp/TrendRadar-main --force

  # Attempt to clone directly (requires GitHub network access)
  scripts/import_trendradar.sh --clone https://github.com/ezanzu7559-del/TrendRadar --force
USAGE
}

FROM_DIR=""
CLONE_URL=""
FORCE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --from-dir)
      FROM_DIR=$(readlink -f "$2")
      shift 2
      ;;
    --clone)
      CLONE_URL="$2"
      shift 2
      ;;
    --force)
      FORCE=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -n "$FROM_DIR" && -n "$CLONE_URL" ]]; then
  echo "Use either --from-dir or --clone, not both." >&2
  exit 1
fi

if [[ -z "$FROM_DIR" && -z "$CLONE_URL" ]]; then
  echo "You must provide either --from-dir or --clone." >&2
  usage
  exit 1
fi

if [[ -n "$FROM_DIR" && ! -d "$FROM_DIR" ]]; then
  echo "Provided --from-dir does not exist: $FROM_DIR" >&2
  exit 1
fi

workdir=""
cleanup() {
  if [[ -n "$workdir" && -d "$workdir" ]]; then
    rm -rf "$workdir"
  fi
}
trap cleanup EXIT

if [[ -n "$CLONE_URL" ]]; then
  workdir=$(mktemp -d)
  echo "Cloning $CLONE_URL..."
  git clone "$CLONE_URL" "$workdir/source"
  SOURCE_DIR="$workdir/source"
else
  SOURCE_DIR="$FROM_DIR"
fi

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Source directory not found: $SOURCE_DIR" >&2
  exit 1
fi

existing_items=$(find "$ROOT_DIR" -mindepth 1 -maxdepth 1 \! -name ".git" \! -name "scripts" -print -quit)
if [[ -n "$existing_items" && "$FORCE" != true ]]; then
  echo "Files already exist in $ROOT_DIR. Re-run with --force to replace them." >&2
  exit 1
fi

if [[ -n "$existing_items" ]]; then
  echo "Removing existing project files from $ROOT_DIR..."
  shopt -s dotglob
  for path in "$ROOT_DIR"/*; do
    base=$(basename "$path")
    if [[ "$base" == ".git" || "$base" == "scripts" ]]; then
      continue
    fi
    rm -rf "$path"
  done
  shopt -u dotglob
fi

keep_dir=$(mktemp -d)
cp "$SCRIPT_PATH" "$keep_dir/"

echo "Copying TrendRadar sources from $SOURCE_DIR into repository root..."
rsync -a --delete --exclude '.git' "$SOURCE_DIR"/ "$ROOT_DIR"/

mkdir -p "$ROOT_DIR/scripts"
cp "$keep_dir/$(basename "$SCRIPT_PATH")" "$SCRIPT_PATH"

echo "TrendRadar files imported. Review the changes and commit when ready."
