---
description: Create a new Claude Code custom command
---

## Your task

Create a new custom command based on the following request:

$ARGUMENTS

Follow these guidelines:

1. Create the command file at `.claude/commands/<command-name>.md`
2. Use the proper Claude Code command format with:
   - YAML frontmatter containing `description` (and optionally `allowed-tools` for security/scope constraints)
   - Optional `## Context` section for bash commands (using `!`) or file includes (using `@`)
   - Required `## Your task` section with the main prompt
   - Support for `$ARGUMENTS` for dynamic input

3. Example format:
```markdown
---
description: Brief description of what the command does
# allowed-tools: Bash, Read, Write  # Optional: specify which tools this command can use
---

## Context (optional)
!git status
@file.txt

## Your task
Instructions for Claude, including $ARGUMENTS for user input
```

4. Make the description concise and clear
5. Ensure the command name is descriptive and follows kebab-case convention
6. Note: The `allowed-tools` field can be used to restrict which tools a command can access for security/scope reasons

## Design Principles for Developer Commands

When creating commands for developer tools, follow these principles:

1. **Prioritize complete automation** - Don't rely on interactive prompts or manual steps
2. **Include pre-flight checks** - Validate prerequisites before the main action (e.g., check git status before creating PR)
3. **Generate smart defaults** - When user provides minimal input, analyze context to generate appropriate values
4. **Consider the full workflow**:
   - Pre-checks (validate state)
   - Main action (execute the command)
   - Result/feedback (return URLs, success messages, etc.)
5. **Fail gracefully** - Provide helpful error messages and suggest fixes

## Questions to Consider

If the request is vague, consider these aspects:
- What should happen when no arguments are provided?
- What validations should run before the main action?
- What output should the user receive after completion?
- Are there common workflows this command should support?

## Example: Minimal vs Comprehensive Implementation

**Minimal (avoid this):**
```markdown
## Your task
Create a PR using: gh pr create $ARGUMENTS
```

**Comprehensive (prefer this):**
```markdown
## Context
!git status
!git log --oneline -5

## Your task
Create a GitHub pull request:
1. Ensure all changes are committed
2. Push current branch to remote
3. If no title in $ARGUMENTS, analyze recent commits to generate one
4. Create PR with gh pr create
5. Return the PR URL for easy access
```