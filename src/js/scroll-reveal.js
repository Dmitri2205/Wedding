(function (w) {
    w.Wedding = w.Wedding || {};

    function revealWithFallback(nodes) {
        nodes.forEach(function (node) {
            node.classList.add('visible');
        });
    }

    w.Wedding.initScrollReveal = function () {
        const sectionSelectors = ['#schedule', '#location', '#wishes', '#rsvp'];
        const sections = sectionSelectors
            .map(function (selector) { return document.querySelector(selector); })
            .filter(Boolean);

        if (!sections.length) {
            return;
        }

        const timelineItems = Array.from(document.querySelectorAll('.timeline .timeline-item'));
        const canUseGsap = Boolean(w.gsap && w.ScrollTrigger);

        if (!canUseGsap) {
            revealWithFallback(sections);
            revealWithFallback(timelineItems);
            return;
        }

        w.gsap.registerPlugin(w.ScrollTrigger);
        sections.forEach(function (section) {
            w.gsap.fromTo(
                section,
                { autoAlpha: 0, y: 20 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.55,
                    ease: 'power2.out',
                    clearProps: 'transform,opacity,visibility',
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 74%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        });

        if (timelineItems.length) {
            w.gsap.fromTo(
                timelineItems,
                { autoAlpha: 0, y: 20 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.45,
                    stagger: 0.12,
                    ease: 'power2.out',
                    clearProps: 'transform,opacity,visibility',
                    scrollTrigger: {
                        trigger: '#schedule',
                        start: 'top 70%'
                    }
                }
            );
        }
    };
})(window);
