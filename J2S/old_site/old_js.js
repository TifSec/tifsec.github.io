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

// ==============================
// Déferrement des modèles 3D <model-viewer>
// ==============================
(function(){
    let modelViewerLoaded = false;

    // Charger model-viewer dynamiquement
    function loadModelViewerScripts(){
      if(modelViewerLoaded) return;
      modelViewerLoaded = true;
      const mod = document.createElement('script');
      mod.type = 'module';
      mod.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      document.head.appendChild(mod);
      const nomod = document.createElement('script');
      nomod.setAttribute('nomodule', '');
      nomod.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer-legacy.js';
      document.head.appendChild(nomod);
    }

    function markDeferredMV(section){
      const figs = Array.from(section.querySelectorAll('.grid .item.model3d'));
      figs.forEach(fig =>{
        const mv = fig.querySelector('model-viewer');
        if(!mv) return;
        if(!mv.dataset.src && mv.getAttribute('src')){
          mv.dataset.src = mv.getAttribute('src');
        }
        mv.removeAttribute('src'); // empêche le chargement initial
        fig.classList.add('hidden','deferred3d');
      });
    }

    function ensureToggleButton(section){
      const header = section.querySelector('.card-header');
      if(!header || header.querySelector('.toggle3d')) return;
      const has3D = section.querySelector('.grid .item.model3d');
      if(!has3D) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pill toggle3d';
      btn.textContent = 'Afficher les plans 3D';
      btn.setAttribute('aria-expanded','false');
      btn.addEventListener('click', ()=> toggle3D(section, btn));
      header.appendChild(btn);
    }

    function toggle3D(section, btn){
      const figs = Array.from(section.querySelectorAll('.grid .item.model3d'));
      const hidden = figs.every(f => f.classList.contains('hidden'));
      if(hidden){
        // Charger model-viewer si pas encore présent
        loadModelViewerScripts();

        figs.forEach(f =>{
          const mv = f.querySelector('model-viewer');
          if(mv && !mv.getAttribute('src') && mv.dataset.src){
            mv.setAttribute('src', mv.dataset.src);
          }
          f.classList.remove('hidden');
        });
        btn.textContent = 'Masquer les plans 3D';
        btn.setAttribute('aria-expanded','true');
      }else{
        figs.forEach(f => f.classList.add('hidden'));
        btn.textContent = 'Afficher les plans 3D';
        btn.setAttribute('aria-expanded','false');
      }
    }

    // Plein écran
    function bindFullscreen(){
      document.querySelectorAll('[data-fullscreen]').forEach(btn =>{
        btn.addEventListener('click', e =>{
          const fig = e.currentTarget.closest('.item');
          const mv = fig ? fig.querySelector('model-viewer') : null;
          const target = mv || fig;
          if(target && target.requestFullscreen) target.requestFullscreen();
        });
      });
    }

    // Init
    Array.from(document.querySelectorAll('.game')).forEach(section =>{
      markDeferredMV(section);
      ensureToggleButton(section);
    });
    bindFullscreen();
})();

// Ajout d'un loader aux modèles 3D
(function(){
    function addLoader(fig){
        let loader = fig.querySelector('.loader3d');
        if(loader) return loader;
        loader = document.createElement('div');
        loader.className = 'loader3d';
        loader.innerHTML = '<span class="spinner" aria-hidden="true"></span><span class="txt">Chargement du modèle…</span>';
        fig.appendChild(loader);
        return loader;
    }

    function bindModelViewer(fig){
        const mv = fig.querySelector('model-viewer');
        if(!mv) return;
        const loader = addLoader(fig);
        const show = ()=>{ if(loader) loader.style.display = 'grid'; };
        const hide = ()=>{ if(loader) loader.style.display = 'none'; };
        if(mv.getAttribute('src')) show();
        mv.addEventListener('load', hide);
        mv.addEventListener('error', ()=>{
            if(loader){ loader.classList.add('error'); const t=loader.querySelector('.txt'); if(t) t.textContent='Erreur de chargement'; }
        });
        const obs = new MutationObserver((muts)=>{
            muts.forEach(m=>{ if(m.attributeName==='src' && mv.getAttribute('src')) show(); });
        });
        obs.observe(mv, {attributes:true});
    }

    // Init sur tous les blocs 3D existants
    document.querySelectorAll('.item.model3d').forEach(bindModelViewer);
    // Plein écran (si non déjà relié)
    document.querySelectorAll('[data-fullscreen]').forEach(btn=>{
        btn.addEventListener('click', (e)=>{
            const fig = e.currentTarget.closest('.item');
            const mv = fig ? fig.querySelector('model-viewer') : null;
            const target = mv || fig;
            if(target && target.requestFullscreen){ target.requestFullscreen(); }
        });
    });
})();