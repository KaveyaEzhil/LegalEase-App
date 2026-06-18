from backend.db import init_db, save_transaction_to_db

if __name__ == '__main__':
    init_db()
    save_transaction_to_db('Tamil', 'Test summary from smoke test', document_filename='smoke.txt', raw_text='Sample raw text for smoke test')
    print('Smoke test completed: inserted sample analysis into database')
