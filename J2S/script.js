const PRODUCTS_URL = 'products.json';

const state = {
    products: [],
    filteredProducts: [],
    activeFilter: 'all',
    featuredProducts: [],
    carouselIndex: 0,
    carouselInterval: null,
    currentModalProduct: null
};

const productsGrid = document.getElementById('products-grid');
const catalogStatus = document.getElementById('catalog-status');
const catalogEmpty = document.getElementById('catalog-empty');
const filtersContainer = document.getElementById('catalog-filters');
const featuredStatus = document.getElementById('featured-status');
const featuredCarousel = document.getElementById('featured-carousel');
const carouselTrack = document.getElementById('carousel-track');
const carouselDots = document.getElementById('carousel-dots');
const carouselPrev = document.getElementById('carousel-prev');
const carouselNext = document.getElementById('carousel-next');
const form = document.getElementById('contact-form');
const formMessage = document.getElementById('form-message');
const modal = document.getElementById('product-modal');
const modalClose = document.getElementById('modal-close');
const modalCloseSecondary = document.getElementById('modal-close-secondary');
const modalImage = document.getElementById('modal-image');
const modalCategory = document.getElementById('modal-category');
const modalTitle = document.getElementById('modal-title');
const modalPrice = document.getElementById('modal-price');
const modalDescription = document.getElementById('modal-description');
const modalTags = document.getElementById('modal-tags');
const modalLink = document.getElementById('modal-link');

function sortProductsAlphabetically(products) {
    return [...products].sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr', { sensitivity: 'base' }));
}

function normalizeProducts(products) {
    return sortProductsAlphabetically(products).map((product, index) => ({
    id: product.id || product.slug || `product-${index}`,
    nom: product.nom || 'Insert sans nom',
    prix: product.prix || 'Tarif sur demande',
    categorie: product.categorie || 'Autres',
    materiau: product.materiau || 'Non précisé',
    description: product.description || 'Description à compléter.',
    image: product.image || '',
    lien: product.lien || '#contact',
    tags: Array.isArray(product.tags) ? product.tags : [product.materiau || 'Non précisé'],
    compatible: product.compatible || '',
    slug: product.slug || ''
    }));
}

function createImageMarkup(product, className = 'visual') {
    if (product.image) {
    return `<div class="${className}"><img src="${product.image}" alt="${escapeHtml(product.nom)}"></div>`;
    }
    return `<div class="${className}">Ajoute une image dans <code>products.json</code><br>ou place un fichier dans ton dossier images/</div>`;
}

function escapeHtml(value) {
    return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderFilters() {
    const categories = [...new Set(state.products.map(product => product.categorie))].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
    const filterValues = ['all', ...categories];

    filtersContainer.innerHTML = filterValues.map(filter => {
    const label = filter === 'all' ? 'Tous' : filter;
    const activeClass = state.activeFilter === filter ? 'chip active' : 'chip';
    return `<button type="button" class="${activeClass}" data-filter="${escapeHtml(filter)}">${escapeHtml(label)}</button>`;
    }).join('');

    filtersContainer.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
        state.activeFilter = button.dataset.filter;
        renderFilters();
        renderCatalog();
    });
    });
}

function renderCatalog() {
    state.filteredProducts = state.activeFilter === 'all'
    ? [...state.products]
    : state.products.filter(product => product.categorie === state.activeFilter);

    productsGrid.innerHTML = state.filteredProducts.map(product => `
    <article class="product">
        <button type="button" class="product-image" data-open-product="${escapeHtml(product.id)}" aria-label="Voir ${escapeHtml(product.nom)}">
        ${product.image
            ? `<img src="${product.image}" alt="${escapeHtml(product.nom)}">`
            : `Ajoute une image dans <code>products.json</code>`}
        </button>
        <div class="product-head">
        <h3>${escapeHtml(product.nom)}</h3>
        <span class="price">${escapeHtml(String(product.prix))}</span>
        </div>
        <p class="muted">${escapeHtml(product.description)}</p>
        <div class="tags">
        ${product.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
        <div class="product-actions">
        <button class="btn btn-primary" type="button" data-open-product="${escapeHtml(product.id)}">Voir l’insert</button>
        <a class="btn btn-secondary" href="${escapeHtml(product.lien)}">Commander</a>
        </div>
    </article>
    `).join('');

    catalogStatus.classList.add('hidden');
    catalogEmpty.classList.toggle('hidden', state.filteredProducts.length > 0);
    bindOpenProductButtons();
}

