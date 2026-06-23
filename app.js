// =========================================================
// Простий SPA-роутер на трьох екранах:
// login -> catalog -> detail (slide-over)
// Усе живе в одному DOM, перемикання класів керує переходами.
// =========================================================

const screenLogin   = document.getElementById('screen-login');
const screenCatalog = document.getElementById('screen-catalog');
const screenDetail  = document.getElementById('screen-detail');
const cardFeed       = document.getElementById('card-feed');
const toastEl         = document.getElementById('toast');
const overlayEl       = document.getElementById('overlay');

const favorites = new Set();

/* ---------------------------------------------------------
   Генерує невелику SVG-ілюстрацію кота (силует), щоб картка
   мала "фото" без залежності від зовнішніх зображень.
   Колір смужок трохи відрізняється для кожного кота.
--------------------------------------------------------- */
function catSilhouette(strokeColor){
  return `
  <svg class="cat-illustration" viewBox="0 0 220 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="110" cy="120" rx="78" ry="46" fill="#e8dcc6" opacity="0.92"/>
    <path d="M50 95 L35 50 L75 80 Z" fill="#e8dcc6"/>
    <path d="M170 95 L185 50 L145 80 Z" fill="#e8dcc6"/>
    <ellipse cx="110" cy="95" rx="46" ry="40" fill="#f3ead9"/>
    <ellipse cx="92" cy="92" rx="5.5" ry="7" fill="#241e19"/>
    <ellipse cx="128" cy="92" rx="5.5" ry="7" fill="#241e19"/>
    <path d="M104 104 q6 5 12 0" stroke="#241e19" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M70 100 H40 M70 106 H36 M150 100 H180 M150 106 H184" stroke="${strokeColor}" stroke-width="2" opacity="0.55" stroke-linecap="round"/>
    <path d="M40 130 q70 28 140 0" stroke="${strokeColor}" stroke-width="3" fill="none" opacity="0.35" stroke-linecap="round"/>
  </svg>`;
}

const heartIcon = (filled) => `
  <svg viewBox="0 0 24 24" width="16" height="16">
    <path d="M12 20s-7-4.5-9.3-9C1.2 7.6 2.7 4.5 6 4.2 8 4 10 5 12 7.5 14 5 16 4 18 4.2c3.3.3 4.8 3.4 3.3 6.8C19 15.5 12 20 12 20z"
      fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.6"/>
  </svg>`;

/* ---------------------------------------------------------
   Рендер карток у каталозі
--------------------------------------------------------- */
function renderCards(){
  cardFeed.innerHTML = CATS.map((cat, i) => `
    <article class="cat-card" data-id="${cat.id}" style="animation-delay:${i * 70}ms" tabindex="0" role="button" aria-label="Відкрити справу ${cat.name}">
      <div class="cat-card__photo">
        ${catSilhouette(cat.pawColor)}
        <span class="cat-card__status">${cat.status}</span>
        <button class="cat-card__fav ${favorites.has(cat.id) ? 'is-fav' : ''}" data-fav="${cat.id}" aria-label="Додати до улюблених">
          ${heartIcon(favorites.has(cat.id))}
        </button>
        <span class="cat-card__id">№ ${cat.id}</span>
      </div>
      <div class="cat-card__meta">
        <span class="cat-card__name">${cat.name}</span>
        <span class="cat-card__sub">${cat.sex} · ${cat.age}</span>
      </div>
    </article>
  `).join('');
}

