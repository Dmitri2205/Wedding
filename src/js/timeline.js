(function () {
    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function getTimelineProgress(timeline) {
        const rect = timeline.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

        if (rect.height <= 0 || viewportHeight <= 0) {
            return 0;
        }

        const start = viewportHeight * 0.62;
        const end = viewportHeight * 0.18;
        const distance = Math.max(1, rect.height + start - end);

        return clamp((start - rect.top) / distance, 0, 1);
    }

    function buildSchedulePath(items, timelineRect, width, height) {
        if (!items || items.length < 2) {
            return '';
        }

        const corridorInset = clamp(width * 0.04, 14, 30);

        const anchors = items.map((item, index) => {
            const rect = item.getBoundingClientRect();
            const isRight = index % 2 === 1;
            const edgeX = (isRight ? rect.left : rect.right) - timelineRect.left;
            const x = isRight ? edgeX - corridorInset : edgeX + corridorInset;
            const y = rect.top - timelineRect.top + rect.height * 0.5;

            return {
                x: clamp(x, 10, width - 10),
                y: clamp(y, 10, height - 10),
                h: rect.height,
            };
        });

        const first = anchors[0];
        const second = anchors[1];
        const last = anchors[anchors.length - 1];
        const beforeLast = anchors[anchors.length - 2];
        const startBacktrack = clamp(0.26, 0.18, 0.32);
        const endForward = clamp(0.28, 0.2, 0.34);
        const points = [];

        points.push({
            x: clamp(first.x - (second.x - first.x) * startBacktrack, 10, width - 10),
            y: clamp(first.y - (second.y - first.y) * startBacktrack, 10, height - 10),
        });

        anchors.forEach(function (anchor) {
            points.push({ x: anchor.x, y: anchor.y });
        });

        points.push({
            x: clamp(last.x + (last.x - beforeLast.x) * endForward, 10, width - 10),
            y: clamp(last.y + (last.y - beforeLast.y) * endForward, 10, height - 10),
        });

        const parts = [`M ${points[0].x} ${points[0].y}`];
        const tension = 0.92;

        for (let i = 0; i < points.length - 1; i += 1) {
            const p0 = points[Math.max(0, i - 1)];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(points.length - 1, i + 2)];

            const cp1x = clamp(p1.x + ((p2.x - p0.x) / 6) * tension, 10, width - 10);
            const cp1y = clamp(p1.y + ((p2.y - p0.y) / 6) * tension, 10, height - 10);
            const cp2x = clamp(p2.x - ((p3.x - p1.x) / 6) * tension, 10, width - 10);
            const cp2y = clamp(p2.y - ((p3.y - p1.y) / 6) * tension, 10, height - 10);

            parts.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`);
        }

        return parts.join(' ');
    }

    function initTimelinePath() {
        const timeline = document.querySelector('.timeline');
        const svg = document.querySelector('.timeline-path-svg');
        const path = document.querySelector('.timeline-path-line');

        if (!timeline || !svg || !path) {
            return;
        }
        if (timeline.dataset.timelineInitialized === '1') {
            return;
        }

        timeline.dataset.timelineInitialized = '1';

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const state = { progress: 0 };
        let pathLength = 0;
        let rafId = 0;
        let tween = null;

        function applyStroke(progress) {
            if (!pathLength) {
                return;
            }

            const p = clamp(progress, 0, 1);
            path.style.strokeDasharray = String(pathLength);
            path.style.strokeDashoffset = String(pathLength * (1 - p));
        }

        function destroyTween() {
            if (tween?.scrollTrigger) {
                tween.scrollTrigger.kill();
            }
            if (tween) {
                tween.kill();
            }
            tween = null;
        }

        function syncFallbackProgress() {
            if (prefersReduced) {
                state.progress = 1;
                applyStroke(1);
                return;
            }

            state.progress = getTimelineProgress(timeline);
            applyStroke(state.progress);
        }

        function setupAnimation() {
            destroyTween();

            if (prefersReduced) {
                state.progress = 1;
                applyStroke(1);
                return;
            }

            if (window.gsap && window.ScrollTrigger) {
                window.gsap.registerPlugin(window.ScrollTrigger);
                state.progress = 0;
                tween = window.gsap.to(state, {
                    progress: 1,
                    ease: 'none',
                    overwrite: true,
                    immediateRender: false,
                    onUpdate: function () {
                        applyStroke(state.progress);
                    },
                    scrollTrigger: {
                        trigger: timeline,
                        start: 'top 62%',
                        end: 'bottom 18%',
                        scrub: 0.35,
                        invalidateOnRefresh: true,
                    },
                });

                applyStroke(tween.scrollTrigger ? tween.scrollTrigger.progress : 0);
                window.ScrollTrigger.refresh();
                return;
            }

            syncFallbackProgress();
        }

        function updatePath() {
            const width = Math.max(1, Math.round(timeline.offsetWidth));
            const height = Math.max(1, Math.round(timeline.offsetHeight));
            const items = Array.from(timeline.querySelectorAll('.timeline-item'));

            svg.setAttribute('width', String(width));
            svg.setAttribute('height', String(height));
            svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

            if (items.length < 2) {
                path.setAttribute('d', '');
                pathLength = 0;
                destroyTween();
                return;
            }

            const timelineRect = timeline.getBoundingClientRect();
            const d = buildSchedulePath(items, timelineRect, width, height);
            path.setAttribute('d', d);

            const length = path.getTotalLength();
            if (!Number.isFinite(length) || length <= 0) {
                pathLength = 0;
                destroyTween();
                return;
            }

            pathLength = length;
            setupAnimation();
        }

        function onScroll() {
            if (tween || prefersReduced) {
                return;
            }
            if (rafId) {
                return;
            }

            rafId = window.requestAnimationFrame(function () {
                rafId = 0;
                syncFallbackProgress();
            });
        }

        const resizeObserver = new ResizeObserver(function () {
            window.requestAnimationFrame(updatePath);
        });

        resizeObserver.observe(timeline);
        timeline.querySelectorAll('.timeline-item').forEach(function (item) {
            resizeObserver.observe(item);
        });

        updatePath();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', function () {
            window.requestAnimationFrame(updatePath);
        });

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () {
                window.requestAnimationFrame(updatePath);
            });
        }
    }

    window.initTimelinePath = initTimelinePath;
    document.addEventListener('DOMContentLoaded', initTimelinePath);
})();
