import './style.css';
import { Studio } from './scene.js';
import { products } from './catalog.js';

const icon = name => {
  const paths = {
    arrow:'M7 17 17 7M7 7h10v10',download:'M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4',
    rotate:'M3 11a9 9 0 1 1 2 7M3 4v7h7',close:'m6 6 12 12M6 18 18 6',
    ruler:'m3 17 14-14 4 4L7 21l-4-4Zm4-4 2 2m2-6 2 2m2-6 2 2',check:'m5 12 4 4L19 6'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.arrow}"/></svg>`;
};
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const millimetres = value => Math.round(Number(value) * 1000).toLocaleString('pl-PL');
const finishes = [['factory','Fabryczne','#b9bcbc'],['graphite','Grafit','#41464a'],['white','Biel','#f1f2ed']];
const views = [['studio','Perspektywa'],['front','Przód'],['side','Bok'],['rear','Tył'],['detail','Detal']];
const viewLabels = {studio:'Bryła, materiały i detale',front:'Widok z przodu',side:'Profil boczny',rear:'Widok z tyłu',detail:'Zbliżenie na detale'};
const initial = {product:products[0].id,finish:'factory',sheen:'satin',dimensions:false};
const STORAGE_KEY = 'radek-piece-config-v1';
let state = {...initial};
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  if (saved) {
    if (products.some(product => product.id === saved.product)) state.product = saved.product;
    if (finishes.some(finish => finish[0] === saved.finish)) state.finish = saved.finish;
    if (['gloss','satin'].includes(saved.sheen)) state.sheen = saved.sheen;
    if (typeof saved.dimensions === 'boolean') state.dimensions = saved.dimensions;
  }
} catch {}
const selectedProduct = () => products.find(product => product.id === state.product) || products[0];

