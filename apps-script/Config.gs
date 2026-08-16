var CONFIG = Object.freeze({
  REMINDERS_SHEET: 'Reminders',
  DEVICES_SHEET: 'Devices',
  SETTINGS_SHEET: 'Settings',
  DEFAULT_USER_ID: 'personal',
  DEFAULT_TIMEZONE: 'Europe/Prague',
  REMINDER_HEADERS: [
    'id', 'userId', 'title', 'originalText', 'scheduledAt', 'timezone', 'status',
    'recurrenceType', 'recurrenceValue', 'createdAt', 'updatedAt', 'notifiedAt',
    'completedAt', 'snoozeCount', 'requestId', 'deliveryState'
  ],
  DEVICE_HEADERS: [
    'id', 'userId', 'fcmToken', 'platform', 'userAgent', 'createdAt', 'lastSeenAt', 'active'
  ],
  SETTINGS_HEADERS: [
    'userId', 'timezone', 'voiceEnabled', 'defaultMorningTime',
    'defaultAfternoonTime', 'defaultEveningTime', 'defaultSnoozeMinutes'
  ]
});

function getRequiredProperty_(name) {
  var value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value) throw apiError_('CONFIG_MISSING', 'Chybí serverové nastavení ' + name + '.');
  return value;
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(getRequiredProperty_('SPREADSHEET_ID'));
}

function setPwaBaseUrl_(value) {
  var url = String(value || '').replace(/\/$/, '');
  if (!/^https:\/\//.test(url)) throw apiError_('INVALID_URL', 'Adresa PWA musí používat HTTPS.');
  PropertiesService.getScriptProperties().setProperty('PWA_BASE_URL', url);
  return { pwaBaseUrl: url };
}
