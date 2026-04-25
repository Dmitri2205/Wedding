(function (w) {
    w.Wedding = w.Wedding || {};
    const TARGET_LAT = '55.803504';
    const TARGET_LON = '37.281695';

    /** Модалка + ссылки в навигаторы (без ожидания ymaps) */
    w.Wedding.initMapUi = function () {
        const modalOverlay = document.getElementById('mapModal');
        const openBtn = document.getElementById('openMapModalBtn');
        const closeBtn = document.getElementById('closeMapModalBtn');
        const mapLinks = document.querySelectorAll('.btn-nav');

        if (openBtn && modalOverlay && closeBtn) {
            openBtn.addEventListener('click', function () {
                modalOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });

            const closeModal = function () {
                modalOverlay.classList.remove('active');
                document.body.style.overflow = '';
            };

            closeBtn.addEventListener('click', closeModal);
            modalOverlay.addEventListener('click', function (e) {
                if (e.target === modalOverlay) closeModal();
            });
        }

        mapLinks.forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const app = link.getAttribute('data-app');
                let href = '';
                let fallbackHref = '';

                switch (app) {
                case 'yandex-navi':
                    href = 'yandexnavi://build_route_on_map?lat_to=' + TARGET_LAT + '&lon_to=' + TARGET_LON;
                    fallbackHref = 'https://yandex.ru/maps/?rtext=~' + TARGET_LAT + ',' + TARGET_LON;
                    break;
                case 'yandex-maps':
                    href = 'yandexmaps://maps.yandex.ru/?pt=' + TARGET_LON + ',' + TARGET_LAT + '&z=16&l=map';
                    fallbackHref = 'https://yandex.ru/maps/?rtext=~' + TARGET_LAT + ',' + TARGET_LON;
                    break;
                case '2gis':
                    href = 'dgis://2gis.ru/routeSearch/rsType/car/to/' + TARGET_LON + ',' + TARGET_LAT;
                    fallbackHref = 'https://2gis.ru/directions/points/%7C' + TARGET_LON + '%2C' + TARGET_LAT;
                    break;
                case 'google':
                    href = 'google.navigation:q=' + TARGET_LAT + ',' + TARGET_LON;
                    fallbackHref = 'https://www.google.com/maps/dir/?api=1&destination=' + TARGET_LAT + ',' + TARGET_LON;
                    break;
                case 'apple':
                    href = 'http://maps.apple.com/?daddr=' + TARGET_LAT + ',' + TARGET_LON;
                    fallbackHref = href;
                    break;
                default:
                    return;
                }

                const startStr = +new Date();
                const timeout = setTimeout(function () {
                    if (+new Date() - startStr < 1500) {
                        window.location.href = fallbackHref;
                    }
                }, 1000);

                window.addEventListener('visibilitychange', function checkVisibility() {
                    if (document.hidden) {
                        clearTimeout(timeout);
                        window.removeEventListener('visibilitychange', checkVisibility);
                    }
                });

                window.location.href = href;
            });
        });
    };

    /** Только Yandex API (ymaps) — вызывать один раз, после requestIdleCallback */
    w.Wedding.initYandexMap = function () {
        if (typeof ymaps === 'undefined') {
            return;
        }
        ymaps.ready(function () {
            const myMap = new ymaps.Map('map', {
                center: [TARGET_LAT, TARGET_LON],
                zoom: 14,
                controls: ['zoomControl', 'fullscreenControl'],
            }, {
                suppressMapOpenBlock: true,
            });

            myMap.geoObjects.add(new ymaps.Placemark(
                [TARGET_LAT, TARGET_LON],
                {
                    hintContent: 'Загородный клуб "Хвоя"',
                    balloonContent: 'Место проведения нашей свадьбы',
                },
                { preset: 'islands#darkGreenIcon' }
            ));
            myMap.behaviors.disable('scrollZoom');
        });
    };
})(window);
