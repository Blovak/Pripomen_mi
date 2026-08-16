function checkDueReminders() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    var now = new Date();
    var reminders = readRows_(CONFIG.REMINDERS_SHEET, CONFIG.REMINDER_HEADERS);
    var devices = readRows_(CONFIG.DEVICES_SHEET, CONFIG.DEVICE_HEADERS).filter(function (item) { return item.active === true || item.active === 'TRUE'; });
    reminders.filter(function (item) {
      return item.status === 'ACTIVE' && !item.deliveryState && new Date(item.scheduledAt).getTime() <= now.getTime();
    }).forEach(function (reminder) {
      // Marker je zapsán před externím voláním. I po pádu skriptu tak stejný výskyt
      // nebude odeslán podruhé; správce může marker ručně vyčistit a odeslání zopakovat.
      reminder.deliveryState = 'SENDING:' + Utilities.getUuid();
      reminder.updatedAt = now.toISOString();
      updateObjectRow_(CONFIG.REMINDERS_SHEET, CONFIG.REMINDER_HEADERS, reminder._row, reminder);
      try {
        sendReminderPush_(reminder, devices.filter(function (device) { return device.userId === reminder.userId; }));
        reminder.notifiedAt = new Date().toISOString();
        advanceAfterNotification_(reminder);
      } catch (error) {
        reminder.deliveryState = '';
        console.error(JSON.stringify({ code: error.code || 'NOTIFY_ERROR', reminderId: reminder.id, message: error.message }));
      }
      reminder.updatedAt = new Date().toISOString();
      updateObjectRow_(CONFIG.REMINDERS_SHEET, CONFIG.REMINDER_HEADERS, reminder._row, reminder);
    });
  } finally { lock.releaseLock(); }
}

function advanceAfterNotification_(reminder) {
  var type = reminder.recurrenceType || 'NONE';
  if (type === 'DAILY' || type === 'WEEKLY') {
    var next = new Date(reminder.scheduledAt);
    next.setUTCDate(next.getUTCDate() + (type === 'DAILY' ? 1 : 7));
    reminder.scheduledAt = next.toISOString();
    reminder.status = 'ACTIVE';
    reminder.deliveryState = '';
  } else {
    reminder.status = 'SENT';
    reminder.deliveryState = 'SENT';
  }
}

function installSchedulerTrigger() {
  ScriptApp.getProjectTriggers().filter(function (trigger) {
    return trigger.getHandlerFunction() === 'checkDueReminders';
  }).forEach(function (trigger) { ScriptApp.deleteTrigger(trigger); });
  ScriptApp.newTrigger('checkDueReminders').timeBased().everyMinutes(1).create();
}
