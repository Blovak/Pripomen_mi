function ensureSheet_(spreadsheet, name, headers) {
  var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}

function getSheet_(name, headers) {
  return ensureSheet_(getSpreadsheet_(), name, headers);
}

function readRows_(name, headers) {
  var sheet = getSheet_(name, headers);
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues().map(function (row, index) {
    var item = { _row: index + 2 };
    headers.forEach(function (header, column) { item[header] = normalizeCell_(row[column]); });
    return item;
  });
}

function normalizeCell_(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function appendObject_(name, headers, item) {
  var sheet = getSheet_(name, headers);
  sheet.appendRow(headers.map(function (header) { return item[header] == null ? '' : item[header]; }));
  return item;
}

function updateObjectRow_(name, headers, rowNumber, item) {
  getSheet_(name, headers).getRange(rowNumber, 1, 1, headers.length)
    .setValues([headers.map(function (header) { return item[header] == null ? '' : item[header]; })]);
  return item;
}

function withoutInternal_(item) {
  var copy = {};
  Object.keys(item).forEach(function (key) { if (key.charAt(0) !== '_') copy[key] = item[key]; });
  return copy;
}