function renderCarousel() {
    state.featuredProducts = state.products.slice(0, 3);

    if (state.featuredProducts.length === 0) {
    featuredStatus.textContent = 'Aucun insert disponible pour le moment.';
    featuredCarousel.classList.add('hidden');
    return;
    }

    featuredStatus.classList.add('hidden');
    featuredCarousel.classList.remove('hidden');

    carouselTrack.innerHTML = state.featuredProducts.map(product => `
    <div class="carousel-slide">
        <article class="carousel-card">
        ${createImageMarkup(product, 'visual')}
        <div class="carousel-content">
            <p class="tiny">${escapeHtml(product.categorie)}</p>
            <h3>${escapeHtml(product.nom)}</h3>
            <div class="price" style="width: fit-content;">${escapeHtml(String(product.prix))}</div>
            <p class="muted">${escapeHtml(product.description)}</p>
            <div class="tags">
            ${product.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
            <div class="product-actions">
            <button class="btn btn-primary" type="button" data-open-product="${escapeHtml(product.id)}">Découvrir</button>
            <a class="btn btn-secondary" href="#catalogue">Voir le catalogue</a>
            </div>
        </div>
        </article>
    </div>
    `).join('');

    carouselDots.innerHTML = state.featuredProducts.map((product, index) => `
    <button type="button" class="dot ${index === 0 ? 'active' : ''}" data-carousel-dot="${index}" aria-label="Aller à ${escapeHtml(product.nom)}"></button>
    `).join('');

    state.carouselIndex = 0;
    updateCarousel();
    bindOpenProductButtons();

    carouselDots.querySelectorAll('[data-carousel-dot]').forEach(dot => {
    dot.addEventListener('click', () => {
        state.carouselIndex = Number(dot.dataset.carouselDot);
        updateCarousel();
        restartCarouselAutoPlay();
    });
    });
}

function updateCarousel() {
    carouselTrack.style.transform = `translateX(-${state.carouselIndex * 100}%)`;
    carouselDots.querySelectorAll('.dot').forEach((dot, index) => {
    dot.classList.toggle('active', index === state.carouselIndex);
    });
}

function nextCarousel() {
    if (state.featuredProducts.length === 0) return;
    state.carouselIndex = (state.carouselIndex + 1) % state.featuredProducts.length;
    updateCarousel();
}

function prevCarousel() {
    if (state.featuredProducts.length === 0) return;
    state.carouselIndex = (state.carouselIndex - 1 + state.featuredProducts.length) % state.featuredProducts.length;
    updateCarousel();
}

function startCarouselAutoPlay() {
    stopCarouselAutoPlay();
    if (state.featuredProducts.length > 1) {
    state.carouselInterval = setInterval(nextCarousel, 4500);
    }
}

function stopCarouselAutoPlay() {
    if (state.carouselInterval) {
    clearInterval(state.carouselInterval);
    state.carouselInterval = null;
    }
}

function restartCarouselAutoPlay() {
    startCarouselAutoPlay();
}

function bindOpenProductButtons() {
    document.querySelectorAll('[data-open-product]').forEach(button => {
    button.addEventListener('click', () => {
        const product = state.products.find(item => item.id === button.dataset.openProduct);
        if (product) openModal(product);
    });
    });
}

function openModal(product) {
    state.currentModalProduct = product;
    modalCategory.textContent = product.categorie;
    modalTitle.textContent = product.nom;
    modalPrice.textContent = String(product.prix);
    modalDescription.textContent = product.description;
    modalTags.innerHTML = [
    ...product.tags,
    product.compatible ? `Compatible : ${product.compatible}` : ''
    ].filter(Boolean).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
    modalLink.href = product.lien || '#contact';

    if (product.image) {
    modalImage.innerHTML = `<img src="${product.image}" alt="${escapeHtml(product.nom)}">`;
    } else {
    modalImage.innerHTML = 'Ajoute une image à cet insert dans <code>products.json</code>';
    }

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
}

function closeModal() {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    state.currentModalProduct = null;
}

async function loadProducts() {
    try {
    const response = await fetch(PRODUCTS_URL, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Impossible de lire ${PRODUCTS_URL}`);
    }

    const rawProducts = await response.json();
    if (!Array.isArray(rawProducts)) {
        throw new Error('Le fichier JSON doit contenir un tableau de produits.');
    }

    state.products = normalizeProducts(rawProducts);
    renderFilters();
    renderCatalog();
    renderCarousel();
    startCarouselAutoPlay();
    } catch (error) {
    console.error(error);
    catalogStatus.classList.remove('hidden');
    catalogStatus.innerHTML = `Erreur de chargement du catalogue.<br>Vérifie la présence et la syntaxe de <code>${escapeHtml(PRODUCTS_URL)}</code>.`;
    featuredStatus.innerHTML = `Impossible de charger les inserts mis en avant.<br>Vérifie <code>${escapeHtml(PRODUCTS_URL)}</code>.`;
    }
}

carouselNext.addEventListener('click', () => {
    nextCarousel();
    restartCarouselAutoPlay();
});

carouselPrev.addEventListener('click', () => {
    prevCarousel();
    restartCarouselAutoPlay();
});

featuredCarousel.addEventListener('mouseenter', stopCarouselAutoPlay);
featuredCarousel.addEventListener('mouseleave', startCarouselAutoPlay);

form.addEventListener('submit', function (event) {
    event.preventDefault();
    formMessage.textContent = 'Formulaire prêt. Sur GitHub Pages, relie-le à Formspree, Basin, Netlify Forms ou un service équivalent.';
});

modalClose.addEventListener('click', closeModal);
modalCloseSecondary.addEventListener('click', closeModal);

modal.addEventListener('click', (event) => {
    if (event.target === modal) {
    closeModal();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
    closeModal();
    }
});

loadProducts();