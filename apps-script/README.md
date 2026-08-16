# Nasazení Google Apps Scriptu

1. Vytvoř Google Sheet a samostatný Apps Script projekt.
2. Do Script Properties vlož `SPREADSHEET_ID`, veřejnou adresu PWA bez koncového
   lomítka jako `PWA_BASE_URL` a celé JSON service accountu do
   `FCM_SERVICE_ACCOUNT_JSON`. Service accountu povol Firebase Cloud Messaging API.
3. V editoru jednorázově spusť `setApiToken('nahodny-tajny-token-alespon-24-znaku')`.
4. Spusť `setupProject()` a potvrď oprávnění. Funkce založí listy a minutový trigger.
5. Nasaď projekt jako Web App vykonávanou pod vlastníkem. URL vlož do
   `VITE_APPS_SCRIPT_URL` frontendu.

Tajný token, Spreadsheet ID ani service-account JSON necommituj. `.clasp.json` je
ignorovaný; po `clasp create` nebo `clasp clone` lze obsah této složky synchronizovat
příkazem `clasp push`.
