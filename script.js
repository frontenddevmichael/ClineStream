// ================================
// CLINEVAULT - ENHANCED JAVASCRIPT
// Apple-Inspired Interactions & Features
// ================================

// API Configuration
const API_KEY = "fdce1282d4d24c3feba76eb420d2c71b";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE_URL = "https://image.tmdb.org/t/p/w500";

// Global State
let currentMovies = [];
let currentPage = 1;
let isLoading = false;
let currentView = 'grid';
let currentSort = 'title';
let appliedFilters = {
    genres: [],
    year: ''
};

// DOM Elements
const moviesGrid = document.getElementById('moviesGrid');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const filterBtn = document.getElementById('filter-btn');
const filterDropdown = document.getElementById('filter-dropdown');
const themeToggle = document.getElementById('theme-toggle');
const sortSelect = document.getElementById('sort-select');
const gridViewBtn = document.getElementById('grid-view');
const listViewBtn = document.getElementById('list-view');
const loadMoreBtn = document.getElementById('load-more');
const backToTopBtn = document.getElementById('back-to-top');
const moviesLoading = document.getElementById('movies-loading');
const emptyState = document.getElementById('empty-state');
const clearFiltersBtn = document.getElementById('clear-filters');
const movieModal = document.getElementById('movie-modal');
const toastContainer = document.getElementById('toast-container');
const loadingScreen = document.getElementById('loading-screen');

// ================================
// INITIALIZATION & SETUP
// ================================

document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
    setupEventListeners();
    setupIntersectionObserver();
    setupScrollEffects();
});

async function initializeApp() {
    showLoadingScreen();

    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        await fetchPopularMovies();
        hideLoadingScreen();

        // Trigger staggered card animations
        setTimeout(() => {
            document.querySelectorAll('.movie-card').forEach((card, index) => {
                card.style.animationDelay = `${index * 0.1}s`;
                card.classList.add('animate-in');
            });
        }, 100);

    } catch (error) {
        hideLoadingScreen();
        showToast('Failed to load movies. Please try again.', 'error');
    }
}

// ================================
// LOADING STATES & ANIMATIONS
// ================================

function showLoadingScreen() {
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
        loadingScreen.classList.remove('hidden');
    }
}

function hideLoadingScreen() {
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
}

function showMoviesLoading() {
    moviesLoading?.classList.add('show');
    moviesGrid.style.opacity = '0.5';
}

function hideMoviesLoading() {
    moviesLoading?.classList.remove('show');
    moviesGrid.style.opacity = '1';
}

function showEmptyState() {
    emptyState?.classList.add('show');
    moviesGrid.style.display = 'none';
}

function hideEmptyState() {
    emptyState?.classList.remove('show');
    moviesGrid.style.display = 'grid';
}

// ================================
// API FUNCTIONS
// ================================

async function fetchPopularMovies() {
    try {
        showMoviesLoading();
        const response = await fetch(
            `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=${currentPage}`
        );

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();

        if (currentPage === 1) {
            currentMovies = data.results;
        } else {
            currentMovies = [...currentMovies, ...data.results];
        }

        await renderMovies(currentMovies);
        hideMoviesLoading();

    } catch (error) {
        console.error('Error fetching movies:', error);
        hideMoviesLoading();
        showToast('Failed to load movies', 'error');
    }
}

async function searchMovies(query) {
    if (!query.trim()) {
        hideSearchResults();
        return;
    }

    try {
        const response = await fetch(
            `${BASE_URL}/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1`
        );

        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();
        displaySearchResults(data.results.slice(0, 5)); // Show top 5 results

    } catch (error) {
        console.error('Search error:', error);
        showToast('Search failed', 'error');
    }
}

async function fetchMovieDetails(movieId) {
    try {
        const response = await fetch(
            `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US&append_to_response=videos,credits`
        );

        if (!response.ok) throw new Error('Failed to fetch movie details');

        return await response.json();

    } catch (error) {
        console.error('Error fetching movie details:', error);
        showToast('Failed to load movie details', 'error');
        return null;
    }
}

// ================================
// RENDER FUNCTIONS
// ================================

