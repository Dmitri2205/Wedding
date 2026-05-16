(function (w) {
    w.Wedding = w.Wedding || {};
    w.Wedding.initRsvp = function () {
        const rsvpForm = document.getElementById('rsvpForm');
        const drinksGroup = document.getElementById('drinksGroup');
        const attendanceRadios = document.querySelectorAll('input[name="attendance"]');
        const plusOneGroup = document.getElementById('plusOneGroup');
        const plusOneCheckbox = document.getElementById('plusOne');
        const companionGroup = document.getElementById('companionGroup');
        const companionInput = document.getElementById('companionName');

        const STORAGE_KEY = 'rsvp_submitted';
        const EXPIRY_DATE = 'Sun, 19 Jul 2026 12:00:00 UTC';

        const checkRSVPSubmission = function () {
            const hasCookie = document.cookie.split(';').some(function (item) {
                return item.trim().indexOf(STORAGE_KEY + '=') === 0;
            });
            const hasStorage = localStorage.getItem(STORAGE_KEY);

            if (hasCookie || hasStorage) {
                if (rsvpForm) {
                    rsvpForm.innerHTML = '<div style="text-align: center; padding: 2rem 0;"><h3 style="color: var(--color-accent);">Спасибо!</h3><p>Ваш ответ уже был отправлен ранее. Мы ждем вас!</p></div>';
                }
                return true;
            }
            return false;
        };

        if (!rsvpForm) {
            return;
        }

        if (checkRSVPSubmission()) {
            return;
        }

        const animateChoice = function (inputEl) {
            if (!inputEl) {
                return;
            }
            const label = inputEl.closest('.radio-label, .checkbox-label');
            if (!label) {
                return;
            }
            label.classList.add('is-selected');
            if (w.gsap) {
                w.gsap.fromTo(
                    label,
                    { scale: 0.97 },
                    {
                        scale: 1,
                        duration: 0.2,
                        ease: 'power2.out',
                        clearProps: 'transform'
                    }
                );
                return;
            }
            w.setTimeout(function () {
                label.classList.remove('is-selected');
            }, 200);
        };

        attendanceRadios.forEach(function (radio) {
            radio.addEventListener('change', function (e) {
                animateChoice(e.target);
                if (e.target.value.indexOf('не смогу') !== -1) {
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

        plusOneCheckbox.addEventListener('change', function (e) {
            animateChoice(e.target);
            if (e.target.checked) {
                companionGroup.style.display = 'block';
            } else {
                companionGroup.style.display = 'none';
                companionInput.value = '';
            }
        });

        const drinkNone = document.getElementById('drinkNone');
        const drinkCheckboxes = rsvpForm.querySelectorAll('input[name="drinks"]');
        const setOtherDrinksDisabled = function (disabled) {
            drinkCheckboxes.forEach(function (input) {
                if (input !== drinkNone) {
                    input.disabled = disabled;
                }
            });
        };
        if (drinkNone && drinkCheckboxes.length) {
            drinkCheckboxes.forEach(function (input) {
                input.addEventListener('change', function () {
                    animateChoice(input);
                    if (input === drinkNone) {
                        if (drinkNone.checked) {
                            drinkCheckboxes.forEach(function (o) {
                                if (o !== drinkNone) {
                                    o.checked = false;
                                }
                            });
                            setOtherDrinksDisabled(true);
                        } else {
                            setOtherDrinksDisabled(false);
                        }
                    } else if (input.checked) {
                        drinkNone.checked = false;
                        setOtherDrinksDisabled(false);
                    }
                });
            });
        }

        const rsvpLoader = document.getElementById('rsvpFormLoader');
        const rsvpLoaderDisabled = new Map();

        const showRsvpLoader = function () {
            if (!rsvpLoader) {
                return;
            }
            rsvpLoader.removeAttribute('hidden');
            rsvpLoader.setAttribute('aria-hidden', 'false');
            rsvpForm.setAttribute('aria-busy', 'true');
            rsvpLoaderDisabled.clear();
            rsvpForm.querySelectorAll('input, button, textarea, select').forEach(function (el) {
                rsvpLoaderDisabled.set(el, el.disabled);
                el.disabled = true;
            });
        };

        const hideRsvpLoader = function () {
            if (!rsvpLoader) {
                return;
            }
            rsvpLoader.setAttribute('hidden', '');
            rsvpLoader.setAttribute('aria-hidden', 'true');
            rsvpForm.setAttribute('aria-busy', 'false');
            rsvpLoaderDisabled.forEach(function (was, el) {
                el.disabled = was;
            });
            rsvpLoaderDisabled.clear();
        };

        rsvpForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const submitBtn = document.getElementById('submitBtn');
            const originalBtnText = submitBtn.innerText;
            showRsvpLoader();
            submitBtn.innerText = 'Отправка…';

            const name = document.getElementById('guestName').value.trim();
            const attendance = document.querySelector('input[name="attendance"]:checked').value;
            const isPlusOne = plusOneCheckbox.checked;
            const companionName = companionInput.value.trim();

            let plusOneText = '';
            if (isPlusOne) {
                plusOneText = '\n👥 *Будет не один(а)*: Да' + (companionName ? ' (Спутники: ' + companionName + ')' : '');
            }

            let drinksText = '';
            if (attendance.indexOf('не смогу') === -1) {
                const drinks = Array.prototype.map.call(
                    document.querySelectorAll('input[name="drinks"]:checked'),
                    function (cb) { return cb.value; }
                );
                if (drinks.length > 0) {
                    drinksText = '\n🍷 *Напитки:* ' + drinks.join(', ');
                } else {
                    drinksText = '\n🍷 *Напитки:* не выбрано';
                }
            }

            const message = '🔔 *Новый ответ на приглашение!*\n\n👤 *Имя:* ' + name + '\n✅ *Присутствие:* ' + attendance + plusOneText + drinksText;

            const BOT_TOKEN = '8781128784:AAECuc2oK-lHYZIuc8qsyLTgv36mG7MeCqs';
            const CHAT_ID = '-5173257192';

            fetch('/api/rsvp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: message }),
            })
                .then(function (response) {
                    if (response.ok) {
                        document.cookie = STORAGE_KEY + '=true; expires=' + EXPIRY_DATE + '; path=/';
                        localStorage.setItem(STORAGE_KEY, 'true');
                        rsvpForm.innerHTML = '<div style="text-align: center; padding: 2rem 0;"><h3 style="color: var(--color-accent);">Спасибо!</h3><p>Ваш ответ успешно отправлен.</p></div>';
                    } else {
                        throw new Error('Network response was not ok.');
                    }
                })
                .catch(function (error) {
                    console.error('Ошибка при отправке в Telegram:', error);
                    alert('Произошла ошибка при отправке. Пожалуйста, проверьте настройки бота в rsvp.js или напишите нам лично.');
                    hideRsvpLoader();
                    submitBtn.innerText = originalBtnText;
                });
        });
    };
})(window);
