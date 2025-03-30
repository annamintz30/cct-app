// ============================
// 1. Global Constants
// ============================

const SPREADSHEET_ID = "13WfkWkE2Kofy7CRZQRLYPHpJt6RExjrPZ_OOU7EE6Aw";
const EMPLOYEE_SHEET_NAME = "Employees";
const DROPDOWN_SHEET_NAME = "DropdownOptions";
const HEADER_ROW_INDEX = 1;
const PROPERTY_ROW_INDEX = 2;
const DATA_START_ROW_INDEX = 3;

// ============================
// 2. Entry Point
//    include(filename)
//    doGet(e)
//    loadPartial(filename)
//    doPost(e)
// ============================

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle("CCT App")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // or SAMEORIGIN if preferred
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function loadPartial(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doPost(e) {
    try {
        // Parse the incoming request
        var request = JSON.parse(e.postData.contents);

        // Route based on the action (e.g., "addEmployee")
        if (request.action === "addEmployee") {
            var result = addEmployee(request.employee); // Call your business logic function
            return ContentService
                .createTextOutput(JSON.stringify(result))
                .setMimeType(ContentService.MimeType.JSON);
        }

        // Default response if action is not recognized
        return ContentService
            .createTextOutput(JSON.stringify({ success: false, message: "Unknown action" }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        Logger.log("Error in doPost: " + error.toString());
        return ContentService
            .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// ============================
// 3. Data Handlers
//    getSheetData()
//    getNextJccId()
//    addOrUpdateEmployee(data)
//    deleteEmployeeRow()
// ============================

function getSheetData() {
  Logger.log("🚀 getSheetData called!");

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Employees");
  if (!sheet) {
    Logger.log("❌ Sheet not found");
    return JSON.stringify({ data: [], headers: [], properties: [] });
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const properties = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
  const data = lastRow > 2 ? sheet.getRange(3, 1, lastRow - 2, lastCol).getValues() : [];

  const result = data.map(row => {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j] || `column${j + 1}`;
      obj[key] = row[j];
    }
    return obj;
  });

  Logger.log("✅ Returning:", JSON.stringify({ data: result, headers, properties }));
  return JSON.stringify({ data: result, headers, properties });
}

function getNextJccId() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Employees");
  const data = sheet.getDataRange().getValues();

  const headerRow = data[0];
  const idColIndex = headerRow.indexOf("JCCID");

  if (idColIndex === -1) {
    throw new Error("JCCID column not found.");
  }

  const idValues = data.slice(2).map(row => row[idColIndex]);

  let maxNumber = 1049; // Start one below minimum so the first is 1050

  idValues.forEach(id => {
    if (typeof id === "string") {
      const match = id.match(/\d+/); // Extract the numeric part
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  });

  const nextNumber = maxNumber + 1;
  return `JCC${nextNumber}`;
}

// Called by saveChanges() client-side
function addOrUpdateEmployee(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Employees");

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowData = headers.map(header => data[header] || "");

  const rowIndex = parseInt(data._rowIndex || data.rowIndex, 10);

  if (!isNaN(rowIndex) && rowIndex > 2) {  // Assuming rows 1–2 are headers
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    return { status: "updated", row: rowIndex };
  } else {
    sheet.appendRow(rowData);
    return { status: "added", row: sheet.getLastRow() };
  }
}

function deleteEmployeeRow(rowIndex) {
  const sheet = SpreadsheetApp.getActive().getSheetByName("Employees");
  if (rowIndex > 2) {  // Ensure headers aren't deleted
    sheet.deleteRow(rowIndex);
  }
}

function getDropdownOptions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("DropdownOptions");
  if (!sheet) return {};

  const range = sheet.getDataRange().getValues();
  const headers = range[0];
  const options = {};

  headers.forEach((header, colIndex) => {
    const columnOptions = [];
    for (let i = 1; i < range.length; i++) {
      const value = range[i][colIndex];
      if (value) columnOptions.push(value);
    }
    options[header] = columnOptions;
  });

  Logger.log(options);

  return options;
}

// ============================
// 3. Data Handlers
// ============================
function employeesTab() {
  return HtmlService.createHtmlOutputFromFile('EmployeeDatabase').getContent();
}

function sopsTab() {
  return HtmlService.createHtmlOutputFromFile('SOPs').getContent();
}

function trainingTab() {
  return HtmlService.createHtmlOutputFromFile('Training').getContent();
}







