/* script.js — Version-A
   - Loads data/surah_101.json
   - Renders ayaat (one-line Arabic)
   - Global translation toggles (Osmani / Tawzih)
   - Full Grammar modal (fullscreen, scrollable)
   - Word modal (details, auto-generate helper)
*/

// ---------- state ----------
let surahData = null;
let showOsmani = true;
let showTawzih = true;

// ---------- helper DOM refs ----------
const wrap = () => document.getElementById('surahWrap');
const grammarModal = () => document.getElementById('grammarModal');
const grammarBody = () => document.getElementById('grammarBody');
const grammarTitle = () => document.getElementById('grammarTitle');

const wordModal = () => document.getElementById('wordModal');
const wordAr = () => document.getElementById('wordAr');
const wordBn = () => document.getElementById('wordBn');
const morphBadges = () => document.getElementById('morphBadges');
const formsGrid = () => document.getElementById('formsGrid');
const gramMap = () => document.getElementById('gramMap');

// ---------- fetch data ----------
fetch('data/surah_101.json')
  .then(r => {
    if(!r.ok) throw new Error('Failed to fetch JSON: ' + r.status);
    return r.json();
  })
  .then(data => {
    surahData = data;
    // attach UI toolbar (translation toggles + settings)
    renderToolbar();
    renderSurah();
  })
  .catch(err => {
    console.error(err);
    if (wrap()) wrap().innerHTML = '<div style="color:salmon;padding:24px">JSON লোড সমস্যা — কনসোলে দেখুন।</div>';
  });


// ---------- toolbar (global translation toggles) ----------
function renderToolbar(){
  // create container above surahWrap
  const container = document.createElement('div');
  container.className = 'toolbar';
  container.innerHTML = `
    <div class="toolbar-left">
      <label><input id="chkOsmani" type="checkbox" checked> Osmani অনুবাদ</label>
      <label><input id="chkTawzih" type="checkbox" checked> Tawzih অনুবাদ</label>
    </div>
    <div class="toolbar-right">
      <button id="btnAutoGenAll" class="small-btn">Auto-generate morphology (quick)</button>
    </div>
  `;
  // insert before surahWrap
  const parent = document.body;
  parent.insertBefore(container, wrap());

  document.getElementById('chkOsmani').addEventListener('change', (e)=>{
    showOsmani = e.target.checked;
    renderSurah(); // rerender to show/hide translations
  });
  document.getElementById('chkTawzih').addEventListener('change', (e)=>{
    showTawzih = e.target.checked;
    renderSurah();
  });

  document.getElementById('btnAutoGenAll').addEventListener('click', ()=>{
    if(!surahData) return alert('No data loaded');
    // run simple auto-generation for missing word fields
    surahData.ayahs.forEach(a=>{
      a.words.forEach(w=>{
        autoGenerateWordFields(w);
      });
    });
    alert('Auto-generation applied (basic heuristics). Tap words to see updated fields.');
  });
}


