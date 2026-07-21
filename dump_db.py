import sqlite3

def dump_database():
    conn = sqlite3.connect('legalease.db')
    cursor = conn.cursor()

    print("==================================================")
    print("           LEGALEASE DATABASE DUMP                ")
    print("==================================================")

    # Tables list
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"Active Tables: {tables}\n")

    # Users
    if 'users' in tables:
        print("--- USERS TABLE ---")
        cursor.execute("SELECT id, username, email, created_at FROM users;")
        users = cursor.fetchall()
        if not users:
            print("No registered users found yet.")
        else:
            for u in users:
                print(f"  ID: {u[0]} | Username: {u[1]} | Email: {u[2]} | Registered: {u[3]}")
        print()

    # Documents
    if 'documents' in tables:
        print("--- DOCUMENTS TABLE ---")
        cursor.execute("SELECT id, filename, created_at FROM documents;")
        docs = cursor.fetchall()
        if not docs:
            print("No uploaded document records found yet.")
        else:
            for d in docs:
                print(f"  ID: {d[0]} | Filename: {d[1]} | Uploaded: {d[2]}")
        print()

    # Analyses
    if 'analyses' in tables:
        print("--- ANALYSES TABLE ---")
        cursor.execute("SELECT id, document_id, language, summary_text, created_at FROM analyses;")
        analyses = cursor.fetchall()
        if not analyses:
            print("No analysis records found yet.")
        else:
            for a in analyses:
                snippet = (a[3][:60] + "...") if a[3] else ""
                print(f"  ID: {a[0]} | Doc ID: {a[1]} | Lang: {a[2]} | Summary: {snippet} | Date: {a[4]}")
        print()

    print("==================================================")
    conn.close()

if __name__ == "__main__":
    dump_database()
