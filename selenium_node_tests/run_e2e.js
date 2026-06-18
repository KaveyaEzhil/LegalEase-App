const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { execSync } = require('child_process');
const { writeReport } = require('./utils/report');
const mkdirp = require('mkdirp');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const REPORT_DIR = path.join(__dirname, 'reports');
const DATABASE_URL = process.env.DATABASE_URL;
const DOC_IMG = path.join(__dirname, '..', 'doc.jpg');

async function createSampleImage() {
  const imgPath = path.join(__dirname, 'assets');
  await mkdirp(imgPath);
  const filePath = path.join(imgPath, 'onepixel.png');
  if (!fs.existsSync(filePath)) {
    // 1x1 transparent PNG
    const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
    fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
  }
  return filePath;
}

async function checkDatabaseCounts() {
  if (DATABASE_URL && DATABASE_URL.startsWith('postgresql://')) {
    const { Client } = require('pg');
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
    const analysesRes = await client.query('SELECT count(*) as count FROM analyses');
    const docsRes = await client.query('SELECT count(*) as count FROM documents');
    await client.end();
    return {
      analyses: parseInt(analysesRes.rows[0].count),
      documents: parseInt(docsRes.rows[0].count)
    };
  } else {
    try {
      const pythonCmd = `python -c "import sys, os; sys.path.insert(0, os.path.abspath('.')); from backend.db import SessionLocal, Analysis, Document; session=SessionLocal(); print(f'{session.query(Analysis).count()},{session.query(Document).count()}'); session.close()"`;
      const rootPath = path.join(__dirname, '..');
      const result = execSync(pythonCmd, { cwd: rootPath, env: { ...process.env, PYTHONPATH: rootPath } }).toString().trim();
      const parts = result.split(',');
      return {
        analyses: parseInt(parts[0]),
        documents: parseInt(parts[1])
      };
    } catch (err) {
      console.warn("DB check warning: Python script failed, defaulting counts to 0. Error:", err.message);
      return { analyses: 0, documents: 0 };
    }
  }
}

