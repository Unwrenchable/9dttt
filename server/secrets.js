/**
 * Signing-secret resolution.
 *
 * Production refuses to boot when a required secret is missing, blank, or
 * still set to a value that used to be hard-coded in this repository.
 * Development and test never fall back to a committed literal: each process
 * generates a random secret once, the first time it is needed.
 */

const crypto = require('crypto');

// Previously committed fallbacks. Compared only so production will not
// keep signing with a public value. These strings are never used as defaults.
const REJECTED_LITERALS = new Set([
    'your-super-secret-jwt-key-change-in-production',
    'your-super-secret-jwt-key-change-this-to-something-random',
    'your-super-secret-jwt-key-change-this'
]);

const generatedFallbacks = new Map();

function isProduction() {
    return (process.env.NODE_ENV || 'development') === 'production';
}

function isRejectedLiteral(value) {
    if (typeof value !== 'string') return false;
    return REJECTED_LITERALS.has(value) || REJECTED_LITERALS.has(value.trim());
}

/**
 * @param {string} name Environment variable name (for example JWT_SECRET).
 * @returns {string}
 */
function requireSecret(name) {
    const raw = process.env[name];
    const present = typeof raw === 'string' && raw.trim().length > 0;

    if (present && isRejectedLiteral(raw)) {
        if (isProduction()) {
            throw new Error(
                `FATAL: ${name} is set to a publicly known fallback and cannot be used in production. Rotate it and set a unique secret. Refusing to start.`
            );
        }
        // An explicit dev/test value is honored, even if it matches an old sample.
        return raw;
    }

    if (present) {
        return raw;
    }

    if (isProduction()) {
        throw new Error(
            `FATAL: ${name} environment variable must be set to a strong secret in production. Refusing to start.`
        );
    }

    if (!generatedFallbacks.has(name)) {
        generatedFallbacks.set(name, crypto.randomBytes(32).toString('hex'));
        const nodeEnv = process.env.NODE_ENV || 'development';
        console.warn(
            `[secrets] ${name} is not set. Generated a random ${name} for this ${nodeEnv} process. ` +
            'It changes when the process restarts and is not shared with other processes. ' +
            `Set ${name} to keep tokens valid.`
        );
    }

    return generatedFallbacks.get(name);
}

module.exports = { requireSecret };
