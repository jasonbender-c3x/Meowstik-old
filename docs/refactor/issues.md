# GitHub Issues Template

## Issue 1: RAG Stack Ingestion Failure (Rule 1 Violation)

### Problem
The Retrieval-Augmented Generation (RAG) stack is silently failing.
- **Ingestion**: Python "Refinery" writes to root-level Firestore collection (e.g., `tech_core`)
- **Retrieval**: TypeScript backend looks in `/artifacts/{appId}/public/data/knowledge_buckets`
- **Result**: The "Brain" (Ingestion) and "Eyes" (Retrieval) are misaligned

### Fix
Align the Ingestion Path with the Retrieval Path by:
1. Enforcing Rule 1 (Strict Paths)
2. Ensuring both Python and TypeScript use the same authorized location
3. Attaching `user_id` to every record for proper isolation

### Implementation Steps
1. Locate ingestion script: `scripts/analyze_logs.py`
2. Inject App ID: Retrieve `__app_id` environment variable
3. Construct Path: Update Firestore collection reference
   - Old: `db.collection("tech_core")`
   - New: `db.collection("artifacts").document(app_id).collection("public").document("data").collection("knowledge_buckets")`
4. Schema Compliance: Update data payload to include `userId`
5. Restart ingestion service

### Code Snippet
```python
import os

APP_ID = os.getenv("__app_id", "default-app-id")
COLLECTION_PATH = f"artifacts/{APP_ID}/public/data/knowledge_buckets"

# Inside your loop
doc_ref = db.collection(COLLECTION_PATH).document(entry.message_id)
payload['user_id'] = "jasonbender-c3x"  # Ensure visibility
```

### Labels
- `bug`
- `RKS-CORE`
- `auto-generated`

### Assignee
jasonbender

---

## Issue 2: Prompt Directory "Split Brain"

### Problem
The `/prompts/` directory contains conflicting and redundant instructions:
- `proposed-prompt.md`: Outdated logic (V4.2), references deprecated tools
- `database-instructions.md`: Encourages direct SQL access, violates MPC Server abstraction
- `llm-instructions.md`: Redundant with core-directives.md

### Fix
Delete "ghost" files and consolidate instructions into a single "Kernel":
- `AI_CORE_DIRECTIVE.md` + `core-directives.md`

This removes ambiguity about which tools to use.

### Implementation Steps
1. Delete ghost files:
   ```bash
   rm prompts/proposed-prompt.md prompts/llm-instructions.md prompts/database-instructions.md
   ```
2. Verify `prompts/core-directives.md` explicitly lists the `say` tool
3. Merge unique personality traits from `prompts/personality.md` into `core-directives.md`
4. Delete `personality.md` after merge

### Labels
- `bug`
- `RKS-CORE`
- `auto-generated`

### Assignee
jasonbender

---

## Issue 3: Memory Log Evaporation (Demand Paging Side-Effect)

### Problem
Critical memory files are not being updated:
- `logs/personal.md`
- `logs/Short_Term_Memory.md`
- `logs/execution.md`

**Cause**: "Demand Paging" optimization instructed the LLM to ignore these files to save context tokens, so it stopped writing to them.

**Result**: System "Amnesia" - handles current conversation but fails to persist insights.

### Fix
Decouple Reading (Demand Paging) from Writing (Persistence):
- Ignore log content in prompts (save space)
- Still append to logs at end of every turn using `write_file` or `append_file`

### Implementation Steps
1. Update `prompts/core-directives.md` with MANDATORY POST-ACTION:
   > "AFTER generating a response, you MUST check if the interaction contained a 'Breakthrough', 'Task', or 'Personal Detail'. If yes, append a summary to logs/execution.md or logs/personal.md."

2. Verify files exist and are writable:
   ```bash
   touch logs/Short_Term_Memory.md logs/personal.md logs/execution.md
   ```

### Labels
- `bug`
- `RKS-CORE`
- `auto-generated`

### Assignee
jasonbender

---

## Issue 4: Expressive Audio Upgrade (SSML Emotion Tagging)

### Problem
`server/integrations/elevenlabs-tts.ts` sends raw text. The voice is flat.

### Fix
Port SSML emotion tagging logic from Meowstik-old.

### Implementation Steps
1. In `server/services/speech.ts`, create function `wrapWithSSML(text, sentiment)`
2. If sentiment is "excited" (>0.8), wrap text in appropriate SSML tags
3. Support emotions: excited, sad, angry, neutral
4. Pass wrapped text to ElevenLabs API

### Code Snippet
```typescript
function wrapWithSSML(text: string, sentiment: number): string {
  if (sentiment > 0.8) {
    return `<speak><prosody rate="fast" pitch="+10%">${text}</prosody></speak>`;
  } else if (sentiment < -0.5) {
    return `<speak><prosody rate="slow" pitch="-5%">${text}</prosody></speak>`;
  }
  return text;
}
```

### Labels
- `enhancement`
- `RKS-CORE`
- `auto-generated`

### Assignee
jasonbender
