# Short-Term Memory

## Current Context (2026-02-03)

### Active Session
- Implementing Meowstik Middleware V1.0
- Addressing RAG stack ingestion failures
- Setting up proper directory structure and core directives

### Recent Decisions
- Aligned Firestore paths between Python ingestion and TypeScript retrieval
- Collection path: `artifacts/{app_id}/public/data/knowledge_buckets`
- All records must include `user_id` for proper isolation

### Breakthroughs
- Identified "Split Brain" issue: conflicting prompt files causing tool confusion
- Discovered "Amnesia" bug: demand paging preventing memory persistence
- Solution: decouple reading (demand paging) from writing (persistence)

### Current State
- Core infrastructure files created
- RAG ingestion script implemented with proper path alignment
- Core directives consolidated into single source of truth

### Next Steps
- Create GitHub middleware for issue automation
- Implement credentials acquisition logic
- Set up memory persistence hooks

---

## Historical Context

### Previous Sessions
(To be populated as system is used)

---

*This file is automatically updated after each significant interaction*