// ---------- render surah ----------
function renderSurah(){
  const container = wrap();
  if(!container) return;
  container.innerHTML = '';

  // show surah heading (with number & name)
  const header = document.createElement('div');
  header.className = 'surah-header';
  header.innerHTML = `<h1>সূরা ${surahData.number} — ${surahData.name_bn || surahData.name || ''}</h1>
    <div class="meta">আয়াত: ${surahData.ayah_count || (surahData.ayahs && surahData.ayahs.length) || '?'}</div>`;
  container.appendChild(header);

  // for each ayah
  (surahData.ayahs || []).forEach(ayah=>{
    const card = document.createElement('div');
    card.className = 'ayah';

    // ayah number line (user requested show ayah no)
    const ayNo = document.createElement('div');
    ayNo.className = 'ayah-number';
    ayNo.textContent = `আয়াত ${ayah.ayah}`;
    card.appendChild(ayNo);

    // Arabic one-line (join words with spaces) - Version-A desired
    const arabicLine = document.createElement('div');
    arabicLine.className = 'arabic-line';
    // if ayah.text available, use that; else join words
    const arText = ayah.text || (ayah.words || []).map(w=>w.arabic).join(' ');
    arabicLine.textContent = arText;
    card.appendChild(arabicLine);

    // word-by-word inline with bolded words and spacing one-line-break in grammar modal mapping:
    const wordRow = document.createElement('div');
    wordRow.className = 'word-row';
    (ayah.words || []).forEach((w, idx)=>{
      const span = document.createElement('span');
      span.className = 'word';
      span.innerHTML = `<strong>${w.arabic}</strong>`; // bold Arabic word
      span.title = w.bangla || w.meaning || '';
      // attach word object for modal
      span.onclick = (ev)=>{
        ev.stopPropagation();
        showWordModal(w);
      };
      // small gap after each word (visual)
      span.style.marginRight = '8px';
      wordRow.appendChild(span);
    });
    card.appendChild(wordRow);

    // translations (global toggles)
    const tr = document.createElement('div');
    tr.className = 'translations';
    let trHTML = '';
    if(showOsmani && ayah.translation && ayah.translation.osmani){
      trHTML += `<div class="trans-osmani"><strong>Osmani:</strong> ${ayah.translation.osmani}</div>`;
    }
    if(showTawzih && ayah.translation && ayah.translation.tawzih){
      trHTML += `<div class="trans-tawzih"><strong>Tawzih:</strong> ${ayah.translation.tawzih}</div>`;
    }
    tr.innerHTML = trHTML;
    card.appendChild(tr);

    // actions: full grammar button
    const act = document.createElement('div');
    act.className = 'actions';
    const gbtn = document.createElement('button');
    gbtn.className = 'action-btn';
    gbtn.textContent = 'Full Grammar Notes';
    gbtn.onclick = (ev)=>{
      ev.stopPropagation();
      openGrammarModal(ayah);
    };
    act.appendChild(gbtn);
    card.appendChild(act);

    container.appendChild(card);
  });
}


// ---------- Full Grammar Modal ----------
document.getElementById('closeGrammar').addEventListener('click', ()=> grammarModal().style.display = 'none');

function openGrammarModal(ayah){
  grammarTitle().textContent = `সূরা ${surahData.number} — আয়াত ${ayah.ayah} — বিস্তারিত ব্যাকরণ`;
  grammarBody().innerHTML = '';

  // prefer full_grammar_note if present
  if(ayah.full_grammar_note){
    const pre = document.createElement('pre');
    pre.className = 'full-grammar-pre';
    pre.textContent = ayah.full_grammar_note;
    grammarBody().appendChild(pre);
  } else {
    // fallback: build from word grammar fields line-by-line
    const wrapper = document.createElement('div');
    (ayah.words || []).forEach(w=>{
      const block = document.createElement('div');
      block.className = 'grammar-block';
      // show Arabic + bangla meaning on one line
      const line1 = document.createElement('div');
      line1.innerHTML = `<strong>${w.arabic}</strong> ${w.bangla ? '- ' + w.bangla : ''}`;
      block.appendChild(line1);

      // grammar details
      const details = document.createElement('div');
      details.className = 'grammar-details';
      const html = `
        <div>Root: ${w.root || '-'}</div>
        <div>POS: ${w.pos || '-'}</div>
        <div>Form: ${w.form || '-'}</div>
        <div>Past: ${w.tense_forms?.past || w.past || '-'}</div>
        <div>Present: ${w.tense_forms?.present || w.present || '-'}</div>
        <div>Imperative: ${w.tense_forms?.imperative || w.imperative || '-'}</div>
        <div>Subject: ${w.subject || '-'}</div>
        <div>Object: ${w.object || '-'}</div>
        <div>Case: ${w.case || '-'}</div>
        <div>Definite: ${w.definite ? 'হ্যাঁ (ال)' : 'না'}</div>
        <div>Notes: ${w.grammar || w.notes || '-'}</div>
      `;
      details.innerHTML = html;
      block.appendChild(details);
      wrapper.appendChild(block);
    });
    grammarBody().appendChild(wrapper);
  }

  grammarModal().style.display = 'flex';
}


// ---------- Word modal logic ----------
document.getElementById('closeWord').addEventListener('click', ()=> wordModal().style.display = 'none');

function clearNode(n){ while(n.firstChild) n.removeChild(n.firstChild); }

