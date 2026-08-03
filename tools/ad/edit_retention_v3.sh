#!/usr/bin/env bash
# NizamOk — retention cuts.
#
# The edit is NOT a trim of a flattened export. It is a re-cut from source:
# node renders the Arabic cards in Chromium at the size this cut needs, then
# ffmpeg selects windows out of the existing 1080x1920 frame sequences and
# composites the cards over them. Nothing is scaled, cropped or upscaled, so no
# Arabic can be clipped.
#
# Everything below is driven from ONE table (the `shots` arrays in the mjs), so
# the plan, the report and the render cannot drift apart.
set -euo pipefail
cd "$(dirname "$0")/../.."

# Prerequisites — the frame sequences the cuts draw from.
[ -d build/ad/lamhat/frames-v ]  || node tools/ad/lamhat-tiktok.mjs
[ -d build/ad/lamhat-book/v ]    || node tools/ad/lamhat-pages.mjs
[ -d build/ad/book/v ]           || node tools/ad/render-book.mjs
[ -d build/ad/cover/v ]          || node tools/ad/render-cover.mjs

node tools/ad/retention-cuts.mjs

ls -la build/ad/out/lamhat_mubdia_retention_v3.mp4 \
       build/ad/out/lamhat_mubdia_retention_aggressive.mp4 \
       build/ad/out/rebuild_mubdia_retention_v3.mp4
