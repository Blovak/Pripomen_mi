function routeRequest_(request) {
  var payload = request.payload || {};
  switch (request.action) {
    case 'setupProject': return setupProject();
    case 'listReminders': return listReminders_(payload);
    case 'getReminder': return getReminder_(payload.id, payload.userId);
    case 'createReminder': return createReminder_(payload.reminder, payload.requestId);
    case 'updateReminder': return updateReminder_(payload.reminder);
    case 'cancelReminder': return setReminderStatus_(payload.id, payload.userId, 'CANCELLED');
    case 'completeReminder': return completeReminder_(payload.id, payload.userId);
    case 'snoozeReminder': return snoozeReminder_(payload.id, payload.userId, payload.scheduledAt);
    case 'registerDevice': return registerDevice_(payload.device);
    default: throw apiError_('UNKNOWN_ACTION', 'Požadovaná operace neexistuje.');
  }
}
