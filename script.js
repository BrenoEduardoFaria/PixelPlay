const games = [
  { nome: "The Legend of Zelda: Breath of the Wild", categoria: "aventura", descricao: "Explore Hyrule livremente e enfrente Ganon.", ano: 2017 },
  { nome: "Stardew Valley", categoria: "simulação", descricao: "Crie sua fazenda e viva uma vida pacífica no campo.", ano: 2016 },
  { nome: "Celeste", categoria: "ação", descricao: "Supere desafios em uma montanha cheia de simbolismo e dificuldade.", ano: 2018 },
  { nome: "The Witcher 3: Wild Hunt", categoria: "rpg", descricao: "Siga Geralt em uma jornada épica por um mundo rico e perigoso.", ano: 2015 },
  { nome: "Civilization VI", categoria: "estratégia", descricao: "Construa um império que resista ao tempo e à história.", ano: 2016 },
];

const grid = document.getElementById("games-grid");
const favGrid = document.getElementById("fav-grid");
const randomCard = document.getElementById("random-card");
const searchInput = document.getElementById("search");
const filterSelect = document.getElementById("filter-category");

let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

function renderGames(lista) {
  grid.innerHTML = "";
  lista.forEach(game => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${game.nome}</h3>
      <p>${game.descricao}</p>
      <p class="muted">${game.ano} • ${game.categoria}</p>
      <button class="btn" onclick="toggleFav('${game.nome}')">
        ${favoritos.includes(game.nome) ? "★ Favorito" : "☆ Favoritar"}
      </button>
    `;
    grid.appendChild(card);
  });
}
function renderFavs() {
  favGrid.innerHTML = "";
  favoritos.forEach(nome => {
    const game = games.find(g => g.nome === nome);
    if (game) {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<h3>${game.nome}</h3><p>${game.descricao}</p>`;
      favGrid.appendChild(card);
    }
  });
}
function toggleFav(nome) {
  if (favoritos.includes(nome)) {
    favoritos = favoritos.filter(f => f !== nome);
  } else {
    favoritos.push(nome);
  }
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
  renderGames(games);
  renderFavs();
}
document.getElementById("discover").onclick = () => {
  const random = games[Math.floor(Math.random() * games.length)];
  randomCard.innerHTML = `
    <h3>${random.nome}</h3>
    <p>${random.descricao}</p>
    <p class="muted">${random.ano} • ${random.categoria}</p>
  `;
  randomCard.style.animation = "fadeIn 0.6s ease";
};
searchInput.oninput = () => {
  const query = searchInput.value.toLowerCase();
  const filtrados = games.filter(g => g.nome.toLowerCase().includes(query));
  renderGames(filtrados);
};
filterSelect.onchange = () => {
  const categoria = filterSelect.value;
  const filtrados = categoria === "all" ? games : games.filter(g => g.categoria === categoria);
  renderGames(filtrados);
};

renderGames(games);
renderFavs();
