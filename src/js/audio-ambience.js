(function (w) {
    w.Wedding = w.Wedding || {};

    w.Wedding.initAudioAmbience = function () {
        const toggleBtn = document.getElementById('soundToggleBtn');
        const audio = document.getElementById('forestAmbience');
        if (!toggleBtn || !audio) {
            return;
        }

        const state = { isOn: false };
        audio.loop = true;
        audio.volume = 0;

        function updateUi() {
            toggleBtn.setAttribute('aria-pressed', String(state.isOn));
            toggleBtn.classList.toggle('is-active', state.isOn);
            toggleBtn.setAttribute(
                'aria-label',
                state.isOn ? 'Выключить звуки леса' : 'Включить звуки леса'
            );
            toggleBtn.textContent = state.isOn ? '🔊' : '🔈';
        }

        function fadeOutAndPause() {
            if (w.gsap) {
                w.gsap.to(audio, {
                    volume: 0,
                    duration: 0.45,
                    ease: 'power2.out',
                    onComplete: function () {
                        audio.pause();
                    }
                });
                return;
            }
            audio.volume = 0;
            audio.pause();
        }

        function tryEnableAudio() {
            const started = audio.play();
            if (started && typeof started.then === 'function') {
                return started.then(function () {
                    if (w.gsap) {
                        w.gsap.to(audio, { volume: 0.35, duration: 0.85, ease: 'power1.out' });
                    } else {
                        audio.volume = 0.35;
                    }
                }).catch(function () {
                    state.isOn = false;
                    updateUi();
                });
            }
            audio.volume = 0.35;
            return Promise.resolve();
        }

        toggleBtn.addEventListener('click', function () {
            if (!state.isOn) {
                state.isOn = true;
                updateUi();
                tryEnableAudio();
                return;
            }
            state.isOn = false;
            updateUi();
            fadeOutAndPause();
        });

        updateUi();
    };
})(window);