function showWordModal(w){
  // Arabic + Bangla
  wordAr().textContent = w.arabic || '';
  wordBn().textContent = w.bangla || w.meaning || '';

  // badges
  clearNode(morphBadges());
  const badgeItems = [];
  if(w.pos) badgeItems.push(w.pos);
  if(w.pos_detail) badgeItems.push(w.pos_detail);
  if(w.form) badgeItems.push(`ফর্ম-${w.form}`);
  if(w.person) badgeItems.push(w.person);
  if(w.number) badgeItems.push(w.number);
  if(w.gender) badgeItems.push(w.gender);
  if(badgeItems.length===0) badgeItems.push('—');

  badgeItems.forEach(b=>{
    const d = document.createElement('div');
    d.className = 'badge';
    d.textContent = b;
    morphBadges().appendChild(d);
  });

  // forms grid (past, present, imperative, root)
  clearNode(formsGrid());
  const pills = [
    {t:'অতীত (Past)', v: w.tense_forms?.past || w.past || '-'},
    {t:'বর্তমান (Present)', v: w.tense_forms?.present || w.present || '-'},
    {t:'আদেশ (Imperative)', v: w.tense_forms?.imperative || w.imperative || '-'},
    {t:'Root (মূল)', v: w.root || '-'},
    {t:'Noun / Masdar', v: w.noun || '-'},
    {t:'Form', v: w.form || '-'}
  ];
  pills.forEach(p=>{
    const el = document.createElement('div');
    el.className = 'pill';
    el.innerHTML = `<div class="p-title">${p.t}</div><div class="p-val">${p.v}</div>`;
    formsGrid().appendChild(el);
  });

  // grammar map
  clearNode(gramMap());
  const rows = [
    {k:'Subject (فاعل):', v: w.subject || '-'},
    {k:'Object (مفعول):', v: w.object || '-'},
    {k:'Case (إعراب):', v: w.case || '-'},
    {k:'Definite (ال):', v: w.definite ? 'হ্যাঁ (ال)' : 'না'},
    {k:'Notes:', v: w.grammar || w.notes || '-'}
  ];
  rows.forEach(r=>{
    const div = document.createElement('div');
    div.className = 'row';
    div.innerHTML = `<div class="gram-key">${r.k}</div><div class="gram-val">${r.v}</div>`;
    gramMap().appendChild(div);
  });

  // show modal
  wordModal().style.display = 'flex';
}

// ---------- Auto-generation helper (very basic heuristics) ----------
function autoGenerateWordFields(w){
  // If definite (ال)
  w.definite = !!(w.arabic && w.arabic.startsWith('ال'));
  // If particle (short list)
  const particles = ['و','ف','ب','ك','ل','س','ما','مَا','أ','إ'];
  if(particles.includes(w.arabic)) {
    w.pos = 'حرف (particle)';
    return;
  }
  // If word length small treat as particle/noun
  if(w.arabic && w.arabic.length<=2){
    w.pos = w.pos || 'حرف/اسم';
  }
  // very naive verb detection: common prefixes for present tense
  const presPrefixes = ['ي','ت','ن','أ','س'];
  if(w.arabic && presPrefixes.includes(w.arabic[0])){
    w.pos = w.pos || 'فعل (verb)';
    // set some guessed forms
    if(!w.tense_forms) w.tense_forms = {};
    if(!w.tense_forms.present) w.tense_forms.present = w.arabic;
    w.tense_forms.past = w.tense_forms.past || guessPastFromPresent(w.tense_forms.present);
  } else {
    // assume noun
    w.pos = w.pos || 'اسم (noun)';
  }
  // rudimentary root guess: take first three consonants (not accurate)
  if(!w.root && w.arabic){
    const letters = w.arabic.replace(/[^ء-ي]/g,''); // keep Arabic letters
    w.root = letters.slice(0,3);
  }
}

function guessPastFromPresent(present){
  // super naive: if present starts with ي then replace with أَدْ or remove prefix
  if(!present) return '-';
  if(present.startsWith('ي')) return present.replace(/^ي/, 'أَ');
  if(present.startsWith('ت')) return present.replace(/^ت/, 'أَ');
  return '-';
}
