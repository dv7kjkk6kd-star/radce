# Rádce podnikatele 2026/2027

Srozumitelný průvodce pro české OSVČ, malé a střední firmy: paušální daň, výdaje, odpisy, DPH, sociální a zdravotní pojištění, přiznání a slevy, studenti a brigády, EET 2.0, zaměstnanci a mzdy, faktury, s.r.o., smlouvy a pohledávky, e-shop a GDPR, kontroly a sankce. Obsahuje kalendář termínů 2027 a čtyři kalkulačky:

- paušální daň vs. výdajový paušál vs. skutečné výdaje,
- odpisová kalkulačka (rovnoměrné i zrychlené odpisy),
- OSVČ vs. s.r.o.,
- čistá mzda a náklady zaměstnavatele.

Čistě statický web (HTML + CSS + JavaScript), bez závislostí a bez sběru dat. Stav k 14. 11. 2026.

## Soubory

| Soubor | Co obsahuje |
|---|---|
| `index.html` | celý obsah průvodce |
| `styles.css` | vzhled (světlý i tmavý režim, mobil, tisk) |
| `app.js` | vyhledávání, navigace, kalkulačky a parametry pro roky 2026 a 2027 |
| `.nojekyll` | říká GitHub Pages, ať soubory nijak nezpracovává |

## Zveřejnění na GitHub Pages (5 minut, zdarma)

1. Přihlas se na [github.com](https://github.com) a vpravo nahoře klikni na **+ → New repository**.
2. Název třeba `radce-podnikatele`, nastav **Public** a klikni **Create repository**.
3. Na stránce nového repozitáře klikni na **uploading an existing file**, přetáhni do okna všechny soubory z této složky (`index.html`, `styles.css`, `app.js`, `README.md`, `.nojekyll`) a klikni **Commit changes**.
   - Soubor `.nojekyll` může být ve Finderu nebo Průzkumníku skrytý. Web funguje i bez něj.
4. Otevři **Settings → Pages**. V části *Build and deployment* zvol **Source: Deploy from a branch**, branch **main** a složku **/ (root)**, pak **Save**.
5. Za minutu až dvě bude web na adrese `https://TVOJE-JMENO.github.io/radce-podnikatele/`.

Vlastní doménu nastavíš ve stejném místě (Settings → Pages → Custom domain).

## Jak aktualizovat čísla na další rok

Všechna čísla pro kalkulačky jsou na začátku `app.js` v objektu `Y` (např. `Y[2027]`). Pro nový rok zkopíruj blok, uprav hodnoty (průměrná mzda, minimální mzda, minimální zálohy, pásma paušální daně, rozhodná částka, hranice 23% daně) a přidej rok do výběrových polí `o-rok`, `s-rok` a `m-rok` v `index.html`. Texty a tabulky uprav přímo v `index.html`.

## Upozornění

Obsah je informativní a zjednodušený. Nenahrazuje daňového poradce, účetní ani advokáta. Před důležitým rozhodnutím ověř aktuální znění předpisů (Finanční správa, ČSSZ, Sbírka zákonů).
