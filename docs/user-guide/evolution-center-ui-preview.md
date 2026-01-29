# Evolution Center UI Preview

## Layout Overview

The Evolution Center is accessible via a tab in the main Meowstik header and provides a full-screen interface for log analysis.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Meowstik                                [ Workspace ] [ Evolution Center ]   │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🧪 Evolution Center                                                          │
│ Analyze tool execution logs and auto-generate improvement issues            │
└─────────────────────────────────────────────────────────────────────────────┘
│                                                                               │
│ ╔═══════════════════════════════════════════════════════════════════════╗  │
│ ║ Tool Execution Logs                          [ Upload Log File ]      ║  │
│ ╠═══════════════════════════════════════════════════════════════════════╣  │
│ ║                                                                         ║  │
│ ║ Paste tool execution logs here or upload a log file...                ║  │
│ ║                                                                         ║  │
│ ║                                                                         ║  │
│ ║                                                                         ║  │
│ ╠═══════════════════════════════════════════════════════════════════════╣  │
│ ║ Min Occurrences: [ 3 ] errors to create issue   [ 🧪 Analyze Logs ]  ║  │
│ ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 📄 Total Logs    │ ❌ Errors Found  │ ✅ Issues Generated              │ │
│ │      12          │       9          │         2                        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ ╔═══════════════════════════════════════════════════════════════════════╗  │
│ ║ Error Patterns Detected                                                ║  │
│ ╠═══════════════════════════════════════════════════════════════════════╣  │
│ ║ ┌───────────────────────────────────────────────────────────────────┐ ║  │
│ ║ │ PermissionError                                      [ critical ] │ ║  │
│ ║ │ error: permission denied when writing to /path                    │ ║  │
│ ║ │ Occurrences: 4    Affected Tools: 1                               │ ║  │
│ ║ │ Tools: file_put                                                    │ ║  │
│ ║ └───────────────────────────────────────────────────────────────────┘ ║  │
│ ║ ┌───────────────────────────────────────────────────────────────────┐ ║  │
│ ║ │ TimeoutError                                         [ medium ]   │ ║  │
│ ║ │ network timeout after nms                                         │ ║  │
│ ║ │ Occurrences: 3    Affected Tools: 2                               │ ║  │
│ ║ │ Tools: http_post, http_get                                        │ ║  │
│ ║ └───────────────────────────────────────────────────────────────────┘ ║  │
│ ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                               │
│ ╔═══════════════════════════════════════════════════════════════════════╗  │
│ ║ Auto-Generated GitHub Issues                                           ║  │
│ ║ (Ready to be created and assigned to @copilot)                        ║  │
│ ╠═══════════════════════════════════════════════════════════════════════╣  │
│ ║ ┌───────────────────────────────────────────────────────────────────┐ ║  │
│ ║ │ [Auto-Generated] PermissionError: error: permission denied wh... │ ║  │
│ ║ │ [auto-generated] [evolution-center] [severity:low] [bug]         │ ║  │
│ ║ │ [tool:file_put]                                                   │ ║  │
│ ║ │ Assignees: @copilot                                               │ ║  │
│ ║ │ ▼ View Issue Body                                                 │ ║  │
│ ║ └───────────────────────────────────────────────────────────────────┘ ║  │
│ ║ ┌───────────────────────────────────────────────────────────────────┐ ║  │
│ ║ │ [Auto-Generated] TimeoutError: network timeout after nms         │ ║  │
│ ║ │ [auto-generated] [evolution-center] [severity:medium] [bug]      │ ║  │
│ ║ │ [tool:http_post] [tool:http_get]                                 │ ║  │
│ ║ │ Assignees: @copilot                                               │ ║  │
│ ║ │ ▼ View Issue Body                                                 │ ║  │
│ ║ └───────────────────────────────────────────────────────────────────┘ ║  │
│ ╚═══════════════════════════════════════════════════════════════════════╝  │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Features Shown

### Header Navigation
- Two tabs: "Workspace" and "Evolution Center"
- Active tab highlighted in blue
- Icon indicators for each section

### Evolution Center Header
- Gradient purple-to-blue background
- Flask icon (🧪) indicating experimental/evolution features
- Descriptive subtitle explaining functionality

### Input Section
- Large textarea for pasting logs
- "Upload Log File" button for file selection (supports .log, .txt, .json)
- Min Occurrences input for threshold tuning
- Prominent "Analyze Logs" button (purple, disabled when empty)

### Summary Cards
- Three metric cards showing:
  - Total Logs processed
  - Errors Found count
  - Issues Generated count
- Clean, card-based design with icons

### Error Patterns Display
- Each pattern shown in a bordered card
- Pattern name as heading with severity badge
- Normalized error message
- Occurrence count and affected tools count
- List of specific tools affected
- Hover effect for interactivity

### Auto-Generated Issues Display
- List of issues ready for GitHub
- Full issue title (truncated if too long)
- Label tags with distinct styling
- Assignees clearly shown
- Collapsible "View Issue Body" details
- Full issue markdown when expanded

## Color Scheme

- **Primary**: Purple gradient (#667eea to #764ba2)
- **Accent**: Blue (#60a5fa) for active states
- **Success**: Green for success indicators
- **Warning**: Yellow/Orange for medium severity
- **Error**: Red for high/critical severity
- **Background**: Dark slate (#0f172a) for consistency with rest of app
- **Text**: Light gray (#e2e8f0) on dark backgrounds

## Interactions

1. **Tab Switching**: Click tab buttons to switch between Workspace and Evolution Center
2. **File Upload**: Click "Upload Log File" to open file picker
3. **Text Input**: Paste logs directly or type in textarea
4. **Threshold Adjustment**: Use number input to change min occurrences
5. **Analysis**: Click "Analyze Logs" to process (shows loading spinner)
6. **Issue Details**: Click "View Issue Body" to expand full issue content
7. **Copy**: Users can copy issue content for manual GitHub creation

## Responsive Design

- Full-width layout on all screen sizes
- Cards stack on mobile devices
- Scrollable content areas
- Fixed header for easy navigation

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- High contrast colors
- Focus indicators on all interactive elements
