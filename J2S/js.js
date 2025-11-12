// ==============================
// Utilitaires
// ==============================
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

// Année footer
$('#year').textContent = new Date().getFullYear();

// ==============================
// Recherche (filtrage live)
// ==============================
const searchInput = $('#search');
const games = $$('.game');
const sideLinks = $$('#sideMenu a');

function normalize(s){ return (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,''); }

function applyFilter(q){
    const nq = normalize(q);
    games.forEach(section => {
    const title = normalize(section.dataset.title);
    const tags = normalize(section.dataset.tags);
    const match = !nq || title.includes(nq) || tags.includes(nq);
    section.style.display = match ? '' : 'none';
    });
    // activer / désactiver les liens du menu
    sideLinks.forEach(a => {
    const id = a.getAttribute('href').slice(1);
    const sec = document.getElementById(id);
    a.classList.toggle('active', sec && sec.style.display !== 'none');
    })
}
searchInput.addEventListener('input', (e)=> applyFilter(e.target.value));

// ==============================
// Lightbox simple
// ==============================
const lightbox = $('#lightbox');
const lbImg = $('#lbImg');
const lbPrev = $('#lbPrev');
const lbNext = $('#lbNext');
const lbClose = $('#lbClose');

let currentGroup = [];
let currentIndex = 0;

function openLightbox(src, groupEls, index){
    currentGroup = groupEls.map(el => $('img', el).src);
    currentIndex = index;
    lbImg.src = src;
    lightbox.classList.add('open');
}
function closeLightbox(){ lightbox.classList.remove('open'); lbImg.src=''; }
function show(delta){
    if(!currentGroup.length) return;
    currentIndex = (currentIndex + delta + currentGroup.length) % currentGroup.length;
    lbImg.src = currentGroup[currentIndex];
}

// Ouvrir depuis les boutons
$$('[data-zoom]').forEach((btn, idx) =>{
    btn.addEventListener('click', (e)=>{
    const fig = e.currentTarget.closest('.item');
    const groupName = fig.dataset.group;
    const groupEls = $$(`.item[data-group="${groupName}"]`);
    const index = groupEls.indexOf(fig);
    openLightbox($('img', fig).src, groupEls, index);
    })
})

// Plein écran pour les modèles 3D
$$('[data-fullscreen]').forEach(btn =>{
    btn.addEventListener('click', (e)=>{
    const mv = e.currentTarget.closest('.item').querySelector('model-viewer');
    if(mv && mv.requestFullscreen){ mv.requestFullscreen(); }
    })
})

// Contrôles lightbox
lbPrev.addEventListener('click', ()=> show(-1));
lbNext.addEventListener('click', ()=> show(1));
lbClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e)=>{ if(e.target === lightbox) closeLightbox(); });
window.addEventListener('keydown', (e)=>{
    if(!lightbox.classList.contains('open')) return;
    if(e.key === 'Escape') closeLightbox();
    if(e.key === 'ArrowLeft') show(-1);
    if(e.key === 'ArrowRight') show(1);
});

// ==============================
// Améliorations UX légères
// ==============================
// surligner lien actif au scroll
const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry =>{
    const id = entry.target.id;
    const link = $(`#sideMenu a[href="#${id}"]`);
    if(link){ link.classList.toggle('active', entry.isIntersecting); }
    })
}, {rootMargin: "-40% 0px -55% 0px", threshold: 0});
games.forEach(g => observer.observe(g));

// Accessibilité: focus visible sur clic clavier
document.addEventListener('keydown', (e)=>{
    if(e.key === 'Tab') document.body.classList.add('kbd');
});

// Handles loading the events for <model-viewer>'s slotted progress bar
const onProgress = (event) => {
  const progressBar = event.target.querySelector('.progress-bar');
  const updatingBar = event.target.querySelector('.update-bar');
  updatingBar.style.width = `${event.detail.totalProgress * 100}%`;
  if (event.detail.totalProgress === 1) {
    progressBar.classList.add('hide');
    event.target.removeEventListener('progress', onProgress);
  } else {
    progressBar.classList.remove('hide');
  }
};
document.querySelector('model-viewer').addEventListener('progress', onProgress);

(function(){
    // sections de jeux (réutilise la NodeList déjà présente si besoin)
    const sections = Array.from(document.querySelectorAll('.game'));

    function markDeferred3D(section){
      const figs = Array.from(section.querySelectorAll('.grid .item'));
      figs.forEach(fig =>{
        const cap = fig.querySelector('.tag');
        const img = fig.querySelector('img');
        if(cap && /plan\s*3d/i.test(cap.textContent) && img){
          if(!fig.dataset.kind){ fig.dataset.kind = '3d'; }
          if(!img.dataset.src){ img.dataset.src = img.getAttribute('src'); }
          img.removeAttribute('src');             // ne pas charger au départ
          fig.classList.add('hidden','deferred3d');
        }
      });
    }

    function ensureToggleButton(section){
      const header = section.querySelector('.card-header');
      if(!header || header.querySelector('.toggle3d')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pill toggle3d';
      btn.textContent = 'Afficher les plans 3D';
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', ()=> toggle3D(section, btn));
      header.appendChild(btn);
    }

    function toggle3D(section, btn){
      const figs = Array.from(section.querySelectorAll('.grid .item.deferred3d'));
      const hidden = figs.every(f => f.classList.contains('hidden'));
      if(hidden){
        // Afficher et CHARGER à la demande
        figs.forEach(f =>{
          const img = f.querySelector('img');
          if(img && !img.getAttribute('src') && img.dataset.src){
            img.setAttribute('src', img.dataset.src);
          }
          f.classList.remove('hidden');
        });
        btn.textContent = 'Masquer les plans 3D';
        btn.setAttribute('aria-expanded', 'true');
      }else{
        // Re-masquer (images restent en cache)
        figs.forEach(f => f.classList.add('hidden'));
        btn.textContent = 'Afficher les plans 3D';
        btn.setAttribute('aria-expanded', 'false');
      }
    }

    // Init pour chaque section
    sections.forEach(section => { markDeferred3D(section); ensureToggleButton(section); });
  })();