const TMDB_API_KEY = 'c05110ffcce825d8c2b38895645b0e32';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

async function fetchFromTMDB(endpoint, params = {}) {
    const queryParams = new URLSearchParams({
        api_key: TMDB_API_KEY,
        ...params
    });
    
    const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${queryParams}`);
    return response.json();
}

export async function getHeroContent() {
    // Get trending content for hero section
    const data = await fetchFromTMDB('/trending/tv/week');
    const heroItem = data.results[0];
    
    return {
        title: heroItem.name,
        description: heroItem.overview,
        backdrop: `${TMDB_IMAGE_BASE}/original${heroItem.backdrop_path}`,
        year: new Date(heroItem.first_air_date).getFullYear(),
        rating: Math.round(heroItem.vote_average * 10),
        genres: await getGenres(heroItem.genre_ids, 'tv')
    };
}

export async function getGenres(genreIds, type = 'movie') {
    const data = await fetchFromTMDB(`/genre/${type}/list`);
    return genreIds
        .map(id => data.genres.find(g => g.id === id)?.name)
        .filter(name => name);
}

export async function getMovieDetails(movieId) {
    const data = await fetchFromTMDB(`/movie/${movieId}`);
    
    // Get credits in the same request to avoid multiple API calls
    const credits = await fetchFromTMDB(`/movie/${movieId}/credits`);
    
    return {
        title: data.title,
        overview: data.overview,
        backdrop: `${TMDB_IMAGE_BASE}/original${data.backdrop_path}`,
        poster: `${TMDB_IMAGE_BASE}/w500${data.poster_path}`,
        year: new Date(data.release_date).getFullYear(),
        rating: Math.round(data.vote_average * 10),
        genres: data.genres.map(g => g.name),
        adult: data.adult,
        runtime: data.runtime,
        budget: data.budget,
        revenue: data.revenue,
        status: data.status,
        tagline: data.tagline,
        production_companies: data.production_companies,
        release_date: data.release_date,
        vote_count: data.vote_count,
        vote_average: data.vote_average,
        popularity: data.popularity,
        original_language: data.original_language,
        cast: credits.cast?.slice(0, 10) || [],
        crew: credits.crew?.filter(person => 
            person.job === "Director" || 
            person.job === "Producer" || 
            person.job === "Writer"
        ).slice(0, 5) || []
    };
}

export async function getTVDetails(tvId) {
    const data = await fetchFromTMDB(`/tv/${tvId}`);
    const credits = await fetchFromTMDB(`/tv/${tvId}/credits`);
    
    return {
        id: data.id,
        title: data.name,
        overview: data.overview,
        backdrop: `${TMDB_IMAGE_BASE}/original${data.backdrop_path}`,
        poster: `${TMDB_IMAGE_BASE}/w500${data.poster_path}`,
        year: new Date(data.first_air_date).getFullYear(),
        rating: Math.round(data.vote_average * 10),
        genres: data.genres.map(g => g.name),
        seasons: data.number_of_seasons,
        episodes: data.number_of_episodes,
        first_air_date: data.first_air_date,
        last_air_date: data.last_air_date,
        networks: data.networks,
        status: data.status,
        type: data.type,
        vote_count: data.vote_count,
        vote_average: data.vote_average,
        popularity: data.popularity,
        original_language: data.original_language,
        cast: credits.cast?.slice(0, 10) || [],
        crew: credits.crew?.filter(person => 
            person.job === "Creator" || 
            person.job === "Executive Producer" || 
            person.job === "Producer"
        ).slice(0, 5) || [],
        season_details: []
    };
}

export async function getTVSeasonDetails(tvId, seasonNumber) {
    const data = await fetchFromTMDB(`/tv/${tvId}/season/${seasonNumber}`);
    return {
        id: data.id,
        name: data.name,
        overview: data.overview,
        poster: data.poster_path ? `${TMDB_IMAGE_BASE}/w500${data.poster_path}` : null,
        season_number: data.season_number,
        air_date: data.air_date,
        episodes: data.episodes.map(episode => ({
            id: episode.id,
            name: episode.name,
            overview: episode.overview,
            still: episode.still_path ? `${TMDB_IMAGE_BASE}/w300${episode.still_path}` : null,
            air_date: episode.air_date,
            episode_number: episode.episode_number,
            runtime: episode.runtime,
            vote_average: episode.vote_average
        }))
    };
}

export async function getSimilarTVShows(tvId) {
    const data = await fetchFromTMDB(`/tv/${tvId}/similar`);
    return data.results.slice(0, 10).map(show => ({
        id: show.id,
        title: show.name,
        poster: show.poster_path ? `${TMDB_IMAGE_BASE}/w500${show.poster_path}` : null,
        year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'Unknown',
        rating: Math.round(show.vote_average * 10),
        type: 'tv'
    }));
}

export async function getSimilarMovies(movieId) {
    const data = await fetchFromTMDB(`/movie/${movieId}/similar`);
    return data.results.slice(0, 10).map(movie => ({
        id: movie.id,
        title: movie.title,
        poster: movie.poster_path ? `${TMDB_IMAGE_BASE}/w500${movie.poster_path}` : null,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown',
        rating: Math.round(movie.vote_average * 10),
        type: 'movie'
    }));
}

export async function getRandomContent(type = 'all') {
    let endpoint;
    switch(type) {
        case 'movie':
            endpoint = '/movie/popular';
            break;
        case 'tv':
            endpoint = '/tv/popular';
            break;
        default:
            endpoint = '/trending/all/week';
    }
    
    const data = await fetchFromTMDB(endpoint);
    const randomIndex = Math.floor(Math.random() * data.results.length);
    const item = data.results[randomIndex];
    
    return {
        id: item.id,
        title: item.title || item.name,
        description: item.overview,
        backdrop: `${TMDB_IMAGE_BASE}/original${item.backdrop_path}`,
        year: new Date(item.release_date || item.first_air_date).getFullYear(),
        rating: Math.round(item.vote_average * 10),
        genres: await getGenres(item.genre_ids, item.title ? 'movie' : 'tv'),
        type: item.title ? 'movie' : 'tv',
        seasons: item.number_of_seasons
    };
}

export async function getContent(type = 'movie') {
    const categories = {
        movie: [
            {
                title: 'Popular Movies',
                endpoint: '/movie/popular'
            },
            {
                title: 'Top Rated Movies',
                endpoint: '/movie/top_rated'
            },
            {
                title: 'Upcoming Movies',
                endpoint: '/movie/upcoming'
            }
        ],
        tv: [
            {
                title: 'Popular TV Shows',
                endpoint: '/tv/popular'
            },
            {
                title: 'Top Rated TV Shows',
                endpoint: '/tv/top_rated'
            },
            {
                title: 'Currently Airing TV Shows',
                endpoint: '/tv/on_the_air'
            }
        ],
        home: [
            {
                title: 'Trending This Week',
                endpoint: '/trending/all/week'
            },
            {
                title: 'Popular Movies',
                endpoint: '/movie/popular'
            },
            {
                title: 'Popular TV Shows',
                endpoint: '/tv/popular'
            }
        ]
    };

    const selectedCategories = categories[type] || categories.home;
    
    const results = await Promise.all(
        selectedCategories.map(async category => {
            const data = await fetchFromTMDB(category.endpoint);
            return {
                title: category.title,
                items: data.results.map(item => ({
                    id: item.id,
                    title: item.title || item.name,
                    poster: `${TMDB_IMAGE_BASE}/w500${item.poster_path}`,
                    type: item.title ? 'movie' : 'tv'
                }))
            };
        })
    );

    return results;
}

export async function searchContent(query) {
    if (!query) return [];
    
    try {
        const [movieResults, tvResults] = await Promise.all([
            fetchFromTMDB('/search/movie', { query }),
            fetchFromTMDB('/search/tv', { query })
        ]);

        const movies = movieResults.results.map(item => ({
            id: item.id,
            title: item.title,
            type: 'movie',
            year: item.release_date ? new Date(item.release_date).getFullYear() : '',
            poster: item.poster_path ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}` : null,
            rating: Math.round(item.vote_average * 10),
            overview: item.overview
        }));

        const tvShows = tvResults.results.map(item => ({
            id: item.id,
            title: item.name,
            type: 'tv',
            year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : '',
            poster: item.poster_path ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}` : null,
            rating: Math.round(item.vote_average * 10),
            overview: item.overview
        }));

        return [...movies, ...tvShows].sort((a, b) => b.rating - a.rating).slice(0, 20);
    } catch (error) {
        console.error('Error searching content:', error);
        return [];
    }
}