const bigintCryptoUtils = require('bigint-crypto-utils');

async function generateSetup(bits = 2048) {
    // Generate two large prime numbers
    const p = await bigintCryptoUtils.prime(bits / 2);
    const q = await bigintCryptoUtils.prime(bits / 2);

    // Compute RSA modulus N = p * q
    const N = p * q;

    // Generate a random element from the multiplicative group Z*_N
    // We ensure it's coprime with N
    let x;
    do {
        x = bigintCryptoUtils.randBetween(N);
    } while (bigintCryptoUtils.gcd(x, N) !== 1n);

    return { N, x };
}

function sequentialSquare(x, T, N) {
    // Perform T sequential squaring operations
    let result = x;
    for (let i = 0n; i < T; i++) {
        result = (result * result) % N;
        // Note: In practice, this cannot be parallelized due to the sequential nature
    }
    return result;
}

async function generateChallenge(params) {
    const { N, x, T } = params;

    // Compute the sequential square
    const y = sequentialSquare(x, T, N);

    // Generate a random element from the same group
    let r;
    do {
        r = bigintCryptoUtils.randBetween(N);
    } while (bigintCryptoUtils.gcd(r, N) !== 1n);

    // Randomly choose whether to use the real value or random
    const isReal = Math.random() < 0.5;
    const challenge = isReal ? y : r;

    return {
        challenge,
        isReal,
        publicParams: { N, x, T }
    };
}

// Example usage
async function demonstrateAssumption() {
    console.log("Setting up Sequential Squaring...");

    // Setup phase
    const T = 1000n; // Number of sequential operations
    const { N, x } = await generateSetup();

    // Generate challenge
    const { challenge, isReal, publicParams } = await generateChallenge({ N, x, T });

    console.log(`Public Parameters:`);
    console.log(`N: ${N}`);
    console.log(`x: ${x}`);
    console.log(`T: ${T}`);
    console.log(`Challenge: ${challenge}`);

    // Simulate attacker trying to distinguish
    // In reality, without computing the full sequence,
    // this should be computationally hard
    const guess = Math.random() < 0.5;

    console.log(`\nResults:`);
    console.log(`Actual: ${isReal ? 'Real' : 'Random'}`);
    console.log(`Guess: ${guess ? 'Real' : 'Random'}`);
    console.log(`Correct? ${guess === isReal}`);
}

// Run the demonstration
demonstrateAssumption().catch(console.error);