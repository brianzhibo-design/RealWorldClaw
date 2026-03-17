#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_DIR="$ROOT_DIR/reports"
DATE="$(date +%F)"
REPORT_FILE="$REPORT_DIR/security-scan-$DATE.md"
BANDIT_JSON="$REPORT_DIR/bandit-$DATE.json"
SAFETY_JSON="$REPORT_DIR/safety-$DATE.json"
PIP_AUDIT_JSON="$REPORT_DIR/pip-audit-$DATE.json"

mkdir -p "$REPORT_DIR"

if [[ -f "$ROOT_DIR/.venv/bin/activate" ]]; then
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.venv/bin/activate"
fi

for tool in bandit safety pip-audit; do
  command -v "$tool" >/dev/null 2>&1 || {
    echo "$tool not found. Install with: pip install bandit safety pip-audit" >&2
    exit 1
  }
done

bandit_exit=0
safety_exit=0
pip_audit_exit=0

set +e
bandit -r "$ROOT_DIR/api" "$ROOT_DIR/cli" "$ROOT_DIR/scripts" "$ROOT_DIR"/*.py \
  -x "$ROOT_DIR/tests,$ROOT_DIR/.venv,$ROOT_DIR/venv,$ROOT_DIR/api/routers/_archived" \
  -f json -o "$BANDIT_JSON"
bandit_exit=$?

safety check --json -r "$ROOT_DIR/requirements.txt" > "$SAFETY_JSON.raw"
safety_exit=$?

pip-audit -r "$ROOT_DIR/requirements.txt" --format json > "$PIP_AUDIT_JSON"
pip_audit_exit=$?
set -e

python - "$SAFETY_JSON.raw" "$SAFETY_JSON" <<'PY'
import json
import pathlib
import sys

raw_path = pathlib.Path(sys.argv[1])
out_path = pathlib.Path(sys.argv[2])
text = raw_path.read_text(encoding="utf-8")

decoder = json.JSONDecoder()
start = text.find("{")
obj = None
while start != -1:
    try:
        obj, _ = decoder.raw_decode(text[start:])
        break
    except json.JSONDecodeError:
        start = text.find("{", start + 1)

if obj is None:
    obj = {"error": "no-json-output", "raw_excerpt": text[:2000]}

out_path.write_text(json.dumps(obj, indent=2, ensure_ascii=False), encoding="utf-8")
PY
rm -f "$SAFETY_JSON.raw"

python - "$BANDIT_JSON" "$SAFETY_JSON" "$PIP_AUDIT_JSON" "$REPORT_FILE" "$DATE" \
  "$bandit_exit" "$safety_exit" "$pip_audit_exit" <<'PY'
import json
import pathlib
import sys
from collections import Counter

bandit_file, safety_file, pip_audit_file, report_file, date, bandit_exit, safety_exit, pip_audit_exit = sys.argv[1:]

bandit = json.loads(pathlib.Path(bandit_file).read_text(encoding="utf-8"))
safety = json.loads(pathlib.Path(safety_file).read_text(encoding="utf-8"))
pip_audit = json.loads(pathlib.Path(pip_audit_file).read_text(encoding="utf-8"))

bandit_results = bandit.get("results", [])
sev_counter = Counter(item.get("issue_severity", "UNKNOWN") for item in bandit_results)
hi_bandit = [item for item in bandit_results if item.get("issue_severity") == "HIGH"]
med_low_bandit = [item for item in bandit_results if item.get("issue_severity") in {"MEDIUM", "LOW"}]

vuln_count_safety = safety.get("report_meta", {}).get("vulnerabilities_found", "unknown")

pip_vulns = []
for dep in pip_audit.get("dependencies", []):
    for vuln in dep.get("vulns", []):
        pip_vulns.append({
            "package": dep.get("name"),
            "version": dep.get("version"),
            "id": vuln.get("id"),
            "aliases": ", ".join(vuln.get("aliases", [])),
            "fix_versions": ", ".join(vuln.get("fix_versions", [])) or "N/A",
            "description": vuln.get("description", "").strip(),
        })

lines = [
    f"# Security Scan Report ({date})",
    "",
    "## Run Summary",
    "",
    f"- Bandit exit code: `{bandit_exit}`",
    f"- Safety exit code: `{safety_exit}`",
    f"- pip-audit exit code: `{pip_audit_exit}`",
    "",
    "## Bandit (Static Analysis)",
    "",
    f"- Total findings: **{len(bandit_results)}**",
    f"- HIGH: **{sev_counter.get('HIGH', 0)}**",
    f"- MEDIUM: **{sev_counter.get('MEDIUM', 0)}**",
    f"- LOW: **{sev_counter.get('LOW', 0)}**",
    "",
]

if hi_bandit:
    lines += ["### HIGH Findings (must fix)", ""]
    for item in hi_bandit:
        lines.append(f"- `{item.get('test_id')}` `{item.get('filename')}:{item.get('line_number')}` — {item.get('issue_text')}")
    lines.append("")
else:
    lines += ["- ✅ No HIGH severity findings.", ""]

lines += [
    "### MEDIUM/LOW Findings",
    "",
    f"- Count: **{len(med_low_bandit)}** (see `{pathlib.Path(bandit_file).name}` for details)",
    "",
    "## Safety (Dependency DB Check)",
    "",
    f"- Reported vulnerabilities: **{vuln_count_safety}**",
    "",
    "## pip-audit (Installed Dependency Audit)",
    "",
    f"- Vulnerable dependencies found: **{len(pip_vulns)}**",
    "",
]

if pip_vulns:
    lines += ["### Vulnerability Details", ""]
    for v in pip_vulns:
        lines += [
            f"- `{v['package']}=={v['version']}` — `{v['id']}` ({v['aliases'] or 'no alias'})",
            f"  - Fix versions: {v['fix_versions']}",
            f"  - {v['description']}",
        ]
    lines.append("")

lines += [
    "## Artifacts",
    "",
    f"- `{pathlib.Path(bandit_file).name}`",
    f"- `{pathlib.Path(safety_file).name}`",
    f"- `{pathlib.Path(pip_audit_file).name}`",
]

pathlib.Path(report_file).write_text("\n".join(lines) + "\n", encoding="utf-8")
PY

echo "Security scan report generated: $REPORT_FILE"

if [[ "$bandit_exit" -ne 0 || "$safety_exit" -ne 0 || "$pip_audit_exit" -ne 0 ]]; then
  exit 1
fi
