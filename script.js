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
      // Garante que os controles sejam ligados antes de renderizar
      APP.events.bindControls(); 
      await APP.data.fetchGames();
      APP.router();
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
      if (favGames.length === 0 && APP.state.games.length > 0) { // Verifica se jogos foram carregados
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
      const gameElements = []; // Array para armazenar os elementos DOM criados

      games.forEach(game => {
        const isFav = APP.state.favorites.includes(game.id);
        const card = document.createElement('div');
        card.className = 'game-card'; 
        
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
        gameElements.push(card); // Adiciona o elemento ao array
      });

      grid.appendChild(fragment);

      // NOVO: Animação de entrada sequencial (Staggered Fade-in)
      gameElements.forEach((el, index) => {
        // Aplica a classe 'animate' com um pequeno atraso para cada card
        setTimeout(() => {
          el.classList.add('animate');
        }, index * 50); // Atraso de 50ms entre cada card
      });
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
      // Remove a verificação desnecessária de 'grid', pois os controles
      // só existem se estivermos em 'enciclopedia.html' ou 'favoritos.html'.
      const searchInput = document.getElementById('search');
      const genreSelect = document.getElementById('genre');
      const sortSelect = document.getElementById('sort');
      const grid = document.getElementById('game-grid'); // Adiciona aqui para o delegador de eventos

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

      // Delegação de Eventos no grid (sempre que o elemento grid existir)
      if (grid) {
        grid.addEventListener('click', (e) => {
          // Usa o closest para garantir que o clique foi no botão ou em um de seus filhos
          const favBtn = e.target.closest('.fav-btn');
          if (favBtn) {
            const id = parseInt(favBtn.dataset.id);
            APP.data.toggleFavorite(id);
          }
        });
      }
    }
  },

  ui: {
    highlightMenu: () => {
      const links = document.querySelectorAll('.nav-links a');
      // Obtém o nome do arquivo atual para destacar o menu
      const path = window.location.pathname.split('/').pop() || 'index.html'; 
      links.forEach(link => {
        // Remove a classe 'active' de todos primeiro, para garantir
        link.classList.remove('active');
        if (link.getAttribute('href').split('/').pop() === path) {
          link.classList.add('active');
        }
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', APP.init);
