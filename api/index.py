from flask import Flask, request, render_template, jsonify
import pytesseract
from PIL import Image
import io
import psycopg2
import os

app = Flask(__name__)

# 📝 FIX 1: REMOVED THE HARDCODED WINDOWS C:\ PATH 
# Vercel finds Tesseract automatically on Linux, so no path configuration is required!

# Database connection URL
DB_URL = "postgresql://postgres:SuperNova75Legalapp@db.fhdngrkozyqdndktxckcy.supabase.co:5432/postgres"

def clean_ai_text(text):
    """Removes any raw ANSI or markdown symbols if present."""
    return text.replace("\x1B[31m", "").replace("[0M", "").strip()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process_document():
    # Check if file exists in the incoming request payload
    if 'file' not in request.files:
        return jsonify({"error": "No file caught in pipeline"}), 200
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Empty file submitted"}), 200

    try:
        # 📝 FIX 2: IN-MEMORY PROCESSING (Bypasses Vercel's Read-Only Filesystem restriction)
        img_bytes = file.read()
        img = Image.open(io.BytesIO(img_bytes))
        
        # Run OCR extraction straight from RAM bytes
        extracted_text = pytesseract.image_to_string(img)
        
        # Clean text and process database storage logic below
        cleaned_text = clean_ai_text(extracted_text)
        
        # Connect and push log entry directly to Supabase PostgreSQL
        conn = psycopg2.connect(DB_URL)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO legal_analytics (extracted_content, status) VALUES (%s, %s);",
            (cleaned_text, "Processed Successfully")
        )
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            "status": "success",
            "extracted_text": cleaned_text,
            "db_logged": True
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 200

if __name__ == '__main__':
    app.run(debug=True)
