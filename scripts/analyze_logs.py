#!/usr/bin/env python3
"""
RAG Stack Ingestion Script (Issue 1 Fix)
Aligned to use correct Firestore paths with app_id isolation
"""
import os
import sys
from datetime import datetime

# Environment configuration
APP_ID = os.getenv("__app_id", "default-app-id")
USER_ID = os.getenv("USER_ID", "jasonbender-c3x")

# Firestore collection path - aligned with TypeScript backend retrieval path
# Using artifacts/{app_id}/public/data/knowledge_buckets for proper isolation
COLLECTION_PATH = f"artifacts/{APP_ID}/public/data/knowledge_buckets"

def get_firestore_client():
    """
    Initialize Firestore client
    Requires GOOGLE_APPLICATION_CREDENTIALS or appropriate auth
    """
    try:
        from google.cloud import firestore
        return firestore.Client()
    except ImportError:
        print("ERROR: google-cloud-firestore not installed")
        print("Run: pip install google-cloud-firestore")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Failed to initialize Firestore client: {e}")
        sys.exit(1)

def ingest_log_entry(db, entry_data):
    """
    Ingest a log entry into Firestore with proper path and user_id
    
    Args:
        db: Firestore client
        entry_data: Dict with 'message_id', 'content', 'metadata', etc.
    """
    message_id = entry_data.get('message_id', f"msg_{datetime.now().timestamp()}")
    
    # Construct the document reference using the aligned path
    doc_ref = db.collection(COLLECTION_PATH).document(message_id)
    
    # Ensure payload includes user_id for proper isolation
    payload = {
        'user_id': USER_ID,
        'app_id': APP_ID,
        'message_id': message_id,
        'content': entry_data.get('content', ''),
        'metadata': entry_data.get('metadata', {}),
        'timestamp': datetime.now().isoformat(),
        'indexed_at': firestore.SERVER_TIMESTAMP,
    }
    
    # Add vector if provided
    if 'vector' in entry_data:
        payload['vector'] = entry_data['vector']
    
    try:
        doc_ref.set(payload)
        print(f"✓ Ingested: {message_id} to {COLLECTION_PATH}")
        return True
    except Exception as e:
        print(f"✗ Failed to ingest {message_id}: {e}")
        return False

def main():
    """
    Main ingestion process
    """
    print("=" * 60)
    print("RAG Stack Ingestion Script (V1.1)")
    print("=" * 60)
    print(f"App ID: {APP_ID}")
    print(f"User ID: {USER_ID}")
    print(f"Collection Path: {COLLECTION_PATH}")
    print("=" * 60)
    
    # Initialize Firestore
    db = get_firestore_client()
    
    # Example: Process log files or data sources
    # This is a template - actual log processing logic would go here
    example_entries = [
        {
            'message_id': 'example_001',
            'content': 'Sample log entry for testing',
            'metadata': {'source': 'test', 'type': 'example'}
        }
    ]
    
    success_count = 0
    for entry in example_entries:
        if ingest_log_entry(db, entry):
            success_count += 1
    
    print("=" * 60)
    print(f"Ingestion complete: {success_count}/{len(example_entries)} successful")
    print("=" * 60)

if __name__ == "__main__":
    main()
