# LegalEase 🏛️

**LegalEase** is an AI-powered legal document translator that helps bridge the language gap for citizens across India. It uses OCR and a local LLM (Ollama) to scan legal documents and produce plain-language summaries in all 22 official Indian languages.

---

## ✨ Features

- 📄 **OCR Document Scanning** — Upload a photo or scan of any legal document
- 🤖 **AI Summarisation** — Powered by Gemma 2B via Ollama for concise 3-bullet summaries
- 🌐 **22 Indian Languages** — Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, and more
- 📊 **Analytics** — Telemetry logged to Supabase cloud database
- 🚀 **Vercel-ready** — Flask backend configured for Vercel serverless deployment

---

## 🗂️ Project Structure

```
legalease_project/
├── web/                    # Flask web application
│   ├── index.py            # Main Flask app & API routes
│   ├── templates/
│   │   └── index.html      # Frontend UI
│   ├── static/
│   │   └── manifest.json
│   ├── requirements.txt    # Python dependencies
│   └── vercel.json         # Vercel deployment config
├── android/                # Android (Capacitor) wrapper
├── tests/                  # Automated test suite
└── capacitor.config.json
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
- [Ollama](https://ollama.ai/) with `gemma2:2b` model pulled

### Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/KaveyaEzhil/LegalEase-App.git
cd LegalEase-App

# 2. Install Python dependencies
pip install -r web/requirements.txt

# 3. Set your Supabase DB URL
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres"

# 4. Run the Flask app
python web/index.py
```

Then open `http://localhost:8080` in your browser.

---

## 🌐 Deployment (Vercel)

The `web/vercel.json` is pre-configured for Vercel Python serverless deployment.

1. Install Vercel CLI: `npm i -g vercel`
2. Set the `DATABASE_URL` environment variable in your Vercel project settings
3. Run `vercel --prod` from the `web/` directory

---

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Full PostgreSQL connection URI for Supabase |

---

## 📦 Tech Stack

- **Backend:** Python, Flask, pytesseract, Ollama (Gemma 2B)
- **Frontend:** HTML5, Vanilla CSS, JavaScript
- **Database:** Supabase (PostgreSQL)
- **Mobile:** Capacitor (Android)
- **Deployment:** Vercel

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