async function runAll() {
  await mkdirp(REPORT_DIR);
  const results = [];
  const startSuite = Date.now();

  const options = new chrome.Options();
  if (process.env.HEADLESS !== 'false') {
    options.addArguments('--headless=new', '--no-sandbox', '--disable-gpu', '--window-size=1280,800');
  }

  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  
  function addResult(id, category, name, description, expected, actual, status, duration) {
    results.push({ id, category, name, description, expected, actual, status, duration: Math.round(duration) });
    console.log(`[${status}] ${id}: ${name} (${Math.round(duration)}ms)`);
    if (status === 'FAIL') {
      console.log(`       -> FAIL Reason: ${actual}`);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // 1. FUNCTIONAL TESTING
    // -------------------------------------------------------------------------
    {
      const start = Date.now();
      try {
        await driver.get(BASE_URL);
        const fileInput = await driver.findElement(By.id('file'));
        const langSelect = await driver.findElement(By.id('lang'));
        const submitBtn = await driver.findElement(By.css('form#upload-form button[type="submit"]'));
        
        await fileInput.sendKeys(DOC_IMG);
        await langSelect.sendKeys('Tamil');
        await submitBtn.click();

        const summaryEl = await driver.wait(until.elementLocated(By.id('summaryText')), 60000);
        await driver.wait(async () => {
          const txt = await summaryEl.getText();
          return txt && !txt.startsWith('No text processed');
        }, 60000);

        const summaryText = await summaryEl.getText();
        const success = summaryText.includes('TAMIL SUMMARY') && !summaryText.includes('OCR Failed');
        addResult(
          'TC_FUNC_01', 
          'Functional Testing', 
          'E2E Upload & Process Workflow', 
          'Verify upload form processes file and outputs translation summary',
          'Summary text containing selected language summary sections',
          summaryText.substring(0, 150) + '...',
          success ? 'PASS' : 'FAIL',
          Date.now() - start
        );
      } catch (err) {
        addResult('TC_FUNC_01', 'Functional Testing', 'E2E Upload & Process Workflow', 'Verify upload form processes file and outputs translation summary', 'Summary text displaying output', String(err), 'FAIL', Date.now() - start);
      }
    }

    // -------------------------------------------------------------------------
    // 2. UI/UX TESTING
    // -------------------------------------------------------------------------
    {
      const start = Date.now();
      try {
        await driver.get(BASE_URL);
        const brand = await driver.findElement(By.className('brand')).getText();
        const scanTab = await driver.findElement(By.id('link-scan'));
        const historyTab = await driver.findElement(By.id('link-history'));

        // Perform navigation checks
        await historyTab.click();
        await driver.sleep(300);
        const historyVisible = await driver.findElement(By.id('page-history')).isDisplayed();
        
        await scanTab.click();
        await driver.sleep(300);
        const scanVisible = await driver.findElement(By.id('page-scan')).isDisplayed();

        const cleanBrand = brand.replace(/\s+/g, '');
        const success = cleanBrand.includes('LegalEase') && historyVisible && scanVisible;
        addResult(
          'TC_UIUX_02', 
          'UI/UX Testing', 
          'Visual Components & Navigation Transitions', 
          'Check title brand name and navigate across tabs checking visible section active states',
          'Brand logo visible and tabs toggle active panels',
          `Brand: ${brand}, History Panel Visible: ${historyVisible}, Scan Panel Visible: ${scanVisible}`,
          success ? 'PASS' : 'FAIL',
          Date.now() - start
        );
      } catch (err) {
        addResult('TC_UIUX_02', 'UI/UX Testing', 'Visual Components & Navigation', 'Verify brand elements and navigation transitions', 'Successful navigation updates', String(err), 'FAIL', Date.now() - start);
      }
    }

    // -------------------------------------------------------------------------
    // 3. COMPATIBILITY TESTING
    // -------------------------------------------------------------------------
    {
      const start = Date.now();
      try {
        // Test responsive resizing
        const viewports = [
          { name: 'Desktop', width: 1200, height: 800 },
          { name: 'Tablet', width: 768, height: 1024 },
          { name: 'Mobile', width: 375, height: 667 }
        ];

        let resultsStr = [];
        let allVisible = true;
        for (const vp of viewports) {
          await driver.manage().window().setSize(vp.width, vp.height);
          await driver.sleep(200);
          const fileInput = await driver.findElement(By.id('file'));
          const isDisp = await fileInput.isDisplayed();
          resultsStr.push(`${vp.name}: ${isDisp ? 'Visible' : 'Hidden'}`);
          if (!isDisp) allVisible = false;
        }

        // Restore window size
        await driver.manage().window().setSize(1280, 800);
        addResult(
          'TC_COMPAT_03', 
          'Compatibility Testing', 
          'Responsive Viewports Compatibility Check', 
          'Check that main interactive controls remain accessible across Desktop, Tablet and Mobile viewports',
          'Form controls remain visible and active in all sizes',
          resultsStr.join(', '),
          allVisible ? 'PASS' : 'FAIL',
          Date.now() - start
        );
      } catch (err) {
        addResult('TC_COMPAT_03', 'Compatibility Testing', 'Responsive Viewports Check', 'Test viewport layouts', 'Inputs stay visible', String(err), 'FAIL', Date.now() - start);
      }
    }

    // -------------------------------------------------------------------------
    // 4. PERFORMANCE TESTING
    // -------------------------------------------------------------------------
    {
      const start = Date.now();
      try {
        const loadStart = Date.now();
        await driver.get(BASE_URL);
        await driver.findElement(By.className('brand'));
        const loadDuration = Date.now() - loadStart;

        const success = loadDuration < 1500;
        addResult(
          'TC_PERF_04', 
          'Performance Testing', 
          'Initial Home Page Load Latency', 
          'Measure time required to fetch HTML, build DOM structure and load core styles',
          'Page loads within 1500ms',
          `Load duration: ${loadDuration}ms`,
          success ? 'PASS' : 'FAIL',
          Date.now() - start
        );
      } catch (err) {
        addResult('TC_PERF_04', 'Performance Testing', 'Page Load Latency', 'Measure DOM interactive latency', 'Page loads under 1500ms', String(err), 'FAIL', Date.now() - start);
      }
    }

    // -------------------------------------------------------------------------
    // 5. SECURITY TESTING
    // -------------------------------------------------------------------------
    {
      const start = Date.now();
      try {
        await driver.get(BASE_URL);
        const fileInput = await driver.findElement(By.id('file'));
        const requiredAttr = await fileInput.getAttribute('required');

        // Probe error responses
        const form = new FormData();
        // POST to /process with NO file, should return validation error instead of 500
        const resp = await axios.post(`${BASE_URL}/process`, form, { 
          headers: form.getHeaders(), 
          validateStatus: () => true 
        });

        const success = (requiredAttr === 'true') && (resp.data.error !== undefined);
        addResult(
          'TC_SEC_05', 
          'Security Testing', 
          'Empty Input Validation & API Protection Check', 
          'Verify that empty form submissions are blocked client-side and API handles missing files gracefully',
          'Input marked required and API returns validation error',
          `Required Attr: ${requiredAttr}, API Error Message: "${resp.data.error}"`,
          success ? 'PASS' : 'FAIL',
          Date.now() - start
        );
      } catch (err) {
        addResult('TC_SEC_05', 'Security Testing', 'Validation & Error Probes', 'Test pipeline boundaries', 'API errors handled gracefully', String(err), 'FAIL', Date.now() - start);
      }
    }

    // -------------------------------------------------------------------------
    // 6. API TESTING
    // -------------------------------------------------------------------------
    {
      const start = Date.now();
      try {
        const form = new FormData();
        const sampleImg = await createSampleImage();
        form.append('file', fs.createReadStream(sampleImg));
        form.append('language', 'Tamil');

        const resp = await axios.post(`${BASE_URL}/process`, form, { 
          headers: form.getHeaders() 
        });

        const data = resp.data;
        const success = data.summary !== undefined || data.error !== undefined;
        addResult(
          'TC_API_06', 
          'API Testing', 
          'Direct REST API /process Endpoint Verification', 
          'Send direct POST transaction request with files and query target language configs',
          'Response contains summary body or validation error JSON payload',
          `Status: ${resp.status}, Summary Snippet: "${(data.summary || data.error).substring(0, 100)}..."`,
          success ? 'PASS' : 'FAIL',
          Date.now() - start
        );
      } catch (err) {
        addResult('TC_API_06', 'API Testing', 'REST Endpoint Call', 'Query /process API directly', 'API returns 200 OK JSON', String(err), 'FAIL', Date.now() - start);
      }
    }

    // -------------------------------------------------------------------------
    // 7. DATABASE TESTING
    // -------------------------------------------------------------------------
    {
      const start = Date.now();
      try {
        const beforeCounts = await checkDatabaseCounts();

        // Trigger an insert by making a valid API transaction
        const form = new FormData();
        form.append('file', fs.createReadStream(DOC_IMG));
        form.append('language', 'Hindi');
        await axios.post(`${BASE_URL}/process`, form, { headers: form.getHeaders() });

        const afterCounts = await checkDatabaseCounts();

        const success = (afterCounts.analyses > beforeCounts.analyses);
        addResult(
          'TC_DB_07', 
          'Database Testing', 
          'SQL Log Persistence & Row Write Check', 
          'Verify transaction details are inserted into database analyses and documents tables',
          'Database analysis record count increases after transaction',
          `Before counts: ${JSON.stringify(beforeCounts)}, After counts: ${JSON.stringify(afterCounts)}`,
          success ? 'PASS' : 'FAIL',
          Date.now() - start
        );
      } catch (err) {
        addResult('TC_DB_07', 'Database Testing', 'Database Write Persistence', 'Verify SQL row persistence', 'Row is written successfully', String(err), 'FAIL', Date.now() - start);
      }
    }

    // -------------------------------------------------------------------------
    // 8. ACCESSIBILITY TESTING
    // -------------------------------------------------------------------------
    {
      const start = Date.now();
      try {
        await driver.get(BASE_URL);
        const htmlLang = await driver.findElement(By.tagName('html')).getAttribute('lang');
        const fileInputId = await driver.findElement(By.id('file'));
        const fileLabel = await driver.findElement(By.css('label[for="file"]'));
        
        const success = (htmlLang !== '') && (fileLabel !== null);
        addResult(
          'TC_ACC_08', 
          'Accessibility Testing', 
          'HTML5 Semantics & Input Labels Check', 
          'Check presence of global page lang attributes, form labels, and semantic structural tags',
          'Document has language code declared and form inputs have descriptive tags',
          `HTML lang code: "${htmlLang}", Label text: "${await fileLabel.getText()}"`,
          success ? 'PASS' : 'FAIL',
          Date.now() - start
        );
      } catch (err) {
        addResult('TC_ACC_08', 'Accessibility Testing', 'Semantic Accessibility Check', 'Verify HTML labels and lang properties', 'Accessibility compliance metadata checks', String(err), 'FAIL', Date.now() - start);
      }
    }

    // -------------------------------------------------------------------------
    // 9. MOBILE-SPECIFIC TESTING
    // -------------------------------------------------------------------------
    {
      const start = Date.now();
      try {
        await driver.manage().window().setSize(375, 667); // Mobile layout
        await driver.sleep(200);

        const grid = await driver.findElement(By.className('split-grid'));
        const displayType = await grid.getCssValue('display');

        // Check viewport scale configuration is present in html
        const metaViewport = await driver.findElement(By.css('meta[name="viewport"]')).getAttribute('content');
        
        // Restore window size
        await driver.manage().window().setSize(1280, 800);

        const success = displayType.includes('grid') && metaViewport.includes('width=device-width');
        addResult(
          'TC_MOB_09', 
          'Mobile-Specific Testing', 
          'Responsive Column Stacking & Viewport Configuration', 
          'Validate mobile display settings, CSS grid parameters, and standard viewport scales',
          'Grid layout fits small device viewport and scale meta exists',
          `Grid display type: "${displayType}", Meta Viewport value: "${metaViewport}"`,
          success ? 'PASS' : 'FAIL',
          Date.now() - start
        );
      } catch (err) {
        // Restore window size in case of failure
        await driver.manage().window().setSize(1280, 800);
        addResult('TC_MOB_09', 'Mobile-Specific Testing', 'Mobile Screen Fitting', 'Verify CSS media rules on small viewport', 'Layout handles small sizes', String(err), 'FAIL', Date.now() - start);
      }
    }

    // -------------------------------------------------------------------------
    // 10. REGRESSION TESTING
    // -------------------------------------------------------------------------
    {
      const start = Date.now();
      try {
        await driver.get(BASE_URL);
        const fileInput = await driver.findElement(By.id('file'));
        const langSelect = await driver.findElement(By.id('lang'));
        const submitBtn = await driver.findElement(By.css('form#upload-form button[type="submit"]'));

        const blurryPath = await createSampleImage(); // 1x1 transparent image has no text, so triggers OCR failure
        await fileInput.sendKeys(blurryPath);
        await langSelect.sendKeys('Tamil');
        await submitBtn.click();

        const summaryEl = await driver.wait(until.elementLocated(By.id('summaryText')), 60000);
        let pollCount = 0;
        await driver.wait(async () => {
          try {
            const txt = await summaryEl.getAttribute('textContent');
            pollCount++;
            if (pollCount % 10 === 0) {
              console.log(`       -> [TC_REG_10 Poll ${pollCount}] Current textContent: "${txt.substring(0, 50)}..."`);
            }
            return txt && !txt.startsWith('No text processed');
          } catch (e) {
            // If alert is open, throw it so it escapes the wait loop immediately
            if (e.name === 'UnexpectedAlertOpenError') {
              throw e;
            }
            return false;
          }
        }, 60000);

        const summaryText = await summaryEl.getAttribute('textContent');
        const expectedError = 'OCR Failed: The text image is too blurry to extract letters properly.';
        const success = summaryText.trim() === expectedError || summaryText.includes('OCR Failed');

        addResult(
          'TC_REG_10', 
          'Regression Testing', 
          'OCR Blurry Image Exception Guard Fallback', 
          'Verify that uploading unreadable blurry files triggers deterministic error guards rather than system exceptions',
          'Display readable OCR failed warning string',
          `Response Text output matches fallback message: "${summaryText}"`,
          success ? 'PASS' : 'FAIL',
          Date.now() - start
        );
      } catch (err) {
        let alertMsg = '';
        try {
          const alert = await driver.switchTo().alert();
          alertMsg = await alert.getText();
          await alert.accept();
          console.log(`       -> Handled browser alert: "${alertMsg}"`);
        } catch (alertErr) {
          // No alert open
        }
        try {
          const logs = await driver.manage().logs().get('browser');
          if (logs && logs.length > 0) {
            console.log(`       -> Browser Logs:`, JSON.stringify(logs, null, 2));
          }
        } catch (logErr) {}
        addResult('TC_REG_10', 'Regression Testing', 'OCR Exception Fallback Checks', 'Guard OCR unhandled exceptions', 'Friendly error string rendered', alertMsg ? `Alert: ${alertMsg}` : String(err), 'FAIL', Date.now() - start);
      }
    }

    // -------------------------------------------------------------------------
    // 11. END-TO-END (E2E) TESTING
    // -------------------------------------------------------------------------
    {
      const start = Date.now();
      try {
        await driver.get(BASE_URL);
        
        // Reset localStorage metrics first to ensure clean check
        await driver.executeScript(() => {
          localStorage.setItem('totalScansMetric', '0');
          localStorage.setItem('totalAudioMetric', '0');
        });
        await driver.navigate().refresh();

        const fileInput = await driver.findElement(By.id('file'));
        const langSelect = await driver.findElement(By.id('lang'));
        const submitBtn = await driver.findElement(By.css('form#upload-form button[type="submit"]'));
        
        await fileInput.sendKeys(DOC_IMG);
        await langSelect.sendKeys('Tamil');
        await submitBtn.click();

        // Wait for redirection page-results active check
        await driver.wait(async () => {
          const resultsPage = await driver.findElement(By.id('page-results'));
          const classes = await resultsPage.getAttribute('class');
          return classes.includes('active-page');
        }, 60000);

        // Fetch localStorage Scans Metric
        const scansMetric = await driver.executeScript(() => localStorage.getItem('totalScansMetric'));
        
        // Click Speak Out button
        const speakBtn = await driver.findElement(By.xpath('//button[contains(text(), "Speak Out Loud")]'));
        await speakBtn.click();
        await driver.sleep(200);

        // Fetch localStorage Audio Metric
        const audioMetric = await driver.executeScript(() => localStorage.getItem('totalAudioMetric'));

        const success = (scansMetric === '1') && (audioMetric === '1');
        addResult(
          'TC_E2E_11', 
          'End-to-End (E2E) Testing', 
          'Full Unified E2E Processing & Telemetry Flow', 
          'Run complete user journey from file upload to OCR summary to speech synthesis and localStorage updates',
          'Application completes translation workflow and increments dashboard counters in local browser memory',
          `Scans counter: ${scansMetric}, Audio counter: ${audioMetric}`,
          success ? 'PASS' : 'FAIL',
          Date.now() - start
        );
      } catch (err) {
        addResult('TC_E2E_11', 'End-to-End (E2E) Testing', 'Full E2E Flow', 'Test upload, process, telemetry and speech triggers', 'Telemetry updates and speech triggers', String(err), 'FAIL', Date.now() - start);
      }
    }

  } finally {
    await driver.quit();
    
    // Write out results to Excel report
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFilename = path.join(REPORT_DIR, `E2E_Report_${timestampStr}.xlsx`);
    
    await writeReport(reportFilename, results);
    console.log('=' * 60);
    console.log(`Node.js E2E suite completed in ${Date.now() - startSuite}ms`);
    console.log('Report saved at:', reportFilename);
    console.log('=' * 60);
  }
}

runAll().catch(err => {
  console.error("Selenium test runner failure:", err);
  process.exitCode = 1;
});
