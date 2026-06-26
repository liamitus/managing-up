#!/usr/bin/env bash
#
# ship.sh — build "Managing Up" as a static export and publish it to
# liamhowell.com/games/managing-up/ via the existing GitHub Pages pipeline.
#
# Flow:  next export  →  copy into liamhowell.com/src/games/managing-up/
#        →  ensure .nojekyll on the Pages repo  →  run the site's `npm run deploy`
#        (which copies src/* into liamitus.github.io, commits, and pushes).
#
# The old /games/the-meeting/ path is a static query-preserving redirect kept in
# the site source (src/games/the-meeting/index.html), so links already shared
# keep working.
#
# Usage:  npm run ship            # default commit message
#         npm run ship "message"  # custom commit message
#
set -euo pipefail

GAME_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_DIR="$HOME/dev/liamhowell.com"
PAGES_DIR="$HOME/dev/liamitus.github.io"
DEST="$SITE_DIR/src/games/managing-up"
MSG="${1:-managing up: deploy}"

[ -d "$SITE_DIR" ] || { echo "✗ Site repo not found at $SITE_DIR"; exit 1; }
[ -d "$PAGES_DIR" ] || { echo "✗ Pages repo not found at $PAGES_DIR"; exit 1; }

echo "▸ Building static export…"
cd "$GAME_DIR"
EXPORT=1 npm run build

echo "▸ Syncing → $DEST"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$GAME_DIR/out/." "$DEST/"

# GitHub Pages runs Jekyll by default, which silently ignores _next/.
# A .nojekyll at the Pages root disables that. cp -R src/* won't carry a
# dotfile, so place it directly on the Pages repo (idempotent).
echo "▸ Ensuring .nojekyll on Pages root"
touch "$PAGES_DIR/.nojekyll"

echo "▸ Committing site source"
cd "$SITE_DIR"
git add -A src/games
git commit -m "$MSG" >/dev/null 2>&1 || echo "  (no source changes to commit)"
git push >/dev/null 2>&1 || echo "  (source push skipped/failed — continuing)"

# Clean the published game dirs so renames / old content-hashed chunks don't
# linger (the site deploy copies but never deletes). They're re-copied fresh
# from src by `npm run deploy`.
echo "▸ Cleaning stale published files"
rm -rf "$PAGES_DIR/games/managing-up" "$PAGES_DIR/games/the-meeting"

echo "▸ Deploying to GitHub Pages…"
npm run deploy

echo "✅ Shipped → https://liamhowell.com/games/managing-up/"
echo "   (old /games/the-meeting/ redirects here, query string preserved)"
