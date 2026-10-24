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
Gradle-installation behövs Gradle 8.9 och JDK 17. En APK har ännu inte byggts
eller testats i detta projekt.

## Filer

- `index.html`: gränssnitt och spelregler.
- `cards.js` och `cards.json`: de 24 varelsernas kortdata.
- `arena.png` och `art/`: arena och illustrationer.
- `android-app/`: Android-projekt med en kopia av webbversionen i
  `app/src/main/assets/`.

Vid ändringar behöver webbversionen och Android-projektets assets hållas
synkroniserade. Illustrationerna är beskurna från den tidigare översiktsbilden,
enligt originalets `README.txt`.
