#!/usr/bin/env bash
# Auto-checkpoint leftover uncommitted changes when Claude finishes a turn.
#
# This is the safety net for the "hook + good messages" workflow: meaningful
# commits are made during the work itself; this catches anything left
# uncommitted so the tree is always clean before the next change.
#
# Invoked by the Stop hook in .claude/settings.json. Reads nothing from stdin.

# Locate the repo root; bail quietly if we're not in a git repo.
root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
[ -n "$root" ] || exit 0
cd "$root" || exit 0

# Clean working tree -> nothing to checkpoint.
if [ -z "$(git status --porcelain)" ]; then
  exit 0
fi

# Don't interfere while a merge / rebase / cherry-pick is in progress —
# auto-committing mid-operation would corrupt the user's intended history.
gitdir="$(git rev-parse --git-dir)"
if [ -e "$gitdir/MERGE_HEAD" ] || [ -d "$gitdir/rebase-merge" ] \
   || [ -d "$gitdir/rebase-apply" ] || [ -e "$gitdir/CHERRY_PICK_HEAD" ]; then
  exit 0
fi

git add -A
git commit --quiet \
  -m "chore: auto-checkpoint uncommitted changes" \
  -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
exit 0
