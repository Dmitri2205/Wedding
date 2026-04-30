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
        //@TODO: re-enable parallax after mobile behavior fix.
        // W.initParallaxAndFade();
        //@TODO: remove this fallback once parallax/fade module is restored.
        var fadeNodes = document.querySelectorAll('.fade-in');
        var revealOnScroll = function () {
            var triggerBottom = window.innerHeight * 0.72;
            fadeNodes.forEach(function (el) {
                if (el.classList.contains('visible')) {
                    return;
                }
                if (el.getBoundingClientRect().top < triggerBottom) {
                    el.classList.add('visible');
                }
            });
        };
        window.addEventListener('scroll', revealOnScroll, { passive: true });
        revealOnScroll();
        W.initCountdown();
        W.initRsvp();
        W.initMapUi();
        if (W.initScrollReveal) {
            W.initScrollReveal();
        }
        if (W.initContactsSlider) {
            W.initContactsSlider();
        }
        if (W.initAudioAmbience) {
            W.initAudioAmbience();
        }
        runWhenIdle(loadYandexMap);
    });
})(window);
