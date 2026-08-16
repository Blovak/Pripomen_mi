function hashToken_(token) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token, Utilities.Charset.UTF_8);
  return digest.map(function (byte) {
    var value = byte < 0 ? byte + 256 : byte;
    return ('0' + value.toString(16)).slice(-2);
  }).join('');
}

function assertAuthorized_(request) {
  var supplied = request && request.apiToken ? String(request.apiToken) : '';
  var expected = getRequiredProperty_('API_TOKEN_SHA256');
  if (!supplied || hashToken_(supplied) !== expected) {
    throw apiError_('UNAUTHORIZED', 'Přístupový token není platný.');
  }
}

function setApiToken(token) {
  if (!token || String(token).length < 24) throw new Error('Token musí mít alespoň 24 znaků.');
  PropertiesService.getScriptProperties().setProperty('API_TOKEN_SHA256', hashToken_(String(token)));
  return 'API token byl bezpečně uložen jako SHA-256 hash.';
}
