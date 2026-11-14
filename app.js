/* Rádce podnikatele – vyhledávání, navigace a kalkulačky.
   Všechny výpočty běží lokálně v prohlížeči. Parametry: stav k 14. 11. 2026. */
(function () {
  'use strict';

  // ---------- Parametry podle roku ----------
  const KIDS_YEAR = [15204, 22320, 27840];      // zvýhodnění na 1., 2., 3.+ dítě (ročně)
  const KIDS_MONTH = [1267, 1860, 2320];        // měsíčně
  const Y = {
    2026: {
      avg: 48967, minWage: 22400, sleva: 30840, studentSleva: 0,
      thr23: 1762812, thrMonth: 146901,
      socMinMain: 5005, socMinSide: 1574, healthMin: 3306,
      rozhodna: 117521, maxVZ: 2350416,
      // paušální daň ročně (1. pásmo po zpětném snížení: 9 162 Kč × 12)
      paus: [
        { m: 9162, tax: 100, soc: 5756, zdr: 3306 },
        { m: 16745, tax: 4963, soc: 8191, zdr: 3591 },
        { m: 27139, tax: 9320, soc: 12527, zdr: 5292 }
      ],
      eetOff: 0
    },
    2027: {
      avg: 51663, minWage: 24900, sleva: 30840, studentSleva: 4020,
      thr23: 1859868, thrMonth: 154989,
      socMinMain: 5281, socMinSide: 1660, healthMin: 3488,
      rozhodna: 123991, maxVZ: 2479824,
      paus: [
        { m: 9662, tax: 100, soc: 6074, zdr: 3488 },
        { m: 16745, tax: 4963, soc: 8191, zdr: 3591 },
        { m: 27139, tax: 9320, soc: 12527, zdr: 5292 }
      ],
      eetOff: 1400
    }
  };
  const CAP = { '0.8': 1600000, '0.6': 1200000, '0.4': 800000 };

  // ---------- Pomocné funkce ----------
  const $ = (id) => document.getElementById(id);
  const nf = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const kc = (n) => nf.format(Math.round(n)) + ' Kč';
  const num = (id) => {
    const v = parseFloat(String($(id).value).replace(/\s/g, '').replace(',', '.'));
    return isFinite(v) && v > 0 ? v : 0;
  };
  const floor = Math.floor, max = Math.max, min = Math.min;
  // zaokrouhlení nahoru na celé Kč, odolné vůči chybám plovoucí čárky (240900.0000001 -> 240900)
  const ceil = (x) => Math.ceil(Math.round(x * 100) / 100);

  // Roční daň z příjmů FO ze základu daně (zaokrouhlení ZD na 100 Kč dolů, daň na Kč nahoru)
  function taxFO(zd, p) {
    const base = floor(max(0, zd) / 100) * 100;
    if (base <= 0) return 0;
    return ceil(0.15 * min(base, p.thr23) + 0.23 * max(0, base - p.thr23));
  }
  function kidsCredit(n, arr) {
    let s = 0;
    for (let i = 0; i < n; i++) s += arr[min(i, 2)];
    return s;
  }

  // Běžný režim OSVČ (výdajový paušál nebo skutečné výdaje)
  function regime(P, vydaje, typ, deti, p) {
    const zd = max(0, P - vydaje);
    const applySlevy = typ !== 'zam';
    const slevy = applySlevy ? p.sleva + (typ === 'student' ? p.studentSleva : 0) : 0;
    let t = max(0, taxFO(zd, p) - slevy);
    const kids = applySlevy ? kidsCredit(deti, KIDS_YEAR) : 0;
    t = t - kids;
    let bonus = 0;
    if (t < 0) {
      if (P >= 6 * p.minWage && -t >= 100) bonus = -t;
      t = 0;
    }
    const tax = t - bonus;
    let soc, zdr;
    const vzSoc = min(0.55 * zd, p.maxVZ);
    if (typ === 'hlavni') {
      soc = max(ceil(0.292 * vzSoc), 12 * p.socMinMain);
      zdr = max(ceil(0.135 * 0.5 * zd), 12 * p.healthMin);
    } else {
      soc = zd > p.rozhodna ? max(ceil(0.292 * vzSoc), 12 * p.socMinSide) : 0;
      zdr = ceil(0.135 * 0.5 * zd);
    }
    return { zd, tax, bonus, soc, zdr, total: tax + soc + zdr };
  }

  function pausBand(P, rate) {
    if (P <= 1000000 || (P <= 1500000 && rate >= 0.6) || (P <= 2000000 && rate >= 0.8)) return 1;
    if (P <= 1500000 || (P <= 2000000 && rate >= 0.6)) return 2;
    if (P <= 2000000) return 3;
    return 0;
  }

  // ---------- Kalkulačka 1: OSVČ ----------
  function calcOSVC() {
    const rok = $('o-rok').value, p = Y[rok];
    const P = num('o-prijmy');
    const rateKey = $('o-pausal').value, rate = parseFloat(rateKey);
    const typ = $('o-typ').value;
    const skutRaw = $('o-skutecne').value.trim();
    const hasSkut = skutRaw !== '' && isFinite(parseFloat(skutRaw));
    const skut = hasSkut ? num('o-skutecne') : 0;
    const deti = parseInt($('o-deti').value, 10) || 0;
    const dph = $('o-dph').checked;
    const out = $('o-result');

    if (P <= 0) { out.innerHTML = '<p class="na">Zadej roční příjmy.</p>'; return; }

    const rows = [];
    const notes = [];

    // Paušální daň
    const band = pausBand(P, rate);
    let pausOk = true, pausWhy = '';
    if (dph) { pausOk = false; pausWhy = 'plátce DPH nemůže být v paušálním režimu'; }
    else if (typ === 'zam') { pausOk = false; pausWhy = 'při příjmech ze zaměstnání paušální režim obvykle nelze použít'; }
    else if (!band) { pausOk = false; pausWhy = 'příjmy nad 2 mil. Kč'; }
    if (pausOk) {
      const b = p.paus[band - 1];
      rows.push({ name: 'Paušální daň – ' + band + '. pásmo (' + nf.format(b.m) + ' Kč/měs.)', tax: b.tax * 12, soc: b.soc * 12, zdr: b.zdr * 12, total: b.m * 12 });
      if (rok === '2027' && band === 1 && P <= 1000000) {
        rows.push({ name: 'Paušální daň – 1. pásmo + EET OFF', tax: (b.tax + p.eetOff) * 12, soc: b.soc * 12, zdr: b.zdr * 12, total: (b.m + p.eetOff) * 12, eet: true });
      }
    }

    // Výdajový paušál
    const pausExp = min(P * rate, CAP[rateKey]);
    const vp = regime(P, pausExp, typ, deti, p);
    rows.push(Object.assign({ name: 'Výdajový paušál ' + Math.round(rate * 100) + ' % (výdaje ' + kc(pausExp) + ')' }, vp));

    // Skutečné výdaje
    if (hasSkut) {
      const sv = regime(P, skut, typ, deti, p);
      rows.push(Object.assign({ name: 'Skutečné výdaje (daňová evidence)' }, sv));
    }

    // Nejlevnější varianta (EET OFF nepočítáme jako vítěze, je to volba pohodlí)
    const cand = rows.filter((r) => !r.eet);
    const best = cand.reduce((a, b) => (b.total < a.total ? b : a), cand[0]);

    const keepLabel = hasSkut ? 'Zůstane ti (po skutečných nákladech)' : 'Příjmy − odvody';
    let html = '<div class="best">Nejméně zaplatíš: ' + best.name.replace(/ \(.*\)$/, '') + ' – ' + kc(best.total) + ' ročně (' + kc(best.total / 12) + ' měsíčně)</div>';
    html += '<div class="table-wrap"><table><thead><tr><th>Varianta</th><th class="num">Daň</th><th class="num">Sociální</th><th class="num">Zdravotní</th><th class="num">Celkem odvody / rok</th><th class="num">' + keepLabel + '</th></tr></thead><tbody>';
    rows.forEach((r) => {
      const keep = P - (hasSkut ? skut : 0) - r.total;
      const taxCell = r.tax < 0 ? '−' + kc(-r.tax) + ' (bonus)' : kc(r.tax);
      html += '<tr' + (r === best ? ' class="winner"' : '') + '><td>' + r.name + '</td><td class="num">' + taxCell + '</td><td class="num">' + kc(r.soc) + '</td><td class="num">' + kc(r.zdr) + '</td><td class="num">' + kc(r.total) + '</td><td class="num">' + kc(keep) + '</td></tr>';
    });
    html += '</tbody></table></div>';

    if (!pausOk) notes.push('Paušální daň: nelze (' + pausWhy + ').');
    if (pausOk && band > 1 && rate < 0.8) notes.push('Pásmo se určuje podle příjmů za předchozí rok. Kalkulačka předpokládá, že všechny příjmy mají stejný výdajový paušál.');
    if (typ === 'hlavni') notes.push('Hlavní činnost: sociální pojištění minimálně ' + kc(12 * p.socMinMain) + ' a zdravotní minimálně ' + kc(12 * p.healthMin) + ' ročně, i při nízkém zisku.');
    if (typ !== 'hlavni') notes.push('Vedlejší činnost: sociální pojištění jen při zisku nad ' + kc(p.rozhodna) + ' (rozhodná částka ' + rok + '), zdravotní z poloviny zisku bez minima. V paušálním režimu bys platil plné minimum.');
    if (typ === 'zam') notes.push('Při zaměstnání kalkulačka nepočítá slevu na poplatníka ani děti (předpokládá, že je uplatňuješ u zaměstnavatele) a ignoruje vliv mzdy na 23% sazbu.');
    if (typ === 'student' && rok === '2027') notes.push('Rok 2027: započtena sleva na studenta 4 020 Kč.');
    if (typ === 'student' && rok === '2026') notes.push('Rok 2026: sleva na studenta neexistuje (vrací se od 2027).');
    if (deti > 0) notes.push('V paušálním režimu se zvýhodnění na děti neuplatní. U běžného režimu je započteno; daňový bonus jen při příjmech aspoň ' + kc(6 * p.minWage) + '.');
    if (rows.some((r) => r.eet)) notes.push('EET OFF (+1 400 Kč/měs.) se hodí, jen pokud přijímáš kontaktní platby (hotovost, karta na místě) a nechceš je evidovat.');
    if (rok === '2026') notes.push('Rok 2026: 1. pásmo počítáno po zpětném snížení na 9 162 Kč/měs. (přeplatek za 1. pololetí se vrací).');
    html += '<ul class="muted" style="font-size:.86rem;margin:10px 0 0">' + notes.map((n) => '<li>' + n + '</li>').join('') + '</ul>';
    out.innerHTML = html;
  }

  // ---------- Kalkulačka 2: Odpisy ----------
  const GROUPS = {
    1: { n: 3, r: [20, 40], k: [3, 4] },
    2: { n: 5, r: [11, 22.25], k: [5, 6] },
    3: { n: 10, r: [5.5, 10.5], k: [10, 11] },
    4: { n: 20, r: [2.15, 5.15], k: [20, 21] },
    5: { n: 30, r: [1.4, 3.4], k: [30, 31] },
    6: { n: 50, r: [1.02, 2.02], k: [50, 51] }
  };
  function calcOdpisy() {
    const vcRaw = num('d-vc');
    const g = GROUPS[$('d-sk').value];
    const met = $('d-metoda').value;
    const rok0 = parseInt($('d-rok').value, 10) || 2026;
    const auto = $('d-auto').checked;
    const out = $('d-result');
    if (vcRaw <= 0) { out.innerHTML = '<p class="na">Zadej vstupní cenu.</p>'; return; }
    const vc = auto ? min(vcRaw, 2000000) : vcRaw;
    let html = '';
    if (vcRaw <= 80000) html += '<div class="tip">Movitý majetek do 80 000 Kč nemusíš odpisovat, jde rovnou do nákladů v roce pořízení. Rozpis níže platí jen pro budovy a stavby.</div>';
    if (auto && vcRaw > 2000000) html += '<div class="warn">Osobní auto: odpisuje se jen z 2 000 000 Kč. Zbylých ' + kc(vcRaw - 2000000) + ' do nákladů nepůjde.</div>';
    let zc = vc, sum = 0;
    const rows = [];
    for (let i = 0; i < g.n; i++) {
      let o;
      if (i === g.n - 1) o = zc;
      else if (met === 'r') o = ceil(vc * (i === 0 ? g.r[0] : g.r[1]) / 100);
      else o = i === 0 ? ceil(vc / g.k[0]) : ceil(2 * zc / (g.k[1] - i));
      o = min(o, zc);
      zc -= o; sum += o;
      rows.push([rok0 + i, o, zc]);
    }
    html += '<div class="best">' + (met === 'r' ? 'Rovnoměrně' : 'Zrychleně') + ': 1. rok ' + kc(rows[0][1]) + ', celkem ' + kc(sum) + ' za ' + g.n + ' let</div>';
    html += '<div class="table-wrap" style="max-height:360px;overflow:auto"><table><thead><tr><th>Rok</th><th class="num">Daňový odpis</th><th class="num">Zůstatková cena na konci roku</th></tr></thead><tbody>';
    rows.forEach((r) => { html += '<tr><td>' + r[0] + '</td><td class="num">' + kc(r[1]) + '</td><td class="num">' + kc(r[2]) + '</td></tr>'; });
    html += '</tbody></table></div>';
    html += '<p class="muted" style="font-size:.86rem;margin:8px 0 0">V roce zařazení se uplatní celý roční odpis. Při výdajovém paušálu nebo paušální dani se odpisy do výdajů nepřičítají. Odpis můžeš v některém roce přerušit, doba se prodlouží.</p>';
    out.innerHTML = html;
  }

  // ---------- Kalkulačka 3: OSVČ vs. s.r.o. ----------
  function calcSRO() {
    const rok = $('s-rok').value, p = Y[rok];
    const Z = num('s-zisk');
    const uc = num('s-ucetni');
    const obzp = $('s-obzp').checked;
    const out = $('s-result');
    if (Z <= 0) { out.innerHTML = '<p class="na">Zadej roční zisk.</p>'; return; }

    const o = regime(Z, 0, 'hlavni', 0, p); // zisk = základ daně
    const oNet = Z - o.total;

    const base = max(0, Z - uc);
    const dppo = ceil(0.21 * floor(base / 1000) * 1000);
    const after = base - dppo;
    const wht = floor(0.15 * after);
    const obzpY = obzp ? 12 * ceil(0.135 * p.minWage) : 0;
    const sNet = after - wht - obzpY;

    const better = sNet > oNet ? 's.r.o.' : 'OSVČ';
    const diff = Math.abs(sNet - oNet);
    let html = '<div class="best">Víc ti zůstane jako ' + better + ': o ' + kc(diff) + ' ročně</div>';
    html += '<div class="table-wrap"><table><thead><tr><th></th><th class="num">OSVČ (skutečné výdaje)</th><th class="num">s.r.o. + dividenda</th></tr></thead><tbody>';
    html += '<tr><td>Náklady navíc (účetní, závěrka)</td><td class="num">–</td><td class="num">' + kc(uc) + '</td></tr>';
    html += '<tr><td>Daň z příjmů (OSVČ 15/23 % po slevě / firma 21 %)</td><td class="num">' + kc(o.tax) + '</td><td class="num">' + kc(dppo) + '</td></tr>';
    html += '<tr><td>Srážková daň z dividendy 15 %</td><td class="num">–</td><td class="num">' + kc(wht) + '</td></tr>';
    html += '<tr><td>Sociální pojištění</td><td class="num">' + kc(o.soc) + '</td><td class="num">0 Kč</td></tr>';
    html += '<tr><td>Zdravotní pojištění</td><td class="num">' + kc(o.zdr) + '</td><td class="num">' + kc(obzpY) + (obzp ? ' (OBZP)' : '') + '</td></tr>';
    html += '<tr class="winner"><td>Zůstane ti</td><td class="num">' + kc(oNet) + '</td><td class="num">' + kc(sNet) + '</td></tr>';
    html += '<tr><td>Efektivní zatížení zisku</td><td class="num">' + (100 * (Z - oNet) / Z).toFixed(1) + ' %</td><td class="num">' + (100 * (Z - sNet) / Z).toFixed(1) + ' %</td></tr>';
    html += '</tbody></table></div>';
    html += '<ul class="muted" style="font-size:.86rem;margin:10px 0 0">'
      + '<li>U s.r.o. z dividendy neplatíš důchodové pojištění: nižší budoucí důchod a žádná nemocenská. V praxi se často kombinuje mzda jednatele a dividenda.</li>'
      + '<li>Dividendu lze vyplatit až po schválení účetní závěrky a testu insolvence. Peníze necháné ve firmě se zdaní jen 21 %.</li>'
      + '<li>OSVČ počítá se slevou na poplatníka a bez dětí; s dětmi by OSVČ vyšla lépe.</li>'
      + '<li>Ručení, prestiž, prodej firmy a více společníků jsou další důvody pro s.r.o., které kalkulačka nezohledňuje.</li>'
      + '</ul>';
    out.innerHTML = html;
  }

  // ---------- Kalkulačka 4: Mzda ----------
  function calcMzda() {
    const rok = $('m-rok').value, p = Y[rok];
    const H = num('m-hruba');
    const deti = parseInt($('m-deti').value, 10) || 0;
    const prohl = $('m-prohl').checked;
    const student = $('m-student').checked;
    const out = $('m-result');
    if (H <= 0) { out.innerHTML = '<p class="na">Zadej hrubou mzdu.</p>'; return; }

    const socE = ceil(0.071 * H), zdrE = ceil(0.045 * H);
    const base = H > 100 ? ceil(H / 100) * 100 : H;
    let zal = ceil(0.15 * min(base, p.thrMonth) + 0.23 * max(0, base - p.thrMonth));
    let bonus = 0;
    if (prohl) {
      const slevy = p.sleva / 12 + (student ? p.studentSleva / 12 : 0);
      zal = max(0, zal - slevy);
      zal = zal - kidsCredit(deti, KIDS_MONTH);
      if (zal < 0) {
        if (H >= p.minWage / 2 && -zal >= 50) bonus = -zal;
        zal = 0;
      }
    }
    const net = H - socE - zdrE - zal + bonus;
    const socR = ceil(0.248 * H), zdrR = ceil(0.09 * H);
    const cost = H + socR + zdrR;

    let html = '<div class="best">Čistá mzda ' + kc(net) + ' · firmu stojí ' + kc(cost) + ' měsíčně (' + kc(cost * 12) + ' ročně)</div>';
    html += '<div class="cols" style="margin:8px 0 0"><div class="col"><h4>Zaměstnanec</h4><div class="table-wrap" style="margin:0"><table><tbody>'
      + '<tr><td>Hrubá mzda</td><td class="num">' + kc(H) + '</td></tr>'
      + '<tr><td>Sociální 7,1 %</td><td class="num">−' + kc(socE) + '</td></tr>'
      + '<tr><td>Zdravotní 4,5 %</td><td class="num">−' + kc(zdrE) + '</td></tr>'
      + '<tr><td>Záloha na daň' + (prohl ? ' (po slevách)' : ' (bez slev)') + '</td><td class="num">−' + kc(zal) + '</td></tr>'
      + (bonus ? '<tr><td>Daňový bonus</td><td class="num">+' + kc(bonus) + '</td></tr>' : '')
      + '<tr class="winner"><td>Čistá mzda</td><td class="num">' + kc(net) + '</td></tr>'
      + '</tbody></table></div></div>'
      + '<div class="col"><h4>Zaměstnavatel</h4><div class="table-wrap" style="margin:0"><table><tbody>'
      + '<tr><td>Hrubá mzda</td><td class="num">' + kc(H) + '</td></tr>'
      + '<tr><td>Sociální 24,8 %</td><td class="num">+' + kc(socR) + '</td></tr>'
      + '<tr><td>Zdravotní 9 %</td><td class="num">+' + kc(zdrR) + '</td></tr>'
      + '<tr class="winner"><td>Celkový náklad</td><td class="num">' + kc(cost) + '</td></tr>'
      + '</tbody></table></div></div></div>';
    const notes = [];
    if (H < p.minWage) notes.push('Mzda je pod minimální mzdou ' + kc(p.minWage) + ' (u plného úvazku nelze). U zkráceného úvazku pozor na doplatek zdravotního pojištění do minimálního základu.');
    if (student && rok === '2026') notes.push('Sleva na studenta v roce 2026 neplatí, vrací se od ledna 2027.');
    if (!prohl) notes.push('Bez prohlášení se neuplatní sleva na poplatníka. Přeplatek si můžeš vrátit v přiznání.');
    notes.push('Zjednodušeno: bez stravenek, benefitů a srážek. Nad ' + kc(p.thrMonth) + ' měsíčně se uplatní 23% sazba.');
    html += '<ul class="muted" style="font-size:.86rem;margin:10px 0 0">' + notes.map((n) => '<li>' + n + '</li>').join('') + '</ul>';
    out.innerHTML = html;
  }

  function bind(ids, fn) {
    ids.forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('input', fn);
      el.addEventListener('change', fn);
    });
    fn();
  }
  bind(['o-rok', 'o-prijmy', 'o-pausal', 'o-typ', 'o-skutecne', 'o-deti', 'o-dph'], calcOSVC);
  bind(['d-vc', 'd-sk', 'd-metoda', 'd-rok', 'd-auto'], calcOdpisy);
  bind(['s-rok', 's-zisk', 's-ucetni', 's-obzp'], calcSRO);
  bind(['m-rok', 'm-hruba', 'm-deti', 'm-prohl', 'm-student'], calcMzda);

  // ---------- Vyhledávání ----------
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const search = $('search');
  const sections = Array.from(document.querySelectorAll('main section.block'));
  const hero = $('hero');
  const noRes = $('noResults');
  const count = $('searchCount');
  const index = [];
  sections.forEach((sec) => {
    const title = norm((sec.querySelector('h2') || {}).textContent || '');
    sec.querySelectorAll('.item').forEach((it) => {
      index.push({ el: it, sec, text: norm(it.textContent + ' ' + (it.dataset.keywords || '') + ' ' + title) });
    });
  });
  let timer;
  function runSearch() {
    const q = norm(search.value.trim());
    if (q.length < 2) {
      index.forEach((x) => {
        x.el.classList.remove('hidden-by-search');
        if (x.el.dataset.openedBySearch) { x.el.open = false; delete x.el.dataset.openedBySearch; }
      });
      sections.forEach((s) => s.classList.remove('hidden-by-search'));
      hero.classList.remove('hidden-by-search');
      noRes.style.display = 'none';
      count.textContent = '';
      return;
    }
    const terms = q.split(/\s+/);
    let hits = 0;
    const visibleSec = new Set();
    index.forEach((x) => {
      const ok = terms.every((t) => x.text.includes(t));
      x.el.classList.toggle('hidden-by-search', !ok);
      if (ok) {
        hits++;
        visibleSec.add(x.sec);
        if (x.el.tagName === 'DETAILS' && !x.el.open) { x.el.open = true; x.el.dataset.openedBySearch = '1'; }
      } else if (x.el.dataset.openedBySearch) {
        x.el.open = false; delete x.el.dataset.openedBySearch;
      }
    });
    sections.forEach((s) => s.classList.toggle('hidden-by-search', !visibleSec.has(s)));
    hero.classList.add('hidden-by-search');
    noRes.style.display = hits ? 'none' : 'block';
    count.textContent = hits ? hits + ' výsledků' : '';
  }
  search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(runSearch, 120); });
  search.addEventListener('keydown', (e) => { if (e.key === 'Escape') { search.value = ''; runSearch(); } });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== search && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault(); search.focus();
    }
  });

  // ---------- Navigace ----------
  const links = Array.from(document.querySelectorAll('#toc a'));
  const byId = {};
  links.forEach((a) => { byId[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting && byId[en.target.id]) {
          links.forEach((l) => l.classList.remove('active'));
          byId[en.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    sections.forEach((s) => io.observe(s));
  }
  const sidebar = $('sidebar');
  $('menuBtn').addEventListener('click', () => sidebar.classList.toggle('open'));
  links.forEach((a) => a.addEventListener('click', () => {
    sidebar.classList.remove('open');
    if (search.value) { search.value = ''; runSearch(); }
  }));
  document.querySelectorAll('a.chip, .hero a[href^="#"]').forEach((a) => a.addEventListener('click', () => {
    if (search.value) { search.value = ''; runSearch(); }
  }));
  const toTop = $('toTop');
  window.addEventListener('scroll', () => toTop.classList.toggle('show', window.scrollY > 800), { passive: true });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();
