import { getMovieDetails, getSimilarMovies } from './api.js';
import { addToMyList, removeFromMyList, isInMyList } from './my-list.js';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export async function updateMovieDetailsPage(movieId) {
    try {
        const movieDetails = await getMovieDetails(movieId);
        updateDetailsUI(movieDetails);
        await loadSimilarMovies(movieId);
        setupTabSwitching();
    } catch (error) {
        console.error('Error loading movie details:', error);
    }
}

function updateDetailsUI(details) {
    const detailsHero = document.querySelector('.details-hero');
    const heroDetails = document.querySelector('.hero-details');
    
    if (!detailsHero || !heroDetails) return;
    
    // Update hero background
    detailsHero.style.backgroundImage = `linear-gradient(to top, #141414, transparent), url('${details.backdrop}')`;
    
    // Update hero content
    const myListButtonHtml = isInMyList(details.id, 'movie')
        ? `<button class="my-list-btn"><i class="fas fa-check"></i> Remove from List</button>`
        : `<button class="my-list-btn"><i class="fas fa-plus"></i> My List</button>`;
        
    heroDetails.innerHTML = `
        <h1>${details.title}</h1>
        <div class="badges">
            <span class="match">${details.rating}% Match</span>
            <span class="year">${details.year}</span>
            <span class="maturity">${details.adult ? 'TV-MA' : 'TV-14'}</span>
        </div>
        <p class="description collapsed">${details.overview}</p>
        <button class="toggle-description">Show more</button>
        <div class="genre">
            ${details.genres.map(genre => `<span>${genre}</span>`).join('')}
        </div>
        <div class="hero-buttons">
            <button class="play-btn"><i class="fas fa-play"></i> Play</button>
            ${myListButtonHtml}
        </div>
    `;
    
    // Add My List button functionality
    const myListBtn = heroDetails.querySelector('.my-list-btn');
    myListBtn.addEventListener('click', () => {
        const isInList = isInMyList(details.id, 'movie');
        if (isInList) {
            removeFromMyList(details.id, 'movie');
            myListBtn.innerHTML = '<i class="fas fa-plus"></i> My List';
        } else {
            addToMyList({
                id: details.id,
                type: 'movie',
                title: details.title,
                poster: details.poster
            });
            myListBtn.innerHTML = '<i class="fas fa-check"></i> Remove from List';
        }
    });

    // Set up description toggle
    setupDescriptionToggle();
    
    // Load additional details
    const detailsContainer = document.querySelector('.movie-details-container');
    if (detailsContainer) {
        detailsContainer.innerHTML = `
            <div class="detail-section">
                <h3>Movie Info</h3>
                <div class="detail-item"><span class="detail-label">Director:</span> ${details.crew?.filter(c => c.job === 'Director').map(d => d.name).join(', ') || 'N/A'}</div>
                <div class="detail-item"><span class="detail-label">Runtime:</span> ${details.runtime ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m` : 'N/A'}</div>
                <div class="detail-item"><span class="detail-label">Release Date:</span> ${new Date(details.release_date).toLocaleDateString()}</div>
                <div class="detail-item"><span class="detail-label">Status:</span> ${details.status || 'N/A'}</div>
                <div class="detail-item"><span class="detail-label">Language:</span> ${details.original_language?.toUpperCase() || 'N/A'}</div>
                <div class="detail-item"><span class="detail-label">Budget:</span> ${details.budget ? `$${(details.budget / 1000000).toFixed(1)}M` : 'N/A'}</div>
                <div class="detail-item"><span class="detail-label">Revenue:</span> ${details.revenue ? `$${(details.revenue / 1000000).toFixed(1)}M` : 'N/A'}</div>
                <div class="detail-item"><span class="detail-label">Production:</span> ${details.production_companies?.map(c => c.name).join(', ') || 'N/A'}</div>
            </div>
            <div class="detail-section">
                <h3>Cast</h3>
                <div class="cast-grid">
                    ${details.cast?.slice(0, 8).map(actor => `
                        <div class="cast-item">
                            <img class="cast-image" src="${actor.profile_path ? `${TMDB_IMAGE_BASE}/w185${actor.profile_path}` : 'https://via.placeholder.com/50x50?text=No+Image'}" alt="${actor.name}">
                            <div class="cast-info">
                                <span class="cast-name">${actor.name}</span>
                                <span class="cast-character">${actor.character}</span>
                            </div>
                        </div>
                    `).join('') || 'No cast information available'}
                </div>
            </div>
        `;
    }
}

async function loadSimilarMovies(movieId) {
    try {
        const similarMovies = await getSimilarMovies(movieId);
        const similarContainer = document.querySelector('.similar-movies');
        if (similarContainer) {
            similarContainer.innerHTML = similarMovies.map(movie => `
                <div class="card" data-id="${movie.id}" data-type="movie">
                    <div class="poster">
                        <img src="${movie.poster}" alt="${movie.title} Poster" 
                             onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
                    </div>
                    <div class="card-details">
                        <h3>${movie.title}</h3>
                        <span class="match">${movie.rating}% Match</span>
                    </div>
                </div>
            `).join('');
            
            // Add click handlers for similar movie cards
            similarContainer.querySelectorAll('.card').forEach(card => {
                card.addEventListener('click', () => {
                    const id = card.dataset.id;
                    const type = card.dataset.type;
                    const url = `/${type}/info/${id}`;
                    history.pushState(null, null, url);
                    window.dispatchEvent(new Event('popstate'));
                });
            });
        }
    } catch (error) {
        console.error('Error loading similar movies:', error);
    }
}

function setupTabSwitching() {
    // Set up tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Update active button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });
}

function setupDescriptionToggle() {
    const toggleBtn = document.querySelector('.toggle-description');
    const description = document.querySelector('.hero-details .description');
    
    if (toggleBtn && description) {
        toggleBtn.addEventListener('click', () => {
            description.classList.toggle('collapsed');
            toggleBtn.textContent = description.classList.contains('collapsed') ? 'Show more' : 'Show less';
        });
    }
}