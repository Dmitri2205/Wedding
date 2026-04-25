(function (w) {
    const W = w.Wedding;

    function runWhenIdle(fn) {
        if (typeof w.requestIdleCallback === 'function') {
            w.requestIdleCallback(function () { fn(); }, { timeout: 2500 });
        } else {
            w.setTimeout(fn, 0);
        }
    }

    var yandexMapInited = false;
    function loadYandexMap() {
        if (yandexMapInited) {
            return;
        }
        yandexMapInited = true;
        W.initYandexMap();
    }

    document.addEventListener('DOMContentLoaded', function () {
        W.initParallaxAndFade();
        W.initCountdown();
        W.initRsvp();
        W.initMapUi();
        runWhenIdle(loadYandexMap);
    });
})(window);
