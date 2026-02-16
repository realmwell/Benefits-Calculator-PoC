#!/usr/bin/env python3
"""
DC Benefits Finder — Embeddings Builder

Reads chunked corpus from corpus/processed/all_chunks.jsonl,
generates embeddings via Bedrock Titan Embeddings v2,
and builds a FAISS index.

Usage:
    python build_embeddings.py

Prerequisites:
    - AWS credentials configured with Bedrock access
    - corpus/processed/all_chunks.jsonl exists (run build_corpus.py first)

Output:
    backend/corpus/embeddings/benefits.faiss
    backend/corpus/embeddings/chunks_metadata.json
"""

import json
import sys
import time
from pathlib import Path

import boto3
import faiss
import numpy as np

# ── Configuration ─────────────────────────────────────────────────────

EMBED_MODEL = "amazon.titan-embed-text-v2:0"
EMBEDDING_DIM = 1024  # Titan v2 output dimension

CHUNKS_PATH = Path(__file__).parent.parent / "corpus" / "processed" / "all_chunks.jsonl"
OUTPUT_DIR = Path(__file__).parent.parent / "corpus" / "embeddings"

# Rate limiting for Bedrock API
BATCH_DELAY = 0.1  # seconds between embedding calls


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load chunks
    if not CHUNKS_PATH.exists():
        print(f"ERROR: {CHUNKS_PATH} not found. Run build_corpus.py first.")
        sys.exit(1)

    chunks = []
    with open(CHUNKS_PATH, "r") as f:
        for line in f:
            chunks.append(json.loads(line))

    print(f"Loaded {len(chunks)} chunks")

    # Initialize Bedrock client
    bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")

    # Generate embeddings
    embeddings = []
    for i, chunk in enumerate(chunks):
        if (i + 1) % 10 == 0 or i == 0:
            print(f"  Embedding chunk {i + 1}/{len(chunks)}...")

        try:
            response = bedrock.invoke_model(
                modelId=EMBED_MODEL,
                body=json.dumps({"inputText": chunk["text"][:8000]}),  # Titan v2 limit
            )
            body = json.loads(response["body"].read())
            embedding = body["embedding"]
            embeddings.append(embedding)
        except Exception as e:
            print(f"  ERROR embedding chunk {i}: {e}")
            # Use zero vector as fallback
            embeddings.append([0.0] * EMBEDDING_DIM)

        time.sleep(BATCH_DELAY)

    # Convert to numpy
    embeddings_np = np.array(embeddings, dtype=np.float32)
    print(f"Embeddings shape: {embeddings_np.shape}")

    # Normalize for cosine similarity
    faiss.normalize_L2(embeddings_np)

    # Build FAISS index (Inner Product = cosine similarity after normalization)
    index = faiss.IndexFlatIP(EMBEDDING_DIM)
    index.add(embeddings_np)
    print(f"FAISS index built with {index.ntotal} vectors")

    # Save index
    index_path = OUTPUT_DIR / "benefits.faiss"
    faiss.write_index(index, str(index_path))
    print(f"Index saved to {index_path}")

    # Save metadata (without embeddings, for Lambda)
    metadata_path = OUTPUT_DIR / "chunks_metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(chunks, f)
    print(f"Metadata saved to {metadata_path}")

    # Report sizes
    index_size_mb = index_path.stat().st_size / (1024 * 1024)
    metadata_size_mb = metadata_path.stat().st_size / (1024 * 1024)
    print(f"\nFAISS index: {index_size_mb:.1f} MB")
    print(f"Metadata: {metadata_size_mb:.1f} MB")
    print(f"Total: {index_size_mb + metadata_size_mb:.1f} MB")
    print("\nThese files go into a Lambda layer for the chat handler.")


if __name__ == "__main__":
    main()
