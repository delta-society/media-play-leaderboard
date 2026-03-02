#!/bin/bash
# Media Play Leaderboard — build + commit + push + deploy
# Usage: ./scripts/deploy.sh "commit message"

set -e

LEADERBOARD_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KOMPOUND_DIR="$HOME/dev/delta-society-kompound"

MSG="${1:-chore: update}"

echo "=== Build ==="
cd "$LEADERBOARD_DIR"
npm run build

echo ""
echo "=== Leaderboard: commit & push ==="
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "$MSG"
  git push origin main
  echo "Pushed to main"
else
  echo "No changes in leaderboard"
fi

echo ""
echo "=== Kompound: commit & push (media-play skill) ==="
cd "$KOMPOUND_DIR"
SKILL_CHANGES=$(git diff --name-only .claude/skills/media-play/ 2>/dev/null)
if [ -n "$SKILL_CHANGES" ]; then
  git add .claude/skills/media-play/
  git commit -m "docs: media-play 스킬 업데이트"
  git push origin master
  echo "Pushed skill doc"
else
  echo "No skill doc changes"
fi

echo ""
echo "=== Vercel deploy ==="
cd "$LEADERBOARD_DIR"
npx vercel --prod

echo ""
echo "Done! https://media-play-leaderboard.vercel.app"
