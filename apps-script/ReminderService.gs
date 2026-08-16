function validateReminder_(reminder) {
  if (!reminder || !reminder.title || !reminder.scheduledAt) {
    throw apiError_('INVALID_REMINDER', 'Připomínka musí mít název a termín.');
  }
  var scheduled = new Date(reminder.scheduledAt);
  if (isNaN(scheduled.getTime())) throw apiError_('INVALID_DATE', 'Datum připomínky není platné.');
  if (scheduled.getTime() <= Date.now()) throw apiError_('DATE_IN_PAST', 'Připomínka nemůže být v minulosti.');
}

function listReminders_(payload) {
  var userId = payload.userId || CONFIG.DEFAULT_USER_ID;
  return readRows_(CONFIG.REMINDERS_SHEET, CONFIG.REMINDER_HEADERS)
    .filter(function (item) { return item.userId === userId && (!payload.status || item.status === payload.status); })
    .map(withoutInternal_);
}

function findReminder_(id, userId) {
  var item = readRows_(CONFIG.REMINDERS_SHEET, CONFIG.REMINDER_HEADERS).find(function (row) {
    return row.id === id && row.userId === (userId || CONFIG.DEFAULT_USER_ID);
  });
  if (!item) throw apiError_('NOT_FOUND', 'Připomínka nebyla nalezena.');
  return item;
}

function getReminder_(id, userId) { return withoutInternal_(findReminder_(id, userId)); }

function createReminder_(input, requestId) {
  validateReminder_(input);
  var rows = readRows_(CONFIG.REMINDERS_SHEET, CONFIG.REMINDER_HEADERS);
  if (requestId) {
    var existing = rows.find(function (row) { return row.requestId === requestId; });
    if (existing) return withoutInternal_(existing);
  }
  var now = new Date().toISOString();
  var reminder = {
    id: input.id || Utilities.getUuid(), userId: input.userId || CONFIG.DEFAULT_USER_ID,
    title: input.title, originalText: input.originalText || '', scheduledAt: input.scheduledAt,
    timezone: input.timezone || CONFIG.DEFAULT_TIMEZONE, status: 'ACTIVE',
    recurrenceType: input.recurrenceType || 'NONE', recurrenceValue: input.recurrenceValue || '',
    createdAt: now, updatedAt: now, notifiedAt: '', completedAt: '',
    snoozeCount: Number(input.snoozeCount || 0), requestId: requestId || '', deliveryState: ''
  };
  appendObject_(CONFIG.REMINDERS_SHEET, CONFIG.REMINDER_HEADERS, reminder);
  return reminder;
}

function updateReminder_(input) {
  validateReminder_(input);
  var current = findReminder_(input.id, input.userId);
  ['title', 'originalText', 'scheduledAt', 'timezone', 'recurrenceType', 'recurrenceValue'].forEach(function (key) {
    if (input[key] !== undefined) current[key] = input[key];
  });
  current.updatedAt = new Date().toISOString();
  updateObjectRow_(CONFIG.REMINDERS_SHEET, CONFIG.REMINDER_HEADERS, current._row, current);
  return withoutInternal_(current);
}

function setReminderStatus_(id, userId, status) {
  var reminder = findReminder_(id, userId);
  reminder.status = status;
  reminder.updatedAt = new Date().toISOString();
  updateObjectRow_(CONFIG.REMINDERS_SHEET, CONFIG.REMINDER_HEADERS, reminder._row, reminder);
  return withoutInternal_(reminder);
}

function completeReminder_(id, userId) {
  var reminder = findReminder_(id, userId);
  reminder.status = 'DONE';
  reminder.completedAt = new Date().toISOString();
  reminder.updatedAt = reminder.completedAt;
  updateObjectRow_(CONFIG.REMINDERS_SHEET, CONFIG.REMINDER_HEADERS, reminder._row, reminder);
  return withoutInternal_(reminder);
}

function snoozeReminder_(id, userId, scheduledAt) {
  var reminder = findReminder_(id, userId);
  validateReminder_({ title: reminder.title, scheduledAt: scheduledAt });
  reminder.scheduledAt = scheduledAt;
  reminder.status = 'ACTIVE';
  reminder.notifiedAt = '';
  reminder.deliveryState = '';
  reminder.snoozeCount = Number(reminder.snoozeCount || 0) + 1;
  reminder.updatedAt = new Date().toISOString();
  updateObjectRow_(CONFIG.REMINDERS_SHEET, CONFIG.REMINDER_HEADERS, reminder._row, reminder);
  return withoutInternal_(reminder);
}
