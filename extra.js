/* Rádce podnikatele – průvodce situacemi, vzory dokumentů, kvíz, vyhledávač odpisových skupin, animace. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bez úložiště */ } }
  };
  function toast(msg) {
    const t = $('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ================= PRŮVODCE SITUACEMI =================
  const SITS = {
    start: { t: 'Začínám podnikat', steps: [
      'Rozhodni se mezi živností a s.r.o. <a href="#formy">Srovnání</a> · <a href="#calc-sro">Kalkulačka</a>',
      'Ohlas živnost přes Jednotný registrační formulář (Portál občana nebo živnostenský úřad). Poplatek 1 000 Kč. Formulář tě přihlásí i na FÚ, ČSSZ a pojišťovnu.',
      'Zkontroluj, že ČSSZ dostala oznámení o zahájení činnosti do 8. dne následujícího měsíce a pojišťovna do 8 dnů.',
      'Zapni si upozornění v datové schránce. Zpráva je doručená nejpozději 10. den, i když ji neotevřeš.',
      'Založ si oddělený podnikatelský účet a fakturační nástroj.',
      'Vyber daňový režim: paušální daň, výdajový paušál, nebo skutečné výdaje. <a href="#calc-osvc">Spočítat</a>',
      'Nastav trvalé příkazy na zálohy (hlavní činnost: sociální 5 281 Kč a zdravotní 3 488 Kč v roce 2027; začínající OSVČ mají nižší sociální minimum).',
      'Rozhodni EET: přijímáš hotovost nebo kartu na místě? Pak evidence od 1. 1. 2027, nebo EET OFF u paušální daně. <a href="#eet">EET 2.0</a>',
      'Zvaž pojištění odpovědnosti z podnikání a dobrovolné nemocenské.',
      'Ulož si termíny do kalendáře. <a href="#kalendar">Kalendář 2027</a>'
    ] },
    student: { t: 'Student / brigádník', steps: [
      'Požádej všechny zaměstnavatele (i z DPP) o Potvrzení o zdanitelných příjmech za rok 2026.',
      'Jen jeden zaměstnavatel s podepsaným prohlášením? Požádej ho o roční zúčtování do 15. 2. 2027 a máš hotovo.',
      'Jinak podej přiznání elektronicky přes Moje daně do 3. 5. 2027. Uplatni slevu na poplatníka 30 840 Kč.',
      'Vyplň číslo účtu. Přeplatek přijde do 30 dnů od konce lhůty. <a href="#student">Příklad výpočtu</a>',
      'Od ledna 2027: podepiš u hlavního zaměstnavatele prohlášení a doložit potvrzení o studiu, abys měl slevu na studenta 335 Kč měsíčně.',
      'Podnikáš? Jsi vedlejší činnost: sociální platíš jen nad 117 521 Kč zisku (2026), zdravotní z poloviny zisku. Podej přehledy.',
      'Po 26. narozeninách nebo po skončení studia nahlas změnu pojišťovně do 8 dnů. Bez práce platíš zdravotní sám.'
    ] },
    nezaplatil: { t: 'Klient mi nezaplatil', steps: [
      'Zkontroluj smlouvu, objednávku a fakturu: splatnost, částka, sjednaná smluvní pokuta.',
      'Den až dva po splatnosti: přátelská připomínka telefonem nebo e-mailem.',
      'Pošli písemnou upomínku s novým termínem. <a href="#dokumenty">Vygenerovat upomínku</a>',
      'Vyčísli úrok z prodlení (repo sazba ČNB + 8 p. b. ročně) a u firem paušál 1 200 Kč.',
      'Prověř dlužníka v insolvenčním rejstříku (isir.justice.cz). Pokud je v insolvenci, přihlas pohledávku včas.',
      'Pošli předžalobní výzvu doporučeně nebo datovkou, nejméně 7 dní před žalobou. <a href="#dokumenty">Vygenerovat výzvu</a>',
      'Podej návrh na (elektronický) platební rozkaz u okresního soudu. Pohlídej si 3letou promlčecí lhůtu.',
      'Plátce DPH: u nedobytné pohledávky můžeš za podmínek § 46 zákona o DPH snížit odvedenou daň.'
    ] },
    zamestnanec: { t: 'Chci přijmout člověka', steps: [
      'Vyber typ: HPP, DPP (max. 300 h/rok) nebo DPČ (max. 20 h týdně). <a href="#zamestnanci">Srovnání</a>',
      'Spočítej, kolik tě bude stát. <a href="#calc-mzda">Kalkulačka mzdy</a>',
      'Zaregistruj se jako zaměstnavatel u ČSSZ do 8 dnů od nástupu prvního zaměstnance a na FÚ k dani ze závislé činnosti.',
      'Sepiš pracovní smlouvu písemně. Zkušební dobu (max. 4 měsíce) sjednej písemně nejpozději v den nástupu.',
      'Do 7 dnů předej písemnou informaci o podmínkách zaměstnání.',
      'Zařiď vstupní lékařskou prohlídku a školení BOZP před nástupem.',
      'Přihlas zaměstnance (JMHZ, pojišťovna do 8 dnů). Nech si podepsat prohlášení k dani.',
      'Nastav evidenci pracovní doby a mzdový software. Mzdu vyplať nejpozději v následujícím měsíci.'
    ] },
    majetek: { t: 'Kupuju auto nebo techniku', steps: [
      'Máš výdajový paušál nebo paušální daň? Pak nákup daně nesníží. Kupuj, jen když věc potřebuješ.',
      'Cena do 80 000 Kč (bez DPH u plátce): rovnou do nákladů v roce pořízení.',
      'Nad 80 000 Kč: zjisti odpisovou skupinu. <a href="#odpisy">Vyhledávač skupin</a>',
      'Porovnej rovnoměrné a zrychlené odpisy. <a href="#calc-odpisy">Odpisová kalkulačka</a>',
      'Auto: rozhodni mezi knihou jízd (skutečné výdaje) a paušálem 5 000 Kč měsíčně. Osobní auto se odpisuje max. z 2 mil. Kč.',
      'Plátce DPH: odečti DPH jen v poměru k podnikání.',
      'Koupíš a zařadíš do 31. 12.? Uplatníš celý roční odpis už letos.',
      'Založ kartu majetku (datum, cena, skupina, způsob) a schovej doklady.'
    ] },
    urad: { t: 'Přišel mi dopis z úřadu', steps: [
      'Zjisti, co přesně to je: výzva k podání, výzva k odstranění pochybností, oznámení o kontrole, nebo platební výměr.',
      'Poznamenej si lhůtu. Běží od doručení (u datovky nejpozději 10. den po dodání).',
      'Nestíháš? Požádej písemně o prodloužení lhůty ještě před jejím koncem.',
      'Připrav doklady a odpověz věcně. Neposílej víc, než se chce.',
      'Jde o kontrolu nebo větší částku? Zvaž daňového poradce jako zástupce.',
      'Nesouhlasíš s rozhodnutím? Odvolání do 30 dnů od doručení.',
      'Nemáš na doplatek? Požádej o splátky nebo posečkání (§ 156 daňového řádu) dřív, než nabíhají úroky. <a href="#kontroly">Více</a>'
    ] },
    dph: { t: 'Blížím se 2 milionům obratu', steps: [
      'Sleduj obrat za kalendářní rok (1. 1. až 31. 12.) každý měsíc.',
      'Překročíš 2 000 000 Kč? Jsi plátcem od 1. 1. příštího roku. Přihlášku podej do 10 pracovních dnů od překročení.',
      'Překročíš 2 536 500 Kč? Plátcem jsi hned následující den.',
      'Paušální daň tím končí. Připrav se na přiznání a přehledy.',
      'Uprav ceny (+21 % nebo 12 % DPH), faktury (DIČ, DUZP, sazba) a fakturační software.',
      'Nastav si měsíční termín 25.: přiznání DPH a kontrolní hlášení.',
      'Zveřejni bankovní účet v registru plátců. <a href="#dph">Vše o DPH</a>'
    ] },
    eshop: { t: 'Prodávám online', steps: [
      'Obchodní podmínky, reklamační řád a poučení o odstoupení do 14 dnů. <a href="#dokumenty">Formulář pro odstoupení</a>',
      'Zásady zpracování osobních údajů a zpracovatelské smlouvy (hosting, e-mailing, účetní).',
      'Cookie lišta: analytika a marketing jen po souhlasu, odmítnutí stejně snadné jako přijetí.',
      'Slevy: uváděj nejnižší cenu za posledních 30 dní. Recenze: napiš, jak je ověřuješ.',
      'Reklamace vyřizuj do 30 dnů a vydávej potvrzení. <a href="#dokumenty">Vzor potvrzení</a>',
      'Prodej do EU nad 10 000 EUR ročně: DPH státu zákazníka přes OSS.',
      'Platíš reklamu Google nebo Meta? Jako neplátce jsi identifikovaná osoba a musíš se registrovat.',
      'EET: platební brána a převod ne, platba při osobním odběru ano.'
    ] },
    sro: { t: 'Zvažuju s.r.o.', steps: [
      'Spočítej, jestli se to vyplatí. <a href="#calc-sro">OSVČ vs. s.r.o.</a>',
      'Promysli společníky, podíly, jednatele a základní kapitál.',
      'Notářský zápis, živnost pro firmu, zápis do obchodního rejstříku.',
      'Zapiš skutečné majitele a registruj firmu k dani do 15 dnů od vzniku.',
      'Domluv si účetní (podvojné účetnictví je povinné).',
      'Sepiš smlouvu o výkonu funkce jednatele a nech ji schválit valnou hromadou (jinak je funkce bezplatná).',
      'Převeď zakázky a smlouvy na firmu. Rozhodni, jestli živnost přerušíš nebo zrušíš.'
    ] },
    konec: { t: 'Končím s podnikáním', steps: [
      'Ukonči nebo přeruš živnost na živnostenském úřadě (JRF oznámí i ČSSZ a pojišťovně).',
      'Paušální daň: odhlas se. Plátce DPH: požádej o zrušení registrace a vyrovnej odpočty.',
      'Daňová evidence: v přiznání za rok ukončení uprav základ o nezaplacené pohledávky, závazky a zásoby (§ 23 odst. 8 ZDP).',
      'Podej přiznání a přehledy za rok ukončení.',
      'Nemáš jiný příjem ani státní pojištění? Plať zdravotní pojištění jako OBZP.',
      'Doklady archivuj (DPH 10 let, ostatní podle lhůt). <a href="#faktury">Archivace</a>'
    ] }
  };
  const sitWrap = $('situations');
  const plan = $('plan');
  function renderPlan(key) {
    const d = SITS[key]; if (!d) return;
    const done = store.get('plan-' + key, []);
    let h = '<div class="plan"><h3>' + esc(d.t) + ': tvůj plán</h3><div class="meter"><i id="plan-meter"></i></div><ul class="todo">';
    d.steps.forEach((s, i) => {
      const on = done.includes(i);
      h += '<li class="' + (on ? 'done' : '') + '"><input type="checkbox" data-i="' + i + '"' + (on ? ' checked' : '') + ' aria-label="Hotovo"><span>' + s + '</span></li>';
    });
    h += '</ul><div class="btn-row"><button class="btn ghost" type="button" id="plan-reset">↺ Začít znovu</button><button class="btn ghost" type="button" id="plan-print">🖨️ Vytisknout plán</button></div></div>';
    plan.innerHTML = h;
    const upd = () => {
      const boxes = plan.querySelectorAll('.todo input');
      const sel = []; boxes.forEach((b) => { if (b.checked) sel.push(+b.dataset.i); b.parentElement.classList.toggle('done', b.checked); });
      store.set('plan-' + key, sel);
      $('plan-meter').style.width = (100 * sel.length / boxes.length) + '%';
      if (sel.length === boxes.length) toast('🎉 Hotovo! Všechno odškrtnuto.');
    };
    plan.querySelectorAll('.todo input').forEach((b) => b.addEventListener('change', upd));
    $('plan-meter').style.width = (100 * done.length / d.steps.length) + '%';
    $('plan-reset').addEventListener('click', () => { store.set('plan-' + key, []); renderPlan(key); });
    $('plan-print').addEventListener('click', () => printText(d.t + ' – plán\n\n' + d.steps.map((s, i) => (i + 1) + '. ' + s.replace(/<[^>]+>/g, '')).join('\n')));
  }
  if (sitWrap) {
    sitWrap.addEventListener('click', (e) => {
      const b = e.target.closest('.sit'); if (!b) return;
      sitWrap.querySelectorAll('.sit').forEach((x) => x.classList.toggle('on', x === b));
      renderPlan(b.dataset.sit);
      store.set('plan-last', b.dataset.sit);
      plan.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    const last = store.get('plan-last', null);
    if (last && SITS[last]) { sitWrap.querySelector('[data-sit="' + last + '"]').classList.add('on'); renderPlan(last); }
  }

  // ================= TISK / KOPÍROVÁNÍ =================
  function printText(text) {
    const area = document.createElement('div');
    area.className = 'print-area'; area.textContent = text;
    document.body.appendChild(area); document.body.classList.add('print-doc');
    const done = () => { document.body.classList.remove('print-doc'); area.remove(); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
    setTimeout(done, 1500);
  }
  function copyText(text) {
    const fallback = () => {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('📋 Zkopírováno'); } catch (e) { toast('Kopírování se nepovedlo'); }
      ta.remove();
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => toast('📋 Zkopírováno'), fallback);
    else fallback();
  }

  // ================= GENERÁTOR DOKUMENTŮ =================
  const today = new Date();
  const dnes = today.getDate() + '. ' + (today.getMonth() + 1) + '. ' + today.getFullYear();
  const F = {
    ja: ['ja', 'Tvoje jméno / firma', 'text', 'Jan Novák'],
    jaIco: ['jaIco', 'Tvoje IČO', 'text', '12345678'],
    jaAdr: ['jaAdr', 'Tvoje adresa / sídlo', 'text', 'Hlavní 1, 110 00 Praha 1'],
    on: ['on', 'Druhá strana (jméno / firma)', 'text', 'ABC s.r.o.'],
    onIco: ['onIco', 'IČO druhé strany', 'text', '87654321'],
    onAdr: ['onAdr', 'Adresa druhé strany', 'text', 'Dlouhá 5, 602 00 Brno'],
    misto: ['misto', 'Místo podpisu', 'text', 'Praha'],
    datum: ['datum', 'Datum', 'text', dnes]
  };
  const T = {
    upominka: {
      fields: [F.ja, F.jaIco, F.jaAdr, F.on, F.onIco, F.onAdr,
        ['fa', 'Číslo faktury', 'text', '2026015'], ['fadat', 'Datum splatnosti faktury', 'text', '31. 10. 2026'],
        ['castka', 'Dlužná částka (Kč)', 'text', '25 000'], ['ucet', 'Číslo účtu', 'text', '123456789/0100'],
        ['lhuta', 'Nová lhůta k úhradě (dní)', 'number', '7'], F.misto, F.datum],
      note: 'Upomínku pošli e-mailem i písemně. Nic tím neztrácíš a máš důkaz.',
      build: (v) => `${v.ja}, IČO ${v.jaIco}
${v.jaAdr}

${v.on}, IČO ${v.onIco}
${v.onAdr}

${v.misto}, ${v.datum}

UPOMÍNKA – žádost o úhradu faktury č. ${v.fa}

Vážení,

dovoluji si Vás upozornit, že faktura č. ${v.fa} na částku ${v.castka} Kč byla splatná dne ${v.fadat} a dosud nebyla uhrazena.

Prosím o úhradu dlužné částky do ${v.lhuta} dnů od doručení této upomínky na účet č. ${v.ucet}, variabilní symbol ${v.fa}.

Upozorňuji, že od prvního dne prodlení mi náleží zákonný úrok z prodlení podle nařízení vlády č. 351/2013 Sb. Pokud jste platbu mezitím odeslali, považujte prosím tuto upomínku za bezpředmětnou.

Děkuji a jsem s pozdravem

…………………………
${v.ja}`
    },
    vyzva: {
      fields: [F.ja, F.jaIco, F.jaAdr, F.on, F.onIco, F.onAdr,
        ['fa', 'Číslo faktury / smlouvy', 'text', '2026015'], ['fadat', 'Datum splatnosti', 'text', '31. 10. 2026'],
        ['castka', 'Jistina (Kč)', 'text', '25 000'], ['ucet', 'Číslo účtu', 'text', '123456789/0100'],
        ['lhuta', 'Lhůta k úhradě (dní, min. 7)', 'number', '7'],
        ['b2b', 'Dlužník je podnikatel (paušál 1 200 Kč)', 'checkbox', true], F.misto, F.datum],
      note: 'Pošli doporučeně na adresu sídla nebo bydliště, případně do datové schránky. Výzva musí odejít nejméně 7 dní před podáním žaloby, jinak ti soud nemusí přiznat náhradu nákladů řízení (§ 142a OSŘ). Schovej si podací lístek.',
      build: (v) => `${v.ja}, IČO ${v.jaIco}
${v.jaAdr}

Doporučeně / do datové schránky
${v.on}, IČO ${v.onIco}
${v.onAdr}

${v.misto}, ${v.datum}

PŘEDŽALOBNÍ VÝZVA k zaplacení dluhu podle § 142a zákona č. 99/1963 Sb., občanský soudní řád

Vážení,

evidujeme za Vámi pohledávku z faktury / smlouvy č. ${v.fa}, splatnou dne ${v.fadat}, ve výši ${v.castka} Kč, která do dnešního dne nebyla uhrazena.

Tímto Vás vyzýváme k úhradě:
1) jistiny ve výši ${v.castka} Kč,
2) zákonného úroku z prodlení ve výši stanovené nařízením vlády č. 351/2013 Sb. z dlužné částky od prvního dne prodlení do zaplacení,${Number(String(v.lhuta).replace(/\D/g, '')) < 7 ? '\n[POZOR: lhůta musí být nejméně 7 dní]' : ''}${v.b2b ? '\n3) nákladů spojených s uplatněním pohledávky ve výši 1 200 Kč podle § 3 nařízení vlády č. 351/2013 Sb.,' : ''}

a to nejpozději do ${v.lhuta} dnů od doručení této výzvy na účet č. ${v.ucet}, variabilní symbol ${v.fa}.

Pokud dlužnou částku v uvedené lhůtě neuhradíte, podáme bez dalšího upozornění žalobu (návrh na vydání platebního rozkazu) u příslušného soudu. Tím Vám vzniknou další náklady, zejména soudní poplatek a náklady právního zastoupení, a následně případně náklady exekuce.

S pozdravem

…………………………
${v.ja}`
    },
    plnamoc: {
      fields: [['ja', 'Zmocnitel (kdo plnou moc dává)', 'text', 'Jan Novák'], ['jaNar', 'Datum narození / IČO zmocnitele', 'text', '1. 1. 1990'], F.jaAdr,
        ['on', 'Zmocněnec (kdo bude jednat)', 'text', 'Petra Svobodová'], ['onNar', 'Datum narození zmocněnce', 'text', '2. 2. 1992'], F.onAdr,
        ['rozsah', 'K čemu (rozsah)', 'textarea', 'k převzetí zásilek a k zastupování ve věci podání žádosti na živnostenském úřadě'],
        F.misto, F.datum],
      note: 'Pro finanční úřad existuje samostatný formulář plné moci (na webu Finanční správy). Některé úřady a banky chtějí úředně ověřený podpis.',
      build: (v) => `PLNÁ MOC

Já, níže podepsaný/á
${v.ja}, nar. / IČO: ${v.jaNar}
bytem / se sídlem: ${v.jaAdr}
(dále jen „zmocnitel“)

zmocňuji tímto

${v.on}, nar.: ${v.onNar}
bytem: ${v.onAdr}
(dále jen „zmocněnec“)

aby mě zastupoval/a a jednal/a mým jménem ${v.rozsah}.

Zmocněnec je oprávněn činit veškeré úkony a přijímat písemnosti, které s touto věcí souvisejí.

${v.misto}, ${v.datum}

…………………………
${v.ja}, zmocnitel

Plnou moc přijímám.

…………………………
${v.on}, zmocněnec`
    },
    najem: {
      fields: [['ja', 'Nájemce (ty / tvoje firma)', 'text', 'Jan Novák'], F.jaIco, F.jaAdr,
        ['on', 'Pronajímatel', 'text', 'Realitní a.s.'], F.onAdr,
        ['prostor', 'Pronajatý prostor (adresa, popis)', 'text', 'nebytový prostor č. 3, Hlavní 10, Praha'],
        ['smlDat', 'Datum nájemní smlouvy', 'text', '1. 3. 2024'],
        ['typ', 'Typ nájmu', 'select', 'neurcita', [['neurcita', 'Na dobu neurčitou, bez důvodu (6 měsíců)'], ['vazny', 'Na dobu neurčitou, s vážným důvodem (3 měsíce)'], ['urcita', 'Na dobu určitou, s důvodem (3 měsíce)']]],
        ['duvod', 'Důvod výpovědi (u vážného důvodu a doby určité povinně)', 'textarea', ''],
        F.misto, F.datum],
      note: 'Zkontroluj nájemní smlouvu: může upravovat výpovědní důvody, doby i to, odkdy výpovědní doba běží. U nájmu na dobu určitou musí výpověď obsahovat důvod, jinak je neplatná (§ 2310 OZ). Doruč doporučeně nebo proti podpisu.',
      build: (v) => {
        const m = v.typ === 'neurcita' ? 'šestiměsíční' : 'tříměsíční';
        const par = v.typ === 'urcita' ? '§ 2308 a § 2310' : '§ 2312';
        const d = (v.typ !== 'neurcita') ? `\nDůvod výpovědi: ${v.duvod || '[DOPLŇ DŮVOD – bez něj je výpověď neplatná]'}\n` : '';
        return `${v.ja}, IČO ${v.jaIco}
${v.jaAdr}

${v.on}
${v.onAdr}

${v.misto}, ${v.datum}

VÝPOVĚĎ NÁJMU PROSTORU SLOUŽÍCÍHO PODNIKÁNÍ

Vážení,

tímto vypovídám nájem prostoru: ${v.prostor}, sjednaný nájemní smlouvou ze dne ${v.smlDat}, a to podle ${par} zákona č. 89/2012 Sb., občanský zákoník.
${d}
Výpovědní doba je ${m} a běží v souladu s nájemní smlouvou a zákonem. Prostor Vám předám ke dni skončení nájmu; navrhuji sepsat předávací protokol a dohodnout termín předání.

Současně žádám o vrácení jistoty po skončení nájmu a o konečné vyúčtování služeb.

S pozdravem

…………………………
${v.ja}`;
      }
    },
    reklamace: {
      fields: [['ja', 'Prodávající (firma)', 'text', 'Obchod s.r.o.'], F.jaIco, F.jaAdr,
        ['on', 'Zákazník', 'text', 'Eva Malá'], ['kontakt', 'Kontakt na zákazníka', 'text', 'eva@example.cz, 777 123 456'],
        ['zbozi', 'Zboží / služba', 'text', 'Bezdrátová sluchátka XY'], ['koupe', 'Datum koupě', 'text', '15. 9. 2026'],
        ['vada', 'Popis vady', 'textarea', 'levé sluchátko nehraje'],
        ['naroky', 'Požadavek zákazníka', 'select', 'oprava', [['oprava', 'oprava'], ['vymena', 'výměna'], ['sleva', 'přiměřená sleva'], ['odstoupeni', 'odstoupení od smlouvy']]],
        F.datum],
      note: 'Spotřebiteli musíš vydat potvrzení o tom, kdy reklamaci uplatnil, co je jejím obsahem a jaký způsob vyřízení požaduje. Reklamaci vyřiď do 30 dnů (lze prodloužit jen po dohodě).',
      build: (v) => `POTVRZENÍ O PŘIJETÍ REKLAMACE

Prodávající: ${v.ja}, IČO ${v.jaIco}, ${v.jaAdr}
Zákazník: ${v.on}, kontakt: ${v.kontakt}

Reklamované zboží / služba: ${v.zbozi}
Datum koupě: ${v.koupe}
Datum uplatnění reklamace: ${v.datum}
Popis vady: ${v.vada}
Požadovaný způsob vyřízení: ${{ oprava: 'oprava', vymena: 'výměna', sleva: 'přiměřená sleva z ceny', odstoupeni: 'odstoupení od smlouvy' }[v.naroky]}

Reklamaci vyřídíme bez zbytečného odkladu, nejpozději do 30 dnů ode dne jejího uplatnění, pokud se nedohodneme na delší lhůtě. O vyřízení Vás budeme informovat na uvedený kontakt.

Za prodávajícího: …………………………      Zákazník: …………………………`
    },
    odstoupeni: {
      fields: [['ja', 'Název e-shopu / firmy', 'text', 'Obchod s.r.o.'], F.jaIco, F.jaAdr, ['mail', 'E-mail pro odstoupení', 'text', 'info@obchod.cz']],
      note: 'Toto je vzorový formulář podle přílohy nařízení vlády č. 363/2013 Sb. Dej ho do obchodních podmínek nebo přilož k zásilce. Zákazník ho použít může, ale nemusí.',
      build: (v) => `Oznámení o odstoupení od smlouvy

(vyplňte tento formulář a pošlete jej zpět pouze v případě, že chcete odstoupit od smlouvy)

Adresát: ${v.ja}, IČO ${v.jaIco}, ${v.jaAdr}, e-mail: ${v.mail}

Oznamuji/oznamujeme (*), že tímto odstupuji/odstupujeme (*) od smlouvy o nákupu tohoto zboží (*) / o poskytnutí těchto služeb (*):

……………………………………………………………………

Datum objednání (*) / datum obdržení (*): ……………………

Jméno a příjmení spotřebitele/spotřebitelů: ……………………

Adresa spotřebitele/spotřebitelů: ……………………

Podpis spotřebitele/spotřebitelů (pouze pokud je tento formulář zasílán v listinné podobě): ……………………

Datum: ……………………

(*) Nehodící se škrtněte nebo údaje doplňte.`
    },
    predani: {
      fields: [['ja', 'Zhotovitel', 'text', 'Jan Novák – truhlářství'], F.jaIco, ['on', 'Objednatel', 'text', 'Petr Dvořák'],
        ['dilo', 'Předávané dílo', 'text', 'kuchyňská linka dle nabídky č. 12/2026'], ['smlouva', 'Smlouva / objednávka ze dne', 'text', '1. 9. 2026'],
        ['misto2', 'Místo předání', 'text', 'Lipová 8, Olomouc'],
        ['vysledek', 'Výsledek', 'select', 'bez', [['bez', 'převzato bez výhrad'], ['s', 'převzato s výhradami (drobné vady)'], ['ne', 'nepřevzato']]],
        ['vady', 'Zjištěné vady a termín odstranění', 'textarea', ''], F.datum],
      note: 'Předávací protokol je důležitý důkaz: od převzetí obvykle běží splatnost ceny i záruka. Vady sepiš konkrétně a s termínem odstranění, ideálně přilož fotky.',
      build: (v) => `PROTOKOL O PŘEDÁNÍ A PŘEVZETÍ DÍLA

Zhotovitel: ${v.ja}, IČO ${v.jaIco}
Objednatel: ${v.on}
Dílo: ${v.dilo}
Podle smlouvy / objednávky ze dne: ${v.smlouva}
Místo a datum předání: ${v.misto2}, ${v.datum}

Výsledek předání: ${{ bez: 'Dílo bylo předáno a objednatelem převzato bez výhrad.', s: 'Dílo bylo předáno a objednatelem převzato s níže uvedenými výhradami.', ne: 'Objednatel dílo nepřevzal z níže uvedených důvodů.' }[v.vysledek]}

Zjištěné vady / nedodělky a termín odstranění:
${v.vady || '—'}

Za zhotovitele: …………………………      Za objednatele: …………………………`
    }
  };
  const gTyp = $('g-typ'), gFields = $('g-fields'), gOut = $('g-out'), gNote = $('g-note');
  const gSaved = store.get('gen-values', {});
  function genRender() {
    const t = T[gTyp.value];
    gFields.innerHTML = t.fields.map(([id, label, type, def, opts]) => {
      const val = gSaved[id] !== undefined ? gSaved[id] : def;
      const fid = 'gf-' + id;
      if (type === 'checkbox') return '<div class="field"><label class="check"><input type="checkbox" id="' + fid + '" data-k="' + id + '"' + (val ? ' checked' : '') + '> ' + esc(label) + '</label></div>';
      if (type === 'textarea') return '<div class="field" style="grid-column:1/-1"><label for="' + fid + '">' + esc(label) + '</label><textarea id="' + fid + '" data-k="' + id + '">' + esc(val) + '</textarea></div>';
      if (type === 'select') return '<div class="field"><label for="' + fid + '">' + esc(label) + '</label><select id="' + fid + '" data-k="' + id + '">' + opts.map(([v, l]) => '<option value="' + v + '"' + (v === val ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select></div>';
      return '<div class="field"><label for="' + fid + '">' + esc(label) + '</label><input type="' + type + '" id="' + fid + '" data-k="' + id + '" value="' + esc(val) + '"></div>';
    }).join('');
    gNote.innerHTML = '<div class="warn">' + esc(t.note) + '</div>';
    gFields.querySelectorAll('[data-k]').forEach((el) => { el.addEventListener('input', genBuild); el.addEventListener('change', genBuild); });
    genBuild();
  }
  function genValues() {
    const v = {};
    gFields.querySelectorAll('[data-k]').forEach((el) => {
      v[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value;
      if (el.dataset.k !== 'datum') gSaved[el.dataset.k] = v[el.dataset.k];
    });
    store.set('gen-values', gSaved);
    return v;
  }
  function genBuild() { gOut.textContent = T[gTyp.value].build(genValues()); }
  if (gTyp) {
    gTyp.addEventListener('change', genRender);
    genRender();
    $('g-copy').addEventListener('click', () => copyText(gOut.textContent));
    $('g-print').addEventListener('click', () => printText(gOut.textContent));
    $('g-dl').addEventListener('click', () => {
      const blob = new Blob(['﻿' + gOut.textContent], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = gTyp.value + '.txt';
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    });
  }

  // ================= VYHLEDÁVAČ ODPISOVÝCH SKUPIN =================
  const ITEMS = [
    ['Notebook, počítač, server, monitor', '1 · 3 roky'], ['Tiskárna, kopírka, kancelářský stroj', '1 · 3 roky'],
    ['Elektrické ruční nářadí (vrtačka, pila)', '1 · 3 roky'], ['Osobní auto (max. ze 2 mil. Kč)', '2 · 5 let'],
    ['Dodávka, nákladní auto', '2 · 5 let'], ['Motocykl', '2 · 5 let'], ['Traktor, zemědělský stroj', '2 · 5 let'],
    ['Kancelářský nábytek', '2 · 5 let'], ['Obráběcí a dřevoobráběcí stroje', '2 · 5 let'], ['Klimatizační jednotka', '2 · 5 let (ověř)'],
    ['Výtah', '3 · 10 let'], ['Kotel, ústřední topení', '3 · 10 let'], ['Trezor', '3 · 10 let'],
    ['Fotovoltaická elektrárna', '4 · 20 let'], ['Potrubí, přípojky, rozvody', '4 · 20 let'],
    ['Rodinný dům, bytový dům, výrobní hala, garáž', '5 · 30 let'], ['Byt nebo nebytová jednotka', '5 · 30 let'],
    ['Administrativní budova, hotel, obchodní dům', '6 · 50 let'],
    ['Cokoli do 80 000 Kč (telefon, notebook, nábytek)', 'rovnou náklad'],
    ['Software, web, licence', 'neodpisuje se daňově'], ['Pozemek', 'neodpisuje se']
  ];
  const lkQ = $('lk-q'), lkL = $('lk-list');
  const nrm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function lkRender() {
    const q = nrm((lkQ && lkQ.value) || '');
    const hits = ITEMS.filter(([n]) => !q || nrm(n).includes(q));
    lkL.innerHTML = hits.length ? hits.map(([n, g]) => '<div class="lk"><span>' + esc(n) + '</span><b>' + esc(g) + '</b></div>').join('') : '<p class="muted">Nenašel jsem. Zkus obecnější slovo, nebo hledej podle kódu CZ-CPA v příloze č. 1 ZDP.</p>';
  }
  if (lkL) { lkQ.addEventListener('input', lkRender); lkRender(); }

  // ================= KVÍZ =================
  const Q = [
    ['Od jakého obratu se povinně stáváš plátcem DPH?', ['1 000 000 Kč za posledních 12 měsíců', '2 000 000 Kč za kalendářní rok', '2 500 000 Kč za posledních 12 měsíců', 'Jen když se sám rozhodnu'], 1, 'Od roku 2025 se sleduje kalendářní rok. Nad 2 mil. Kč jsi plátcem od 1. 1. dalšího roku, nad 2 536 500 Kč hned.'],
    ['Koupíš notebook za 45 000 Kč a vedeš skutečné výdaje. Co s ním?', ['Odpisuju 3 roky', 'Dám ho celý do nákladů hned', 'Do nákladů nejde vůbec', 'Odpisuju 5 let'], 1, 'Hmotný majetek do 80 000 Kč nemusíš odpisovat, jde celý do nákladů v roce pořízení.'],
    ['Co z toho je daňově uznatelný výdaj?', ['Láhev vína pro klienta', 'Večeře s obchodním partnerem', 'Reklamní hrnek s logem za 150 Kč', 'Dárkový koš k Vánocům'], 2, 'Pohoštění a dárky jsou reprezentace (§ 25 ZDP). Výjimka: reklamní předměty s logem do 500 Kč bez DPH.'],
    ['Kolik je sleva na studenta za rok 2026?', ['4 020 Kč', '0 Kč, je zrušená', '30 840 Kč', '2 000 Kč'], 1, 'Sleva na studenta byla zrušena od roku 2024 a vrací se až od 1. 1. 2027 (4 020 Kč ročně).'],
    ['Jaká je nejdelší splatnost faktury mezi firmami bez zvláštního zdůvodnění?', ['14 dní', '30 dní', '60 dní', 'Neomezená'], 2, 'Delší splatnost než 60 dní platí jen tehdy, pokud není vůči věřiteli hrubě nespravedlivá (§ 1963 OZ).'],
    ['Kolik dní předem musí dlužník dostat předžalobní výzvu?', ['Žádnou nemusí', 'Aspoň 3 dny', 'Aspoň 7 dní', 'Aspoň 30 dní'], 2, 'Bez výzvy alespoň 7 dní před žalobou ti soud nemusí přiznat náhradu nákladů řízení (§ 142a OSŘ).'],
    ['Jak dlouhá může být zkušební doba běžného zaměstnance?', ['Max. 3 měsíce', 'Max. 4 měsíce', 'Max. 6 měsíců', 'Max. 12 měsíců'], 1, 'Od 1. 6. 2025 až 4 měsíce (u vedoucích 8), nejvýš polovina sjednané doby pracovního poměru.'],
    ['Zaměstnanec ti doručí výpověď 10. března. Kdy začne běžet výpovědní doba?', ['1. dubna', '10. března', '1. března', 'Až po schválení'], 1, 'Od flexinovely běží výpovědní doba ode dne doručení výpovědi (dřív od 1. dne dalšího měsíce).'],
    ['Do kdy se musíš přihlásit k paušální dani na rok 2027?', ['31. 12. 2026', '11. 1. 2027', '1. 4. 2027', 'Kdykoli během roku'], 1, 'Termín je 10. ledna, ten v roce 2027 vychází na neděli, proto 11. 1. 2027. Pozdní oznámení je neúčinné.'],
    ['Jsi paušalista bez EET OFF. Zákazník u tebe zaplatí kartou na místě. Evidovat od 2027?', ['Ne, karta se neeviduje', 'Ano, je to kontaktní platba', 'Jen nad 10 000 Kč', 'Jen plátci DPH'], 1, 'EET 2.0 eviduje všechny kontaktní platby: hotovost, kartu na místě, QR u pultu. Převody a platební brány e-shopu ne.']
  ];
  const quiz = $('quiz');
  let qi = 0, score = 0;
  function quizRender() {
    if (qi >= Q.length) {
      const msg = score >= 9 ? '🏆 Jsi daňový ninja!' : score >= 6 ? '👏 Slušná práce, pár věcí si ještě projdi.' : '📚 Stojí za to projít průvodce. Hodně peněz se dá ušetřit.';
      quiz.innerHTML = '<div class="quiz-q">Máš ' + score + ' z ' + Q.length + ' bodů</div><p style="font-size:1.2rem">' + msg + '</p><button class="btn" type="button" id="q-again">🔄 Znovu</button>';
      $('q-again').addEventListener('click', () => { qi = 0; score = 0; quizRender(); });
      if (score >= 9) toast('🎉 Výborně!');
      return;
    }
    const [q, opts, right, ex] = Q[qi];
    quiz.innerHTML = '<div class="quiz-score">Otázka ' + (qi + 1) + ' / ' + Q.length + ' · body: ' + score + '</div><div class="meter"><i style="width:' + (100 * qi / Q.length) + '%"></i></div><div class="quiz-q">' + esc(q) + '</div><div class="quiz-opts">' +
      opts.map((o, i) => '<button type="button" data-i="' + i + '">' + esc(o) + '</button>').join('') + '</div><div class="quiz-ex" id="q-ex"></div>';
    quiz.querySelectorAll('.quiz-opts button').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      quiz.querySelectorAll('.quiz-opts button').forEach((x) => { x.disabled = true; if (+x.dataset.i === right) x.classList.add('right'); });
      if (i === right) score++; else b.classList.add('wrong');
      const exEl = $('q-ex');
      exEl.innerHTML = (i === right ? '✅ <strong>Správně!</strong> ' : '❌ <strong>Vedle.</strong> ') + esc(ex) + '<div class="btn-row"><button class="btn" type="button" id="q-next">' + (qi + 1 < Q.length ? 'Další otázka →' : 'Výsledek 🏁') + '</button></div>';
      exEl.style.display = 'block';
      $('q-next').addEventListener('click', () => { qi++; quizRender(); });
    }));
  }
  if (quiz) quizRender();

  // ================= ANIMACE A PRŮBĚH =================
  const prog = $('progress');
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
    if (prog) prog.style.width = (100 * p) + '%';
  }, { passive: true });
  if ('IntersectionObserver' in window) {
    const els = document.querySelectorAll('main section.block');
    const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el, i) => { if (i > 0) { el.classList.add('reveal'); io.observe(el); } });
  }
})();
