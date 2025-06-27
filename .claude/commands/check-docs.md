---
description: Check documentation from Expo, Anthropic, or Replit Quick SH using WebFetch
allowed-tools: WebFetch, WebSearch
---

## Your task

Check documentation based on the following query: $ARGUMENTS

### How to use this command:
- For Expo documentation: Include "expo" or mention Expo/React Native concepts
- For Anthropic/Claude documentation: Include "claude", "anthropic", or "mcp"
- For Replit Quick SH: Include "replit" or "quick-sh"
- Or provide a full URL from one of the allowed domains

### Process:

1. **Parse the query** to determine:
   - Which documentation source to check
   - What specific topic or path to search for
   - Whether to search multiple sources

2. **Select the appropriate domain**:
   - If query contains "expo", "react native", "navigation", "router" → use docs.expo.dev
   - If query contains "claude", "anthropic", "mcp", "model" → use docs.anthropic.com
   - If query contains "replit", "quick" → use quick-sh.replit.app
   - If unclear, ask for clarification

3. **Fetch the documentation**:
   - Use WebFetch with the selected domain
   - Construct appropriate search queries or paths
   - Handle multiple results if needed

4. **Present the results**:
   - Format the documentation clearly
   - Extract key information and code examples
   - Provide direct links to the documentation pages
   - Summarize the most relevant parts

5. **Follow-up suggestions**:
   - Suggest related documentation topics
   - Offer to search additional sources if needed
   - Provide code examples if applicable

### Examples:
- "expo router setup" → Searches Expo docs for router setup guides
- "claude mcp server" → Searches Anthropic docs for MCP server info
- "how to use expo camera" → Searches Expo docs for camera API
- "anthropic function calling" → Searches Claude docs for function calling

If no specific domain can be determined from the query, present options and ask which documentation source to check.