---
description: PR automation - validate, merge, cleanup, and sync
model: claude-sonnet-4-6
---

# Auto Merge Workflow

Automated pull request validation, merging, and cleanup with full verification gates.

## PR: $ARGUMENTS

## Quick Usage

```bash
/automerge #456           # Validate and merge PR
/automerge #456 --squash  # Force squash merge
/automerge #456 --rebase  # Force rebase merge
/automerge #456 --dry-run # Check without merging
```

**When to use**: After PR is approved and ready to merge, to ensure all gates pass before merging.

**Prerequisites**:

- GitHub CLI authenticated (`gh auth status`)
- PR has required approvals
- Write access to repository
- Branch protection rules satisfied

**Output**: Merged PR, deleted branch, synced local main.

## Process

### Step 1: Fetch PR Details

```bash
# Get PR information
gh pr view [NUMBER] --json title,body,state,mergeable,mergeStateStatus,reviews,statusCheckRollup,headRefName,baseRefName,additions,deletions,changedFiles

# Display PR summary
gh pr view [NUMBER]
```

Parse to understand:

- **State**: Open, closed, merged
- **Mergeable**: Can it be merged?
- **Reviews**: Approval status
- **Checks**: CI/CD status
- **Conflicts**: Merge conflicts?

### Step 2: Verify PR Status

Check all requirements are met:

```bash
# Check review status
gh pr view [NUMBER] --json reviews --jq '.reviews[] | select(.state=="APPROVED")'

# Check CI status
gh pr view [NUMBER] --json statusCheckRollup --jq '.statusCheckRollup[] | {context: .context, state: .state}'

# Check mergeable state
gh pr view [NUMBER] --json mergeable,mergeStateStatus
```

**Status checks**:
| Check | Required |
|-------|----------|
| Approved reviews | Yes (1+) |
| CI passing | Yes |
| No conflicts | Yes |
| Branch up-to-date | Recommended |

### Step 3: Run Local Validation Gates

Before merging, run comprehensive local checks:

```bash
# Checkout PR branch locally
gh pr checkout [NUMBER]

# Phase 1: Build
npm run build

# Phase 2: Type checking
npx tsc --noEmit

# Phase 3: Linting
npm run lint

# Phase 4: Tests
npm test -- --coverage

# Phase 5: Security scan
grep -rn "console\.log" --include="*.ts" --include="*.tsx" src/ app/ 2>/dev/null | wc -l
```

**All gates must pass for merge to proceed.**

### Step 4: Update Changelog

Check and update changelog with PR details:

```bash
# Check for changelog
ls -la CHANGELOG* HISTORY* CHANGES*
```

If changelog exists and not already updated:

```markdown
## [Unreleased]

### [Type based on PR labels]
- [PR title] (#[pr-number])
```

**Changelog categories**:

- `Added` - New features
- `Changed` - Changes to existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security fixes

If changelog was updated, commit it:

```bash
git add CHANGELOG.md
git commit -m "docs: update changelog for PR #[NUMBER]"
git push
```

### Step 5: Select Merge Method

Determine appropriate merge method:

| Method | When to Use |
|--------|-------------|
| **Squash** | Multiple commits, want clean history |
| **Rebase** | Linear history, clean commits |
| **Merge** | Preserve all commits, feature branches |

**Decision tree**:

```
Commits > 3? → Squash
Commits clean and atomic? → Rebase
Need full history? → Merge
Default → Squash
```

### Step 6: Execute Merge

```bash
# Squash merge (default for most cases)
gh pr merge [NUMBER] --squash --delete-branch

# OR Rebase merge
gh pr merge [NUMBER] --rebase --delete-branch

# OR Standard merge
gh pr merge [NUMBER] --merge --delete-branch
```

**Merge options**:

- `--squash` - Squash commits into one
- `--rebase` - Rebase and merge
- `--merge` - Standard merge commit
- `--delete-branch` - Delete branch after merge
- `--auto` - Enable auto-merge when requirements met

### Step 7: Verify Merge Success

```bash
# Check PR state
gh pr view [NUMBER] --json state,mergedAt,mergedBy

# Verify branch deleted on remote
git fetch --prune
git branch -r | grep [branch-name] || echo "Branch deleted successfully"
```

### Step 8: Clean Up Local Environment

```bash
# Switch to main
git checkout main

# Pull latest changes
git pull origin main

# Delete local feature branch
git branch -d [branch-name]

# Prune remote tracking branches
git fetch --prune

# Verify clean state
git status
```

### Step 9: Close Related Issues

Check if PR closes any issues:

```bash
# Extract issue references from PR body
gh pr view [NUMBER] --json body --jq '.body' | grep -oE "(Fixes|Closes|Resolves) #[0-9]+"

# Verify issues are closed
gh issue view [ISSUE_NUMBER] --json state
```

