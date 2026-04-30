(function (w) {
    w.Wedding = w.Wedding || {};

    w.Wedding.initContactsSlider = function () {
        const contactsSection = document.getElementById('contacts');
        if (!contactsSection) {
            return;
        }

        const list = contactsSection.querySelector('.contacts-list');
        if (!list) {
            return;
        }

        let progressWrap = contactsSection.querySelector('.contacts-progress');
        let progressBar = progressWrap && progressWrap.querySelector('.contacts-progress__bar');

        if (!progressWrap) {
            progressWrap = document.createElement('div');
            progressWrap.className = 'contacts-progress';
            progressBar = document.createElement('span');
            progressBar.className = 'contacts-progress__bar';
            progressWrap.appendChild(progressBar);
            contactsSection.appendChild(progressWrap);
        }

        function updateProgress() {
            const maxScroll = Math.max(1, list.scrollWidth - list.clientWidth);
            const progress = Math.max(0, Math.min(1, list.scrollLeft / maxScroll));
            const width = 18 + progress * 82;

            if (w.gsap) {
                w.gsap.to(progressBar, {
                    width: width + '%',
                    duration: 0.15,
                    ease: 'power1.out',
                    overwrite: true
                });
            } else {
                progressBar.style.width = width + '%';
            }
        }

        const drag = {
            active: false,
            startX: 0,
            startScrollLeft: 0
        };

        function onPointerDown(evt) {
            if (evt.pointerType === 'touch') {
                return;
            }
            drag.active = true;
            drag.startX = evt.clientX;
            drag.startScrollLeft = list.scrollLeft;
            list.classList.add('is-dragging');
            list.setPointerCapture(evt.pointerId);
        }

        function onPointerMove(evt) {
            if (!drag.active) {
                return;
            }
            const deltaX = evt.clientX - drag.startX;
            list.scrollLeft = drag.startScrollLeft - deltaX;
        }

        function onPointerUp(evt) {
            if (!drag.active) {
                return;
            }
            drag.active = false;
            list.classList.remove('is-dragging');
            if (list.hasPointerCapture(evt.pointerId)) {
                list.releasePointerCapture(evt.pointerId);
            }
        }

        function onWheel(evt) {
            if (Math.abs(evt.deltaY) <= Math.abs(evt.deltaX)) {
                return;
            }
            list.scrollLeft += evt.deltaY;
            evt.preventDefault();
        }

        list.addEventListener('pointerdown', onPointerDown);
        list.addEventListener('pointermove', onPointerMove);
        list.addEventListener('pointerup', onPointerUp);
        list.addEventListener('pointercancel', onPointerUp);
        list.addEventListener('wheel', onWheel, { passive: false });
        list.addEventListener('scroll', updateProgress, { passive: true });
        window.addEventListener('resize', updateProgress);
        updateProgress();
    };
})(window);
