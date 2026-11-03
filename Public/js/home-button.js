// Shared, always-visible navigation for game pages.
// Fixed top-left, high contrast, 44px touch targets, safe-area aware.
//   - 9D page (ultimate-tictactoe): [🏠 Home]            -> /
//   - add-on pages:                 [🏠 Home] [🎮 Games]  -> /  and  /games.html
// The existing "#main-content" link is the accessibility skip link and stays as-is
// (off-screen until focused); this button is the visible way home.
(function () {
    if (document.getElementById('home-nav')) return;
    var isFlagship = /ultimate-tictactoe/.test(location.pathname);

    var style = document.createElement('style');
    style.textContent = [
        '#home-nav{position:fixed;z-index:1000000;display:flex;gap:6px;',
        ' top:calc(8px + env(safe-area-inset-top, 0px));left:calc(8px + env(safe-area-inset-left, 0px));}',
        '#home-nav a{display:inline-flex;align-items:center;justify-content:center;gap:4px;',
        ' min-width:44px;min-height:44px;padding:0 12px;box-sizing:border-box;border-radius:22px;',
        ' background:#0a0e27;color:#fff;border:2px solid #FFD700;font:700 15px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;',
        ' text-decoration:none;box-shadow:0 2px 10px rgba(0,0,0,.45);-webkit-tap-highlight-color:transparent;}',
        '#home-nav a:hover,#home-nav a:focus-visible{background:#FFD700;color:#0a0e27;outline:3px solid #fff;outline-offset:2px;}',
        '#home-nav .hn-label{white-space:nowrap;}',
        // narrow phones: icon-only to stay clear of game HUDs
        '@media (max-width:480px),(max-height:500px){#home-nav a{padding:0;width:44px;}#home-nav .hn-label{display:none;}}',
        // the floating ☰ game menu (universal-game-integration.js) normally sits at top-left: move it right of the nav
        'body.has-home-nav button[aria-label="Game Menu"],body.has-home-nav #game-menu-btn{left:calc(var(--home-nav-w,60px) + 16px + env(safe-area-inset-left, 0px)) !important;}',
        '@media print{#home-nav{display:none}}'
    ].join('');
    document.head.appendChild(style);

    var nav = document.createElement('nav');
    nav.id = 'home-nav';
    nav.setAttribute('aria-label', 'Site navigation');
    nav.innerHTML =
        '<a href="/" aria-label="Home"><span aria-hidden="true">🏠</span><span class="hn-label">Home</span></a>' +
        (isFlagship ? '' :
        '<a href="/games.html" aria-label="All games"><span aria-hidden="true">🎮</span><span class="hn-label">Games</span></a>');

    // Keep page titles from sitting under the nav: pad the title on both sides
    // (symmetric, so centered titles stay centered).
    function clearTitles() {
        var nb = nav.getBoundingClientRect();
        var titles = document.querySelectorAll('h1, header h2, .game-title-bar, .menu-title');
        for (var i = 0; i < titles.length; i++) {
            var t = titles[i];
            if (t.dataset.hnPadded) { t.style.paddingLeft = t.style.paddingRight = t.style.maxWidth = ''; delete t.dataset.hnPadded; }
            var b = t.getBoundingClientRect();
            if (!b.width || b.top > nb.bottom || b.bottom < nb.top) continue;
            if (b.left < nb.right && b.right > nb.left) {
                var pad = Math.ceil(nb.right - Math.max(b.left, 0) + 8) + 'px';
                t.style.boxSizing = 'border-box';
                t.style.maxWidth = '100%'; // never widen shrink-to-fit titles past the viewport
                t.style.paddingLeft = pad;
                t.style.paddingRight = pad;
                t.dataset.hnPadded = '1';
            }
        }
    }

    function mount() {
        // After the skip link so keyboard order stays: skip link, home nav, game.
        var skip = document.querySelector('.skip-link');
        if (skip && skip.parentNode === document.body) skip.after(nav); else document.body.insertBefore(nav, document.body.firstChild);
        document.body.classList.add('has-home-nav');
        var setW = function () {
            document.documentElement.style.setProperty('--home-nav-w', Math.ceil(nav.getBoundingClientRect().width) + 'px');
        };
        setW();
        clearTitles();
        window.addEventListener('resize', function () { setW(); clearTitles(); });
        setTimeout(clearTitles, 800); // after games finish laying out
    }
    if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
