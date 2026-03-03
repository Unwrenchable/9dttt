/**
 * Speed Router — 9DTTT Gaming Platform
 *
 * Two responsibilities:
 *   1. Connection-quality indicator
 *      Measures round-trip latency to the backend every 30 s and shows a
 *      small coloured indicator in the bottom-right corner of the page.
 *
 *   2. Update detector
 *      Polls /api/version every 5 minutes.  When the server reports a
 *      build-time that is newer than the one the page was loaded with, a
 *      non-blocking banner invites the player to refresh and get the
 *      latest code — exactly what a "speed router" should do.
 *
 * Usage (automatic — just include this script):
 *   <script src="js/speed-router.js"></script>
 *
 * The module exposes window.speedRouter for manual control from the console:
 *   window.speedRouter.checkNow()   — force a version + latency check
 *   window.speedRouter.dismiss()    — hide the update banner
 */

(function () {
    'use strict';

    // ─────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────
    var LATENCY_INTERVAL_MS   = 30  * 1000;  // 30 s
    var VERSION_POLL_MS       = 5   * 60 * 1000;  // 5 min
    var VERSION_ENDPOINT      = '/api/version';
    var HEALTH_ENDPOINT       = '/api/health';
    // Latency thresholds (ms)
    var LATENCY_EXCELLENT = 100;
    var LATENCY_GOOD      = 250;
    var LATENCY_FAIR      = 500;

    // ─────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────
    var pageLoadBuildTime = null; // build_time stamp seen at page-load
    var indicator         = null; // DOM node — the pill badge
    var banner            = null; // DOM node — the update banner
    var dismissed         = false;

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    /**
     * Returns the correct base URL for API calls:
     * – empty string when running on Vercel (proxied), or
     * – the direct Render URL otherwise.
     */
    function apiBase() {
        if (window.API_CONFIG && typeof window.API_CONFIG.baseUrl === 'string') {
            return window.API_CONFIG.baseUrl;
        }
        return '';
    }

    function fetchJSON(path, timeoutMs) {
        timeoutMs = timeoutMs || 8000;
        var controller = typeof AbortController !== 'undefined'
            ? new AbortController() : null;
        var timer = controller
            ? setTimeout(function () { controller.abort(); }, timeoutMs) : null;

        var opts = { cache: 'no-store' };
        if (controller) {
            opts.signal = controller.signal;
        }

        return fetch(apiBase() + path, opts)
            .then(function (r) { return r.json(); })
            .finally(function () { if (timer) clearTimeout(timer); });
    }

    // ─────────────────────────────────────────────
    // DOM — indicator pill
    // ─────────────────────────────────────────────

    function buildIndicator() {
        var el = document.createElement('div');
        el.id = 'sr-indicator';
        el.title = 'Connection quality — Speed Router';
        el.setAttribute('aria-label', 'Connection quality indicator');
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');

        var css = [
            'position:fixed',
            'bottom:14px',
            'right:14px',
            'z-index:9998',
            'display:flex',
            'align-items:center',
            'gap:6px',
            'padding:4px 10px 4px 8px',
            'border-radius:20px',
            'font-size:11px',
            'font-family:system-ui,sans-serif',
            'font-weight:600',
            'letter-spacing:.03em',
            'cursor:default',
            'transition:background .4s,color .4s',
            'background:rgba(10,14,39,.82)',
            'color:#aaa',
            'border:1px solid rgba(255,255,255,.08)',
            'backdrop-filter:blur(6px)',
            '-webkit-backdrop-filter:blur(6px)',
            'box-shadow:0 2px 8px rgba(0,0,0,.4)'
        ].join(';');
        el.style.cssText = css;

        var dot = document.createElement('span');
        dot.id = 'sr-dot';
        dot.style.cssText = [
            'display:inline-block',
            'width:7px',
            'height:7px',
            'border-radius:50%',
            'background:#555',
            'transition:background .4s',
            'flex-shrink:0'
        ].join(';');

        var label = document.createElement('span');
        label.id = 'sr-label';
        label.textContent = '⚡ …';

        el.appendChild(dot);
        el.appendChild(label);
        document.body.appendChild(el);
        return el;
    }

    function setIndicatorQuality(latencyMs) {
        if (!indicator) return;
        var dot   = document.getElementById('sr-dot');
        var label = document.getElementById('sr-label');
        if (!dot || !label) return;

        var color, text;
        if (latencyMs === null) {
            color = '#ef4444'; text = '⚡ Offline';
        } else if (latencyMs < LATENCY_EXCELLENT) {
            color = '#22c55e'; text = '⚡ ' + latencyMs + ' ms';
        } else if (latencyMs < LATENCY_GOOD) {
            color = '#84cc16'; text = '⚡ ' + latencyMs + ' ms';
        } else if (latencyMs < LATENCY_FAIR) {
            color = '#f59e0b'; text = '⚡ ' + latencyMs + ' ms';
        } else {
            color = '#ef4444'; text = '⚡ ' + latencyMs + ' ms';
        }

        dot.style.background   = color;
        label.textContent      = text;
        indicator.title = 'Speed Router — ' + (latencyMs === null
            ? 'No connection'
            : 'Latency ' + latencyMs + ' ms');
    }

    // ─────────────────────────────────────────────
    // DOM — update banner
    // ─────────────────────────────────────────────

    function buildBanner() {
        var el = document.createElement('div');
        el.id = 'sr-banner';
        el.setAttribute('role', 'alert');
        el.setAttribute('aria-live', 'assertive');

        el.style.cssText = [
            'position:fixed',
            'top:0',
            'left:0',
            'right:0',
            'z-index:9999',
            'display:flex',
            'align-items:center',
            'justify-content:center',
            'gap:12px',
            'padding:10px 16px',
            'background:linear-gradient(90deg,#0f172a 0%,#1e1b4b 100%)',
            'color:#e2e8f0',
            'font-size:13px',
            'font-family:system-ui,sans-serif',
            'font-weight:500',
            'border-bottom:2px solid #6366f1',
            'box-shadow:0 2px 12px rgba(0,0,0,.5)',
            'flex-wrap:wrap',
            'text-align:center'
        ].join(';');

        var msg = document.createElement('span');
        msg.textContent = '🚀 Speed Router detected a platform update!  Refresh to get the latest game code.';

        var refreshBtn = document.createElement('button');
        refreshBtn.textContent = '↻ Refresh now';
        refreshBtn.style.cssText = [
            'padding:4px 14px',
            'background:#6366f1',
            'color:#fff',
            'border:none',
            'border-radius:14px',
            'cursor:pointer',
            'font-size:12px',
            'font-weight:700',
            'transition:background .2s',
            'flex-shrink:0'
        ].join(';');
        refreshBtn.addEventListener('mouseover', function () {
            refreshBtn.style.background = '#4f46e5';
        });
        refreshBtn.addEventListener('mouseout', function () {
            refreshBtn.style.background = '#6366f1';
        });
        refreshBtn.addEventListener('click', function () {
            // Hard reload bypasses all browser and CDN caches.
            // Preserve the hash fragment so anchor-based navigation survives.
            var base = window.location.pathname;
            var hash = window.location.hash || '';
            window.location.href = base + '?sr_bust=' + Date.now() + hash;
        });

        var dismissBtn = document.createElement('button');
        dismissBtn.textContent = '✕';
        dismissBtn.setAttribute('aria-label', 'Dismiss update notification');
        dismissBtn.style.cssText = [
            'padding:4px 8px',
            'background:transparent',
            'color:#94a3b8',
            'border:none',
            'cursor:pointer',
            'font-size:14px',
            'transition:color .2s',
            'flex-shrink:0'
        ].join(';');
        dismissBtn.addEventListener('mouseover', function () {
            dismissBtn.style.color = '#e2e8f0';
        });
        dismissBtn.addEventListener('mouseout', function () {
            dismissBtn.style.color = '#94a3b8';
        });
        dismissBtn.addEventListener('click', function () { module.dismiss(); });

        el.appendChild(msg);
        el.appendChild(refreshBtn);
        el.appendChild(dismissBtn);
        document.body.insertBefore(el, document.body.firstChild);
        return el;
    }

    // ─────────────────────────────────────────────
    // Latency measurement
    // ─────────────────────────────────────────────

    function measureLatency() {
        var t0 = Date.now();
        fetchJSON(HEALTH_ENDPOINT, 6000)
            .then(function () {
                setIndicatorQuality(Date.now() - t0);
            })
            .catch(function () {
                setIndicatorQuality(null);
            });
    }

    // ─────────────────────────────────────────────
    // Version check
    // ─────────────────────────────────────────────

    function checkVersion() {
        fetchJSON(VERSION_ENDPOINT, 8000)
            .then(function (data) {
                if (!data || !data.build_time) return;
                var serverBuildTime = data.build_time;

                if (pageLoadBuildTime === null) {
                    // First call — remember the build time seen at page load.
                    pageLoadBuildTime = serverBuildTime;
                    return;
                }

                // Subsequent calls — compare
                if (serverBuildTime !== pageLoadBuildTime && !dismissed) {
                    if (!banner) {
                        banner = buildBanner();
                    }
                    banner.style.display = 'flex';
                }
            })
            .catch(function () {
                // Version check failed silently — not critical
            });
    }

    // ─────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────

    var module = {
        /** Force an immediate latency + version check. */
        checkNow: function () {
            measureLatency();
            checkVersion();
        },

        /** Hide the update banner for this session. */
        dismiss: function () {
            dismissed = true;
            if (banner) {
                banner.style.display = 'none';
            }
        }
    };

    window.speedRouter = module;

    // ─────────────────────────────────────────────
    // Bootstrap after DOM is ready
    // ─────────────────────────────────────────────

    function init() {
        indicator = buildIndicator();

        // Immediately take readings
        measureLatency();
        checkVersion();

        // Schedule recurring checks
        setInterval(measureLatency, LATENCY_INTERVAL_MS);
        setInterval(checkVersion,   VERSION_POLL_MS);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
