# Elemental Duel

Illustrerat kortspel i liggande format med 24 varelser, fyra kortlekar,
HP-mätare, energi, attackanimationer och AI-motståndare.

Importerad version: `elemental_duel_landscape_v2`.

## Kör webbversionen

Öppna `index.html` i en webbläsare på datorn. Bilder och kortdata finns lokalt
och kräver ingen extern bildtjänst. På mobil används liggande läge.

## Android

Öppna mappen `android-app` i Android Studio. Projektet använder Android Gradle
Plugin 8.7.3 och compile SDK 35. Låt projektet synkroniseras och bygg en APK
via Android Studios Build-meny. Appen kör spelet offline i en WebView och
begär liggande orientering.

Den importerade versionen saknar Gradle Wrapper. För ett bygge med en separat
Gradle-installation behövs Gradle 8.9 och JDK 17, enligt
[Android Gradle Plugins kompatibilitetstabell](https://developer.android.com/build/releases/agp-8-7-0-release-notes#compatibility).

## Automatiska APK-byggen

[Build Android APK](https://github.com/FilipFogel/monzuki/actions/workflows/android-apk.yml)
körs vid varje push till `main`, inklusive när en pull request mergas. Det går
också att starta bygget med **Run workflow** på samma sida.

Varje nytt workflow-bygge får version `0.2.<körningsnummer>` och ett ökande
Android `versionCode` (körningsnummer + 1). Om samma körning startas om behåller
den sitt versionsnummer. Lokala byggen behåller version `0.2` och kod `1`
om inga versionsparametrar anges.

Workflowen installerar byggverktygen, kopierar aktuella spelfiler från projektets
rot till Android-appen och bygger en testsignerad APK. Den kontrollerar sedan
signaturen, versionsnumret och att arenan, kortdata och samtliga kortillustrationer
finns med och matchar källfilerna.

Ladda ner `elemental-duel-0.2.<körningsnummer>-debug` under **Artifacts** i en
lyckad körning, packa upp ZIP-filen och installera APK:n på Android.
Artefakten sparas i 30 dagar. Detta är en debugversion för testning, inte en
Google Play-release. Alla testbyggen använder samma fasta debugnyckel i
`android-app/signing/debug.keystore`. Nästa APK kan därför installeras som en
uppdatering med bibehållen appdata. Versionsnumret ökar automatiskt.

Version 0.2.1 och 0.2.2 använde tillfälliga runner-nycklar som inte sparades.
De måste avinstalleras en sista gång innan den första versionen med den fasta
nyckeln installeras. Avinstallation tar bort appens lokala data.

Nyckeln i repot är avsiktligt offentlig och endast för testbyggen (lösenord
`android`). Den ger ingen säker identitet för en produktionsapp. Använd en
separat privat nyckel och separat applicationId för en framtida produktionsapp.
Byt inte testnyckeln: det bryter uppdateringar för installerade testversioner.

## Filer

- `index.html`: gränssnitt och spelregler.
- `cards.js` och `cards.json`: de 24 varelsernas kortdata.
- `arena.png` och `art/`: arena och illustrationer.
- `android-app/`: Android-projekt med en kopia av webbversionen i
  `app/src/main/assets/`.

Vid ändringar behöver webbversionen och Android-projektets assets hållas
synkroniserade. Illustrationerna är beskurna från den tidigare översiktsbilden,
enligt originalets `README.txt`.
