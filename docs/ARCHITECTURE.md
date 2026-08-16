# Architektura aplikace Připomeň mi

## Rozhodnutí a hranice MVP

Frontend je statická React PWA hostovaná na GitHub Pages. Veškerá doménová logika
(parser, stav konverzace, seskupování připomínek a offline fronta) je oddělená od
transportu. Jediný backend je Google Apps Script Web App nad Google Sheets. Apps
Script zároveň každou minutu kontroluje splatné připomínky a odesílá FCM HTTP v1
zprávy. Frontend proto lze později přepnout ze Sheets na Firestore výměnou
implementace `ReminderRepository`.

```text
React PWA -> ReminderRepository -> AppsScriptApi -> Apps Script router
    |                                                |          |
    +-> IndexedDB pending queue                      v          v
    +-> SpeechRecognitionService                Sheets      FCM HTTP v1
    +-> NotificationService                         ^          ^
                                                    + scheduler+
```

Repozitář ani sestavený frontend neobsahují tajné hodnoty. Ve Vite konfiguraci jsou
jen veřejné Firebase client údaje a URL Apps Scriptu; sdílený osobní API token se
zadává uživatelem do nastavení zařízení. FCM service-account údaje a hash API tokenu
jsou pouze v Apps Script Properties.

## Omezení iPhone/Safari

- Web Push vyžaduje iOS/iPadOS 16.4 nebo novější a aplikaci přidanou na plochu.
- O povolení notifikací lze požádat pouze po přímé akci uživatele. Onboarding proto
  obsahuje samostatné tlačítko; aplikace dialog sama při startu neotevírá.
- Speech Recognition není stabilní multiplatformní kontrakt a může používat síťovou
  službu prohlížeče. Při chybě nebo nedostupnosti je vždy přítomný textový vstup.
- Mikrofon nelze spolehlivě spustit automaticky po otevření `/voice` ani poslouchat
  na pozadí. Route proto otevře zadání a čeká na klepnutí na „Mluvit“.
- Zvuk, vzhled a podporované akce notifikace určuje iOS. Nelze garantovat vlastní
  zvuk ani zobrazení tlačítek; kliknutí vždy funguje jako fallback a otevře detail.
- Background Sync není na všech verzích Safari spolehlivý. Fronta se proto zkouší
  odeslat při startu aplikace a při události `online`.
- Minutový Apps Script trigger není realtime systém. Připomínka je „na minutu“, ale
  spuštění může být zpožděné kvótami nebo plánovačem.

## Datový model

### Reminders

`id, userId, title, originalText, scheduledAt, timezone, status,
recurrenceType, recurrenceValue, createdAt, updatedAt, notifiedAt, completedAt,
snoozeCount`

- `scheduledAt`, `createdAt`, `updatedAt`, `notifiedAt`, `completedAt`: ISO 8601.
- `status`: `ACTIVE | SENT | DONE | CANCELLED`.
- `recurrenceType`: `NONE | DAILY | WEEKLY` (model dovoluje později `MONTHLY |
  CUSTOM`).
- `recurrenceValue`: volitelný JSON/text parametr pravidla.

### Devices

`id, userId, fcmToken, platform, userAgent, createdAt, lastSeenAt, active`

### Settings

`userId, timezone, voiceEnabled, defaultMorningTime, defaultAfternoonTime,
defaultEveningTime, defaultSnoozeMinutes`

Výchozí `userId` je `personal`, timezone `Europe/Prague`. Časy jsou parsovány ve
zvolené zóně klienta, ne v serverové zóně.

## API kontrakt

Apps Script přijímá `POST` JSON `{ action, payload }`; čtecí operace lze volat také
přes `GET ?action=...`. Token je v hlavičce `Authorization: Bearer ...`; kvůli
omezením nasazení Apps Scriptu klient při potřebě může použít `apiToken` v POST body,
nikdy v URL. Produkční varianta má přejít na Google Identity/OAuth.

| action | payload | výsledek |
|---|---|---|
| `listReminders` | `{ userId, status? }` | `Reminder[]` |
| `getReminder` | `{ id, userId }` | `Reminder` |
| `createReminder` | `{ reminder }` | `Reminder` |
| `updateReminder` | `{ reminder }` | `Reminder` |
| `cancelReminder` | `{ id, userId }` | `Reminder` |
| `completeReminder` | `{ id, userId }` | `Reminder` |
| `snoozeReminder` | `{ id, userId, scheduledAt }` | `Reminder` |
| `registerDevice` | `{ device }` | `Device` |

Úspěch má tvar `{ "success": true, "data": ... }`, chyba
`{ "success": false, "error": { "code": "...", "message": "..." } }`.
Mutace přijímají `requestId`; backend ukládá ID vytvořené připomínky a opakovaný
požadavek vrátí existující záznam. Scheduler používá `LockService`; před odesláním
atomicky označí záznam interním stavem a po výsledku nastaví `notifiedAt`/`SENT`,
nebo u opakování vypočítá další termín.

## Adresářová struktura

```text
src/
  components/         UI prvky
  pages/              hlavní, seznam, detail, nastavení, onboarding
  services/api/       Apps Script klient a repository kontrakt
  services/speech/    browser SpeechRecognition + manuální fallback
  services/notifications/ Firebase/Web Push registrace
  services/reminders/ IndexedDB fronta a synchronizace
  hooks/              React integrace
  models/             sdílené typy
  parser/             deterministický český parser
  state/              konverzační automat
  utils/              datumy, ID, formátování
apps-script/           clasp-compatible backend a scheduler
public/                manifestové ikony a FCM service worker
```

## Implementační pořadí a ověření

1. Skeleton, PWA shell, routing a mock repository.
2. Deterministický parser a testy pevným referenčním časem.
3. Konverzační automat včetně slučování doplňujících odpovědí.
4. Apps Script schema, router, CRUD, autentizace a lokálně testovatelná pravidla.
5. FCM registrace a service worker; skutečný test vyžaduje Firebase konfiguraci.
6. Idempotentní scheduler a instalace minutového triggeru.
7. Speech Recognition, TTS a textový fallback.
8. iOS onboarding, `/voice`, fyzický iPhone test.
9. IndexedDB fronta, snooze, recurrence a chybové stavy.

Automaticky lze ověřit build, unit testy a lint/typecheck. Ručně je nutné ověřit
nasazení Apps Scriptu, oprávnění Google účtu, FCM token, fyzický iPhone a doručení
zavřené PWA.

## Externí služby a náklady

- GitHub Pages: zdarma pro veřejný repozitář na GitHub Free; privátní Pages vyžaduje
  placený plán. Alternativa je Firebase Hosting ve vlastních bezplatných kvótách.
- Google Sheets a Apps Script: bez samostatného poplatku v rámci Google účtu, ale s
  denními kvótami a limitem běhu triggerů. Pro osobní MVP je to přijatelné.
- FCM: Cloud Messaging je bezplatné. Ostatní Firebase produkty nejsou potřeba.
- Web Speech API a `speechSynthesis`: aplikace neplatí API, dostupnost a případné
  vzdálené zpracování řeči však řídí prohlížeč/platforma.
- Parser a IndexedDB: lokální, bez provozních nákladů.

Žádná placená služba není pro MVP povinná.
