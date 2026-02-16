"""
DC Benefits Finder — RAG Engine

Handles:
1. Loading FAISS index and chunk metadata
2. Embedding user questions via Bedrock Titan Embeddings v2
3. Retrieving top-k relevant passages
4. Building prompts with retrieved context
5. Calling Bedrock Claude Haiku for answers
"""

import json
import os
import numpy as np
import boto3
import faiss

# Paths — in Lambda, the FAISS index lives in a layer at /opt
INDEX_PATH = os.environ.get("FAISS_INDEX_PATH", "/opt/benefits.faiss")
METADATA_PATH = os.environ.get("CHUNKS_METADATA_PATH", "/opt/chunks_metadata.json")

# Bedrock model IDs
EMBED_MODEL = "amazon.titan-embed-text-v2:0"
LLM_MODEL = "anthropic.claude-3-5-haiku-20241022-v1:0"

# Clients (initialized once per Lambda cold start)
bedrock = boto3.client("bedrock-runtime", region_name=os.environ.get("AWS_REGION", "us-east-1"))

# Lazy-loaded globals
_index = None
_chunks = None


def _load_index():
    """Load FAISS index and chunk metadata (lazy, once per cold start)."""
    global _index, _chunks
    if _index is None:
        _index = faiss.read_index(INDEX_PATH)
        with open(METADATA_PATH, "r") as f:
            _chunks = json.load(f)
    return _index, _chunks


def embed_text(text: str) -> np.ndarray:
    """Embed text using Bedrock Titan Embeddings v2."""
    response = bedrock.invoke_model(
        modelId=EMBED_MODEL,
        body=json.dumps({"inputText": text}),
    )
    body = json.loads(response["body"].read())
    embedding = np.array(body["embedding"], dtype=np.float32)
    # Normalize for cosine similarity (FAISS IndexFlatIP)
    faiss.normalize_L2(embedding.reshape(1, -1))
    return embedding


def retrieve(question: str, k: int = 5) -> list[dict]:
    """Retrieve top-k relevant chunks for a question."""
    index, chunks = _load_index()
    q_embedding = embed_text(question)
    distances, indices = index.search(q_embedding.reshape(1, -1), k)

    results = []
    for i, idx in enumerate(indices[0]):
        if idx < 0 or idx >= len(chunks):
            continue
        chunk = chunks[idx]
        results.append(
            {
                "text": chunk["text"],
                "source_url": chunk.get("source_url", ""),
                "program_name": chunk.get("program_name", ""),
                "score": float(distances[0][i]),
            }
        )
    return results


def build_prompt(question: str, retrieved_chunks: list[dict]) -> str:
    """Build the RAG prompt with retrieved context."""
    context_parts = []
    for chunk in retrieved_chunks:
        source = chunk.get("source_url", "unknown")
        context_parts.append(f"[Source: {source}]\n{chunk['text']}")

    context_text = "\n\n".join(context_parts)

    return f"""You are a benefits advisor for Washington, DC residents.
Answer the user's question using ONLY the provided context.
If the context doesn't contain enough information, say so.
Always cite your sources with the URL provided.
Never fabricate benefit amounts or eligibility criteria.

Context:
{context_text}

Question: {question}

Answer:"""


def generate_answer(prompt: str) -> str:
    """Call Bedrock Claude Haiku to generate an answer."""
    response = bedrock.invoke_model(
        modelId=LLM_MODEL,
        body=json.dumps(
            {
                "anthropic_version": "bedrock-2023-05-31",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 1000,
            }
        ),
    )
    body = json.loads(response["body"].read())
    return body["content"][0]["text"]


def answer_question(question: str) -> dict:
    """Full RAG pipeline: embed -> retrieve -> generate."""
    retrieved = retrieve(question, k=5)

    prompt = build_prompt(question, retrieved)
    answer = generate_answer(prompt)

    sources = [
        {"url": c["source_url"], "program": c["program_name"]} for c in retrieved
    ]

    return {"answer": answer, "sources": sources}
