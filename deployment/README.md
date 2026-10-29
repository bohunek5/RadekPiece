# Publikacja Radlight

Adres: https://radlight.pl/projekty3d/

Panel (`portal/`) i oba zbudowane studia są umieszczone na hostingu Radlight:

```
projekty3d/
  .htaccess
  index.html
  portal.css
  portal.js
  assets/
  antila/  # build repozytorium RadekAntila
  piece/   # build tego repozytorium
```

Na Radlight pozostają pliki aplikacji, HDR i zasoby panelu: 21 plików, 4 762 392 B. Ze względu na dostępne miejsce na hostingu katalogi `references/` i `models/` obu studiów są obsługiwane przez przekierowania 302 do ich opublikowanych wersji GitHub Pages. Reguły znajdują się wyłącznie w `.htaccess` katalogu `projekty3d/`. Główny plik konfiguracyjny witryny WordPress nie wymaga zmian.

`radlight.htaccess` należy wdrożyć pod nazwą `.htaccess` wewnątrz `projekty3d/`. Automatyczny build GitHub Pages dotyczy studia KOSTRZEWA; publikacja na Radlight jest osobnym krokiem. Duże pliki wymagają dostępności obu witryn GitHub Pages.

Loginy panelu to `antila` i `piece`; hasło prezentacji otwiera tylko wybrane studio w bieżącej karcie. `?project=piece` lub `?project=antila` wybiera kartę, a `?logout=1` czyści obie sesje. Dostęp jest bramką prezentacyjną w przeglądarce, a materiały są publiczne.

Gotowe archiwa są w [wydaniu Projekty 3D](https://github.com/bohunek5/RadekPiece/releases/tag/projekty3d-2026-10-29):

- `Radlight-Projekty3D-20261029.zip` — pełny pakiet ze wszystkimi materiałami lokalnie.
- `Radlight-Projekty3D-web-20261029.zip` — wdrożony pakiet korzystający z materiałów na GitHub Pages.

Kontrola publiczna 2026-10-29: loginy, odrzucanie błędnego hasła, oba studia, cztery modele KOSTRZEWA, widok mobilny, wylogowanie, linki źródłowe, repozytoria oraz rzeczywisty eksport PNG 3840 × 2160. Brak błędów JavaScript/HTTP. Wszystkie 44 pliki pełnego zestawu dostępne przez adresy Radlight: 42 identyczne bajtowo, dwa manifesty JSON różnią się wyłącznie końcami linii CRLF/LF wynikającymi z konfiguracji Git. Treść JSON jest identyczna. Tymczasowe archiwa usunięto z hostingu po publikacji.
