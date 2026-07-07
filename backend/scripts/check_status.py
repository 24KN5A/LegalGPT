import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.config import settings  # noqa: E402

conn = sqlite3.connect(str(settings.sqlite_path))

print("--- Status counts ---")
for row in conn.execute("SELECT status, COUNT(*) FROM documents GROUP BY status"):
    print(row)

print("\n--- Non-ready documents (if any) ---")
for row in conn.execute(
    "SELECT original_filename, status, error_message FROM documents WHERE status != 'ready'"
):
    print(row)

conn.close()
