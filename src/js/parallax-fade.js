(function (w) {
    w.Wedding = w.Wedding || {};
    w.Wedding.initParallaxAndFade = function () {
        const bgImage = document.querySelector('.bg-image');
        window.addEventListener('scroll', function () {
            const scrollPosition = window.scrollY;
            if (bgImage) {
                bgImage.style.transform = 'translateY(-' + scrollPosition * 0.1 + 'px)';
            }
        });

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
    };
})(window);
