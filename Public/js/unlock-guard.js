// Add-on unlock guard. Include right after <head> on every add-on game page, AFTER js/catalog.js:
//   <script src="../js/catalog.js"></script>
//   <script src="../js/unlock-guard.js"></script>
// If the add-on is locked (Catalog unlock state in localStorage), redirect to the catalog
// at /games.html?locked=<id> before the game loads. Connect Four is the free sample.
// Dev bypass: localStorage.setItem('9dttt.devUnlockAll', '1').
//
// NOTE: this is a client-side UX gate only and is NOT secure: anyone can edit localStorage
// or the page. Real enforcement will come with in-app purchase receipts
// (StoreKit / Google Play Billing) validated server-side.
(function () {
  try {
    var m = location.pathname.match(/([a-z0-9-]+)(?:\.html)?\/?$/i);
    var id = m && m[1];
    if (!id || !window.ADDON_GAMES || !window.Catalog) return;
    var target = null;
    if ((window.RETIRED_GAMES || []).indexOf(id) !== -1) {
      target = '/games.html';
    } else {
      var known = window.ADDON_GAMES.some(function (g) { return g.id === id; });
      if (known && !window.Catalog.isUnlocked(id)) target = '/games.html?locked=' + encodeURIComponent(id);
    }
    if (target) {
      document.documentElement.style.visibility = 'hidden';
      location.replace(target);
    }
  } catch (e) {
    // Never block the game because the guard itself failed.
  }
})();
