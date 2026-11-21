#!/bin/sh
# Copy the site source (website/) into deploy/site/, which Cloudflare serves (npm run deploy).
# The built apps (blank/ bwbuddy/ tenaday/ regional/ yap/ stance/ music/ deutsch/) and files/ that only live in deploy/site are kept;
# every other old site file there is replaced, so nothing stale survives.
set -eu
cd "$(dirname "$0")/.."
# Every app list on the site comes from website/js/apps-data.js
node scripts/apps-sync.mjs
SRC=website
DST=deploy/site
KEEP="blank bwbuddy tenaday regional yap stance music deutsch files"
for entry in "$DST"/* "$DST"/.[!.]*; do
  [ -e "$entry" ] || continue
  name=$(basename "$entry")
  case " $KEEP " in *" $name "*) continue ;; esac
  rm -rf "$entry"
done
rsync -a --exclude '.DS_Store' --exclude 'scenes/preview.html' --exclude 'files/' "$SRC"/ "$DST"/
if [ -d "$SRC/files" ]; then mkdir -p "$DST/files" && rsync -a --exclude '.DS_Store' "$SRC/files"/ "$DST/files"/; fi
echo "deploy/site synced from website/"
