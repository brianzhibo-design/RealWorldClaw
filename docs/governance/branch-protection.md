# Branch Protection Policy

## `main` Branch Rules

| Rule | Setting |
|------|---------|
| Require pull request before merging | ✅ |
| Required approvals | 1 |
| Require status checks to pass | ✅ |
| Required checks | `Backend Tests`, `Frontend Build`, `Frontend Lint & Type Check`, `Backend Lint`, `Quality Gates` |
| Require branches to be up to date | ✅ |
| No force push | ✅ |
| No deletions | ✅ |

## Setup (GitHub UI)

1. Go to **Settings → Branches → Add branch protection rule**
2. Branch name pattern: `main`
3. Enable all rules listed above
4. Select all CI job names as required status checks
5. Save changes

## Rationale

- PRs ensure code review and knowledge sharing
- Status checks prevent broken code from reaching main
- No force push preserves git history integrity
