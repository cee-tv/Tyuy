// My List functionality
const MY_LIST_KEY = 'netflix_my_list';

export function getMyList() {
    const list = localStorage.getItem(MY_LIST_KEY);
    return list ? JSON.parse(list) : [];
}

export function addToMyList(item) {
    const list = getMyList();
    const exists = list.find(x => x.id === item.id && x.type === item.type);
    if (!exists) {
        list.push(item);
        localStorage.setItem(MY_LIST_KEY, JSON.stringify(list));
        return true;
    }
    return false;
}

export function removeFromMyList(id, type) {
    const list = getMyList();
    const newList = list.filter(x => !(x.id === id && x.type === type));
    localStorage.setItem(MY_LIST_KEY, JSON.stringify(newList));
}

export function isInMyList(id, type) {
    const list = getMyList();
    return list.some(x => x.id === id && x.type === type);
}

export async function updateMyListPage() {
    const list = getMyList();
    const container = document.querySelector('.my-list-content .cards-container');
    
    if (!container) return;
    
    if (list.length === 0) {
        container.innerHTML = `
            <div class="no-content">
                <h3>Your list is empty</h3>
                <p>Add movies and TV shows to your list to watch them later</p>
            </div>
        `;
        return;
    }

    container.innerHTML = list.map(item => `
        <div class="card" data-id="${item.id}" data-type="${item.type}">
            <div class="poster">
                <img src="${item.poster}" alt="${item.title} Poster" 
                     onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
            </div>
            <div class="card-details">
                <h3>${item.title}</h3>
                <div class="card-actions">
                    <button class="remove-from-list-btn" data-id="${item.id}" data-type="${item.type}">
                        <i class="fas fa-check"></i> Remove
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.remove-from-list-btn')) {
                e.preventDefault();
                const button = e.target.closest('.remove-from-list-btn');
                removeFromMyList(button.dataset.id, button.dataset.type);
                updateMyListPage();
            } else {
                const id = card.dataset.id;
                const type = card.dataset.type;
                const url = `/${type}/info/${id}`;
                history.pushState(null, null, url);
                window.dispatchEvent(new Event('popstate'));
            }
        });
    });
}