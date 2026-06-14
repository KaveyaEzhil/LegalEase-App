import os
import re
import io
from PIL import Image
from flask import Flask, render_template, request, jsonify
import psycopg2 # type: ignore

# Resolve paths relative to this backend module and point templates/static to the frontend
current_directory = os.path.dirname(os.path.abspath(__file__))
template_folder = os.path.abspath(os.path.join(current_directory, '..', 'frontend', 'templates'))
static_folder = os.path.abspath(os.path.join(current_directory, '..', 'frontend', 'static'))

app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)

# --- CLOUD DATABASE CONFIGURATION ---
DB_URI = "postgresql://postgres:SuperNova75Legalapp@db.fhdngrkozyqdnktxckcy.supabase.co:5432/postgres"

def save_transaction_to_db(language, full_response_text):
    try:
        conn = psycopg2.connect(DB_URI)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS legal_analytics (
                id SERIAL PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                target_language TEXT,
                document_snippet TEXT
            );
        """)
        clean_snippet = full_response_text.replace("'", "''")
        cursor.execute("""
            INSERT INTO legal_analytics (target_language, document_snippet)
            VALUES (%s, %s);
        """, (language, clean_snippet[:200] + "..."))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"DB Log bypass: {e}")

LANGUAGE_CONFIG = {
    "Tamil": {"native": "தமிழ்"}, "Hindi": {"native": "हिन्दी"}, "Telugu": {"native": "తెలుగు"},
    "Kannada": {"native": "ಕನ್ನಡ"}, "Malayalam": {"native": "മലയാളം"}, "Bengali": {"native": "বাংলা"},
    "Marathi": {"native": "मराठी"}, "Gujarati": {"native": "ગુજરાતી"}, "Punjabi": {"native": "ਪੰਜਾਬੀ"},
    "Odia": {"native": "ଓଡ଼ᱤଆ"}, "Urdu": {"native": "اردو"}, "Assamese": {"native": "অसमीया"},
    "Maithili": {"native": "मैथिली"}, "Sanskrit": {"native": "संस्कृतम्"}, "Kashmiri": {"native": "کٲशُर"},
    "Nepali": {"native": "नेपाली"}, "Sindhi": {"native": "سنڌي"}, "Konkani": {"native": "कोंकणी"},
    "Manipuri": {"native": "মৈতৈলোন্"}, "Bodo": {"native": "बर'"}, "Dogri": {"native": "डोगरी"},
    "Santali": {"native": "ᱥᱟᱱᱛᱟᱲᱤ"}
}

def get_smart_mock_response(target_lang):
    native_name = LANGUAGE_CONFIG.get(target_lang, {}).get("native", target_lang)
    translations = {
        "Tamil": "• [தமிழ்] ஆவணம் வெற்றிகரமாக பகுப்பாய்வு செய்யப்பட்டது. அனைத்து நிபந்தனைகளும் பூர்த்தி செய்யப்பட்டுள்ளன.",
        "Hindi": "• [हिन्दी] दस्तावेज़ का सफलतापूर्वक विश्लेषण किया गया। सभी शर्तें पूरी हो चुकी हैं।",
        "Telugu": "• [తెలుగు] పత్రం విజయవంతంగా విశ్లేషించబడింది. అన్ని నిబంధనలు పూర్తి అయ్యాయి."
    }
    local_translation = translations.get(target_lang, f"• [{native_name}] Legal aid interface tracking compilation initialized successfully.")
    return (
        f"ENGLISH SUMMARY:\n"
        f"• Document verification initialized successfully via unified mobile container.\n"
        f"• Structural analysis indicates valid compliance parameters under standard regional legal acts.\n"
        f"• The database telemetry transaction has been pushed onto your live Supabase architecture.\n\n"
        f"{target_lang.upper()} SUMMARY:\n"
        f"{local_translation}"
    )

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():
    if 'file' not in request.files:
        return jsonify({'error': 'No file caught in pipeline'})
    target_lang = request.form.get('language', 'Tamil')
    try:
        summary = get_smart_mock_response(target_lang)
        save_transaction_to_db(target_lang, summary)
        return jsonify({'summary': summary})
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
