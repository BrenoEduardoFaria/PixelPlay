/**
 * PixelPlay Core Logic
 * Arquitetura baseada em Estado Centralizado e Módulos Funcionais
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

  // Inicializador principal
  init: async () => {
    APP.ui.highlightMenu();
    
    // Verifica se estamos numa página que precisa de dados
    const grid = document.getElementById('game-grid');
    if (grid) {
      await APP.data.fetchGames();
      APP.router(); // Decide qual lógica de renderização usar
      APP.events.bindControls();
    }
  },

  // Roteamento simples baseado na URL/Página
  router: () => {
    const path = window.location.pathname;
    if (path.includes('favoritos.html')) {
      APP.render.favorites();
    } else {
      APP.render.library();
    }
  },

  // Módulo de Dados
  data: {
    fetchGames: async () => {
      const grid = document.getElementById('game-grid');
      grid.innerHTML = '<div class="loading">Carregando biblioteca neural...</div>';
      
      try {
        // Simulando delay de rede para realismo
        await new Promise(r => setTimeout(r, 600)); 
        
        const response = await fetch('games.json');
        if (!response.ok) throw new Error('Falha na conexão');
        
        APP.state.games = await response.json();
      } catch (err) {
        console.error(err);
        grid.innerHTML = '<div class="error">Erro ao carregar dados. Verifique o JSON.</div>';
      }
    },

    toggleFavorite: (id) => {
      const index = APP.state.favorites.indexOf(id);
      if (index === -1) {
        APP.state.favorites.push(id);
      } else {
        APP.state.favorites.splice(index, 1);
      }
      
      // Persistência
      localStorage.setItem('pixelPlayFavs', JSON.stringify(APP.state.favorites));
      
      // Re-renderizar se necessário
      APP.router();
    }
  },

  // Módulo de Renderização
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
        grid.innerHTML = '<div class="empty">Nenhum jogo encontrado com esses filtros.</div>';
        return;
      }

      const fragment = document.createDocumentFragment();

      games.forEach(game => {
        const isFav = APP.state.favorites.includes(game.id);
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
          <img src="${game.image}" alt="${game.title}" class="card-img" loading="lazy">
          <div class="card-content">
            <div class="card-header">
              <div class="card-title">${game.title}</div>
              <div class="card-rating">${game.rating}</div>
            </div>
            <div class="card-meta">
              <span class="tag">${game.genre}</span>
              <span class="tag">${game.year}</span>
            </div>
            <p style="font-size: 0.9rem; color: #bbb; margin-bottom: 1rem;">${game.desc}</p>
            <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${game.id}">
              ${isFav ? '★ Salvo nos Favoritos' : '☆ Adicionar aos Favoritos'}
            </button>
          </div>
        `;
        fragment.appendChild(card);
      });

      grid.appendChild(fragment);
    }
  },

  // Utilitários e Algoritmos
  utils: {
    // Pipeline de filtragem
    processFilters: (dataSet) => {
      let result = [...dataSet];
      const { search, genre, sort } = APP.state.filters;

      // 1. Busca (Case insensitive)
      if (search) {
        const term = search.toLowerCase();
        result = result.filter(g => 
          g.title.toLowerCase().includes(term) || 
          g.desc.toLowerCase().includes(term)
        );
      }

      // 2. Filtro de Gênero
      if (genre !== 'all') {
        result = result.filter(g => g.genre === genre);
      }

      // 3. Ordenação
      result.sort((a, b) => {
        if (sort === 'rating') return b.rating - a.rating;
        if (sort === 'year') return b.year - a.year;
        if (sort === 'az') return a.title.localeCompare(b.title);
        return 0;
      });

      return result;
    },

    // Função Debounce (Performance na digitação)
    debounce: (func, wait) => {
      let timeout;
      return function(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
  },

  // Gerenciamento de Eventos
  events: {
    bindControls: () => {
      const searchInput = document.getElementById('search');
      const genreSelect = document.getElementById('genre');
      const sortSelect = document.getElementById('sort');
      const grid = document.getElementById('game-grid');

      // Busca com Debounce (evita renderizar a cada tecla se digitar rápido)
      if (searchInput) {
        searchInput.addEventListener('input', APP.utils.debounce((e) => {
          APP.state.filters.search = e.target.value;
          APP.router();
        }, 300));
      }

      // Filtros imediatos
      [genreSelect, sortSelect].forEach(el => {
        if (el) {
          el.addEventListener('change', (e) => {
            APP.state.filters[e.target.id] = e.target.value;
            APP.router();
          });
        }
      });

      // Delegação de Eventos (Event Delegation) para cliques nos botões
      // Isso permite que botões criados dinamicamente funcionem sem novos listeners
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

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', APP.init);
