(function (w) {
    w.Wedding = w.Wedding || {};
    w.Wedding.initCountdown = function () {
        const weddingDate = new Date(2026, 6, 19, 15, 0, 0).getTime();
        const countdownEl = document.getElementById('countdown');

        function ruPlural(n, one, few, many) {
            const n10 = n % 10;
            const n100 = n % 100;
            if (n10 === 1 && n100 !== 11) return one;
            if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;
            return many;
        }

        function updateCountdown() {
            const now = new Date().getTime();
            const distance = weddingDate - now;

            if (distance < 0) {
                if (countdownEl) countdownEl.innerHTML = 'Свершилось!';
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            const d = ruPlural(days, 'день', 'дня', 'дней');
            const h = ruPlural(hours, 'час', 'часа', 'часов');
            const m = ruPlural(minutes, 'минута', 'минуты', 'минут');

            if (countdownEl) {
                countdownEl.innerHTML =
                    '<span class="countdown-label">До свадьбы:</span> ' + days + ' ' + d + ' ' + hours + ' ' + h + ' ' + minutes + ' ' + m;
            }
        }

        updateCountdown();
        setInterval(updateCountdown, 1000);
    };
})(window);
