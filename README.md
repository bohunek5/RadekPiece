# RadekPiece — KOSTRZEWA Studio 3D

Interaktywna prezentacja zewnętrzna dwóch pomp ciepła i dwóch kotłów KOSTRZEWA. Obrót, pięć ujęć, wymiary, warianty powłok, eksport aktualnego modelu GLB oraz kadru PNG 3840 × 2160. Interfejs po polsku, dostosowany do telefonu.

- Prezentacja: https://bohunek5.github.io/RadekPiece/
- Wspólne wejście do projektów: https://radlight.pl/projekty3d/
- Repozytorium: https://github.com/bohunek5/RadekPiece
- Powiązany projekt: https://github.com/bohunek5/RadekAntila

## Modele i źródła

| Model | Szerokość × wysokość × głębokość | Podstawa |
|---|---|---|
| HPR 400 Deluxe | 977 × 1718 × 977 mm | [HPR Deluxe](https://www.kostrzewa.com.pl/produkty/hpr-deluxe-hb) |
| HPR 600 Deluxe | 977 × 1718 × 977 mm | [HPR Deluxe](https://www.kostrzewa.com.pl/produkty/hpr-deluxe-hb) |
| Twin Bio Luxury Compact NE 16 | 1150 × 1382 × 831 mm | [Twin Bio Luxury Compact NE](https://www.kostrzewa.com.pl/produkty/twin-bio-luxury-compact-ne) |
| EEI Pellets 16 | 1663 × 1381 × 894 mm | [EEI Pellets](https://www.kostrzewa.com.pl/produkty/eei-pellets) |

Gabaryty modeli odpowiadają wybranym rysunkom producenta; drobne detale są rekonstrukcją ze zdjęć i dokumentacji. Modele służą prezentacji i nie zastępują fabrycznej dokumentacji CAD ani instrukcji montażu. HPR 400/600 mają wspólną obudowę; nie wprowadzono fikcyjnych różnic jej kształtu. Wariant EEI „16” ma według tabeli producenta moc nominalną 15 kW.

PDF-y, zdjęcia i opis rozbieżności między rewizjami: `public/references/`. Dokumentacja źródeł: [SOURCES.md](public/references/SOURCES.md). Alternatywne kolory w aplikacji są wizualizacją, a nie deklaracją dostępności handlowej.

## Uruchomienie

Wymagany Node.js 22. `npm ci`, następnie `npm run dev` — http://127.0.0.1:4184/. W Windows można uruchomić `Start-Kostrzewa.ps1`.

`npm run build` tworzy statyczny katalog `dist/` z relatywnymi ścieżkami. Można go osadzić w dowolnym podkatalogu. GitHub Actions publikuje gałąź `main` na GitHub Pages.

Źródła wspólnego panelu Radlight znajdują się w `portal/`. Pliki panelu trafiają do `/projekty3d/`, a gotowe buildy studiów do `/projekty3d/antila/` i `/projekty3d/piece/`. Login `antila` lub `piece` wybiera aplikację. Podfoldery działają w tym samym origin, więc po zalogowaniu w panelu aplikacja rozpoznaje sesję bez ponownego wpisywania hasła. `?logout=1` na adresie panelu czyści obie sesje. Panel nie przekierowuje automatycznie po samym otwarciu.

## Dostęp

Ekran hasła jest bramką prezentacyjną w przeglądarce. Pliki na statycznym hostingu i w publicznym repozytorium pozostają publiczne. Stan dostępu zapisuje się w sessionStorage, bez przesyłania hasła w adresie URL. Wspólny panel Radlight wybiera właściwy projekt na podstawie loginu.

## Weryfikacja

`npm test` wykonuje kontrolę w Playwright na lokalnym serwerze 4184. Raport: [qa/verification.json](qa/verification.json). Sprawdzono hasło, wszystkie modele i widoki, obrys geometrii, źródła, eksport i ponowny import czterech GLB, cztery PNG 4K, sterowanie orbitą, zachowanie ustawień, telefon i błędy przeglądarki. Dodatkowa kontrola interfejsu: [qa/ui-verification.json](qa/ui-verification.json).

Eksportowane modele w metrach: `public/models/`. Parametryczne źródła: `src/models/`. Zdjęcia, dokumenty i znaki producenta zachowują prawa ich właścicieli; nie są objęte dodatkową licencją tego projektu.
