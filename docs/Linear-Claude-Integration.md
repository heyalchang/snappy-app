# Linear + Claude Code Integration Guide

This is a living document describing how we integrate Linear project management with Claude Code development workflow for the Snappy-app project.

## Initial Setup

### 1. Linear API Authentication
- Generate a Personal API key from Linear: Settings → API → Personal API keys
- Configure Claude Code MCP: `claude mcp add linear-server -e LINEAR_API_KEY=your-key -- npx @modelcontextprotocol/server-linear`
- Verify connection: Use `/mcp` command in Claude Code

### 2. Project Structure
- Created a dedicated project: "Snappy-app" with description linking to class project
- Team: Potdot (default team)
- Project ID: `a7cacc28-4029-4a10-b988-e31679aea2f6` (for reference)

## Issue Management System

### Phase-Based Issues
We track development phases as individual issues:
- **Naming Convention**: `Phase [N]: [Description]`
- **Priority Levels**:
  - Urgent (1): Current/Active phases
  - High (2): Next upcoming phases
  - Medium (3): Future phases
- **Due Dates**: Set based on technical plan timeline

### Issue Structure Template
```markdown
## Tasks
- [ ] Specific implementation tasks
- [ ] Listed as checkboxes

## Exit Criteria
- Clear success metrics
- User-facing functionality

## Claude's Technical Verification
- [ ] Technical checks Claude can verify
- [ ] Implementation details confirmed
- [ ] Code-level validations

## User Acceptance
- [ ] User acceptance of exit criteria (NEVER checked by Claude)
```

### Bug Tracking
Major bugs get dedicated issues with:
- **Title Format**: `BUG: [Description]`
- **Label**: "Bug" (red color)
- **Required Sections**:
  - Bug Description
  - Environment details
  - Steps to Reproduce
  - Expected vs Actual Behavior
  - Investigation History
  - Attempted Fixes
  - Current Workarounds
  - Potential Solutions
  - Related Documentation
  - Code References (file:line format)

## Claude Code Rules

### 1. Exit Criteria Management
- Claude can NEVER check off "User acceptance of exit criteria"
- Claude creates and manages its own technical verification checklist
- User acceptance remains separate and user-controlled

### 2. Status Updates
- **Done**: Only after user accepts exit criteria
- **In Progress**: Active development
- **Backlog**: Not yet started
- **In Review**: Ready for user testing

### 3. Issue Updates
- **NEVER rewrite issue descriptions** - only update existing checkboxes
- Check off tasks as they're completed using the existing format
- Add comments for significant updates, but preserve original issue structure

### 4. Code References
When referencing code in Linear issues, use format:
- `src/screens/CameraScreen.tsx:81` (specific line)
- `src/screens/CameraScreen.tsx:74-76` (line range)

## Workflow Integration

### Daily Development Flow
1. Check current phase status in Linear
2. Update task checkboxes as completed
3. Add comments for significant findings/blockers
4. Create bug issues for major problems
5. Link related issues with `#POT-XX` references

### Phase Completion Process
1. Complete all implementation tasks
2. Run Claude's technical verification checks
3. Update Linear issue with results
4. Request user acceptance testing
5. User marks acceptance checkbox
6. Move issue to "Done" status

## Future Enhancements (Planned)

### Milestones
- Consider adding Linear milestones for major releases
- Week-based milestones matching technical plan

### Additional Classifications
- **Feature Request**: New features beyond PRD
- **Technical Debt**: Refactoring needs
- **Documentation**: Doc updates needed
- **Performance**: Optimization opportunities

### Automation Ideas
- GitHub integration for PR linking
- Automatic status updates from commits
- Time tracking for phases

## Best Practices

### Issue Comments
- Use for significant updates only
- Include investigation results
- Document workarounds discovered
- Link to relevant documentation/code

### Label Usage
- Bug: Defects and issues
- Feature: New functionality
- Improvement: Enhancements
- Suggestion: Ideas for consideration

### Priority Management
- Urgent: Current sprint/week
- High: Next sprint/week
- Medium: Future work
- Low: Nice to have

## MCP Commands Reference

### Useful Linear MCP Commands
```typescript
// List all projects
mcp__linear-server__list_projects()

// Get specific issue
mcp__linear-server__get_issue({ id: "issue-id" })

// Create issue
mcp__linear-server__create_issue({ 
  title: "...", 
  description: "...", 
  teamId: "...", 
  projectId: "..." 
})

// Update issue
mcp__linear-server__update_issue({ 
  id: "...", 
  stateId: "...", 
  labelIds: [...] 
})

// Add comment
mcp__linear-server__create_comment({ 
  issueId: "...", 
  body: "..." 
})
```

## Document History
- 2024-12-23: Initial creation
- Added phase-based issue structure
- Defined bug tracking process
- Established Claude Code rules for exit criteria

---
*This document should be updated as we refine our processes and discover better workflows.*