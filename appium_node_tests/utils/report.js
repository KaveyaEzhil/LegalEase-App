const ExcelJS = require('exceljs');

async function writeReport(filePath, results) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Mobile E2E Test Summary');
  
  // Enable gridlines visibly in Excel
  ws.views = [{ showGridLines: true }];

  // Write title block
  ws.mergeCells('A1:H1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'LegalEase — Android Mobile Appium E2E Quality Verification Report';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E293B' } // Dark Slate
  };
  ws.getRow(1).height = 40;

  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) + '%' : '0.0%';

  const summaryData = [
    ['Test Scope:', 'Appium Mobile E2E Comprehensive Suite', 'Total Test Cases:', total],
    ['Execution Time:', new Date().toLocaleString(), 'Passed Cases:', passed],
    ['Environment:', 'UiAutomator2 / Android Debug APK', 'Failed Cases:', failed],
    ['Framework Target:', 'WebdriverIO Appium Client', 'Pass Rate Metric:', passRate]
  ];

  for (let idx = 0; idx < summaryData.length; idx++) {
    const rowNum = idx + 3;
    const data = summaryData[idx];
    
    ws.getCell(`A${rowNum}`).value = data[0];
    ws.getCell(`A${rowNum}`).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '4B5563' } };
    
    ws.getCell(`B${rowNum}`).value = data[1];
    ws.getCell(`B${rowNum}`).font = { name: 'Segoe UI', size: 10, color: { argb: '111827' } };
    
    ws.getCell(`D${rowNum}`).value = data[2];
    ws.getCell(`D${rowNum}`).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '4B5563' } };
    
    ws.getCell(`E${rowNum}`).value = data[3];
    ws.getCell(`E${rowNum}`).font = { name: 'Segoe UI', size: 10, color: { argb: '111827' } };
    
    ws.getRow(rowNum).height = 20;
  }

  // Setup headers on Row 8
  const headers = ['Test ID', 'Category', 'Test Name', 'Description', 'Expected Result', 'Actual Result', 'Status', 'Duration (ms)'];
  
  const headerRow = ws.getRow(8);
  headerRow.height = 28;
  for (let c = 0; c < headers.length; c++) {
    const cell = headerRow.getCell(c + 1);
    cell.value = headers[c];
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F46E5' } // Indigo Accent
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'CBD5E1' } },
      left: { style: 'thin', color: { argb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
      right: { style: 'thin', color: { argb: 'CBD5E1' } }
    };
  }

  // Write data from row 9
  let currentRaw = 9;
  for (const r of results) {
    const row = ws.getRow(currentRaw);
    row.height = 24;

    const values = [
      r.id,
      r.category,
      r.name,
      r.description,
      r.expected,
      r.actual,
      r.status,
      r.duration
    ];

    for (let c = 0; c < values.length; c++) {
      const cell = row.getCell(c + 1);
      cell.value = values[c];
      cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: '1E293B' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'E2E8F0' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } }
      };
      cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

      if (c === 0) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: '1E293B' } };
      }
      if (c === 6) { // Status column
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true };
        if (r.status === 'PASS') {
          cell.font = { ...cell.font, color: { argb: '166534' } }; // Dark green
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0FDF4' } }; // Soft light green
        } else if (r.status === 'FAIL') {
          cell.font = { ...cell.font, color: { argb: '991B1B' } }; // Dark red
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } }; // Soft light red
        } else {
          cell.font = { ...cell.font, color: { argb: '374151' } }; // Dark gray
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9FAFB' } }; // Soft light gray
        }
      }
    }
    currentRaw++;
  }

  // Adjust column widths
  const widths = [12, 22, 28, 38, 38, 42, 12, 15];
  for (let c = 0; c < widths.length; c++) {
    ws.getColumn(c + 1).width = widths[c];
  }

  await wb.xlsx.writeFile(filePath);
}

module.exports = { writeReport };