/* ---------------------------------------------------------
   Відкриття картки кота -> заповнення детального екрана
--------------------------------------------------------- */
function openDetail(catId){
  const cat = CATS.find(c => c.id === catId);
  if(!cat) return;

  document.getElementById('detail-name').textContent = cat.name;
  document.getElementById('detail-title').textContent = cat.name;
  document.getElementById('detail-stamp').textContent = cat.status;
  document.getElementById('detail-notes').textContent = cat.notes;

  document.getElementById('detail-photo').innerHTML = `
    ${catSilhouette(cat.pawColor)}
    <span class="stamp" id="detail-stamp">${cat.status}</span>
    <div class="photo-dots" id="photo-dots">
      <span class="is-active"></span><span></span><span></span>
    </div>
  `;

  document.getElementById('spec-list').innerHTML = `
    <div><span class="spec-key">ID тварини</span><span class="spec-val">${cat.id}</span></div>
    <div><span class="spec-key">Вид</span><span class="spec-val">Кіт</span></div>
    <div><span class="spec-key">Порода</span><span class="spec-val">${cat.breed}</span></div>
    <div><span class="spec-key">Стать</span><span class="spec-val">${cat.sex}</span></div>
    <div><span class="spec-key">Вік</span><span class="spec-val">${cat.age}</span></div>
    <div><span class="spec-key">Окрас</span><span class="spec-val">${cat.color}</span></div>
    <div><span class="spec-key">Вага</span><span class="spec-val">${cat.weight}</span></div>
  `;

  syncFavButtons(catId);

  screenDetail.dataset.activeId = catId;
  screenDetail.classList.add('is-active');
  overlayEl.classList.add('is-active');
  screenDetail.scrollTop = 0;
  document.querySelector('.detail-scroll').scrollTop = 0;
}

function closeDetail(){
  screenDetail.classList.remove('is-active');
  overlayEl.classList.remove('is-active');
}

/* ---------------------------------------------------------
   Улюблені — синхронізація іконок серця в усіх місцях
--------------------------------------------------------- */
function syncFavButtons(catId){
  const isFav = favorites.has(catId);
  const footerBtn = document.getElementById('btn-fav-detail');
  const squareBtn = document.getElementById('btn-fav-footer');
  [footerBtn, squareBtn].forEach(btn => {
    btn.classList.toggle('is-fav', isFav);
    btn.innerHTML = heartIcon(isFav);
  });
}

function toggleFavorite(catId){
  if(favorites.has(catId)){
    favorites.delete(catId);
    showToast('Видалено з улюблених');
  } else {
    favorites.add(catId);
    showToast('Додано до улюблених ♥');
  }
  renderCards();
  if(screenDetail.dataset.activeId === catId){
    syncFavButtons(catId);
  }
}

/* ---------------------------------------------------------
   Toast
--------------------------------------------------------- */
let toastTimer;
function showToast(message){
  toastEl.textContent = message;
  toastEl.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 1800);
}

/* ---------------------------------------------------------
   Навігація: login -> catalog
--------------------------------------------------------- */
function enterCatalog(){
  screenLogin.classList.add('is-leaving');
  setTimeout(() => {
    screenLogin.classList.remove('is-active', 'is-leaving');
    screenCatalog.classList.add('is-active');
  }, 320);
}

/* ---------------------------------------------------------
   Event wiring
--------------------------------------------------------- */
document.getElementById('btn-login').addEventListener('click', enterCatalog);
document.getElementById('btn-guest').addEventListener('click', enterCatalog);
document.getElementById('btn-back').addEventListener('click', closeDetail);
overlayEl.addEventListener('click', closeDetail);

document.getElementById('btn-adopt').addEventListener('click', () => {
  const cat = CATS.find(c => c.id === screenDetail.dataset.activeId);
  showToast(`Дякуємо! Заявку на ${cat ? cat.name : 'кота'} надіслано 🐾`);
});

document.getElementById('btn-fav-detail').addEventListener('click', () => {
  toggleFavorite(screenDetail.dataset.activeId);
});
document.getElementById('btn-fav-footer').addEventListener('click', () => {
  toggleFavorite(screenDetail.dataset.activeId);
});

document.getElementById('btn-menu').addEventListener('click', () => {
  showToast('Меню поки у розробці');
});

// tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');
    if(tab.dataset.tab !== 'cats'){
      showToast('Цей розділ скоро з\'явиться');
      tab.classList.remove('is-active');
      document.querySelector('.tab[data-tab="cats"]').classList.add('is-active');
    }
  });
});

// card feed: delegate clicks for opening detail + favorite toggle
cardFeed.addEventListener('click', (e) => {
  const favBtn = e.target.closest('[data-fav]');
  if(favBtn){
    e.stopPropagation();
    toggleFavorite(favBtn.dataset.fav);
    return;
  }
  const card = e.target.closest('.cat-card');
  if(card){
    openDetail(card.dataset.id);
  }
});

cardFeed.addEventListener('keydown', (e) => {
  if(e.key === 'Enter' || e.key === ' '){
    const card = e.target.closest('.cat-card');
    if(card){
      e.preventDefault();
      openDetail(card.dataset.id);
    }
  }
});

// init
renderCards();
