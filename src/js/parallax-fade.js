(function (w) {
    w.Wedding = w.Wedding || {};
    w.Wedding.initParallaxAndFade = function () {
        //@TODO: parallax is temporarily disabled; restore this module after proper gyro behavior fix.
        return;
        /*
        const bgImage = document.querySelector('.bg-image');
        const isReducedMotion = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isTouchDevice = w.matchMedia && w.matchMedia('(pointer: coarse)').matches;
        const gyroState = {
            resetTimer: null,
            enabled: false
        };
        const pointerState = {
            active: false,
            resetTimer: null
        };

        function tweenBackground(x, y, duration) {
            if (!bgImage || isReducedMotion) {
                return;
            }
            if (w.gsap) {
                w.gsap.to(bgImage, {
                    x: x,
                    y: y,
                    duration: duration,
                    ease: 'power2.out',
                    overwrite: true
                });
                return;
            }
            bgImage.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
        }

        function scheduleGyroReset() {
            if (!bgImage || isReducedMotion) {
                return;
            }
            if (gyroState.resetTimer) {
                w.clearTimeout(gyroState.resetTimer);
            }
            gyroState.resetTimer = w.setTimeout(function () {
                tweenBackground(0, 0, 0.8);
            }, 1200);
        }

        function schedulePointerReset() {
            if (!bgImage || isReducedMotion) {
                return;
            }
            if (pointerState.resetTimer) {
                w.clearTimeout(pointerState.resetTimer);
            }
            pointerState.resetTimer = w.setTimeout(function () {
                pointerState.active = false;
                tweenBackground(0, 0, 0.55);
            }, 450);
        }

        function applyTilt(gamma, beta) {
            if (!bgImage || isReducedMotion) {
                return;
            }
            if (typeof beta !== 'number' || typeof gamma !== 'number') {
                return;
            }
            const x = Math.max(-12, Math.min(12, gamma * 0.35));
            const y = Math.max(-10, Math.min(10, beta * 0.2));
            tweenBackground(x, y, 0.35);
            scheduleGyroReset();
        }

        function handleDeviceOrientation(evt) {
            if (typeof evt.beta !== 'number' || typeof evt.gamma !== 'number') {
                return;
            }
            gyroState.enabled = true;
            applyTilt(evt.gamma, evt.beta);
        }

        function handleDeviceMotion(evt) {
            if (gyroState.enabled) {
                return;
            }
            var acc = evt.accelerationIncludingGravity;
            if (!acc || typeof acc.x !== 'number' || typeof acc.y !== 'number') {
                return;
            }
            gyroState.enabled = true;
            applyTilt(acc.x * -8, acc.y * 8);
        }

        function tryEnableGyro() {
            if (!('DeviceOrientationEvent' in w)) {
                return;
            }
            var canRequest = typeof w.DeviceOrientationEvent.requestPermission === 'function';
            if (!canRequest) {
                return;
            }
            w.DeviceOrientationEvent.requestPermission()
                .then(function (state) {
                    if (state !== 'granted') {
                        return;
                    }
                    gyroState.enabled = true;
                })
                .catch(function () {});
        }

        if ('DeviceOrientationEvent' in w) {
            window.addEventListener('deviceorientation', handleDeviceOrientation, true);
            window.addEventListener('devicemotion', handleDeviceMotion, true);

            if (typeof w.DeviceOrientationEvent.requestPermission === 'function') {
                // iOS: permission must be requested inside explicit user gesture.
                document.addEventListener('click', tryEnableGyro, { passive: true });
                document.addEventListener('touchend', tryEnableGyro, { passive: true });
            } else {
                gyroState.enabled = true;
            }
        }

        function handlePointerParallax(evt) {
            if (!bgImage || isReducedMotion) {
                return;
            }
            if (evt.pointerType === 'touch' || evt.pointerType === 'pen') {
                return;
            }
            var clientX = typeof evt.clientX === 'number' ? evt.clientX : 0;
            var clientY = typeof evt.clientY === 'number' ? evt.clientY : 0;
            var vw = w.innerWidth || document.documentElement.clientWidth || 1;
            var vh = w.innerHeight || document.documentElement.clientHeight || 1;
            var nx = ((clientX / vw) - 0.5) * 2;
            var ny = ((clientY / vh) - 0.5) * 2;
            var x = Math.max(-10, Math.min(10, nx * 8));
            var y = Math.max(-8, Math.min(8, ny * 6));
            pointerState.active = true;
            tweenBackground(x, y, 0.3);
            schedulePointerReset();
        }

        if (!isTouchDevice) {
            window.addEventListener('pointermove', handlePointerParallax, { passive: true });
        }

        const fadeElements = document.querySelectorAll('.fade-in');
        const checkVisibility = function () {
            const triggerBottom = window.innerHeight * 0.85;
            fadeElements.forEach(function (el) {
                if (el.getBoundingClientRect().top < triggerBottom) {
                    el.classList.add('visible');
                }
            });
        };
        window.addEventListener('scroll', checkVisibility);
        checkVisibility();
        */
    };
})(window);
