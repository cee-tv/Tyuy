import { getHeroContent, getContent, searchContent, getRandomContent } from './api.js';
import { updateMovieDetailsPage } from './movie-details.js';
import { updateTVDetailsPage } from './tv-details.js';
import { updateMyListPage } from './my-list.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Header scroll behavior
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Mobile menu functionality
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    menuToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.mobile-menu') && 
            !event.target.closest('.mobile-menu-toggle') && 
            mobileMenu.classList.contains('active')) {
            mobileMenu.classList.remove('active');
        }
    });

    // Search functionality
    const searchInput = document.querySelector('.mobile-search input');
    const searchIcon = document.querySelector('.search-icon');
    const mobileSearchInput = document.querySelector('.mobile-search input');
    let searchResultsContainer;

    // Update the search results container creation
    function createSearchResults() {
        if (!searchResultsContainer) {
            searchResultsContainer = document.createElement('div');
            searchResultsContainer.className = 'search-results';
            // Add the search results container inside the search wrapper
            const searchWrapper = document.querySelector('.mobile-search');
            if (searchWrapper) {
                searchWrapper.appendChild(searchResultsContainer);
            } else {
                document.body.appendChild(searchResultsContainer);
            }
        }
    }

    // Handle search input
    async function handleSearch(value) {
        if (!value.trim()) {
            searchResultsContainer?.classList.remove('active');
            return;
        }

        // Create search results preview container
        createSearchResults();
        const results = await searchContent(value);
        
        searchResultsContainer.innerHTML = results.map(item => `
            <div class="search-result-item" data-id="${item.id}" data-type="${item.type}">
                <div class="search-result-poster">
                    <img src="${item.poster || 'https://via.placeholder.com/100x150?text=No+Image'}" 
                         alt="${item.title}">
                </div>
                <div class="search-result-info">
                    <div class="search-result-title">${item.title}</div>
                    <div class="search-result-meta">
                        <span>${item.year}</span>
                        <span>${item.type.toUpperCase()}</span>
                        <span>${item.rating}% Match</span>
                    </div>
                    <div class="search-result-overview">${item.overview}</div>
                </div>
            </div>
        `).join('') || '<div class="search-result-item">No results found</div>';

        searchResultsContainer.classList.add('active');

        // Add click handlers for search results
        searchResultsContainer.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                const type = item.dataset.type;
                if (id && type) {
                    const url = `/${type}/info/${id}`;
                    history.pushState(null, null, url);
                    searchResultsContainer.classList.remove('active');
                    searchInput.value = '';
                    mobileSearchInput.value = '';
                    mobileMenu.classList.remove('active');
                    updateContent();
                }
            });
        });
    }

    // Debounce function to limit API calls
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    const debouncedSearch = debounce(handleSearch, 300);

    // Search input event listeners
    searchInput?.addEventListener('input', (e) => debouncedSearch(e.target.value));
    mobileSearchInput?.addEventListener('input', (e) => debouncedSearch(e.target.value));

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-results') && 
            !e.target.closest('.mobile-search') && 
            !e.target.closest('.search-icon')) {
            searchResultsContainer?.classList.remove('active');
        }
    });

    // Search icon click handler
    searchIcon?.addEventListener('click', () => {
        mobileMenu.classList.add('active');
        mobileSearchInput.focus();
    });

    // Search input event listeners for navigation (Enter key)
    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const navigateToSearch = () => {
                const encodedQuery = encodeURIComponent(searchInput.value.trim());
                history.pushState(null, null, `/search/${encodedQuery}`);
                searchResultsContainer?.classList.remove('active');
                searchInput.value = '';
                mobileSearchInput.value = '';
                mobileMenu.classList.remove('active');
                updateContent();
            };
            navigateToSearch();
        }
    });

    mobileSearchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const navigateToSearch = () => {
                const encodedQuery = encodeURIComponent(mobileSearchInput.value.trim());
                history.pushState(null, null, `/search/${encodedQuery}`);
                searchResultsContainer?.classList.remove('active');
                searchInput.value = '';
                mobileSearchInput.value = '';
                mobileMenu.classList.remove('active');
                updateContent();
            };
            navigateToSearch();
        }
    });

    // Search button/icon click for navigation
    const searchButton = document.querySelector('.mobile-search i');
    searchButton?.addEventListener('click', () => {
        if (mobileSearchInput.value.trim()) {
            const encodedQuery = encodeURIComponent(mobileSearchInput.value.trim());
            history.pushState(null, null, `/search/${encodedQuery}`);
            searchResultsContainer?.classList.remove('active');
            searchInput.value = '';
            mobileSearchInput.value = '';
            mobileMenu.classList.remove('active');
            updateContent();
        }
    });

    // ESC key handler to close search
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchResultsContainer?.classList.remove('active');
            searchInput.value = '';
            mobileSearchInput.value = '';
        }
    });

    // Horizontal scroll for cards
    document.querySelectorAll('.cards-container').forEach(container => {
        container.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                container.scrollLeft += e.deltaY;
            }
        });
    });

    // Navigation handling
    let heroRotationInterval;

    async function startHeroRotation(page) {
        // Clear any existing interval
        if (heroRotationInterval) {
            clearInterval(heroRotationInterval);
        }
        
        // Initial load
        await updateRandomHero(page);
        
        // Set up the interval
        heroRotationInterval = setInterval(async () => {
            await updateRandomHero(page);
        }, 6000);
    }

    async function updateRandomHero(page) {
        try {
            const content = await getRandomContent(page);
            await updateHeroSection(content, content.type);
            
            // Add click handler for more info button
            const moreInfoBtn = document.querySelector('.more-info-btn');
            if (moreInfoBtn) {
                moreInfoBtn.onclick = () => {
                    const url = `/${content.type}/info/${content.id}`;
                    history.pushState(null, null, url);
                    if (heroRotationInterval) {
                        clearInterval(heroRotationInterval);
                    }
                    updateContent();
                };
            }
        } catch (error) {
            console.error('Error updating random hero:', error);
        }
    }

    async function updateContent() {
        const currentPath = window.location.pathname;
        const contentContainer = document.getElementById('content-container');
        
        // Add search route handling
        const searchMatch = currentPath.match(/^\/search\/(.+)$/);
        if (searchMatch) {
            const searchQuery = decodeURIComponent(searchMatch[1]);
            try {
                const response = await fetch('search.html');
                contentContainer.innerHTML = await response.text();
                
                // Update search term display
                document.getElementById('search-term').textContent = searchQuery;
                
                // Get and display search results
                const results = await searchContent(searchQuery);
                const resultsContainer = document.querySelector('.search-results-grid');
                if (resultsContainer) {
                    resultsContainer.innerHTML = results.map(item => `
                        <div class="card" data-id="${item.id}" data-type="${item.type}">
                            <div class="poster">
                                <img src="${item.poster || 'https://via.placeholder.com/300x450?text=No+Image'}" 
                                     alt="${item.title} Poster">
                            </div>
                            <div class="card-details">
                                <h3>${item.title}</h3>
                                <div class="meta-info">
                                    <span class="year">${item.year}</span>
                                    <span class="type">${item.type.toUpperCase()}</span>
                                    <span class="match">${item.rating}% Match</span>
                                </div>
                                <p class="overview">${item.overview}</p>
                            </div>
                        </div>
                    `).join('') || '<div class="no-results">No results found</div>';

                    // Add click handlers for results
                    resultsContainer.querySelectorAll('.card').forEach(card => {
                        card.addEventListener('click', () => {
                            const id = card.dataset.id;
                            const type = card.dataset.type;
                            const url = `/${type}/info/${id}`;
                            history.pushState(null, null, url);
                            updateContent();
                        });
                    });
                }
            } catch (error) {
                console.error('Error loading search results:', error);
                contentContainer.innerHTML = '<div class="error">Error loading search results. Please try again later.</div>';
            }
            return;
        }

        // Clear any existing hero rotation
        if (heroRotationInterval) {
            clearInterval(heroRotationInterval);
        }
        
        // Check if it's a movie/tv info page
        const movieMatch = currentPath.match(/^\/movie\/info\/(\d+)$/);
        const tvMatch = currentPath.match(/^\/tv\/info\/(\d+)$/);
        
        if (movieMatch) {
            const movieId = movieMatch[1];
            try {
                const response = await fetch('movie-info.html');
                contentContainer.innerHTML = await response.text();
                await updateMovieDetailsPage(movieId);
            } catch (error) {
                console.error('Error loading movie info:', error);
            }
            return;
        }
        
        if (tvMatch) {
            const tvId = tvMatch[1];
            try {
                const response = await fetch('tv-info.html');
                contentContainer.innerHTML = await response.text();
                await updateTVDetailsPage(tvId);
            } catch (error) {
                console.error('Error loading TV info:', error);
            }
            return;
        }

        // Regular content pages
        let page = (currentPath === '/' || currentPath === '') ? 'home' : currentPath.replace('/', '');
        
        try {
            // Load the appropriate HTML template
            const response = await fetch(`${page}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load ${page}.html`);
            }
            contentContainer.innerHTML = await response.text();
            
            // Update active navigation links
            document.querySelectorAll('nav a, .mobile-nav-links a').forEach(navLink => {
                navLink.classList.remove('active');
                if (navLink.getAttribute('href') === currentPath) {
                    navLink.classList.add('active');
                }
            });
            
            // Start hero rotation for applicable pages
            if (page === 'home' || page === 'movie' || page === 'tv') {
                await startHeroRotation(page);
                const categories = await getContent(page);
                updateMainContent(categories);
            } else if (page === 'my-list') {
                await updateMyListPage();
            }
        } catch (error) {
            console.error('Error loading page:', error);
            contentContainer.innerHTML = '<div class="error">Error loading content. Please try again later.</div>';
        }
    }

    async function updateHeroSection(content, type) {
        const heroSection = document.querySelector('.hero');
        const heroDetails = document.querySelector('.hero-details');
        
        if (!heroSection || !heroDetails) return;

        // Update hero background
        heroSection.style.backgroundImage = `linear-gradient(to top, #141414, transparent), url('${content.backdrop}')`;

        // Update hero content
        heroDetails.innerHTML = `
            <h1>${content.title}</h1>
            <div class="badges">
                <span class="match">${content.rating}% Match</span>
                <span class="year">${content.year}</span>
                <span class="maturity">TV-14</span>
                ${type === 'tv' ? `<span class="seasons">${content.seasons || '1'} Seasons</span>` : ''}
            </div>
            <p class="description collapsed">${content.description}</p>
            <button class="toggle-description">Show more</button>
            <div class="genre">
                ${content.genres.map(genre => `<span>${genre}</span>`).join('')}
            </div>
            <div class="hero-buttons">
                <button class="play-btn"><i class="fas fa-play"></i> Play</button>
                <button class="more-info-btn"><i class="fas fa-info-circle"></i> More Info</button>
            </div>
        `;
        
        // Set up description toggle
        setupHeroDescriptionToggle();
    }

    function setupHeroDescriptionToggle() {
        const toggleBtn = document.querySelector('.toggle-description');
        const description = document.querySelector('.hero-details .description');
        
        if (toggleBtn && description) {
            toggleBtn.addEventListener('click', () => {
                description.classList.toggle('collapsed');
                toggleBtn.textContent = description.classList.contains('collapsed') ? 'Show more' : 'Show less';
            });
        }
    }

    function updateMainContent(categories) {
        const contentSection = document.querySelector('.content');
        if (!contentSection) return;

        contentSection.innerHTML = categories.map(category => `
            <div class="row">
                <h2>${category.title}</h2>
                <div class="cards-container">
                    ${category.items.map(item => `
                        <div class="card" data-id="${item.id}" data-type="${item.type}">
                            <div class="poster">
                                <img src="${item.poster}" alt="${item.title} Poster" 
                                     onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
                            </div>
                            <div class="card-details">
                                <h3>${item.title}</h3>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        // Add click handlers for cards
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                const type = card.dataset.type;
                const url = `/${type}/info/${id}`;
                history.pushState(null, null, url);
                updateContent();
            });
        });
    }

    // Navigation event listeners
    document.querySelectorAll('nav a, .mobile-nav-links a').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            // Close mobile menu when clicking any navigation link
            if (mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
            }
            history.pushState(null, null, href);
            await updateContent();
        });
    });

    // Handle browser navigation
    window.addEventListener('popstate', updateContent);

    // Initial content load
    await updateContent();
});