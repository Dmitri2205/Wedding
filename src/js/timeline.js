(function () {
    const STROKE_ELS = 'path, line, polyline, polygon, circle, ellipse, rect';
    /** На сколько «раньше» по длине пути (px) запускать отрисовку иконки относительно точки у .desc */
    const ICON_REVEAL_LEAD_PX = 72;
    /** Первая иконка — только после старта отрисовки линии (тот же progress, что и stroke таймлайна) */
    const LINE_STROKE_START_EPS = 1e-5;

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function getTimelineProgress(timeline) {
        const rect = timeline.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

        if (rect.height <= 0 || viewportHeight <= 0) {
            return 0;
        }

        const start = viewportHeight * 0.5;
        const end = viewportHeight * 0.3;
        const distance = Math.max(1, rect.height + start - end);

        return clamp((start - rect.top) / distance, 0, 1);
    }

    function getStrokeLength(el) {
        if (typeof el.getTotalLength === 'function') {
            const len = el.getTotalLength();
            if (Number.isFinite(len) && len > 0) {
                return len;
            }
        }
        const tag = el.tagName && el.tagName.toLowerCase();
        if (tag === 'circle') {
            const r = el.r && el.r.baseVal !== undefined
                ? el.r.baseVal.value
                : parseFloat(el.getAttribute('r') || '0', 10);
            if (r > 0) {
                return 2 * Math.PI * r;
            }
        }
        if (tag === 'rect') {
            const w = parseFloat(el.getAttribute('width') || '0', 10);
            const h = parseFloat(el.getAttribute('height') || '0', 10);
            if (w > 0 && h > 0) {
                return 2 * (w + h);
            }
        }
        return 0;
    }

    function prepareDashesInSvg(svg) {
        if (!svg) {
            return;
        }
        svg.querySelectorAll(STROKE_ELS).forEach(function (el) {
            const L = getStrokeLength(el);
            if (L > 0) {
                el.style.strokeDasharray = String(L);
                el.style.strokeDashoffset = String(L);
            } else {
                el.style.removeProperty('stroke-dasharray');
                el.style.removeProperty('stroke-dashoffset');
            }
        });
    }

    function lengthAtClosestY(pathEl, targetY) {
        const total = pathEl.getTotalLength();
        if (total <= 0 || !Number.isFinite(total)) {
            return 0;
        }
        let bestS = 0;
        let bestD = Infinity;
        for (let s = 0; s <= total; s += 1) {
            const p = pathEl.getPointAtLength(s);
            const d = Math.abs(p.y - targetY);
            if (d < bestD) {
                bestD = d;
                bestS = s;
            }
        }
        return bestS;
    }

    function computeItemThresholds(path, items, timelineRect) {
        const t = items.map(function (item) {
            const desc = item.querySelector('.desc');
            const r = (desc || item).getBoundingClientRect();
            const y = r.top - timelineRect.top + r.height / 2;
            return lengthAtClosestY(path, y);
        });
        for (let i = 1; i < t.length; i += 1) {
            t[i] = Math.max(t[i], t[i - 1] + 0.5);
        }
        return t;
    }

    // ~1.2s на сегмент, stagger ~36ms (масштаб от исходных 0.5s / 15ms)
    function runDrawAnimation(paths) {
        if (!paths || !paths.length) {
            return;
        }
        if (window.gsap) {
            window.gsap.killTweensOf(paths);
            window.gsap.to(paths, {
                strokeDashoffset: 0,
                duration: 1.2,
                stagger: 0.036,
                ease: 'power2.out',
            });
        } else {
            paths.forEach(function (p, i) {
                window.setTimeout(function () {
                    p.style.strokeDashoffset = '0';
                }, i * 36);
            });
        }
    }

    function revealStrokeIconInstantly(item) {
        const svg = item.querySelector('.timeline-draw-svg');
        if (!svg) {
            return;
        }
        svg.querySelectorAll(STROKE_ELS).forEach(function (el) {
            const L = getStrokeLength(el);
            if (L > 0) {
                el.style.strokeDasharray = String(L);
                el.style.strokeDashoffset = '0';
            }
        });
    }

    function isFirstTimelineItem(item) {
        const timeline = document.querySelector('.timeline');
        return Boolean(timeline && timeline.querySelector('.timeline-item') === item);
    }

    function setFirstIconDrawVisible(item, visible) {
        if (!isFirstTimelineItem(item)) {
            return;
        }
        const draw = item.querySelector('.timeline-item-draw');
        if (!draw) {
            return;
        }
        if (visible) {
            draw.style.opacity = '1';
            draw.style.visibility = 'visible';
        } else {
            draw.style.opacity = '0';
            draw.style.visibility = 'hidden';
        }
    }

    function playIconForItem(item, preferInstant, reduceMotion) {
        const svg = item.querySelector('.timeline-draw-svg');
        if (!svg) {
            return;
        }
        const paths = [].filter.call(svg.querySelectorAll(STROKE_ELS), function (p) {
            return getStrokeLength(p) > 0;
        });
        if (!paths.length) {
            return;
        }
        setFirstIconDrawVisible(item, true);
        // После updatePath() syncIcons(..., true) выставлял preferInstant — первая иконка
        // сразу показывалась целиком. Первую всегда «дорисовываем» анимацией (кроме a11y).
        const useStrokeAnimation = reduceMotion
            ? false
            : (!preferInstant || isFirstTimelineItem(item));

        if (!useStrokeAnimation) {
            if (window.gsap) {
                window.gsap.killTweensOf(paths);
            }
            revealStrokeIconInstantly(item);
        } else {
            runDrawAnimation(paths);
        }
    }

    function buildSchedulePath(items, timelineRect, width, height) {
        if (!items || items.length < 2) {
            return '';
        }

        const corridorInset = clamp(width * 0.04, 14, 30);

        const anchors = items.map(function (item, index) {
            const rect = item.getBoundingClientRect();
            const desc = item.querySelector('.desc');
            const descRect = desc ? desc.getBoundingClientRect() : null;
            const box = descRect || rect;
            const isRight = index % 2 === 1;
            const edgeX = (isRight ? box.left : box.right) - timelineRect.left;
            const x = isRight ? edgeX - corridorInset : edgeX + corridorInset;
            const y = descRect
                ? descRect.top - timelineRect.top + descRect.height / 2
                : rect.top - timelineRect.top + rect.height / 2;

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

        const parts = ['M ' + points[0].x + ' ' + points[0].y];
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

            parts.push('C ' + cp1x + ' ' + cp1y + ' ' + cp2x + ' ' + cp2y + ' ' + p2.x + ' ' + p2.y);
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
        const items = function () {
            return Array.from(timeline.querySelectorAll('.timeline-item'));
        };
        let iconThresholds = [];
        let listInstance = items();

        function applyStroke(progress) {
            if (!pathLength) {
                return;
            }

            const p = clamp(progress, 0, 1);
            path.style.strokeDasharray = String(pathLength);
            path.style.strokeDashoffset = String(pathLength * (1 - p));
        }

        function resetItemDrawState(its) {
            its.forEach(function (el, index) {
                delete el.dataset.iconRevealed;
                if (index === 0 && !prefersReduced) {
                    setFirstIconDrawVisible(el, false);
                }
                const svg = el.querySelector('.timeline-draw-svg');
                if (svg) {
                    const segs = svg.querySelectorAll(STROKE_ELS);
                    if (window.gsap) {
                        window.gsap.killTweensOf(segs);
                    }
                    prepareDashesInSvg(svg);
                }
            });
        }

        function syncIcons(progress, isLayoutSync) {
            if (!pathLength || !listInstance.length) {
                return;
            }
            const drawn = pathLength * clamp(progress, 0, 1);
            const useInstant = isLayoutSync || prefersReduced;
            for (let i = 0; i < listInstance.length; i += 1) {
                if (iconThresholds[i] === undefined) {
                    return;
                }
                if (i === 0 && !prefersReduced && progress <= LINE_STROKE_START_EPS) {
                    continue;
                }
                const revealAt = Math.max(0, iconThresholds[i] - ICON_REVEAL_LEAD_PX);
                if (drawn + 0.4 < revealAt) {
                    continue;
                }
                if (listInstance[i].dataset.iconRevealed) {
                    continue;
                }
                listInstance[i].dataset.iconRevealed = '1';
                playIconForItem(listInstance[i], useInstant, prefersReduced);
            }
        }

        function destroyTween() {
            if (tween && tween.scrollTrigger) {
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
                syncIcons(1, true);
                return;
            }

            state.progress = getTimelineProgress(timeline);
            applyStroke(state.progress);
            syncIcons(state.progress, false);
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
                        syncIcons(state.progress, false);
                    },
                    scrollTrigger: {
                        trigger: timeline,
                        start: 'top 56%',
                        end: 'bottom 32%',
                        scrub: 0.35,
                        invalidateOnRefresh: true,
                    },
                });

                window.ScrollTrigger.refresh();
                return;
            }
        }

        function updatePath() {
            const width = Math.max(1, Math.round(timeline.offsetWidth));
            const height = Math.max(1, Math.round(timeline.offsetHeight));
            listInstance = items();

            svg.setAttribute('width', String(width));
            svg.setAttribute('height', String(height));
            svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);

            if (listInstance.length < 2) {
                path.setAttribute('d', '');
                pathLength = 0;
                iconThresholds = [];
                destroyTween();
                return;
            }

            const timelineRect = timeline.getBoundingClientRect();
            const d = buildSchedulePath(listInstance, timelineRect, width, height);
            path.setAttribute('d', d);

            const length = path.getTotalLength();
            if (!Number.isFinite(length) || length <= 0) {
                pathLength = 0;
                iconThresholds = [];
                destroyTween();
                return;
            }

            pathLength = length;
            iconThresholds = computeItemThresholds(path, listInstance, timelineRect);
            resetItemDrawState(listInstance);

            setupAnimation();
            if (prefersReduced) {
                state.progress = 1;
            } else if (tween && tween.scrollTrigger) {
                state.progress = tween.scrollTrigger.progress;
            } else {
                state.progress = getTimelineProgress(timeline);
            }
            applyStroke(state.progress);
            syncIcons(state.progress, true);
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
        listInstance.forEach(function (item) {
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
