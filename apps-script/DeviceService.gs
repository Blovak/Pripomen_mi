function registerDevice_(input) {
  if (!input || !input.fcmToken) throw apiError_('INVALID_DEVICE', 'Chybí token zařízení.');
  var rows = readRows_(CONFIG.DEVICES_SHEET, CONFIG.DEVICE_HEADERS);
  var now = new Date().toISOString();
  var existing = rows.find(function (row) { return row.fcmToken === input.fcmToken; });
  if (existing) {
    existing.lastSeenAt = now;
    existing.active = true;
    existing.platform = input.platform || existing.platform;
    existing.userAgent = input.userAgent || existing.userAgent;
    updateObjectRow_(CONFIG.DEVICES_SHEET, CONFIG.DEVICE_HEADERS, existing._row, existing);
    return withoutInternal_(existing);
  }
  var device = {
    id: Utilities.getUuid(), userId: input.userId || CONFIG.DEFAULT_USER_ID,
    fcmToken: input.fcmToken, platform: input.platform || 'web',
    userAgent: input.userAgent || '', createdAt: now, lastSeenAt: now, active: true
  };
  appendObject_(CONFIG.DEVICES_SHEET, CONFIG.DEVICE_HEADERS, device);
  return device;
}