async function renderMovies(movies, append = false) {
    if (!append) {
        moviesGrid.innerHTML = '';
    }

    if (movies.length === 0) {
        showEmptyState();
        return;
    }

    hideEmptyState();

    const fragment = document.createDocumentFragment();

    movies.forEach((movie, index) => {
        const movieCard = createMovieCard(movie, append ? currentMovies.length - movies.length + index : index);
        fragment.appendChild(movieCard);
    });

    moviesGrid.appendChild(fragment);

    // Animate new cards in
    setTimeout(() => {
        const newCards = moviesGrid.querySelectorAll('.movie-card:not(.animated)');
        newCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.05}s`;
            card.classList.add('animated');
        });
    }, 50);
}

function createMovieCard(movie, index) {
    const movieCard = document.createElement('div');
    movieCard.classList.add('movie-card');
    movieCard.setAttribute('data-movie-id', movie.id);

    const posterUrl = movie.poster_path
        ? `${IMG_BASE_URL}${movie.poster_path}`
        : '/api/placeholder/300/450';

    const releaseYear = movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : 'Unknown';

    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

    // Get primary genre
    const genres = movie.genre_ids || [];
    const genreNames = getGenreNames(genres);
    const primaryGenre = genreNames[0] || 'Unknown';

    movieCard.innerHTML = `
        <div class="movie-poster">
            <img src="${posterUrl}" alt="${movie.title}" loading="lazy" />
            <div class="movie-rating">${rating}</div>
        </div>
        <div class="movie-info">
            <h3 class="movie-title">${movie.title}</h3>
            <div class="movie-meta">
                <span class="movie-year">${releaseYear}</span>
                <span class="movie-genre">${primaryGenre}</span>
            </div>
            <p class="movie-description">${movie.overview || 'No description available.'}</p>
        </div>
    `;

    // Add click handler for modal
    movieCard.addEventListener('click', () => openMovieModal(movie.id));

    // Add keyboard accessibility
    movieCard.setAttribute('tabindex', '0');
    movieCard.setAttribute('role', 'button');
    movieCard.setAttribute('aria-label', `View details for ${movie.title}`);

    movieCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openMovieModal(movie.id);
        }
    });

    return movieCard;
}

// ================================
// SEARCH FUNCTIONALITY
// ================================

let searchTimeout;

function setupSearchHandlers() {
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();

        if (query.length === 0) {
            hideSearchResults();
            return;
        }

        if (query.length < 2) return;

        searchTimeout = setTimeout(() => {
            searchMovies(query);
        }, 300);
    });

    searchInput.addEventListener('focus', () => {
        searchInput.parentElement.classList.add('focused');
    });

    searchInput.addEventListener('blur', () => {
        searchInput.parentElement.classList.remove('focused');

        // Hide search results after a delay to allow clicking
        setTimeout(() => {
            hideSearchResults();
        }, 200);
    });

    // Handle keyboard navigation in search results
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const firstResult = searchResults.querySelector('.search-result-item');
            if (firstResult) firstResult.focus();
        }
    });
}

function displaySearchResults(movies) {
    if (!searchResults) return;

    searchResults.innerHTML = '';

    if (movies.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No movies found</div>';
    } else {
        movies.forEach((movie) => {
            const resultItem = document.createElement('div');
            resultItem.classList.add('search-result-item');
            resultItem.setAttribute('tabindex', '0');
            resultItem.setAttribute('role', 'option');

            const posterUrl = movie.poster_path
                ? `${IMG_BASE_URL.replace('w500', 'w92')}${movie.poster_path}`
                : '/api/placeholder/92/138';

            const releaseYear = movie.release_date
                ? new Date(movie.release_date).getFullYear()
                : '';

            resultItem.innerHTML = `
                <img src="${posterUrl}" alt="${movie.title}" width="40" height="60" />
                <div>
                    <div class="search-result-title">${movie.title}</div>
                    <div class="search-result-meta">${releaseYear} • ⭐ ${movie.vote_average?.toFixed(1) || 'N/A'}</div>
                </div>
            `;

            resultItem.addEventListener('click', () => {
                searchInput.value = movie.title;
                hideSearchResults();
                openMovieModal(movie.id);
            });

            resultItem.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    resultItem.click();
                }
            });

            searchResults.appendChild(resultItem);
        });
    }

    showSearchResults();
}

function showSearchResults() {
    if (searchResults) {
        searchResults.classList.add('show');
        searchResults.setAttribute('aria-hidden', 'false');
    }
}

function hideSearchResults() {
    if (searchResults) {
        searchResults.classList.remove('show');
        searchResults.setAttribute('aria-hidden', 'true');
    }
}

// ================================
// FILTER FUNCTIONALITY
// ================================

function setupFilterHandlers() {
    if (!filterBtn || !filterDropdown) return;

    filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFilterDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!filterDropdown.contains(e.target) && !filterBtn.contains(e.target)) {
            closeFilterDropdown();
        }
    });

    // Handle filter changes
    const genreCheckboxes = filterDropdown.querySelectorAll('input[type="checkbox"]');
    const yearSelect = document.getElementById('year-filter');

    genreCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });

    if (yearSelect) {
        yearSelect.addEventListener('change', handleFilterChange);
    }
}

function toggleFilterDropdown() {
    const isOpen = filterDropdown.classList.contains('show');

    if (isOpen) {
        closeFilterDropdown();
    } else {
        openFilterDropdown();
    }
}

function openFilterDropdown() {
    filterDropdown.classList.add('show');
    filterBtn.setAttribute('aria-expanded', 'true');
}

function closeFilterDropdown() {
    filterDropdown.classList.remove('show');
    filterBtn.setAttribute('aria-expanded', 'false');
}

function handleFilterChange() {
    // Update applied filters
    const genreCheckboxes = filterDropdown.querySelectorAll('input[type="checkbox"]:checked');
    const yearSelect = document.getElementById('year-filter');

    appliedFilters.genres = Array.from(genreCheckboxes).map(cb => cb.value);
    appliedFilters.year = yearSelect ? yearSelect.value : '';

    // Apply filters to current movies
    applyFilters();

    showToast('Filters applied', 'success');
}

function applyFilters() {
    let filteredMovies = [...currentMovies];

    // Apply genre filter
    if (appliedFilters.genres.length > 0) {
        filteredMovies = filteredMovies.filter(movie => {
            const movieGenres = getGenreNames(movie.genre_ids || []);
            return appliedFilters.genres.some(genre =>
                movieGenres.some(mg => mg.toLowerCase().includes(genre.toLowerCase()))
            );
        });
    }

    // Apply year filter
    if (appliedFilters.year) {
        filteredMovies = filteredMovies.filter(movie => {
            const movieYear = movie.release_date
                ? new Date(movie.release_date).getFullYear().toString()
                : '';
            return movieYear === appliedFilters.year;
        });
    }

    renderMovies(filteredMovies);
}

// ================================
// SORTING FUNCTIONALITY
// ================================

function setupSortHandlers() {
    if (!sortSelect) return;

    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        sortMovies();
        showToast(`Sorted by ${getSortDisplayName(currentSort)}`, 'success');
    });
}

function sortMovies() {
    let sortedMovies = [...currentMovies];

    switch (currentSort) {
        case 'title':
            sortedMovies.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'year':
            sortedMovies.sort((a, b) => {
                const yearA = a.release_date ? new Date(a.release_date).getFullYear() : 0;
                const yearB = b.release_date ? new Date(b.release_date).getFullYear() : 0;
                return yearB - yearA; // Newest first
            });
            break;
        case 'rating':
            sortedMovies.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
            break;
        case 'genre':
            sortedMovies.sort((a, b) => {
                const genreA = getGenreNames(a.genre_ids || [])[0] || 'Unknown';
                const genreB = getGenreNames(b.genre_ids || [])[0] || 'Unknown';
                return genreA.localeCompare(genreB);
            });
            break;
    }

    renderMovies(sortedMovies);
}

// ================================
// VIEW TOGGLE FUNCTIONALITY
// ================================

function setupViewHandlers() {
    if (!gridViewBtn || !listViewBtn) return;

    gridViewBtn.addEventListener('click', () => setView('grid'));
    listViewBtn.addEventListener('click', () => setView('list'));
}

function setView(view) {
    currentView = view;

    // Update button states
    gridViewBtn.classList.toggle('active', view === 'grid');
    listViewBtn.classList.toggle('active', view === 'list');

    // Update grid classes
    moviesGrid.classList.toggle('list-view', view === 'list');

    // Animate transition
    moviesGrid.style.opacity = '0';
    setTimeout(() => {
        moviesGrid.style.opacity = '1';
    }, 150);

    showToast(`${view.charAt(0).toUpperCase() + view.slice(1)} view activated`, 'success');
}

// ================================
// THEME TOGGLE
// ================================

document.addEventListener('DOMContentLoaded', () => {
    // Try several selectors to match your markup (.ui-switch from your HTML)
    const themeCheckbox = document.querySelector(
        '.ui-switch input[type="checkbox"], .switch input[type="checkbox"], label.ui-switch input[type="checkbox"]'
    );

    // Helpful early warning if selector fails
    if (!themeCheckbox) {
        console.warn('Theme toggle checkbox not found. Ensure your HTML contains: <label class="ui-switch"><input type="checkbox">...</label>');
        return;
    }

    // Apply theme to both <html> and <body> to avoid scoping issues
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
            themeCheckbox.checked = true;
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
            themeCheckbox.checked = false;
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }

    // Initialize from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
        applyTheme(savedTheme);
    } else {
        // fallback to OS preference if user hasn't chosen yet
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
    }

    // When user toggles the checkbox: update theme + persist
    themeCheckbox.addEventListener('change', () => {
        const newTheme = themeCheckbox.checked ? 'dark' : 'light';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Optional: allow toggling by clicking the label (should already work)
    // Optional debug:
    // console.log('Theme initialized:', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
});

// ================================
// MODAL FUNCTIONALITY
// ================================

async function openMovieModal(movieId) {
    if (!movieModal) return;

    const movieDetails = await fetchMovieDetails(movieId);
    if (!movieDetails) return;

    const modalBody = movieModal.querySelector('.modal-body');
    if (!modalBody) return;

    const posterUrl = movieDetails.poster_path
        ? `${IMG_BASE_URL}${movieDetails.poster_path}`
        : '/api/placeholder/500/750';

    const releaseDate = movieDetails.release_date
        ? new Date(movieDetails.release_date).toLocaleDateString()
        : 'Unknown';

    const genres = movieDetails.genres?.map(g => g.name).join(', ') || 'Unknown';
    const runtime = movieDetails.runtime ? `${movieDetails.runtime} min` : 'Unknown';
    const director = movieDetails.credits?.crew?.find(c => c.job === 'Director')?.name || 'Unknown';

    modalBody.innerHTML = `
        <div class="modal-movie-details">
            <div class="modal-poster">
                <img src="${posterUrl}" alt="${movieDetails.title}" />
            </div>
            <div class="modal-info">
                <h2>${movieDetails.title}</h2>
                <div class="modal-meta">
                    <span>⭐ ${movieDetails.vote_average?.toFixed(1) || 'N/A'}</span>
                    <span>${releaseDate}</span>
                    <span>${runtime}</span>
                </div>
                <div class="modal-genres">${genres}</div>
                <p class="modal-overview">${movieDetails.overview || 'No overview available.'}</p>
                <div class="modal-credits">
                    <strong>Director:</strong> ${director}
                </div>
            </div>
        </div>
    `;

    movieModal.classList.add('show');
    movieModal.setAttribute('aria-hidden', 'false');

    // Focus trap
    const focusableElements = movieModal.querySelectorAll('button, [tabindex="0"]');
    if (focusableElements.length > 0) {
        focusableElements[0].focus();
    }
}

function closeMovieModal() {
    if (!movieModal) return;

    movieModal.classList.remove('show');
    movieModal.setAttribute('aria-hidden', 'true');
}

function setupModalHandlers() {
    if (!movieModal) return;

    const closeBtn = movieModal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMovieModal);
    }

    movieModal.addEventListener('click', (e) => {
        if (e.target === movieModal) {
            closeMovieModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && movieModal.classList.contains('show')) {
            closeMovieModal();
        }
    });
}

// ================================
// LOAD MORE FUNCTIONALITY
// ================================

function setupLoadMore() {
    if (!loadMoreBtn) return;

    loadMoreBtn.addEventListener('click', async () => {
        if (isLoading) return;

        isLoading = true;
        loadMoreBtn.textContent = 'Loading...';
        loadMoreBtn.disabled = true;

        currentPage++;
        await fetchPopularMovies();

        isLoading = false;
        loadMoreBtn.textContent = 'Load More Movies';
        loadMoreBtn.disabled = false;
    });
}

// ================================
// SCROLL EFFECTS
// ================================

function setupScrollEffects() {
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateScrollEffects();
                ticking = false;
            });
            ticking = true;
        }
    });
}

function updateScrollEffects() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const header = document.querySelector('header');

    // Header blur effect
    if (header) {
        header.classList.toggle('scrolled', scrollTop > 20);
    }

    // Back to top button
    if (backToTopBtn) {
        backToTopBtn.classList.toggle('show', scrollTop > 500);
    }

    // Parallax effect for hero section
    const heroSection = document.querySelector('.hero-section');
    if (heroSection && scrollTop < window.innerHeight) {
        const parallaxSpeed = 0.5;
        heroSection.style.transform = `translateY(${scrollTop * parallaxSpeed}px)`;
    }
}

function setupBackToTop() {
    if (!backToTopBtn) return;

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        showToast('Scrolled to top', 'success');
    });
}

// ================================
// INTERSECTION OBSERVER
// ================================

function setupIntersectionObserver() {
    const observerOptions = {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe movie cards as they're added
    const observeNewCards = () => {
        const cards = document.querySelectorAll('.movie-card:not(.observed)');
        cards.forEach(card => {
            observer.observe(card);
            card.classList.add('observed');
        });
    };

    // Initial observation
    setTimeout(observeNewCards, 100);

    // Re-observe when new cards are added
    const gridObserver = new MutationObserver(observeNewCards);
    gridObserver.observe(moviesGrid, { childList: true });
}

// ================================
// TOAST NOTIFICATIONS
// ================================

function showToast(message, type = 'info') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.classList.add('toast', type);

    toast.innerHTML = `
        <div class="toast-title">${getToastTitle(type)}</div>
        <div class="toast-message">${message}</div>
    `;

    toastContainer.appendChild(toast);

    // Trigger show animation
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto remove
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toastContainer.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function getToastTitle(type) {
    switch (type) {
        case 'success': return 'Success';
        case 'error': return 'Error';
        case 'warning': return 'Warning';
        default: return 'Info';
    }
}

// ================================
// UTILITY FUNCTIONS
// ================================

function getGenreNames(genreIds) {
    const genreMap = {
        28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
        80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
        14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
        9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
        53: 'Thriller', 10752: 'War', 37: 'Western'
    };

    return genreIds.map(id => genreMap[id] || 'Unknown').filter(Boolean);
}

function getSortDisplayName(sort) {
    switch (sort) {
        case 'title': return 'Title A-Z';
        case 'year': return 'Year (Newest)';
        case 'rating': return 'Rating (Highest)';
        case 'genre': return 'Genre';
        default: return sort;
    }
}

function setupClearFilters() {
    if (!clearFiltersBtn) return;

    clearFiltersBtn.addEventListener('click', () => {
        // Reset all filters
        const checkboxes = filterDropdown.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);

        const yearSelect = document.getElementById('year-filter');
        if (yearSelect) yearSelect.value = '';

        appliedFilters = { genres: [], year: '' };

        renderMovies(currentMovies);
        closeFilterDropdown();
        showToast('Filters cleared', 'success');
    });
}

// ================================
// EVENT LISTENERS SETUP
// ================================

function setupEventListeners() {
    setupSearchHandlers();
    setupFilterHandlers();
    setupSortHandlers();
    setupViewHandlers();
    setupThemeToggle();
    setupModalHandlers();
    setupLoadMore();
    setupBackToTop();
    setupClearFilters();

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === '/') {
            e.preventDefault();
            searchInput?.focus();
        }
    });

    // Handle window resize
    window.addEventListener('resize', debounce(() => {
        // Recalculate layouts if needed
        updateScrollEffects();
    }, 250));
}

// ================================
// PERFORMANCE UTILITIES
// ================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ================================
// ERROR HANDLING
// ================================

window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    showToast('Something went wrong. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    showToast('Network error occurred', 'error');
});

// ================================
// SERVICE WORKER REGISTRATION
// ================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
