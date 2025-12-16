const bigintCryptoUtils = require('bigint-crypto-utils');
console.log("Attacker guessed");
// Security parameter and setup
const p = bigintCryptoUtils.primeSync(2048); // Large prime for group order
const g = bigintCryptoUtils.randBetween(p); // Generator of the group

// Random private keys for Alice and Bob
const u = bigintCryptoUtils.randBetween(p);
const v = bigintCryptoUtils.randBetween(p);

// Compute Diffie-Hellman terms
gU = bigintCryptoUtils.modPow(g, u, p); // g^u mod p
gV = bigintCryptoUtils.modPow(g, v, p); // g^v mod p
const gUV = bigintCryptoUtils.modPow(gU, v, p); // g^(uv) mod p
console.log(`gUV: ${gUV}`);

// Random unrelated value g^w
gW = bigintCryptoUtils.modPow(g, bigintCryptoUtils.randBetween(p), p);
console.log(`gW: ${gW}`);

// Distinguishing challenge
const isReal = Math.random() < 0.5; // Randomly decide if real or random
console.log(`Challenge: ${isReal}`);
const challenge = isReal ? gUV : gW;
console.log(`Challenge: ${challenge}`);



// Attacker tries to distinguish
function attackerDistinguish(g, gU, gV, challenge, p) {
    // Placeholder logic for distinguishing; in practice, this is very hard.
    return Math.random() < 0.5; // Random guess
}

const guess = attackerDistinguish(g, gU, gV, challenge, p);
console.log(`gW: ${guess}`);
console.log(`Attacker guessed ${guess ? 'real' : 'random'}, was actually ${isReal ? 'real' : 'random'}`);
