---
allowed-tools: Bash, TodoWrite, Read, Grep, Task
description: Create a GitHub pull request from the current branch
---

## Context

!git branch --show-current
!git status --porcelain
!git log --oneline -5

## Your task

Create a new pull request on GitHub for the current branch.

Follow these steps:

1. Check the current git status and branch
   - Verify we're not on main/master branch
   - If there are uncommitted changes, inform the user and ask if they want to commit first

2. Ensure all changes are committed
   - If uncommitted changes exist, offer to commit them with a descriptive message
   - Show what files would be included in the commit

3. Push the current branch to remote if needed
   - Check if the branch exists on remote
   - Push with --set-upstream if it's a new branch

4. Create a pull request using the GitHub CLI (`gh pr create`)
   - Parse $ARGUMENTS to extract title and description
   - If no arguments provided, analyze the recent commits to generate:
     * PR title: Based on the first commit or overall change theme
     * PR description: List key changes from the commits
   - Support flags like --draft, --base if mentioned in arguments

5. Return the PR URL after creation
   - Capture the URL from gh output
   - Present it as a clickable link

If any step fails, provide clear error messages and suggestions for resolution.