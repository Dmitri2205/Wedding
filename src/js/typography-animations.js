(function (w) {
    w.Wedding = w.Wedding || {};

    function splitHeadingToChars(el) {
        if (!el || el.dataset.charsSplit === '1') {
            return [];
        }
        const text = (el.textContent || '').trim();
        if (!text) {
            return [];
        }

        el.dataset.charsSplit = '1';
        el.setAttribute('aria-label', text);
        el.textContent = '';

        const chars = [];
        Array.from(text).forEach(function (ch) {
            const span = document.createElement('span');
            span.className = 'split-char';
            span.setAttribute('aria-hidden', 'true');
            span.textContent = ch === ' ' ? '\u00A0' : ch;
            el.appendChild(span);
            chars.push(span);
        });
        return chars;
    }

    w.Wedding.initTypographyAnimations = function () {
        if (!w.gsap || !w.ScrollTrigger) {
            return;
        }

        w.gsap.registerPlugin(w.ScrollTrigger);

        const headings = Array.from(document.querySelectorAll('h1, h2'));
        headings.forEach(function (heading) {
            const chars = splitHeadingToChars(heading);
            if (!chars.length) {
                return;
            }

            w.gsap.fromTo(
                chars,
                { y: 15, autoAlpha: 0 },
                {
                    y: 0,
                    autoAlpha: 1,
                    duration: 0.45,
                    stagger: 0.025,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: heading,
                        start: 'top 88%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        });

        const textBlocks = Array.from(
            document.querySelectorAll(
                '.glass-panel p, .timeline-item .timeline-item-desc, .timeline-item .time'
            )
        );

        textBlocks.forEach(function (block) {
            block.classList.add('text-reveal-target');
            w.gsap.fromTo(
                block,
                { autoAlpha: 0, y: 10, filter: 'blur(5px)' },
                {
                    autoAlpha: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    duration: 0.55,
                    ease: 'power2.out',
                    clearProps: 'filter',
                    scrollTrigger: {
                        trigger: block,
                        start: 'top 92%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        });
    };
})(window);
