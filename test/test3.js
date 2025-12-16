// Utility function for modular arithmetic
function modInverse(a, m) {
    let m0 = m, y = 0, x = 1;
    if (m === 1) return 0;

    while (a > 1) {
        let q = Math.floor(a / m);
        [m, a] = [a % m, m];
        [x, y] = [y, x - q * y];
    }

    return (x + m0) % m0;
}

// Share algorithm
function share(secret, n, t, prime) {
    const coefficients = [secret];
    for (let i = 1; i < t; i++) {
        coefficients.push(Math.floor(Math.random() * prime));
    }

    const shares = [];
    for (let i = 1; i <= n; i++) {
        let x = i;
        let y = coefficients.reduce((sum, coef, j) => {
            return (sum + coef * Math.pow(x, j)) % prime;
        }, 0);
        shares.push([x, y]);
    }

    return shares;
}

// Reconstruct algorithm
function reconstruct(shares, t, prime) {
    let secret = 0;

    for (let i = 0; i < t; i++) {
        const [xi, yi] = shares[i];
        let numerator = 1;
        let denominator = 1;

        for (let j = 0; j < t; j++) {
            if (i !== j) {
                const [xj] = shares[j];
                numerator = (numerator * xj) % prime;
                denominator = (denominator * (xj - xi)) % prime;
            }
        }

        const lambda = (numerator * modInverse(denominator, prime)) % prime;
        secret = (secret + yi * lambda) % prime;
    }

    return secret;
}

// Example Usage
const secret = 1234; // Secret to share
const n = 5;         // Number of participants
const t = 3;         // Threshold to reconstruct
const prime = 7919;  // A prime number larger than the secret

// Generate shares
const shares = share(secret, n, t, prime);
console.log("Shares:", shares);

// Select t shares for reconstruction
const selectedShares = shares.slice(0, t);

// Reconstruct the secret
const reconstructedSecret = reconstruct(selectedShares, t, prime);
console.log("Reconstructed Secret:", reconstructedSecret);
console.log("Secret:", secret, "Prime:", prime);