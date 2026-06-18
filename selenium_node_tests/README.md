Selenium E2E test runner for LegalEase

Prerequisites
- Node.js (16+ recommended)
- Google Chrome installed
- If you want DB checks, set `DATABASE_URL` to your Postgres connection string
- Ensure the backend server is running (default http://localhost:8080)

Install dependencies and run:

```bash
cd selenium_node_tests
npm install
npm run e2e
```

Outputs
- `selenium_node_tests/reports/E2E_Report_*.xlsx` — Excel report with test results

Configuration
- Set `BASE_URL` environment variable to target a different host (e.g., staging).
- Set `HEADLESS=false` to run visible browser for debugging.