If issues not auto-closed:

```bash
gh issue close [ISSUE_NUMBER] --comment "Closed via PR #[NUMBER]"
```

## Output Format

```markdown
## Auto Merge Report

### PR: #[number] - [title]

**Status**: [Merged / Failed / Blocked]
**Merge Method**: [Squash / Rebase / Merge]
**Merged By**: [username]
**Merged At**: [timestamp]

### Pre-Merge Checks
| Check | Status | Details |
|-------|--------|---------|
| Reviews | PASS | 2 approvals |
| CI Status | PASS | All checks green |
| Mergeable | PASS | No conflicts |
| Build | PASS | Compiled successfully |
| Types | PASS | No errors |
| Lint | PASS | No warnings |
| Tests | PASS | 45/45, 85% coverage |

### Merge Details
- Commits merged: 3 (squashed to 1)
- Lines added: +150
- Lines removed: -45
- Files changed: 8

### Cleanup Actions
| Action | Status |
|--------|--------|
| Remote branch deleted | Done |
| Local branch deleted | Done |
| Main synced | Done |
| Issues closed | #123, #124 |

### Post-Merge Verification
- [ ] Main branch builds
- [ ] Deployment triggered (if applicable)
- [ ] Issues auto-closed

### Links
- PR: [#456](link)
- Commit: [abc1234](link)
- Issues closed: [#123](link)
```

## Flags and Options

| Flag | Description |
|------|-------------|
| `--squash` | Force squash merge |
| `--rebase` | Force rebase merge |
| `--merge` | Force standard merge |
| `--dry-run` | Validate without merging |
| `--no-delete` | Keep branch after merge |
| `--no-local-clean` | Skip local cleanup |
| `--force` | Skip local validation gates |

## Pre-Merge Blockers

The following will **block** auto-merge:

| Blocker | Resolution |
|---------|------------|
| Missing approvals | Request reviews |
| CI failing | Fix failing checks |
| Merge conflicts | Resolve conflicts |
| Branch out of date | Update branch |
| Protected branch rules | Satisfy requirements |
| Local build fails | Fix build errors |
| Tests failing | Fix failing tests |

## Error Handling

### PR Not Approved

```
Error: PR requires at least 1 approval
Action: Request review or wait for approval
Command: gh pr review [NUMBER] --request-review @reviewer
```

### CI Checks Failing

```
Error: CI checks are failing
Action: Fix failing checks
Command: gh pr checks [NUMBER]
```

### Merge Conflicts

```
Error: PR has merge conflicts
Action: Resolve conflicts
Commands:
  gh pr checkout [NUMBER]
  git fetch origin main
  git merge origin/main
  # Resolve conflicts
  git push
```

### Branch Out of Date

```
Error: Branch is behind base branch
Action: Update branch
Command: gh pr merge [NUMBER] --merge --admin
OR
  gh pr checkout [NUMBER]
  git fetch origin main
  git rebase origin/main
  git push --force-with-lease
```

## Dry Run Mode

When using `--dry-run`, the command will:

1. Fetch and display PR details
2. Check all requirements
3. Run local validation gates
4. Report what would happen
5. **Not perform the actual merge**

```markdown
## Dry Run Results

### PR: #456 - Add user authentication

**Would merge**: Yes
**Method**: Squash
**Blockers**: None

### Validation Results
| Gate | Status |
|------|--------|
| Approvals | 2/1 required |
| CI | Passing |
| Conflicts | None |
| Local Build | Pass |
| Local Tests | Pass |

### Would Execute
1. Squash merge PR #456
2. Delete remote branch: feat/456-auth
3. Delete local branch: feat/456-auth
4. Pull latest main
5. Close issue #123

**Ready to merge**: Run `/automerge #456` without --dry-run
```

## Integration

This command works with:

- **fixissue** - Create PRs that can be auto-merged
- **verify** - Pre-merge validation
- **review** - Code review before merge

## Example Workflow

```bash
# User runs command
/automerge #456

# Claude:
# 1. Fetches PR #456 details
# 2. Checks: 2 approvals, CI green, no conflicts
# 3. Checks out PR locally
# 4. Runs build, types, lint, tests (all pass)
# 5. Determines squash merge appropriate
# 6. Executes: gh pr merge 456 --squash --delete-branch
# 7. Syncs local main
# 8. Deletes local feature branch
# 9. Verifies issue #123 auto-closed
# 10. Reports completion
```

## Safety Features

1. **Never force-pushes to main/master**
2. **Always validates locally before merge**
3. **Respects branch protection rules**
4. **Confirms destructive actions**
5. **Provides dry-run option**
6. **Logs all actions for audit**
