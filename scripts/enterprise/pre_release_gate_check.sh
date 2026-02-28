#!/usr/bin/env bash
set -euo pipefail

PASS=0
FAIL=0

check() {
  local name="$1"; shift
  if "$@" >/dev/null 2>&1; then
    echo "✅ PASS: $name"; ((PASS++))
  else
    echo "❌ FAIL: $name"; ((FAIL++))
  fi
}

echo "========================================="
echo "  RealWorldClaw Pre-Release Gate Check"
echo "========================================="
echo ""

check "On main branch" test "$(git branch --show-current)" = "main"
check "Git working tree clean" git diff --quiet HEAD

if command -v gh &>/dev/null; then
  p0_count=$(gh issue list --label "P0" --state open --json number --jq 'length' 2>/dev/null || echo "0")
  check "No open P0 issues" test "$p0_count" -eq 0
  ci_status=$(gh run list --branch main --limit 1 --json conclusion --jq '.[0].conclusion' 2>/dev/null || echo "unknown")
  check "Latest CI run passed" test "$ci_status" = "success"
else
  echo "⚠️  SKIP: gh CLI not available"
fi

echo ""
echo "========================================="
if [ "$FAIL" -eq 0 ]; then
  echo "  RESULT: ✅ ALL GATES PASSED ($PASS/$PASS)"
  exit 0
else
  echo "  RESULT: ❌ FAILED ($FAIL failures, $PASS passed)"
  exit 1
fi
