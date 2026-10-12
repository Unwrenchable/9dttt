// Add-on game catalog. 9D Tic-Tac-Toe (flagship) is free and lives on the home page.
// Paywall STUB: unlock state is stored in localStorage only; no real payments.
// In the native apps, replace unlock() with a StoreKit / Google Play Billing purchase.
window.ADDON_GAMES = [
  { id: '4d-chess', title: '4D Chess', icon: '♟️' },
  { id: 'air-hockey', title: 'Air Hockey', icon: '🏒' },
  { id: 'backgammon', title: 'Backgammon', icon: '🎯' },
  { id: 'beach-games', title: 'Beach Games', icon: '🏖️' },
  { id: 'brain-academy', title: 'Brain Academy', icon: '🧠' },
  { id: 'brain-age', title: 'Brain Age', icon: '📚' },
  { id: 'carnival-shooter', title: 'Carnival Shooter', icon: '🎪' },
  { id: 'connect-four', title: 'Connect Four', icon: '🔴' },
  { id: 'contra-commando', title: 'Contra Commando', icon: '🔫' },
  { id: 'crystal-connect', title: 'Crystal Connect', icon: '🔮' },
  { id: 'dimensional-dice', title: 'Dimensional Dice', icon: '🎲' },
  { id: 'dragon-fist', title: 'Dragon Fist', icon: '🐉' },
  { id: 'farkle', title: 'Farkle', icon: '🎲' },
  { id: 'fps-arena', title: 'FPS Arena', icon: '🎮' },
  { id: 'hangman', title: 'Hangman', icon: '🪓' },
  { id: 'mega-heroes', title: 'Mega Heroes', icon: '🦸' },
  { id: 'memory-game', title: 'Memory Game', icon: '🎴' },
  { id: 'monster-rampage', title: 'Monster Rampage', icon: '👹' },
  { id: 'motogp-excite', title: 'MotoGP Excite', icon: '🏍️' },
  { id: 'oregon-trail', title: 'Oregon Trail', icon: '🐂' },
  { id: 'pong', title: 'Pong', icon: '🏓' },
  { id: 'quantum-sudoku', title: 'Quantum Sudoku', icon: '🔢' },
  { id: 'recursive-maze', title: 'Recursive Maze', icon: '🌀' },
  { id: 'reflex-master', title: 'Reflex Master', icon: '⚡' },
  { id: 'sky-ace-combat', title: 'Sky Ace Combat', icon: '✈️' },
  { id: 'space-debris', title: 'Space Debris', icon: '🚀' },
  { id: 'street-brawlers', title: 'Street Brawlers', icon: '👊' },
  { id: 'thirteen', title: 'Thirteen', icon: '🃏' },
  { id: 'tide-turner', title: 'Tide Turner', icon: '🌊' },
  { id: 'tournament-fighters', title: 'Tournament Fighters', icon: '🥊' },
  { id: 'zelda-adventure', title: 'Zelda Adventure', icon: '🗡️' },
];

// Pages that were removed from the catalog; the unlock guard sends them back to the catalog.
window.RETIRED_GAMES = ['crypto-quest'];

(function () {
  const KEY = '9dttt.unlocked';
  // Dev/testing bypass: localStorage.setItem('9dttt.devUnlockAll', '1')
  const DEV_BYPASS_KEY = '9dttt.devUnlockAll';
  const FREE_SAMPLE = ['connect-four']; // one free add-on so the catalog isn't empty
  const devBypass = () => { try { return localStorage.getItem(DEV_BYPASS_KEY) === '1'; } catch (e) { return false; } };
  const load = () => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { return new Set(); } };
  const save = (set) => localStorage.setItem(KEY, JSON.stringify([...set]));
  const isUnlocked = (id) => FREE_SAMPLE.includes(id) || devBypass() || load().has(id);

  function unlock(ids) {
    // TODO(payments): hook up in-app purchase here. Stub just records the unlock.
    const set = load(); ids.forEach((id) => set.add(id)); save(set); render();
  }

  function render() {
    const list = document.getElementById('game-list');
    if (!list) return;
    list.innerHTML = '';
    window.ADDON_GAMES.forEach((g) => {
      const open = isUnlocked(g.id);
      const card = document.createElement('div');
      card.className = 'game-card' + (open ? '' : ' locked') + (g.id === lockedRedirect ? ' highlight' : '');
      card.id = 'card-' + g.id;
      card.innerHTML = `<div class="game-silhouette">${g.icon}</div>
        <div class="game-title">${g.title}</div>
        ${open ? `<a class="download-link" href="games/${g.id}.html">▶ Play</a>`
               : `<button class="unlock-btn" data-id="${g.id}" aria-label="Unlock ${g.title}">🔒 Unlock</button>`}`;
      list.appendChild(card);
    });
    list.querySelectorAll('.unlock-btn').forEach((b) => b.addEventListener('click', () => {
      if (confirm('Payments are not live yet. Unlock this game for testing?')) unlock([b.dataset.id]);
    }));
  }

  // Set when a locked game page redirected here (games.html?locked=<id>)
  let lockedRedirect = null;
  try { lockedRedirect = new URLSearchParams(location.search).get('locked'); } catch (e) {}

  function showLockedNotice() {
    if (!lockedRedirect) return;
    const g = window.ADDON_GAMES.find((x) => x.id === lockedRedirect);
    const list = document.getElementById('game-list');
    if (!g || !list || isUnlocked(g.id)) return;
    const note = document.createElement('p');
    note.className = 'locked-notice';
    note.setAttribute('role', 'status');
    note.textContent = `🔒 ${g.title} is an add-on. Unlock it below to play.`;
    list.parentNode.insertBefore(note, list);
    const card = document.getElementById('card-' + g.id);
    if (card) card.scrollIntoView({ block: 'center' });
  }

  document.addEventListener('DOMContentLoaded', () => {
    render();
    showLockedNotice();
    const all = document.getElementById('unlock-all');
    if (all) all.addEventListener('click', () => {
      if (confirm('Payments are not live yet. Unlock the full catalog for testing?')) unlock(window.ADDON_GAMES.map((g) => g.id));
    });
  });
  window.Catalog = { isUnlocked, unlock, render, devBypass, FREE_SAMPLE };
})();
