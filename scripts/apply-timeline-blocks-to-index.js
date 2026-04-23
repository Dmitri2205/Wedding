const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const indexPath = path.join(root, 'html', 'index.html');

const ind = '                        ';

const schedule = [
    { time: '14:00', block: 1 },
    { time: '15:00', block: 2 },
    { time: '16:00', block: 3 },
    { time: '21:00', block: 4 },
    { time: '22:00', block: 5 },
];

let html = fs.readFileSync(indexPath, 'utf8');

schedule.forEach(({ time, block }) => {
    const raw = fs.readFileSync(
        path.join(root, 'html', `timeline-draw-block-${block}.html`),
        'utf8',
    );
    const blockHtml = raw
        .trimEnd()
        .split('\n')
        .map((L) => ind + L)
        .join('\n');
    const re = new RegExp(
        '(<div class="time">' + time.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</div>\\s*)<div class="timeline-item-draw"[^>]*>[\\s\\S]*?</div>',
        'm',
    );
    if (!re.test(html)) {
        throw new Error('No match for time ' + time + ' (timeline item missing?)');
    }
    html = html.replace(re, '$1' + blockHtml);
});

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Updated', indexPath);
