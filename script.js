/**
 * PixelPlay Core Logic - Advanced Version
 * O cérebro que gerencia o estado, filtros, persistência e renderização das 3 páginas.
 */

const APP = {
  state: {
    games: [],
    favorites: JSON.parse(localStorage.getItem('pixelPlayFavs')) || [],
    filters: {
      search: '',
      genre: 'all',
      sort: 'rating'
    }
  },

  init: async () => {
    APP.ui.highlightMenu();
    const grid = document.getElementById('game-grid');
    if (grid) {
      await APP.data.fetchGames();
      APP.router();
      APP.events.bindControls();
    }
  },

  router: () => {
    const path = window.location.pathname;
    // O router decide qual função de renderização usar baseado na URL
    if (path.includes('favoritos.html')) {
      APP.render.favorites();
    } else {
      APP.render.library();
    }
  },

  data: {
    fetchGames: async () => {
      const grid = document.getElementById('game-grid');
      grid.innerHTML = '<div class="loading">Carregando biblioteca neural...</div>';
      
      try {
        await new Promise(r => setTimeout(r, 300)); 
        const response = await fetch('games.json');
        if (!response.ok) throw new Error('Falha na conexão');
        APP.state.games = await response.json();
        
        // --- LOG DE DEBUG ---
        console.log(`[PixelPlay Debug] Jogos carregados: ${APP.state.games.length} de 50. Se for baixo, o arquivo JSON está em cache.`);
        // --------------------

      } catch (err) {
        console.error(err);
        grid.innerHTML = '<div class="error">Erro ao carregar dados. Verifique a URL do JSON ou se está usando Live Server.</div>';
      }
    },

    toggleFavorite: (id) => {
      const index = APP.state.favorites.indexOf(id);
      if (index === -1) {
        APP.state.favorites.push(id);
      } else {
        APP.state.favorites.splice(index, 1);
      }
      localStorage.setItem('pixelPlayFavs', JSON.stringify(APP.state.favorites));
      APP.router();
    }
  },

  render: {
    library: () => {
      const filtered = APP.utils.processFilters(APP.state.games);
      APP.render.grid(filtered);
    },

    favorites: () => {
      const favGames = APP.state.games.filter(g => APP.state.favorites.includes(g.id));
      const filtered = APP.utils.processFilters(favGames);
      
      const grid = document.getElementById('game-grid');
      if (favGames.length === 0) {
        grid.innerHTML = '<div class="empty">Nenhum favorito salvo ainda.</div>';
        return;
      }
      APP.render.grid(filtered);
    },

    grid: (games) => {
      const grid = document.getElementById('game-grid');
      grid.innerHTML = '';

      if (games.length === 0) {
        grid.innerHTML = '<div class="empty">Nenhum jogo encontrado.</div>';
        return;
      }

      const fragment = document.createDocumentFragment();

      games.forEach(game => {
        const isFav = APP.state.favorites.includes(game.id);
        const card = document.createElement('div');
        card.className = 'game-card'; // Adiciona a classe CSS
        
        card.innerHTML = `
          <div class="desc-popout">
             <h4>${game.title}</h4>
             <p>${game.desc}</p>
          </div>

          <img src="${game.image}" alt="${game.title}" class="card-img" loading="lazy">
          
          <div class="card-content">
            <div class="card-header">
              <div class="card-title">${game.title}</div>
              <div class="card-rating">${game.rating.toFixed(1)}</div>
            </div>
            <div class="card-meta">
              <span class="tag">${game.genre}</span>
              <span class="tag">${game.year}</span>
            </div>
            <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${game.id}">
              ${isFav ? '★ Salvo' : '☆ Favoritar'}
            </button>
          </div>
        `;
        fragment.appendChild(card);
      });

      grid.appendChild(fragment);
    }
  },

  utils: {
    processFilters: (dataSet) => {
      let result = [...dataSet];
      const { search, genre, sort } = APP.state.filters;

      if (search) {
        const term = search.toLowerCase();
        result = result.filter(g => 
          g.title.toLowerCase().includes(term) || 
          g.desc.toLowerCase().includes(term)
        );
      }

      if (genre !== 'all') {
        result = result.filter(g => g.genre === genre);
      }

      result.sort((a, b) => {
        if (sort === 'rating') return b.rating - a.rating;
        if (sort === 'year') return b.year - a.year;
        if (sort === 'az') return a.title.localeCompare(b.title);
        return 0;
      });

      return result;
    },

    // Função Debounce para otimizar a busca
    debounce: (func, wait) => {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    }
  },

  events: {
    bindControls: () => {
      const searchInput = document.getElementById('search');
      const genreSelect = document.getElementById('genre');
      const sortSelect = document.getElementById('sort');
      const grid = document.getElementById('game-grid');

      if (searchInput) {
        searchInput.addEventListener('input', APP.utils.debounce((e) => {
          APP.state.filters.search = e.target.value;
          APP.router();
        }, 250));
      }

      [genreSelect, sortSelect].forEach(el => {
        if (el) {
          el.addEventListener('change', (e) => {
            APP.state.filters[e.target.id] = e.target.value;
            APP.router();
          });
        }
      });

      // Delegação de Eventos no grid
      grid.addEventListener('click', (e) => {
        if (e.target.classList.contains('fav-btn')) {
          const id = parseInt(e.target.dataset.id);
          APP.data.toggleFavorite(id);
        }
      });
    }
  },

  ui: {
    highlightMenu: () => {
      const links = document.querySelectorAll('.nav-links a');
      const path = window.location.pathname.split('/').pop() || 'index.html';
      links.forEach(link => {
        if (link.getAttribute('href') === path) link.classList.add('active');
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', APP.init);
