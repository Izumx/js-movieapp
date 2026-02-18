const API_KEY = "3fd2be6f0c70a2a598f084ddfb75487c";
const BASE_URL = "https://api.themoviedb.org/3";
const API_URL = `${BASE_URL}/discover/movie?sort_by=popularity.desc&api_key=${API_KEY}`;
const IMG_PATH = "https://image.tmdb.org/t/p/w1280";
const SEARCH_API = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=`;

const main = document.getElementById("main");
const form = document.getElementById("form");
const search = document.getElementById("search");
const loading = document.getElementById("loading");
const modal = document.getElementById("movie-modal");

getMovies(API_URL);

async function getMovies(url) {
    loading.classList.remove("hidden");
    try {
        const res = await fetch(url);
        const data = await res.json();
        showMovies(data.results || []);
    } catch {
        main.innerHTML = `<h2 class="text-xl text-center col-span-full text-red-500">Error fetching data.</h2>`;
    } finally {
        loading.classList.add("hidden");
    }
}

function showMovies(movies) {
    main.innerHTML = '';
    if (!movies.length) return main.innerHTML = `<h2 class="text-xl text-center col-span-full">No results found.</h2>`;

    movies.forEach(movie => {
        const { title, poster_path, vote_average, release_date, id } = movie;
        if (!poster_path) return;

        const isFav = isFavorite(id);
        const movieEl = document.createElement('div');
        movieEl.className = 'bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition cursor-pointer group relative';
        movieEl.innerHTML = `<div class="relative aspect-[2/3] overflow-hidden">
                <img src="${IMG_PATH + poster_path}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                <div class="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-sm font-bold flex items-center gap-1 backdrop-blur-sm">
                    <span class="text-yellow-400">★</span> ${vote_average.toFixed(1)}
                </div>
                <button class="fav-btn absolute top-2 left-2 p-2 rounded-full bg-black/50 hover:bg-black/80 transition z-10 text-white">${getHeartIcon(isFav)}</button>
            </div>
            <div class="p-4">
                <h3 class="text-white text-lg font-semibold truncate group-hover:text-yellow-400 transition">${title}</h3>
                <p class="text-slate-400 text-sm mt-1">${release_date?.split('-')[0] || 'N/A'}</p>
            </div>`;

        movieEl.addEventListener('click', e =>
            e.target.closest('.fav-btn')
                ? toggleFavorite(movie, e.target.closest('.fav-btn'))
                : openModal(movie)
        );
        main.appendChild(movieEl);
    });
}

function getFavorites() { return JSON.parse(localStorage.getItem('favs') || '[]'); }
function isFavorite(id) { return getFavorites().some(m => m.id === id); }

function toggleFavorite(movie, btn) {
    let favs = getFavorites();
    if (isFavorite(movie.id)) {
        favs = favs.filter(m => m.id !== movie.id);
        btn.innerHTML = getHeartIcon(false);
    } else {
        favs.push(movie);
        btn.innerHTML = getHeartIcon(true);
    }
    localStorage.setItem('favs', JSON.stringify(favs));
    if (main.dataset.view === 'favs') showMovies(favs);
}

function getHeartIcon(filled) {
    return filled
        ? `<svg class="w-6 h-6 text-red-500 fill-current" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/></svg>`
        : `<svg class="w-6 h-6 text-white stroke-current" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>`;
}

function openModal({ title, poster_path, vote_average, overview, release_date, backdrop_path, original_language, vote_count, id }) {
    const isFav = isFavorite(id);
    document.getElementById('modal-content').innerHTML = `
        <div class="md:flex relative">
            <div class="md:absolute inset-0 -z-10 bg-cover bg-center opacity-20" style="background-image: url('${backdrop_path ? IMG_PATH + backdrop_path : ''}')"></div>
            <div class="md:absolute inset-0 -z-10 bg-gradient-to-t md:bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent"></div>
            <div class="p-6 md:p-8 flex flex-col md:flex-row gap-6 w-full">
                <img src="${IMG_PATH + poster_path}" class="w-1/2 md:w-64 rounded-lg shadow-2xl mx-auto md:mx-0">
                <div class="flex-1 text-left">
                    <h2 class="text-3xl font-bold text-white mb-2">${title}</h2>
                    <div class="flex flex-wrap gap-4 text-sm text-slate-300 mb-6">
                        <span class="bg-yellow-500 text-black px-2 rounded font-bold">${vote_average.toFixed(1)}</span>
                        <span>${vote_count} votes</span> • <span>${release_date}</span> • <span class="uppercase">${original_language}</span>
                    </div>
                    <p class="text-lg text-slate-200 mb-6">${overview}</p>
                    <button id="modal-fav-btn" class="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded-full flex items-center gap-2">
                         ${getHeartIcon(isFav)} <span>${isFav ? 'Remove' : 'Add'}</span>
                    </button>
                </div>
            </div>
        </div>`;

    modal.classList.remove('hidden');
    document.body.classList.add('no-scroll');

    document.getElementById('modal-fav-btn').onclick = function () {
        toggleFavorite({ id, title, poster_path, vote_average, overview, release_date, backdrop_path, original_language, vote_count }, { innerHTML: '' });
        this.innerHTML = `${getHeartIcon(!isFav)} <span>${!isFav ? 'Remove' : 'Add'}</span>`;
        const gridBtn = Array.from(document.querySelectorAll(`h3`)).find(e => e.innerText === title)?.closest('.group')?.querySelector('.fav-btn');
        if (gridBtn) gridBtn.innerHTML = getHeartIcon(!isFav);
    };
}

const closeModal = () => { modal.classList.add('hidden'); document.body.classList.remove('no-scroll'); };
document.getElementById('close-modal').onclick = closeModal;
document.getElementById('modal-backdrop').onclick = closeModal;
document.onkeydown = e => e.key === 'Escape' && closeModal();

document.getElementById('favorites-link').onclick = e => {
    e.preventDefault();
    main.dataset.view = 'favs';
    showMovies(getFavorites());
};

form.onsubmit = e => {
    e.preventDefault();
    if (search.value) {
        getMovies(SEARCH_API + encodeURIComponent(search.value));
        search.value = '';
        main.dataset.view = 'search';
    } else location.reload();
};