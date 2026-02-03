# Scripts Directory

## analyze_logs.py

Python script for RAG stack ingestion with proper path alignment (fixes Issue 1).

### Features
- Aligns Firestore paths between Python ingestion and TypeScript retrieval
- Uses `artifacts/{app_id}/public/data/knowledge_buckets` collection path
- Includes `user_id` in all payloads for proper isolation
- Implements Rule 1: Strict Paths & Isolation

### Configuration

Environment Variables:
- `__app_id`: Application ID for path construction (default: "default-app-id")
- `USER_ID`: User ID for isolation (default: "jasonbender-c3x")
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to Firebase/GCP credentials JSON

### Installation

```bash
pip install -r scripts/requirements.txt
```

### Usage

```bash
# Set environment variables
export __app_id="your-app-id"
export USER_ID="jasonbender-c3x"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"

# Run the script
python scripts/analyze_logs.py
```

### How It Works

1. **Credentials**: Initializes Firestore client with GCP credentials
2. **Path Construction**: Builds collection path using app_id
3. **Ingestion**: Writes log entries with proper schema:
   - `user_id`: For isolation
   - `app_id`: For path alignment
   - `message_id`: Unique identifier
   - `content`: Log content
   - `metadata`: Additional data
   - `timestamp`: ISO format timestamp
   - `vector`: Optional embedding vector

### Collection Path Structure

```
artifacts/
  {app_id}/
    public/
      data/
        knowledge_buckets/
          {message_id}
            - user_id
            - app_id
            - content
            - metadata
            - timestamp
            - vector (optional)
```

This structure ensures:
- ✓ Python ingestion writes to the correct path
- ✓ TypeScript retrieval reads from the same path
- ✓ User isolation is enforced
- ✓ No "split brain" between ingestion and retrieval
