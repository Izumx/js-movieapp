const SEARCH_API = "https://www.googleapis.com/books/v1/volumes?q=";

const main = document.getElementById("main");
const searchInput = document.getElementById("search");
const form = document.getElementById("form");
const loading = document.getElementById("loading");
const favoritesLink = document.getElementById("favorites-link");
const homeLink = document.getElementById("home-link");

const dbName = "BookDB";
const storeName = "favs";

let currentQuery = "javascript";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(storeName, { keyPath: "id" });
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function getFavs() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });
}

async function toggleFav(book) {
  const db = await openDB();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);

  const getReq = store.get(book.id);

  getReq.onsuccess = () => {
    if (getReq.result) {
      store.delete(book.id);
    } else {
      store.put(book);
    }
  };

  tx.oncomplete = () => fetchBooks(currentQuery);
}


async function fetchBooks(query) {
  currentQuery = query;
  loading.classList.remove("hidden");

  try {
    const res = await fetch(SEARCH_API + query);
    const data = await res.json();
    renderBooks(data.items || []);
  } catch (err) {
    console.error(err);
  } finally {
    loading.classList.add("hidden");
  }
}


async function renderBooks(books) {
  const favs = await getFavs();
  main.innerHTML = "";

  books.forEach((book) => {
    const info = book.volumeInfo;
    if (!info.imageLinks?.thumbnail) return;

    const isFav = favs.some((f) => f.id === book.id);

    const card = document.createElement("div");
    card.className = "bg-slate-800 p-4 rounded shadow relative";

    card.innerHTML = `
      <img src="${info.imageLinks.thumbnail}" 
           class="w-full h-60 object-cover rounded mb-3">

      <h3 class="font-bold mb-1">${info.title}</h3>

      <p class="text-sm text-slate-400 mb-2">
        ${info.authors?.join(", ") || "Unknown Author"}
      </p>

      <button class="fav-btn absolute top-3 right-3 text-xl">
        ${isFav ? "❤️" : "🤍"}
      </button>
    `;

    card.querySelector(".fav-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFav({
        id: book.id,
        title: info.title,
        authors: info.authors,
        imageLinks: info.imageLinks
      });
    });

    main.appendChild(card);
  });
}


async function showFavorites() {
  loading.classList.remove("hidden");

  const favs = await getFavs();
  main.innerHTML = "";

  if (favs.length === 0) {
    main.innerHTML = "<h2 class='text-xl'>No favorites yet ❤️</h2>";
    loading.classList.add("hidden");
    return;
  }

  favs.forEach((info) => {
    const card = document.createElement("div");
    card.className = "bg-slate-800 p-4 rounded shadow relative";

    card.innerHTML = `
      <img src="${info.imageLinks?.thumbnail || ""}" 
           class="w-full h-60 object-cover rounded mb-3">

      <h3 class="font-bold mb-1">${info.title}</h3>

      <p class="text-sm text-slate-400 mb-2">
        ${info.authors?.join(", ") || "Unknown Author"}
      </p>

      <button class="remove-btn absolute top-3 right-3 text-xl">
        ❤️
      </button>
    `;

    card.querySelector(".remove-btn").addEventListener("click", async () => {
      const db = await openDB();
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).delete(info.id);
      tx.oncomplete = showFavorites;
    });

    main.appendChild(card);
  });

  loading.classList.add("hidden");
}


form.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (query) fetchBooks(query);
});

favoritesLink.addEventListener("click", (e) => {
  e.preventDefault();
  showFavorites();
});

homeLink.addEventListener("click", () => {
  fetchBooks(currentQuery);
});


fetchBooks(currentQuery);