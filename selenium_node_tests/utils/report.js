const ExcelJS = require('exceljs');

async function writeReport(filePath, results) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('E2E Test Summary');
  
  // Enable gridlines visibly in Excel
  ws.views = [{ showGridLines: true }];

  // Write title block
  ws.mergeCells('A1:H1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'LegalEase — Node.js Selenium E2E Quality Verification Report';
  titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: '1F2937' } };
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(1).height = 35;

  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) + '%' : '0.0%';

  const summaryData = [
    ['Test Scope:', 'Selenium Node.js E2E Comprehensive Suite', 'Total Test Cases:', total],
    ['Execution Time:', new Date().toLocaleString(), 'Passed Cases:', passed],
    ['Environment:', 'Headless Chrome / Local Flask Engine', 'Failed Cases:', failed],
    ['Framework Target:', 'Node.js Selenium-Webdriver', 'Pass Rate Metric:', passRate]
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
  headerRow.height = 25;
  for (let c = 0; c < headers.length; c++) {
    const cell = headerRow.getCell(c + 1);
    cell.value = headers[c];
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '059669' } // LegalEase Brand Green
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'E5E7EB' } },
      left: { style: 'thin', color: { argb: 'E5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
      right: { style: 'thin', color: { argb: 'E5E7EB' } }
    };
  }

  // Write data from row 9
  let currentRaw = 9;
  for (const r of results) {
    const row = ws.getRow(currentRaw);
    row.height = 22;

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
      cell.font = { name: 'Segoe UI', size: 9, color: { argb: '1F2937' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'E5E7EB' } },
        left: { style: 'thin', color: { argb: 'E5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
        right: { style: 'thin', color: { argb: 'E5E7EB' } }
      };
      cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

      if (c === 0) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: '1F2937' } };
      }
      if (c === 6) { // Status column
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Segoe UI', size: 9, bold: true };
        if (r.status === 'PASS') {
          cell.font = { ...cell.font, color: { argb: '15803D' } }; // Dark green
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECFDF5' } }; // Light green
        } else if (r.status === 'FAIL') {
          cell.font = { ...cell.font, color: { argb: 'B91C1C' } }; // Dark red
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } }; // Light red
        } else {
          cell.font = { ...cell.font, color: { argb: '4B5563' } }; // Dark gray
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9FAFB' } }; // Light gray
        }
      }
    }
    currentRaw++;
  }

  // Adjust column widths
  const widths = [12, 25, 30, 40, 40, 45, 12, 15];
  for (let c = 0; c < widths.length; c++) {
    ws.getColumn(c + 1).width = widths[c];
  }

  await wb.xlsx.writeFile(filePath);
}

module.exports = { writeReport };
