const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public');

const files = ['index.html'];
const dirs = ['css', 'js', 'assets', 'img'];

function rmDir(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const from = path.join(src, entry.name);
        const to = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(from, to);
        } else {
            fs.copyFileSync(from, to);
        }
    }
}

rmDir(outDir);
fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
    const src = path.join(root, file);
    if (!fs.existsSync(src)) {
        throw new Error('Missing file for deploy: ' + file);
    }
    fs.copyFileSync(src, path.join(outDir, file));
}

for (const dir of dirs) {
    const src = path.join(root, dir);
    if (fs.existsSync(src)) {
        copyDir(src, path.join(outDir, dir));
    }
}

console.log('Built static output in public/');
