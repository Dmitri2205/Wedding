// Расписание: SVG-линия (без ES modules — иначе при file:///части серверов CORS на подгрузку модулей).
// В .timeline первый ребёнок — <svg>, пункты: nth-child(2)=лев. колонка, 3=правая, …
// (не «1-й пункт = нечётный в CSS»). Колонка: index0 % 2 === 1 → правая.
function buildTimelinePath(rects, tlRect, timelineWidth) {
    if (!rects || rects.length < 2) {
        return '';
    }

    const w = Math.max(1, timelineWidth);
    const yPadT = 3;
    const yPadB = 2;
    const vInset = 8; // зазор от края, чтобы S начиналась с мягкого схода (не 90° L→C)
    const t1 = 0.42;
    const t2 = 0.42;

    const topY = (r) => r.top - tlRect.top + yPadT;
    const botY = (r) => r.bottom - tlRect.top - yPadB;

    /** К краю текста, обращённому к «коридору»: слева — rect.right, справа — rect.left. */
    const innerX = (rect, index0) => {
        const isRight = index0 % 2 === 1;
        const raw = (isRight ? rect.left : rect.right) - tlRect.left;
        return Math.min(w - 0.5, Math.max(0.5, raw));
    };

    const n = rects.length;
    const parts = [];
    const r0 = rects[0];
    const x0 = innerX(r0, 0);
    const top0 = topY(r0);
    const yStart = Math.max(0, top0 - 14);

    // Вход: не «втыкаем» стрелку в верх первого пункта (M+длиная L), а плавно заходим по краю
    parts.push(`M ${x0} ${yStart}`);
    parts.push(
        `C ${x0} ${yStart + 6} ${x0} ${top0 - 1} ${x0} ${top0 + 4}`
    );
    const yExit0 = botY(r0) - vInset;
    parts.push(`L ${x0} ${yExit0}`);

    for (let i = 0; i < n - 1; i += 1) {
        const rA = rects[i];
        const rB = rects[i + 1];
        const ax = innerX(rA, i);
        const bx = innerX(rB, i + 1);
        const tTopB = topY(rB);
        const yExitA = botY(rA) - vInset;
        if (tTopB > yExitA) {
            const spread = tTopB - yExitA;
            const c1x = ax;
            const c1y = yExitA + spread * t1;
            const c2x = bx;
            const c2y = tTopB - spread * t2;
            parts.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${bx} ${tTopB}`);
        } else {
            parts.push(`L ${bx} ${tTopB}`);
        }
        const isLastB = i + 1 === n - 1;
        const yAtBottom = isLastB ? botY(rB) : botY(rB) - vInset;
        parts.push(`L ${bx} ${yAtBottom}`);
    }

    return parts.join(' ');
}

/**
 * 0..1: доля «дорисовки» линии. Раньше считалось от высокой #schedule, из‑за чего
 * при нормальном чтении p оставалось низким (линия визуально обрывалась в середине).
 * Считаем по **видимой** части .timeline: когда блок расписания в кадре, p быстро → 1.
 */
function getScheduleDrawProgressForTimeline() {
    const el = document.querySelector('.timeline');
    if (!el) {
        return 0;
    }
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.height <= 0) {
        return 0;
    }
    const vTop = Math.max(0, r.top);
    const vBottom = Math.min(vh, r.bottom);
    const vis = Math.max(0, vBottom - vTop);
    return Math.min(1, (vis / r.height) * 1.2);
}

function initTimelinePath() {
    const timeline = document.querySelector('.timeline');
    const svg = document.querySelector('.timeline-path-svg');
    const pathEl = document.querySelector('.timeline-path-line');
    const schedule = document.querySelector('#schedule');
    if (!timeline || !svg || !pathEl || !schedule) {
        return;
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let pathLength = 0;
    let rafScroll = 0;

    const applyStroke = () => {
        if (prefersReduced) {
            pathEl.style.strokeDasharray = String(pathLength);
            pathEl.style.strokeDashoffset = '0';
            return;
        }
        if (!pathLength) {
            return;
        }
        const p = getScheduleDrawProgressForTimeline();
        pathEl.style.strokeDasharray = String(pathLength);
        pathEl.style.strokeDashoffset = String(pathLength * (1 - p));
    };

    const applyLayout = () => {
        const w = Math.max(1, Math.round(timeline.offsetWidth));
        const h = Math.max(1, Math.round(timeline.offsetHeight));
        svg.setAttribute('width', String(w));
        svg.setAttribute('height', String(h));
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

        const items = [...timeline.querySelectorAll('.timeline-item')];
        if (items.length < 2) {
            pathEl.setAttribute('d', '');
            pathLength = 0;
            return;
        }

        const tlRect = timeline.getBoundingClientRect();
        const rects = items.map((el) => el.getBoundingClientRect());
        pathEl.setAttribute('d', buildTimelinePath(rects, tlRect, w));

        const len = pathEl.getTotalLength();
        if (!Number.isFinite(len) || len <= 0) {
            pathLength = 0;
            return;
        }
        pathLength = len;
        applyStroke();
    };

    const onScroll = () => {
        if (rafScroll) {
            return;
        }
        rafScroll = window.requestAnimationFrame(() => {
            rafScroll = 0;
            applyStroke();
        });
    };

    const ro = new ResizeObserver(() => {
        window.requestAnimationFrame(applyLayout);
    });

    applyLayout();
    ro.observe(timeline);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
        window.requestAnimationFrame(applyLayout);
    });

    if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
            window.requestAnimationFrame(applyLayout);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Параллакс фона
    const bgImage = document.querySelector('.bg-image');
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY;
        // Смещаем фон вверх (отрицательный translateY), но медленнее чем страницу
        // Таким образом мы "проезжаем" мимо леса сверху вниз
        if (bgImage) {
            bgImage.style.transform = `translateY(-${scrollPosition * 0.1}px)`;
        }
    });

    // 2. Плавное появление элементов (Fade in on scroll)
    const fadeElements = document.querySelectorAll('.fade-in');

    const checkVisibility = () => {
        const triggerBottom = window.innerHeight * 0.85;

        fadeElements.forEach(el => {
            const elTop = el.getBoundingClientRect().top;
            if (elTop < triggerBottom) {
                el.classList.add('visible');
            }
        });
    };

    window.addEventListener('scroll', checkVisibility);
    // Проверим при загрузке
    checkVisibility();

    // 3. Таймер обратного отсчета
    // Дата свадьбы: локальное время (совпадает с расписанием, сбор гостей с 15:00)
    // В JS месяцы 0–11: 6 = июль
    const weddingDate = new Date(2026, 6, 19, 15, 0, 0).getTime();
    const countdownEl = document.getElementById('countdown');

    const ruPlural = (n, one, few, many) => {
        const n10 = n % 10;
        const n100 = n % 100;
        if (n10 === 1 && n100 !== 11) return one;
        if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;
        return many;
    };

    const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = weddingDate - now;

        if (distance < 0) {
            if (countdownEl) countdownEl.innerHTML = "Свершилось!";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

        const d = ruPlural(days, "день", "дня", "дней");
        const h = ruPlural(hours, "час", "часа", "часов");
        const m = ruPlural(minutes, "минута", "минуты", "минут");

        if (countdownEl) {
            countdownEl.innerHTML =
                `<span class="countdown-label">До свадьбы:</span> ${days} ${d} ${hours} ${h} ${minutes} ${m}`;
        }
    };

    updateCountdown();
    setInterval(updateCountdown, 1000);

    // 4. Логика карт и маршрутов
    // Координаты места проведения (пока placeholder, пользователь изменит сам)
    const TARGET_LAT = "55.803504";
    const TARGET_LON = "37.281695";

    // Инициализация интерактивной Яндекс.Карты
    if (typeof ymaps !== 'undefined') {
        ymaps.ready(function () {
            var myMap = new ymaps.Map('map', {
                center: [TARGET_LAT, TARGET_LON],
                zoom: 14,
                controls: ['zoomControl', 'fullscreenControl']
            }, {
                suppressMapOpenBlock: true
            });

            var myPlacemark = new ymaps.Placemark([TARGET_LAT, TARGET_LON], {
                hintContent: 'Загородный клуб "Хвоя"',
                balloonContent: 'Место проведения нашей свадьбы'
            }, {
                preset: 'islands#darkGreenIcon' // зеленая иконка в цвет дизайна
            });

            myMap.geoObjects.add(myPlacemark);

            // Отключаем скролл карты мышью, чтобы не мешать прокрутке страницы
            myMap.behaviors.disable('scrollZoom');
        });
    }

    // Элементы модального окна
    const modalOverlay = document.getElementById('mapModal');
    const openBtn = document.getElementById('openMapModalBtn');
    const closeBtn = document.getElementById('closeMapModalBtn');
    const mapLinks = document.querySelectorAll('.btn-nav');

    // Открытие/закрытие модалки
    if (openBtn && modalOverlay && closeBtn) {
        openBtn.addEventListener('click', () => {
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // блокируем скролл страницы
        });

        const closeModal = () => {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = ''; // возвращаем скролл
        };

        closeBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    // Генерация ссылок для разных навигаторов
    mapLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const app = link.getAttribute('data-app');
            let href = "";
            let fallbackHref = "";

            // Универсальные ссылки, которые на мобильных предложат открыть приложение
            switch (app) {
                case 'yandex-navi':
                    href = `yandexnavi://build_route_on_map?lat_to=${TARGET_LAT}&lon_to=${TARGET_LON}`;
                    fallbackHref = `https://yandex.ru/maps/?rtext=~${TARGET_LAT},${TARGET_LON}`;
                    break;
                case 'yandex-maps':
                    href = `yandexmaps://maps.yandex.ru/?pt=${TARGET_LON},${TARGET_LAT}&z=16&l=map`;
                    fallbackHref = `https://yandex.ru/maps/?rtext=~${TARGET_LAT},${TARGET_LON}`;
                    break;
                case '2gis':
                    // intent для 2GIS
                    href = `dgis://2gis.ru/routeSearch/rsType/car/to/${TARGET_LON},${TARGET_LAT}`;
                    fallbackHref = `https://2gis.ru/directions/points/%7C${TARGET_LON}%2C${TARGET_LAT}`;
                    break;
                case 'google':
                    href = `google.navigation:q=${TARGET_LAT},${TARGET_LON}`;
                    fallbackHref = `https://www.google.com/maps/dir/?api=1&destination=${TARGET_LAT},${TARGET_LON}`;
                    break;
                case 'apple':
                    href = `http://maps.apple.com/?daddr=${TARGET_LAT},${TARGET_LON}`;
                    fallbackHref = href;
                    break;
            }

            // Пытаемся открыть Intent (приложение), если не вышло — открываем веб-версию (fallback)
            // Реализация через таймаут: запускаем intent, и если страница не скрылась (не ушла в фон), 
            // спустя время открываем fallback.

            const startStr = +new Date();
            const timeout = setTimeout(() => {
                const nowStr = +new Date();
                // Если прошло меньше времени, чем таймаут + небольшой запас, 
                // значит приложение не перехватило управление
                if (nowStr - startStr < 1500) {
                    window.location.href = fallbackHref;
                }
            }, 1000);

            // Если вкладка скрылась (открылось приложение), отменяем fallback
            window.addEventListener('visibilitychange', function checkVisibility() {
                if (document.hidden) {
                    clearTimeout(timeout);
                    window.removeEventListener('visibilitychange', checkVisibility);
                }
            });

            window.location.href = href;
        });
    });

    // 5. Обработка формы RSVP
    const rsvpForm = document.getElementById('rsvpForm');
    const drinksGroup = document.getElementById('drinksGroup');
    const attendanceRadios = document.querySelectorAll('input[name="attendance"]');
    const plusOneGroup = document.getElementById('plusOneGroup');
    const plusOneCheckbox = document.getElementById('plusOne');
    const companionGroup = document.getElementById('companionGroup');
    const companionInput = document.getElementById('companionName');

    const STORAGE_KEY = "rsvp_submitted";
    const EXPIRY_DATE = "Sun, 19 Jul 2026 12:00:00 UTC";

    const checkRSVPSubmission = () => {
        const hasCookie = document.cookie.split(';').some((item) => item.trim().startsWith(STORAGE_KEY + '='));
        const hasStorage = localStorage.getItem(STORAGE_KEY);

        if (hasCookie || hasStorage) {
            if (rsvpForm) {
                rsvpForm.innerHTML = '<div style="text-align: center; padding: 2rem 0;"><h3 style="color: var(--color-accent);">Спасибо!</h3><p>Ваш ответ уже был отправлен ранее. Мы ждем вас!</p></div>';
            }
            return true;
        }
        return false;
    };

    if (rsvpForm) {
        if (!checkRSVPSubmission()) {
            // Скрываем выбор напитков и доп. гостей, если человек не придет
            attendanceRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if (e.target.value.includes('не смогу')) {
                        drinksGroup.style.display = 'none';
                        plusOneGroup.style.display = 'none';
                        companionGroup.style.display = 'none';
                        plusOneCheckbox.checked = false;
                    } else {
                        drinksGroup.style.display = 'flex';
                        plusOneGroup.style.display = 'block';
                    }
                });
            });

            // Показ поля для имени спутника
            plusOneCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    companionGroup.style.display = 'block';
                } else {
                    companionGroup.style.display = 'none';
                    companionInput.value = '';
                }
            });

            rsvpForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const submitBtn = document.getElementById('submitBtn');
                const originalBtnText = submitBtn.innerText;
                submitBtn.innerText = 'Отправка...';
                submitBtn.disabled = true;

                const name = document.getElementById('guestName').value.trim();
                const attendance = document.querySelector('input[name="attendance"]:checked').value;
                const isPlusOne = plusOneCheckbox.checked;
                const companionName = companionInput.value.trim();

                let plusOneText = '';
                if (isPlusOne) {
                    plusOneText = `\n👥 *Будет не один(а)*: Да${companionName ? ` (Спутники: ${companionName})` : ''}`;
                }

                let drinksText = '';
                if (!attendance.includes('не смогу')) {
                    const drinks = Array.from(document.querySelectorAll('input[name="drinks"]:checked'))
                        .map(cb => cb.value);
                    if (drinks.length > 0) {
                        drinksText = `\n🍷 *Напитки:* ${drinks.join(', ')}`;
                    } else {
                        drinksText = `\n🍷 *Напитки:* не выбрано`;
                    }
                }

                const message = `🔔 *Новый ответ на приглашение!*\n\n👤 *Имя:* ${name}\n✅ *Присутствие:* ${attendance}${plusOneText}${drinksText}`;

                // Настройки Telegram бота
                const BOT_TOKEN = "8781128784:AAECuc2oK-lHYZIuc8qsyLTgv36mG7MeCqs";
                const CHAT_ID = "-5173257192";

                const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

                fetch(telegramUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        chat_id: CHAT_ID,
                        text: message,
                        parse_mode: 'Markdown'
                    })
                })
                    .then(response => {
                        if (response.ok) {
                            // Дублируем: Куки для сервера/автоудаления + LocalStorage для надежности и тестов
                            document.cookie = `${STORAGE_KEY}=true; expires=${EXPIRY_DATE}; path=/`;
                            localStorage.setItem(STORAGE_KEY, "true");

                            // Успешная отправка
                            rsvpForm.innerHTML = '<div style="text-align: center; padding: 2rem 0;"><h3 style="color: var(--color-accent);">Спасибо!</h3><p>Ваш ответ успешно отправлен.</p></div>';
                        } else {
                            throw new Error('Network response was not ok.');
                        }
                    })
                    .catch(error => {
                        console.error('Ошибка при отправке в Telegram:', error);
                        alert("Произошла ошибка при отправке. Пожалуйста, проверьте настройки бота в main.js или напишите нам лично.");
                        submitBtn.innerText = originalBtnText;
                        submitBtn.disabled = false;
                    });
            });
        }
    }

    // 5. Зигзаг SVG по расписанию (модуль timeline/)
});