document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <a href="#" class="brand" aria-label="KOSTRZEWA Studio modeli 3D"><img src="./kostrzewa-logo.png" alt="KOSTRZEWA" width="145" height="58"><span class="brand-sub">STUDIO<br>MODELI 3D</span></a>
    <span class="top-caption">Ciepło w dobrym wydaniu. <span>Przyjrzyj się z bliska.</span></span>
    <button class="text-button" id="sources-open">Materiały źródłowe ${icon('arrow')}</button>
  </header>
  <main class="workspace">
    <section class="stage" aria-label="Studio modelu 3D">
      <div id="viewport"><div class="loading">Przygotowuję model KOSTRZEWA<span>Geometria · materiały · światło</span></div></div>
      <div class="model-heading"><p class="eyebrow" id="model-category"></p><h1 id="model-title"></h1><p class="stage-caption" id="view-caption">${viewLabels.studio}</p></div>
      <div class="stage-tools"><button id="dimensions" title="Pokaż wymiary" aria-label="Pokaż wymiary" aria-pressed="false">${icon('ruler')}</button><button id="reset-view" title="Przywróć perspektywę" aria-label="Przywróć perspektywę">${icon('rotate')}</button></div>
      <div class="stage-bottom">
        <div class="view-bar" role="group" aria-label="Widok modelu">${views.map(([id,label]) => `<button data-view="${id}" class="${id === 'studio' ? 'active' : ''}" aria-pressed="${id === 'studio'}">${label}</button>`).join('')}</div>
        <p class="gesture">Przeciągnij, aby obrócić <span>·</span> Przewiń, aby przybliżyć</p>
        <div class="specs"><div><strong id="spec-width"></strong><small>SZEROKOŚĆ</small></div><div><strong id="spec-height"></strong><small>WYSOKOŚĆ</small></div><div><strong id="spec-depth"></strong><small>GŁĘBOKOŚĆ</small></div><div class="scale-note"><span class="status-dot"></span><small>Wymiary katalogowe<br><span id="spec-note">Model zewnętrzny</span></small></div></div>
      </div>
    </section>
    <aside class="config" aria-label="Wybór modelu i wykończenia">
      <div class="config-top"><p class="eyebrow">KOLEKCJA KOSTRZEWA</p><h2>Cztery modele. Jeden wybór.</h2><p>Obejrzyj urządzenie z każdej strony.</p></div>
      <div class="config-scroll">
        <section class="option-section product-section"><div class="section-label"><span>01</span><h3>Wybierz urządzenie</h3><span>4 modele</span></div>
          ${[['pump','Pompy ciepła'],['boiler','Kotły pelletowe']].map(([category,label]) => `<div class="product-group"><h4>${label}</h4><div class="product-options" role="group" aria-label="${label}">${products.filter(product => product.category === category).map(product => `<button class="product-card" data-product="${escape(product.id)}" aria-pressed="false"><span class="product-image">${product.imageUrl ? `<img src="${escape(product.imageUrl)}" alt="" loading="eager" decoding="async">` : ''}</span><span class="product-info"><strong>${escape(product.shortName || product.name)}</strong><small>${escape(product.powerLabel || product.categoryLabel)}</small></span><span class="product-check">${icon('check')}</span></button>`).join('')}</div></div>`).join('')}
        </section>
        <section class="option-section"><div class="section-label"><span>02</span><h3>Wykończenie obudowy</h3></div><div class="finish-options" role="group" aria-label="Kolor obudowy">${finishes.map(([id,label,color]) => `<button data-choice="finish" data-value="${id}" title="${label}" aria-pressed="false"><span class="finish-sample ${id}" style="--swatch:${color}"></span><span>${label}</span></button>`).join('')}</div><div class="finish-toggle" role="group" aria-label="Powierzchnia obudowy"><button data-choice="sheen" data-value="satin" aria-pressed="false">Satyna</button><button data-choice="sheen" data-value="gloss" aria-pressed="false">Połysk</button></div><p class="option-note">Grafit, biel i stopień połysku to warianty wizualizacji. Nie oznaczają opcji dostępnych w ofercie producenta.</p></section>
        <section class="option-section product-description"><div class="section-label"><span>03</span><h3>Wybrany model</h3></div><p id="product-description"></p><p class="dimension-note" id="dimension-note"></p><button class="inline-source" id="selected-source">Zobacz zdjęcie i dokumentację ${icon('arrow')}</button></section>
      </div>
      <div class="config-footer"><button id="export-png" class="primary-button">Zapisz ujęcie 4K ${icon('download')}</button><div class="footer-actions"><button id="export-glb">Model GLB ${icon('download')}</button><button id="reset-config">Przywróć ustawienia</button></div></div>
    </aside>
  </main>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <dialog id="sources-dialog" aria-labelledby="sources-title"><div class="dialog-heading"><div><p class="eyebrow">GEOMETRIA I REFERENCJE</p><h2 id="sources-title">Podstawa modelu</h2></div><button id="sources-close" aria-label="Zamknij">${icon('close')}</button></div><div id="source-content"></div></dialog>`;

let studio;
let currentView = 'studio';
let lastProduct;
const toast = message => {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove('show'), 4500);
};

function updateSourceDialog(product) {
  const photoCaption = product.category === 'pump' ? 'Rodzina HPR Deluxe · HPR 500 i hydrobox' : 'Fotografia producenta';
  const photoDescription = product.category === 'pump' ? 'Fotografia producenta: HPR 500 Deluxe z hydroboxem i sterownikiem. Referencja wspólnej obudowy rodziny HPR Deluxe.' : `Zdjęcie referencyjne: ${product.name}`;
  document.querySelector('#sources-title').textContent = product.name;
  document.querySelector('#source-content').innerHTML = `
    <p>${escape(product.accuracyNote || 'Model zewnętrzny odtworzony na podstawie zdjęć i wymiarów producenta. Nie jest plikiem CAD producenta ani dokumentacją montażową.')}</p>
    <div class="source-preview">${product.imageUrl ? `<a href="${escape(product.imageUrl)}" target="_blank" rel="noopener"><img src="${escape(product.imageUrl)}" alt="${escape(photoDescription)}"><span>${escape(photoCaption)} ${icon('arrow')}</span></a>` : ''}<div><p class="eyebrow">WYMIARY KATALOGOWE</p><dl><div><dt>Szerokość</dt><dd>${millimetres(product.width)} mm</dd></div><div><dt>Wysokość</dt><dd>${millimetres(product.height)} mm</dd></div><div><dt>Głębokość</dt><dd>${millimetres(product.depth)} mm</dd></div></dl><p>${escape(product.dimensionNote || '')}</p></div></div>
    <ul class="source-links">${product.sourceUrl ? `<li><a href="${escape(product.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escape(product.name)} — strona KOSTRZEWA ${icon('arrow')}</a></li>` : ''}${product.pdfUrl ? `<li><a href="${escape(product.pdfUrl)}" target="_blank" rel="noopener">Dokumentacja producenta — PDF ${icon('download')}</a></li>` : ''}${product.manualUrl && product.manualUrl !== product.pdfUrl ? `<li><a href="${escape(product.manualUrl)}" target="_blank" rel="noopener">Instrukcja obsługi — PDF ${icon('download')}</a></li>` : ''}</ul>
    <p class="source-footnote">Źródło: kostrzewa.pl. Kolory poglądowe można zmieniać w studiu; wariant „Fabryczne” przywraca kolorystykę ze zdjęć referencyjnych.</p>`;
}

function sync() {
  const product = selectedProduct();
  document.querySelectorAll('[data-product]').forEach(button => {
    const active = button.dataset.product === product.id;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('[data-choice]').forEach(button => {
    const active = state[button.dataset.choice] === button.dataset.value;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelector('#dimensions').setAttribute('aria-pressed', String(state.dimensions));
  if (lastProduct !== product.id) {
    const index = products.findIndex(item => item.id === product.id) + 1;
    document.querySelector('#model-category').textContent = `${String(index).padStart(2, '0')} / ${product.categoryLabel || (product.category === 'pump' ? 'POMPA CIEPŁA' : 'KOCIOŁ PELLETOWY')}`;
    document.querySelector('#model-title').textContent = product.shortName || product.name;
    document.querySelector('#spec-width').innerHTML = `${millimetres(product.width)}<span> mm</span>`;
    document.querySelector('#spec-height').innerHTML = `${millimetres(product.height)}<span> mm</span>`;
    document.querySelector('#spec-depth').innerHTML = `${millimetres(product.depth)}<span> mm</span>`;
    document.querySelector('#spec-note').textContent = product.category === 'pump' ? 'Jednostka zewnętrzna' : 'Model zewnętrzny';
    document.querySelector('#product-description').textContent = product.description || product.name;
    document.querySelector('#dimension-note').textContent = product.dimensionNote || '';
    updateSourceDialog(product);
    document.title = `${product.shortName || product.name} — KOSTRZEWA Studio 3D`;
    lastProduct = product.id;
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  studio?.update(state);
}

function setView(id) {
  if (!views.some(view => view[0] === id)) return;
  currentView = id;
  studio?.setView(id);
  document.querySelectorAll('[data-view]').forEach(button => {
    const active = button.dataset.view === id;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelector('#view-caption').textContent = viewLabels[id];
}

function setState(patch) {
  const previousProduct = state.product;
  if (products.some(product => product.id === patch.product)) state.product = patch.product;
  if (finishes.some(finish => finish[0] === patch.finish)) state.finish = patch.finish;
  if (['satin','gloss'].includes(patch.sheen)) state.sheen = patch.sheen;
  if (typeof patch.dimensions === 'boolean') state.dimensions = patch.dimensions;
  sync();
  if (previousProduct !== state.product) setView('studio');
}

document.querySelectorAll('[data-product]').forEach(button => button.addEventListener('click', () => setState({product:button.dataset.product})));
document.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => setState({[button.dataset.choice]:button.dataset.value})));
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
document.querySelector('#reset-view').onclick = () => setView('studio');
document.querySelector('#dimensions').onclick = () => setState({dimensions:!state.dimensions});
document.querySelector('#reset-config').onclick = () => { state = {...initial}; sync(); setView('studio'); };
document.querySelector('.brand').onclick = event => { event.preventDefault(); setView('studio'); };
const dialog = document.querySelector('#sources-dialog');
document.querySelector('#sources-open').onclick = () => dialog.showModal();
document.querySelector('#selected-source').onclick = () => dialog.showModal();
document.querySelector('#sources-close').onclick = () => dialog.close();
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 20000);
}
async function exporting(button, callback) {
  if (exporting.busy) return;
  exporting.busy = true;
  const previous = button.innerHTML;
  const controls = [...document.querySelectorAll('[data-product], [data-choice], [data-view], #dimensions, #reset-view, #reset-config, #export-png, #export-glb')];
  controls.forEach(control => control.disabled = true);
  button.textContent = 'Przygotowuję plik…';
  try { await callback(); toast('Plik jest gotowy do zapisania.'); }
  catch (error) { console.error(error); toast(`Nie udało się zapisać pliku: ${error.message}`); }
  finally { controls.forEach(control => control.disabled = false); button.innerHTML = previous; exporting.busy = false; }
}
document.querySelector('#export-png').onclick = event => exporting(event.currentTarget, async () => download(await studio.png(), `KOSTRZEWA-${state.product}-${currentView}-${state.finish}-4K.png`));
document.querySelector('#export-glb').onclick = event => exporting(event.currentTarget, async () => download(new Blob([await studio.glb()], {type:'model/gltf-binary'}), `KOSTRZEWA-${state.product}-exterior.glb`));

sync();
try {
  studio = new Studio(document.querySelector('#viewport'), state);
  document.querySelector('.loading')?.remove();
  setView('studio');
  window.kostrzewa = {studio,get state() { return {...state}; },set:setState,view:setView,metrics:() => studio.metrics(),ready:true};
} catch (error) {
  console.error(error);
  document.querySelector('.loading').textContent = 'Nie udało się uruchomić modelu 3D. Otwórz stronę w przeglądarce z włączoną akceleracją sprzętową.';
  document.querySelector('#export-png').disabled = true;
  document.querySelector('#export-glb').disabled = true;
}
window.addEventListener('pagehide', event => { if (!event.persisted) studio?.dispose(); });
