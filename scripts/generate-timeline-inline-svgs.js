/**
 * Берёт SVG из html/img/timeline-icons/. Затем: node scripts/apply-timeline-blocks-to-index.js
 * (либо npm run icons:timeline) вставит их в index.html. Разметка времени: 14:00…22:00.
 */
const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..', 'html', 'img', 'timeline-icons');
const outPath = path.join(__dirname, '..', 'html', '_generated-timeline-draw-blocks.html');

const files = [
    'guests-svgrepo-com.svg',
    'wedding-couple-svgrepo-com.svg',
    'dinner-svgrepo-com.svg',
    'wedding-cake-cook-svgrepo-com.svg',
    'cloudy-night-night-svgrepo-com.svg',
];

function processSvg(raw) {
    let s = raw.replace(/<\?xml[^?]*\?>\s*/gi, '').replace(/<!DOCTYPE[^>]*>\s*/gi, '');
    s = s.replace(/<!--[\s\S]*?-->\s*/g, '');
    s = s.replace(/<svg\s+/, '<svg class="timeline-draw-svg" preserveAspectRatio="xMidYMid meet" ');
    s = s.replace(/\s+height="800px"/gi, '').replace(/\s+width="800px"/gi, '');
    return s.trim();
}

const blocks = files.map((f) => {
    const c = processSvg(fs.readFileSync(path.join(base, f), 'utf8'));
    return '<div class="timeline-item-draw" aria-hidden="true">\n' + c + '\n</div>';
});

fs.writeFileSync(outPath, blocks.join('\n\n'), 'utf8');
blocks.forEach((block, i) => {
    fs.writeFileSync(path.join(__dirname, '..', 'html', `timeline-draw-block-${i + 1}.html`), block, 'utf8');
});
console.log('Wrote', outPath, '+ timeline-draw-block-1..5.html');
