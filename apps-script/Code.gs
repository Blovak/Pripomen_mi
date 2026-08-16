function doGet(e) {
  return jsonResponse_({
    success: true,
    data: { service: 'Připomeň mi API', status: 'ok', version: '0.1.0' }
  });
}

function doPost(e) {
  try {
    var request = parseRequest_(e);
    assertAuthorized_(request);
    return jsonResponse_({ success: true, data: routeRequest_(request) });
  } catch (error) {
    console.error(JSON.stringify({
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
      stack: error.stack
    }));
    return jsonResponse_({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.publicMessage || 'Požadavek se nepodařilo zpracovat.'
      }
    });
  }
}

function parseRequest_(e) {
  if (!e || !e.postData || !e.postData.contents) throw apiError_('EMPTY_REQUEST', 'Požadavek je prázdný.');
  try { return JSON.parse(e.postData.contents); }
  catch (error) { throw apiError_('INVALID_JSON', 'Požadavek nemá platný JSON formát.'); }
}

function jsonResponse_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function apiError_(code, publicMessage) {
  var error = new Error(publicMessage);
  error.code = code;
  error.publicMessage = publicMessage;
  return error;
}

function setupProject() {
  var spreadsheet = getSpreadsheet_();
  ensureSheet_(spreadsheet, CONFIG.REMINDERS_SHEET, CONFIG.REMINDER_HEADERS);
  ensureSheet_(spreadsheet, CONFIG.DEVICES_SHEET, CONFIG.DEVICE_HEADERS);
  var settingsSheet = ensureSheet_(spreadsheet, CONFIG.SETTINGS_SHEET, CONFIG.SETTINGS_HEADERS);
  if (settingsSheet.getLastRow() === 1) {
    settingsSheet.appendRow(['personal', 'Europe/Prague', true, '08:00', '15:00', '19:00', 10]);
  }
  installSchedulerTrigger();
  return 'Tabulky a minutový trigger jsou připravené.';
}
