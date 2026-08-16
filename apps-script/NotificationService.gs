function getFcmAccessToken_() {
  var serviceAccount = JSON.parse(getRequiredProperty_('FCM_SERVICE_ACCOUNT_JSON'));
  var pwaBaseUrl = getRequiredProperty_('PWA_BASE_URL').replace(/\/$/, '');
  var now = Math.floor(Date.now() / 1000);
  var header = { alg: 'RS256', typ: 'JWT' };
  var claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };
  var unsigned = base64Url_(JSON.stringify(header)) + '.' + base64Url_(JSON.stringify(claim));
  var signature = Utilities.computeRsaSha256Signature(unsigned, serviceAccount.private_key);
  var assertion = unsigned + '.' + Utilities.base64EncodeWebSafe(signature).replace(/=+$/, '');
  var response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post', muteHttpExceptions: true,
    payload: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: assertion }
  });
  var body = JSON.parse(response.getContentText());
  if (response.getResponseCode() >= 300 || !body.access_token) throw new Error('FCM OAuth selhal: ' + response.getResponseCode());
  return body.access_token;
}

function base64Url_(value) {
  return Utilities.base64EncodeWebSafe(value, Utilities.Charset.UTF_8).replace(/=+$/, '');
}

function sendReminderPush_(reminder, devices) {
  if (!devices.length) throw apiError_('NO_ACTIVE_DEVICE', 'Není zaregistrované žádné aktivní zařízení.');
  var serviceAccount = JSON.parse(getRequiredProperty_('FCM_SERVICE_ACCOUNT_JSON'));
  var accessToken = getFcmAccessToken_();
  var endpoint = 'https://fcm.googleapis.com/v1/projects/' + serviceAccount.project_id + '/messages:send';
  var successes = 0;
  devices.forEach(function (device) {
    var payload = {
      message: {
        token: device.fcmToken,
        notification: { title: 'Připomínka', body: reminder.title },
        data: { reminderId: reminder.id, clickUrl: pwaBaseUrl + '/reminders/' + reminder.id },
        webpush: {
          fcm_options: { link: pwaBaseUrl + '/reminders/' + reminder.id },
          notification: {
            icon: pwaBaseUrl + '/icon-192.png', badge: pwaBaseUrl + '/icon-192.png',
            tag: 'reminder-' + reminder.id, renotify: true,
            actions: [
              { action: 'done', title: 'Hotovo' },
              { action: 'snooze-10', title: 'Za 10 minut' }
            ]
          }
        }
      }
    };
    var response = UrlFetchApp.fetch(endpoint, {
      method: 'post', contentType: 'application/json', payload: JSON.stringify(payload),
      headers: { Authorization: 'Bearer ' + accessToken }, muteHttpExceptions: true
    });
    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) successes += 1;
    else console.error(JSON.stringify({ code: 'FCM_SEND_FAILED', status: response.getResponseCode(), deviceId: device.id }));
  });
  if (!successes) throw apiError_('FCM_SEND_FAILED', 'Push notifikaci se nepodařilo odeslat.');
  return successes;
}
