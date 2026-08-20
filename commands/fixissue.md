---
description: End-to-end issue resolution - fetch, branch, fix, test, commit, PR, close
model: claude-sonnet-4-6
---

# Fix Issue Workflow

Complete end-to-end workflow for resolving GitHub issues from identification through PR creation.

## Issue: $ARGUMENTS

## Quick Usage

```bash
/fixissue #123           # Fix issue by number
/fixissue #123 --no-pr   # Fix without creating PR
/fixissue #123 --draft   # Create draft PR
```

**When to use**: When you need to fully resolve a GitHub issue with proper git workflow, testing, and documentation.

**Prerequisites**:

- GitHub CLI authenticated (`gh auth status`)
- Clean working tree (no uncommitted changes)
- Write access to repository

**Output**: Branch with fix, tests, commit, and PR ready for review (or merged if auto-merge enabled).

## Process

### Step 1: Fetch Issue Details

```bash
# Get issue information
gh issue view [NUMBER] --json title,body,labels,assignees,milestone

# Display issue details for context
gh issue view [NUMBER]
```

Parse the issue to understand:

- **Problem**: What needs to be fixed?
- **Acceptance criteria**: How do we know it's fixed?
- **Scope**: What files/components are affected?
- **Labels**: Bug, feature, enhancement, etc.

### Step 2: Create Feature Branch

```bash
# Ensure we're on latest main
git fetch origin main
git checkout main
git pull origin main

# Create descriptive branch name
git checkout -b fix/[issue-number]-[short-description]
# Examples:
# fix/123-null-pointer-auth
# feat/456-add-dark-mode
# bug/789-api-timeout
```

**Branch naming conventions**:

- `fix/` - Bug fixes
- `feat/` - New features
- `bug/` - Bug reports
- `chore/` - Maintenance tasks
- `docs/` - Documentation updates

### Step 3: Implement the Fix

Based on issue analysis:

1. **Locate affected files**:

   ```bash
   # Search codebase for relevant code
   grep -r "relevant_term" src/
   ```

2. **Make necessary changes**:
   - Follow existing code patterns
   - Maintain type safety
   - Add error handling
   - Keep changes focused on the issue

3. **Verify changes compile**:

   ```bash
   npm run build
   # OR
   npx tsc --noEmit
   ```

### Step 4: Write/Update Tests

```bash
# Run existing tests first
npm test

# Add new tests for the fix
# Location: adjacent to source file or in __tests__/
```

**Test requirements**:

- [ ] Unit tests for changed functions
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Integration tests if applicable
- [ ] Minimum 80% coverage maintained

### Step 5: Update Changelog (if exists)

Check for changelog and update:

```bash
# Check for changelog
ls -la CHANGELOG* HISTORY* CHANGES*
```

If changelog exists, add entry:

```markdown
## [Unreleased]

### Fixed
- Fix [brief description] (#123)

### Added
- Add [feature description] (#123)

### Changed
- Update [change description] (#123)
```

### Step 6: Run Verification

Execute full verification before committing:

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Tests with coverage
npm test -- --coverage

# Build verification
npm run build
```

**All checks must pass before proceeding.**

### Step 7: Commit Changes

```bash
# Stage relevant files (not all at once)
git add [specific-files]

# Create conventional commit
git commit -m "fix: [description]

[Longer explanation if needed]

Fixes #123"
```

**Conventional commit types**:

- `fix:` - Bug fixes
- `feat:` - New features
- `docs:` - Documentation only
- `style:` - Code style (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance

**Important**: Always reference the issue number with `Fixes #123` or `Closes #123` in the commit body.

### Step 8: Push and Create PR

```bash
# Push branch to remote
git push -u origin fix/[issue-number]-[short-description]

# Create pull request
gh pr create \
  --title "fix: [Description] (#[issue-number])" \
  --body "## Summary
Fixes #[issue-number]

## Changes
- [Change 1]
- [Change 2]

## Test Plan
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Edge cases verified

## Checklist
- [ ] Types pass
- [ ] Lint passes
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Changelog updated (if applicable)"
```

**PR options**:

- `--draft` - Create as draft PR
- `--reviewer @username` - Request specific reviewer
- `--label bug` - Add labels
- `--milestone "v1.0"` - Assign to milestone

### Step 9: Link and Update Issue

```bash
# Comment on issue with PR link
gh issue comment [NUMBER] --body "Fix submitted in PR #[pr-number]"

# Optionally add labels
gh issue edit [NUMBER] --add-label "in-progress"
```

### Step 10: Monitor and Close

After PR is merged:

```bash
# Verify issue is auto-closed (if using "Fixes #123")
gh issue view [NUMBER] --json state

# If not auto-closed, close manually
gh issue close [NUMBER] --comment "Fixed in PR #[pr-number]"

# Clean up local branch
git checkout main
git pull origin main
git branch -d fix/[issue-number]-[short-description]
```

## Output Format

```markdown
## Issue Resolution Report

### Issue: #[number] - [title]

**Status**: [In Progress / PR Created / Merged / Closed]

### Changes Made
| File | Change Type | Description |
|------|-------------|-------------|
| src/auth.ts | Modified | Fixed null check |
| src/auth.test.ts | Added | New test cases |

### Verification Results
| Check | Status |
|-------|--------|
| Types | PASS |
| Lint | PASS |
| Tests | PASS (45/45) |
| Build | PASS |
| Coverage | 85% |

### Git Operations
- Branch: `fix/123-null-pointer-auth`
- Commits: 1
- PR: #456

### Next Steps
- [ ] Await code review
- [ ] Address feedback
- [ ] Merge when approved

### Links
- Issue: [#123](link)
- PR: [#456](link)
```

## Flags and Options

| Flag | Description |
|------|-------------|
| `--no-pr` | Fix and commit but don't create PR |
| `--draft` | Create PR as draft |
| `--no-tests` | Skip test writing (not recommended) |
| `--no-changelog` | Skip changelog update |
| `--reviewer @user` | Request specific reviewer |

## Error Handling

### Issue Not Found

```
Error: Issue #123 not found
Action: Verify issue number and repository
```

### Dirty Working Tree

```
Error: Uncommitted changes detected
Action: Commit or stash changes before proceeding
```

### Tests Failing

```
Error: Test suite failed
Action: Fix failing tests before creating PR
```

### Branch Already Exists

```
Error: Branch fix/123-description already exists
Action: Delete existing branch or use different name
```

## Integration

This command works with:

- **verify** - Runs verification before commit
- **review** - Prepares code for review
- **automerge** - Merges PR after approval

## Example Workflow

```bash
# User runs command
/fixissue #123

# Claude:
# 1. Fetches issue details
# 2. Creates branch fix/123-api-timeout
# 3. Analyzes codebase
# 4. Implements fix in src/api/client.ts
# 5. Adds tests in src/api/client.test.ts
# 6. Updates CHANGELOG.md
# 7. Runs verification (all pass)
# 8. Commits: "fix: handle API timeout gracefully\n\nFixes #123"
# 9. Pushes branch
# 10. Creates PR #456
# 11. Comments on issue #123
# 12. Reports completion
```
