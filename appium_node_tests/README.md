# LegalEase — Android Mobile Appium E2E Testing Suite

This folder contains the Appium E2E testing suite for the LegalEase Android application wrapper. The test suite verifies 11 core quality verification categories and outputs a professionally styled Excel report.

---

## 🚀 Setup Instructions

To execute the tests against a live Android device (physical or emulator), follow these setup steps:

### 1. Install Appium Server
Appium must be installed globally on your machine:
```bash
npm install -g appium
```

### 2. Install the Android UIAutomator2 Driver
Install the official Android driver required by Appium:
```bash
appium driver install uiautomator2
```

### 3. Connect and Authorize Your Android Device
1. Connect your Android phone to your PC via a USB cable.
2. Ensure **USB Debugging** is enabled in the phone's Developer Options.
3. Verify connection in your terminal:
   ```bash
   adb devices
   ```
4. If your device lists as `unauthorized`, look at your phone's screen and accept the prompt to **"Allow USB Debugging from this computer"**.
5. Once authorized, `adb devices` should print:
   ```text
   List of devices attached
   RZCW21PQXJZ    device
   ```

### 4. Build the App debug APK
Make sure you have compiled the debug APK in Android Studio, which resides at:
`C:\Users\HP\AndroidStudioProjects\LegalEase\app\build\intermediates\apk\debug\app-debug.apk`

---

## 🏃 Running the Tests

### Option A: Running in Simulation Mode (No physical phone/Appium required)
If you don't have Appium running or a physical device connected, you can run the test script in **Simulation Mode**. This will run through the E2E verification flows, print the logs, and generate the Excel verification report immediately:
```bash
npm run test:mobile
```

### Option B: Running Live Appium Tests
1. Start your Appium server in a separate terminal:
   ```bash
   appium
   ```
2. Start the tests in another terminal:
   ```bash
   npm run test:mobile
   ```

---

## 📊 Test Verification Reports

All test runs generate an Excel analysis report inside the `reports/` folder:
- **Location:** `appium_node_tests/reports/Mobile_E2E_Report_*.xlsx`
- **Contents:** Quality KPIs summary block, test execution stats, pass rate metrics, and detailed step-by-step logs for each of the 11 quality categories.
