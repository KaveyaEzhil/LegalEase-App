import sys
import os
# Allow importing from parent directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import re
import io
from PIL import Image
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from backend.db import init_db, save_transaction_to_db, create_user, authenticate_user, get_user_by_id

# Resolve paths relative to this backend module and point templates/static to the frontend
current_directory = os.path.dirname(os.path.abspath(__file__))
template_folder = os.path.abspath(os.path.join(current_directory, '..', 'frontend', 'templates'))
static_folder = os.path.abspath(os.path.join(current_directory, '..', 'frontend', 'static'))

app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
app.secret_key = os.environ.get("SECRET_KEY", "legalease-secret-key-2026")

# Initialize local database (creates tables if missing)
init_db()

LANGUAGE_CONFIG = {
    "Tamil": {"native": "தமிழ்"}, "Hindi": {"native": "हिन्दी"}, "Telugu": {"native": "తెలుగు"},
    "Kannada": {"native": "கன்னட"}, "Malayalam": {"native": "മലയാളം"}, "Bengali": {"native": "বাংলা"},
    "Marathi": {"native": "मराठी"}, "Gujarati": {"native": "ગુજરાતી"}, "Punjabi": {"native": "ਪੰਜਾਬੀ"},
    "Odia": {"native": "ଓଡ଼ିଆ"}, "Urdu": {"native": "اردو"}, "Assamese": {"native": "অसमीया"},
    "Maithili": {"native": "मैथिली"}, "Sanskrit": {"native": "संस्कृतम्"}, "Kashmiri": {"native": "کٲشُر"},
    "Nepali": {"native": "नेपाली"}, "Sindhi": {"native": "سنڌي"}, "Konkani": {"native": "कोंकणी"},
    "Manipuri": {"native": "মৈতৈলোন্"}, "Bodo": {"native": "बर'"}, "Dogri": {"native": "डोगरी"},
    "Santali": {"native": "ᱥᱟᱱᱛᱟᱲᱤ"}
}

def get_smart_mock_response(target_lang):
    native_name = LANGUAGE_CONFIG.get(target_lang, {}).get("native", target_lang)
    translations = {
        "Tamil": "• [தமிழ்] ஆவணம் வெற்றிகரமாக பகுப்பாய்வு செய்யப்பட்டது. அனைத்து நிபந்தனைகளும் பூர்த்தி செய்யப்பட்டுள்ளன.",
        "Hindi": "• [हिन्दी] दस्तावेज़ का सफलतापूर्वक विश्लेषण किया गया। सभी शर्तें पूरी हो चुकी हैं।",
        "Telugu": "• [తెలుగు] పత్రం విజయవంతంగా విశ్లేషించబడింది. அனைத்து நிபந்தனைகளும் பூர்த்தி செய்யப்பட்டுள்ளன."
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

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json(silent=True) or request.form
    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip()
    password = data.get('password') or ''
    full_name = (data.get('full_name') or '').strip()

    if not username or not email or not password:
        return jsonify({'error': 'Username, email and password are required'}), 400

    user, err = create_user(username=username, email=email, password=password, full_name=full_name)
    if err:
        return jsonify({'error': err}), 400

    session['user_id'] = user['id']
    return jsonify({'message': 'Registration successful', 'user': user})

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json(silent=True) or request.form
    username_or_email = (data.get('username_or_email') or data.get('username') or '').strip()
    password = data.get('password') or ''

    if not username_or_email or not password:
        return jsonify({'error': 'Username/Email and password are required'}), 400

    user, err = authenticate_user(username_or_email=username_or_email, password=password)
    if err:
        return jsonify({'error': err}), 401

    session['user_id'] = user['id']
    return jsonify({'message': 'Login successful', 'user': user})

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/me')
def api_me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'authenticated': False, 'user': None})
    user = get_user_by_id(user_id)
    if not user:
        session.pop('user_id', None)
        return jsonify({'authenticated': False, 'user': None})
    return jsonify({'authenticated': True, 'user': user})

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():
    if 'file' not in request.files:
        return jsonify({'error': 'No file caught in pipeline'})
    file = request.files['file']
    target_lang = request.form.get('language', 'Tamil')
    try:
        summary = get_smart_mock_response(target_lang)
        save_transaction_to_db(target_lang, summary, document_filename=file.filename)
        return jsonify({'summary': summary})
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
