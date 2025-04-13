import { getTVDetails, getSimilarTVShows, getTVSeasonDetails } from './api.js';
import { addToMyList, removeFromMyList, isInMyList } from './my-list.js';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export async function updateTVDetailsPage(tvId) {
    try {
        const tvDetails = await getTVDetails(tvId);
        updateDetailsUI(tvDetails);
        await loadSimilarTVShows(tvId);
        setupSeasonSelection(tvDetails);
        setupTabSwitching();
    } catch (error) {
        console.error('Error loading TV details:', error);
    }
}

function updateDetailsUI(details) {
    const detailsHero = document.querySelector('.details-hero');
    const heroDetails = document.querySelector('.hero-details');
    
    if (!detailsHero || !heroDetails) return;
    
    // Update hero background
    detailsHero.style.backgroundImage = `linear-gradient(to top, #141414, transparent), url('${details.backdrop}')`;
    
    // Update hero content
    const myListButtonHtml = isInMyList(details.id, 'tv')
        ? `<button class="my-list-btn"><i class="fas fa-check"></i> Remove from List</button>`
        : `<button class="my-list-btn"><i class="fas fa-plus"></i> My List</button>`;
        
    heroDetails.innerHTML = `
        <h1>${details.title}</h1>
        <div class="badges">
            <span class="match">${details.rating}% Match</span>
            <span class="year">${details.year}</span>
            <span class="maturity">TV-14</span>
            <span class="seasons">${details.seasons} Seasons</span>
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
        const isInList = isInMyList(details.id, 'tv');
        if (isInList) {
            removeFromMyList(details.id, 'tv');
            myListBtn.innerHTML = '<i class="fas fa-plus"></i> My List';
        } else {
            addToMyList({
                id: details.id,
                type: 'tv',
                title: details.title,
                poster: details.poster
            });
            myListBtn.innerHTML = '<i class="fas fa-check"></i> Remove from List';
        }
    });

    // Set up description toggle
    setupDescriptionToggle();
    
    // Load additional details
    const detailsContainer = document.querySelector('.tv-details-container');
    if (detailsContainer) {
        detailsContainer.innerHTML = `
            <div class="detail-section">
                <h3>Show Info</h3>
                <div class="detail-item"><span class="detail-label">Creator:</span> ${details.crew?.filter(c => c.job === 'Creator').map(d => d.name).join(', ') || 'N/A'}</div>
                <div class="detail-item"><span class="detail-label">Seasons:</span> ${details.seasons || 'N/A'}</div>
                <div class="detail-item"><span class="detail-label">Episodes:</span> ${details.episodes || 'N/A'}</div>
                <div class="detail-item"><span class="detail-label">First Aired:</span> ${new Date(details.first_air_date).toLocaleDateString()}</div>
                <div class="detail-item"><span class="detail-label">Last Aired:</span> ${new Date(details.last_air_date).toLocaleDateString()}</div>
                <div class="detail-item"><span class="detail-label">Status:</span> ${details.status || 'N/A'}</div>
                <div class="detail-item"><span class="detail-label">Type:</span> ${details.type || 'N/A'}</div>
                <div class="detail-item"><span class="detail-label">Language:</span> ${details.original_language?.toUpperCase() || 'N/A'}</div>
                <div class="detail-item"><span class="detail-label">Networks:</span> ${details.networks?.map(n => n.name).join(', ') || 'N/A'}</div>
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

async function loadSimilarTVShows(tvId) {
    try {
        const similarShows = await getSimilarTVShows(tvId);
        const similarContainer = document.querySelector('.similar-shows');
        if (similarContainer) {
            similarContainer.innerHTML = similarShows.map(show => `
                <div class="card" data-id="${show.id}" data-type="tv">
                    <div class="poster">
                        <img src="${show.poster}" alt="${show.title} Poster" 
                             onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
                    </div>
                    <div class="card-details">
                        <h3>${show.title}</h3>
                        <span class="match">${show.rating}% Match</span>
                    </div>
                </div>
            `).join('');
            
            // Add click handlers for similar TV show cards
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
        console.error('Error loading similar TV shows:', error);
    }
}

function updateSeasonInfo(seasonDetails) {
    const seasonInfo = document.querySelector('.season-info');
    const episodeList = document.querySelector('.episode-list');
    
    if (seasonInfo && seasonDetails) {
        seasonInfo.innerHTML = `
            <div class="season-header">
                <h2>${seasonDetails.name}</h2>
                <p class="season-date">${seasonDetails.air_date ? new Date(seasonDetails.air_date).toLocaleDateString() : 'No air date'}</p>
            </div>
            <p class="season-description collapsed">${seasonDetails.overview || 'No overview available'}</p>
            <button class="toggle-season-description">Show more</button>
        `;
        
        // Set up season description toggle
        setupSeasonDescriptionToggle();
    }
    
    if (episodeList && seasonDetails && seasonDetails.episodes) {
        const initialEpisodes = seasonDetails.episodes.slice(0, 3);
        const remainingEpisodes = seasonDetails.episodes.slice(3);
        
        episodeList.innerHTML = `
            <h3>Episodes</h3>
            <div class="episodes-container">
                ${initialEpisodes.map(episode => createEpisodeCard(episode)).join('')}
            </div>
            <div class="episodes-container collapsed">
                ${remainingEpisodes.map(episode => createEpisodeCard(episode)).join('')}
            </div>
            ${remainingEpisodes.length > 0 ? '<button class="toggle-episodes">Show more episodes</button>' : ''}
        `;
        
        // Set up episodes toggle
        setupEpisodesToggle();
    }
}

function createEpisodeCard(episode) {
    return `
        <div class="episode-card">
            <div class="episode-image">
                <img src="${episode.still || 'https://via.placeholder.com/300x170?text=No+Image'}" alt="Episode ${episode.episode_number}">
            </div>
            <div class="episode-details">
                <div class="episode-number">${episode.episode_number}</div>
                <h4 class="episode-title">${episode.name}</h4>
                <p class="episode-overview collapsed">${episode.overview || 'No description available'}</p>
                <button class="toggle-episode-overview">Show more</button>
                <div class="episode-meta">
                    <span class="episode-runtime">${episode.runtime ? `${episode.runtime} min` : 'N/A'}</span>
                    <span class="episode-rating">${episode.vote_average ? `★ ${episode.vote_average.toFixed(1)}` : ''}</span>
                    <span class="episode-date">${episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'No air date'}</span>
                </div>
            </div>
        </div>
    `;
}

function setupSeasonSelection(details) {
    const seasonDropdown = document.getElementById('season-dropdown');
    if (seasonDropdown && details.seasons > 0) {
        // Clear existing options
        seasonDropdown.innerHTML = '';
        
        // Populate dropdown with seasons
        for (let i = 1; i <= details.seasons; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Season ${i}`;
            seasonDropdown.appendChild(option);
        }
        
        // Initial season load
        loadSeasonDetails(details.id, 1);
        
        // Handle season selection change
        seasonDropdown.addEventListener('change', async () => {
            const selectedSeason = seasonDropdown.value;
            await loadSeasonDetails(details.id, selectedSeason);
        });
    }
}

async function loadSeasonDetails(tvId, seasonNumber) {
    try {
        const seasonDetails = await getTVSeasonDetails(tvId, seasonNumber);
        updateSeasonInfo(seasonDetails);
    } catch (error) {
        console.error('Error loading season details:', error);
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

function setupSeasonDescriptionToggle() {
    const toggleBtn = document.querySelector('.toggle-season-description');
    const description = document.querySelector('.season-description');
    
    if (toggleBtn && description) {
        toggleBtn.addEventListener('click', () => {
            description.classList.toggle('collapsed');
            toggleBtn.textContent = description.classList.contains('collapsed') ? 'Show more' : 'Show less';
        });
    }
}

function setupEpisodesToggle() {
    const toggleBtn = document.querySelector('.toggle-episodes');
    const collapsedEpisodes = document.querySelector('.episodes-container.collapsed');
    
    if (toggleBtn && collapsedEpisodes) {
        toggleBtn.addEventListener('click', () => {
            collapsedEpisodes.classList.toggle('collapsed');
            toggleBtn.textContent = collapsedEpisodes.classList.contains('collapsed') ? 'Show more episodes' : 'Show fewer episodes';
        });
    }
    
    // Set up individual episode overview toggles
    document.querySelectorAll('.toggle-episode-overview').forEach(btn => {
        const overview = btn.previousElementSibling;
        
        btn.addEventListener('click', () => {
            overview.classList.toggle('collapsed');
            btn.textContent = overview.classList.contains('collapsed') ? 'Show more' : 'Show less';
        });
    });
}