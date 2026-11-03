const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const OLD_JWT_FALLBACK = 'your-super-secret-jwt-key-change-in-production';

function runNode(code, overrides = {}, unset = []) {
    const env = { ...process.env, ...overrides };
    for (const key of unset) delete env[key];
    return spawnSync(process.execPath, ['-e', code], {
        cwd: root,
        env,
        encoding: 'utf8'
    });
}

function walkJs(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walkJs(full, files);
        else if (entry.name.endsWith('.js')) files.push(full);
    }
    return files;
}

test('production refuses to start when JWT_SECRET is missing', () => {
    const result = runNode("require('./server/config.js')", { NODE_ENV: 'production' }, ['JWT_SECRET']);
    assert.notStrictEqual(result.status, 0);
    const output = `${result.stderr}\n${result.stdout}`;
    assert.match(output, /JWT_SECRET/);
    assert.match(output, /Refusing to start/);
});

test('production refuses to start when JWT_SECRET is blank', () => {
    const result = runNode(
        "require('./server/config.js')",
        { NODE_ENV: 'production', JWT_SECRET: '   ' }
    );
    assert.notStrictEqual(result.status, 0);
    assert.match(result.stderr, /Refusing to start/);
});

test('production refuses the previously committed JWT_SECRET fallback', () => {
    const result = runNode(
        "require('./server/config.js')",
        { NODE_ENV: 'production', JWT_SECRET: OLD_JWT_FALLBACK }
    );
    assert.notStrictEqual(result.status, 0);
    assert.match(result.stderr, /publicly known fallback/);
    assert.match(result.stderr, /Refusing to start/);
});

test('development generates one random JWT_SECRET per process and does not use the old literal', () => {
    const result = runNode(
        `
        const a = require('./server/config.js').JWT_SECRET;
        const b = require('./server/config.js').JWT_SECRET;
        if (a !== b) process.exit(2);
        if (a === ${JSON.stringify(OLD_JWT_FALLBACK)}) process.exit(3);
        if (!/^[0-9a-f]{64}$/.test(a)) process.exit(4);
        process.stdout.write('ok');
        `,
        { NODE_ENV: 'development' },
        ['JWT_SECRET']
    );
    assert.strictEqual(result.status, 0, result.stderr);
    assert.strictEqual(result.stdout, 'ok');
    assert.match(result.stderr, /Generated a random JWT_SECRET/);
    assert.doesNotMatch(result.stderr, /[0-9a-f]{64}/);
});

test('an explicit JWT_SECRET is used in test', () => {
    const result = runNode(
        "process.stdout.write(require('./server/config.js').JWT_SECRET)",
        { NODE_ENV: 'test', JWT_SECRET: 'unit-test-jwt-secret' }
    );
    assert.strictEqual(result.status, 0, result.stderr);
    assert.strictEqual(result.stdout, 'unit-test-jwt-secret');
});

test('api modules refuse to load in production without JWT_SECRET', () => {
    const files = [
        './api/auth/login.js',
        './api/leaderboard.js',
        './api/stats.js',
        './api/crypto-quest/progress.js'
    ];
    for (const file of files) {
        const result = runNode(`require(${JSON.stringify(file)})`, { NODE_ENV: 'production' }, ['JWT_SECRET']);
        assert.notStrictEqual(result.status, 0, `${file}\n${result.stderr}`);
        assert.match(result.stderr, /JWT_SECRET/);
        assert.match(result.stderr, /Refusing to start/);
    }
});

test('source has no hard-coded secret fallback literals', () => {
    const secretName = /SECRET|PASSWORD|SIGNING_KEY|PRIVATE_KEY|API_KEY|GATEWAY|REFRESH_TOKEN/;
    const fallback = /process\.env\.([A-Z0-9_]+)\s*(?:\|\||\?\?)\s*['"`]/g;
    const offenders = [];
    for (const file of walkJs(root)) {
        const text = fs.readFileSync(file, 'utf8');
        fallback.lastIndex = 0;
        let match;
        while ((match = fallback.exec(text))) {
            if (secretName.test(match[1])) {
                offenders.push(`${path.relative(root, file)}: ${match[0]}`);
            }
        }
    }
    assert.deepStrictEqual(offenders, []);
});
