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

## 🤖 GitHub Integration & Automation

This project is configured with a fully automated setup to track files, sync local changes, and run tests via GitHub Actions.

### 1. GitHub Actions (CI & Auto-Commit)
A GitHub Actions workflow is configured at [.github/workflows/ci.yml](file:///c:/legalease_project/.github/workflows/ci.yml).
- **Triggers**: Runs automatically on every push or pull request to the `master` or `main` branches.
- **Tasks**:
  1. Sets up the Python environment.
  2. Installs required dependencies from both `web/requirements.txt` and `backend/requirements.txt`.
  3. Runs Python unit tests.
  4. Automatically detects and commits back any modified or newly generated files (e.g., test reports, database assets) to the active branch.

### 2. Local Sync Watcher Service
To enable real-time automatic synchronization from your local computer to GitHub:
- We have provided a PowerShell file watcher script: [watch_and_sync.ps1](file:///c:/legalease_project/scripts/watch_and_sync.ps1).
- This script monitors all project files (including spreadsheets like `.xlsx`, `.xls`, and `.csv` files) in real-time.
- When it detects edits, creation, or deletion of files, it waits for **5 seconds** (debouncing) and then automatically runs:
  ```powershell
  git add -A
  git commit -m "Auto-sync: local updates [skip ci]"
  git push origin <branch_name>
  ```

#### How to start the Local Watcher:
1. Open a PowerShell terminal.
2. Navigate to the project root directory.
3. Run the script:
   ```powershell
   ./scripts/watch_and_sync.ps1
   ```
4. Keep the terminal window open. The script will run in the background and keep your repository fully synchronized.

### 3. File Tracking Rules
- All source code and test files are included in version control.
- **Excel Spreadsheet Files** (`.xlsx`, `.xls`, `.csv`) are fully tracked so that test execution results and vulnerability scan results are saved in history.
- Large binary artifacts, local database files (`*.db`), OS artifacts (e.g., `.DS_Store`), and dependency directories (`node_modules/`, `.venv/`) are excluded via `.gitignore`.


---

## 📱 Mobile Appium E2E Testing

This project includes a comprehensive Appium mobile testing suite located in the [appium_node_tests/](file:///c:/legalease_project/appium_node_tests) folder. It automates testing the Android mobile wrapper (`com.legalease.app`) across 11 quality verification categories and generates detailed Excel reports.

### Quick Run:
1. Navigate to the Appium folder:
   ```bash
   cd appium_node_tests
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in **Simulation Mode** (requires no device/Appium setup; instantly generates a mock Excel report representing the E2E verification):
   ```bash
   npm run test:mobile
   ```

To run against a live USB-connected Android device or emulator, see the setup guide in [appium_node_tests/README.md](file:///c:/legalease_project/appium_node_tests/README.md).

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

