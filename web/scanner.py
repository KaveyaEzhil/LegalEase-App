import pytesseract
from PIL import Image
from google import genai
import sys

# This helps Windows terminals show Tamil/Hindi characters properly
sys.stdout.reconfigure(encoding='utf-8')

# 1. SETUP TESSERACT
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# 2. AI SETUP
client = genai.Client(api_key="AIzaSyD3nCh_9RhV8-h3TuiJ00Y3g6PXApOTPk8")

def scan_to_local_language(image_path, language_name):
    try:
        print(f"--- Processing {image_path} ---")
        img = Image.open(image_path)
        extracted_text = pytesseract.image_to_string(img)

        if not extracted_text.strip():
            print("Error: No text detected.")
            return

        # ENHANCED PROMPT: We are being very specific now
        prompt = f"""
        Extract and analyze this legal text: "{extracted_text}"
        
        1. Simplify the legal jargon into very basic English for a villager.
        2. Translate that simplified explanation into {language_name} script.
        3. Format the output exactly like this:
        
        ENGLISH SUMMARY:
        (Simple English text here)
        
        {language_name.upper()} SUMMARY:
        (The translated text in {language_name} script here)
        """
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        print("\n" + "="*60)
        print(response.text)
        print("="*60)

    except Exception as e:
        print(f"Error: {e}")

# --- CHANGE THIS TO TEST DIFFERENT LANGUAGES ---
scan_to_local_language('doc.jpg', 'Tamil')