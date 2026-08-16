# Připomeň mi

Produkční PWA: **https://pripomen-mi-blovak.web.app/**

Mobile-first hlasová PWA pro rychlé české připomínky. Frontend funguje bez App
Store, připomínky ukládá do Google Sheets přes Apps Script a push posílá přes FCM.
Bez připojení se změny ukládají do IndexedDB a odešlou se po návratu online.

## Co je implementované

- český deterministický parser času a data bez placeného LLM,
- stavový dialog pro chybějící datum a čas,
- Web Speech API s textovým fallbackem a české TTS,
- instalovatelná PWA, `/voice`, iPhone onboarding a offline shell,
- seznam, detail, hotovo, zrušit a snooze,
- Apps Script CRUD, Google Sheets schema, FCM HTTP v1 a minutový scheduler,
- FCM registrace až po explicitním klepnutí,
- unit testy parseru, konverzace a API klienta.

Podrobná rozhodnutí, omezení iOS, model a API jsou v
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Nasazení serveru popisuje
[`apps-script/README.md`](apps-script/README.md).

## Lokální spuštění

Požadován je Node.js 20 nebo novější.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Bez proměnných prostředí aplikace funguje lokálně/offline. Pro synchronizaci vyplň
URL nasazeného Apps Scriptu a veřejné Firebase web údaje. Osobní API token se zadává
až v Nastavení aplikace a není součástí buildu ani repozitáře.

```bash
npm test
npm run build
```

## GitHub Pages

Workflow `.github/workflows/deploy.yml` testuje a nasazuje `main`. V nastavení
repozitáře zvol Pages → Source: **GitHub Actions** a vytvoř Repository Variables se
stejnými názvy jako v `.env.example`. Firebase client konfigurace a VAPID public key
nejsou serverová tajemství; service-account JSON však patří výhradně do Apps Script
Properties.

Přímou cestu `https://blovak.github.io/Pripomen_mi/voice` obsluhuje GitHub Pages
fallback `404.html`, který zachová route a předá ji React routeru.

Stejný workflow nasazuje také Firebase Hosting na primární mobilní adresu
`https://pripomen-mi-blovak.web.app/`. Firebase používá SPA rewrite, takže `/`,
`/index.html` i `/voice` odpovídají přímo bez GitHub Pages fallbacku.

## Ruční akceptační test

1. Nasaď Apps Script a frontend, spusť `setupProject()`.
2. Na iPhonu s iOS 16.4+ otevři URL v Safari a přidej ji na plochu.
3. V PWA vlož osobní API token a klepni na „Povolit notifikace“.
4. Řekni „Za pět minut mi připomeň zkontrolovat troubu“ a potvrď uložení.
5. Zavři PWA a ověř doručení notifikace přibližně v dané minutě.
6. Ověř také dialog „Připomeň mi zavolat Petrovi“ → „Zítra“ → „V devět“.

Vlastní zvuk, zobrazení notification actions a přesná sekunda doručení nejsou na
iOS PWA garantované; chování řídí systém a Apps Script scheduler.
