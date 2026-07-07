import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.services.vector_store_service import get_vector_store  # noqa: E402

store = get_vector_store()
print("Total chunks in Chroma:", store.collection.count())

print("\n--- Sample retrieval test ---")
results = store.query("appeal dismissed by the Supreme Court", top_k=3)
for r in results:
    print(r["metadata"]["document_name"], "| score:", round(r["score"], 3) if r["score"] is not None else None)
    print(r["text"][:200].replace("\n", " "), "...\n")
