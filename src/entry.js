import './gate.css';

// Presentation access screen on a static site. Public assets are not encrypted.
const ACCESS_DIGEST = '8d23cf6c86e834a7aa6eded54c26ce2bb2e74903538c61bdd5d2197997ab2f72';
const SESSION_KEY = 'radek-piece-v1';
const app = document.querySelector('#app');

function renderGate(message = '') {
  document.body.classList.add('access-screen');
  app.innerHTML = `
    <main class="access-layout">
      <div class="access-brand" aria-label="KOSTRZEWA Studio modeli 3D">
        <img src="./kostrzewa-logo.png" alt="KOSTRZEWA" width="175" height="70"><span>STUDIO MODELI 3D</span>
      </div>
      <section class="access-card" aria-labelledby="access-title">
        <p class="access-eyebrow">DWIE POMPY CIEPŁA / DWA KOTŁY</p>
        <h1 id="access-title">Ciepło.<br><span>Z każdej strony.</span></h1>
        <p class="access-intro">Wybierz urządzenie. Obróć model.<br>Przyjrzyj się materiałom i detalom.</p>
        <form id="access-form">
          <label for="access-password">Hasło dostępu</label>
          <div class="access-input-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></svg>
            <input id="access-password" type="password" name="password" autocomplete="current-password" required aria-describedby="access-message" spellcheck="false">
          </div>
          <p id="access-message" class="access-message" role="status" aria-live="polite">${message}</p>
          <button class="access-submit" type="submit"><span>Wejdź do studia</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></button>
        </form>
        <p class="access-detail">MODELE 3D <span>·</span> DETALE <span>·</span> UJĘCIA 4K</p>
      </section>
      <p class="access-foot">Radek / KOSTRZEWA</p>
    </main>`;

  const form = document.querySelector('#access-form');
  const input = document.querySelector('#access-password');
  const status = document.querySelector('#access-message');
  const submit = form.querySelector('button');
  let busy = false;

  input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    status.textContent = '';
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    submit.disabled = true;
    input.readOnly = true;
    status.textContent = 'Sprawdzam hasło…';
    try {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input.value));
      const value = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      if (value !== ACCESS_DIGEST) {
        status.textContent = 'Nieprawidłowe hasło. Spróbuj ponownie.';
        input.setAttribute('aria-invalid', 'true');
        input.readOnly = false;
        input.focus();
        input.select();
        submit.disabled = false;
        busy = false;
        return;
      }
      try { sessionStorage.setItem(SESSION_KEY, ACCESS_DIGEST); } catch {}
      input.value = '';
      status.textContent = 'Otwieram studio…';
      submit.querySelector('span').textContent = 'Przygotowuję modele…';
      await openStudio();
    } catch {
      input.readOnly = false;
      submit.disabled = false;
      busy = false;
      status.textContent = 'Nie udało się sprawdzić hasła. Odśwież stronę i spróbuj ponownie.';
    }
  });
  if (matchMedia('(pointer: fine)').matches && !message) input.focus();
}

async function openStudio() {
  try {
    await import('./main.js');
    document.body.classList.remove('access-screen');
  } catch (error) {
    console.error('Nie udało się otworzyć studia KOSTRZEWA.', error);
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    renderGate('Nie udało się pobrać studia. Sprawdź połączenie i spróbuj ponownie.');
  }
}

let remembered = false;
try { remembered = sessionStorage.getItem(SESSION_KEY) === ACCESS_DIGEST; } catch {}
renderGate();
if (remembered) {
  document.querySelector('#access-password').disabled = true;
  document.querySelector('.access-submit').disabled = true;
  document.querySelector('#access-message').textContent = 'Otwieram studio…';
  void openStudio();
}
