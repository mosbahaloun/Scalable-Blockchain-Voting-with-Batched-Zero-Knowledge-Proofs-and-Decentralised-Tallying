// Core utility functions
const crypto = require('crypto');

function randomBigInt(minValue, maxValue) {
    const range = maxValue - minValue + 1n;
    const bytes = Math.ceil(range.toString(2).length / 8);
    const mask = (1n << BigInt(range.toString(2).length)) - 1n;

    while (true) {
        const randomBytes = crypto.randomBytes(bytes);
        let val = BigInt('0x' + randomBytes.toString('hex')) & mask;
        if (val < range) {
            return val + minValue;
        }
    }
}

function modExp(base, exp, modulus) {
    if (modulus === 1n) return 0n;

    let result = 1n;
    base = base % modulus;

    while (exp > 0n) {
        if (exp % 2n === 1n) {
            result = (result * base) % modulus;
        }
        exp = exp >> 1n;
        base = (base * base) % modulus;
    }

    return result;
}

function modInverse(a, m) {
    a = ((a % m) + m) % m;  // Ensure positive value

    function extendedGCD(a, b) {
        if (a === 0n) return [b, 0n, 1n];

        const [gcd, x1, y1] = extendedGCD(b % a, a);
        const x = y1 - (b / a) * x1;
        const y = x1;

        return [gcd, x, y];
    }

    const [gcd, x, _] = extendedGCD(a, m);

    if (gcd !== 1n) {
        throw new Error(`Modular inverse does not exist. GCD(${a}, ${m}) = ${gcd}`);
    }

    return ((x % m) + m) % m;  // Ensure positive result
}

function nextPrime(n) {
    function isPrime(num) {
        if (num <= 1n) return false;
        if (num <= 3n) return true;
        if (num % 2n === 0n || num % 3n === 0n) return false;

        for (let i = 5n; i * i <= num; i += 6n) {
            if (num % i === 0n || num % (i + 2n) === 0n) return false;
        }
        return true;
    }

    let prime = n + 1n;
    while (!isPrime(prime)) {
        prime++;
    }
    return prime;
}

function generateTimeLockPuzzle(N, t) {
    const mu = randomBigInt(2n, N - 1n);
    const T = modExp(mu, 2n ** BigInt(t), N * N);
    const s = randomBigInt(1n, N - 1n);
    const C = (s + T) % N;

    return {
        N,
        mu,
        t,
        C,
        s
    };
}

function generatePolynomial(s, k, p) {
    const coefficients = [s];
    for (let i = 1; i < k; i++) {
        coefficients.push(randomBigInt(0n, p - 1n));
    }
    return coefficients;
}

function evaluatePolynomial(coefficients, x, p) {
    let result = 0n;
    for (let i = 0; i < coefficients.length; i++) {
        result = (result + coefficients[i] * modExp(x, BigInt(i), p)) % p;
    }
    return result;
}

function computeTau(yi, si, p) {
    return modExp(yi, si, p);
}

function computeWi(i, publicKeys, p) {
    let numerator = 1n;
    let denominator = 1n;

    for (let j = 0n; j < i - 1n; j++) {
        numerator = (numerator * publicKeys[Number(j)]) % p;
    }
    for (let j = i; j < BigInt(publicKeys.length); j++) {
        denominator = (denominator * publicKeys[Number(j)]) % p;
    }

    if (denominator === 0n) {
        throw new Error("Denominator is zero in Wi calculation");
    }
    return (numerator * modInverse(denominator, p)) % p;
}

function encryptVoteComplete(vote_vector, i, private_key, share, g, public_keys, p) {
    i = BigInt(i);
    private_key = BigInt(private_key);
    share = BigInt(share);
    g = BigInt(g);
    p = BigInt(p);
    const vote_vector_bn = vote_vector.map(v => BigInt(v));
    const public_keys_bn = public_keys.map(pk => BigInt(pk));

    const Wi = computeWi(i + 1n, public_keys_bn, p);

    const encryptedVotes = [];

    for (const vote of vote_vector_bn) {
        const rhoIJ = randomBigInt(1n, p - 1n);

        const gRho = modExp(g, rhoIJ, p);
        const gGammaSi = modExp(g, (share * Wi) % (p - 1n), p);
        const alpha = (gRho * gGammaSi) % p;

        const gV = modExp(g, vote, p);
        const WiXi = modExp(Wi, private_key, p);
        const gRhoIJ = modExp(g, rhoIJ, p);
        const beta = (gV * WiXi % p * gRhoIJ) % p;

        encryptedVotes.push({ alpha, beta, rhoIJ });
    }

    return { encryptedVotes, Wi };
}

function aggregateVotes(encrypted_votes, p) {
    let alphaAgg = 1n;
    let betaAgg = 1n;

    for (const { alpha, beta } of encrypted_votes) {
        alphaAgg = (alphaAgg * BigInt(alpha)) % p;
        betaAgg = (betaAgg * BigInt(beta)) % p;
    }

    return { alphaAgg, betaAgg };
}

function calculateResults(aggregatedVotes, puzzle, g, p, maxScore) {
    g = BigInt(g);
    p = BigInt(p);
    maxScore = BigInt(maxScore);

    const s = (BigInt(puzzle.C) - modExp(BigInt(puzzle.mu), 2n ** BigInt(puzzle.t), BigInt(puzzle.N))) % BigInt(puzzle.N);
    const g_neg_s = modExp(g, p - 1n - s, p);

    const results = [];

    for (let idx = 0; idx < aggregatedVotes.length; idx++) {
        const { alphaAgg, betaAgg } = aggregatedVotes[idx];

        const denominator = (BigInt(alphaAgg) * g_neg_s) % p;
        if (denominator === 0n) {
            throw new Error(`Denominator is zero for candidate ${idx + 1}`);
        }
        const inv_denominator = modInverse(denominator, p);

        const decrypted = (BigInt(betaAgg) * inv_denominator) % p;

        let found = false;
        for (let i = 0n; i <= maxScore * BigInt(aggregatedVotes.length); i++) {
            if (modExp(g, i, p) === decrypted) {
                results.push(Number(i));
                found = true;
                break;
            }
        }

        if (!found) {
            throw new Error(`Could not decode vote result for candidate ${idx + 1}`);
        }
    }

    return results;
}

async function runProtocol() {
    try {
        const p = nextPrime(2039n);
        const g = 2n;
        const numCandidates = 3;
        const maxScore = 10;
        const k = 2;
        const N = nextPrime(2047n);
        const t = 20;

        const puzzle = generateTimeLockPuzzle(N, t);
        const coefficients = generatePolynomial(puzzle.s, k, p);

        const voters = [];
        const numVoters = 3;
        for (let i = 0; i < numVoters; i++) {
            const privateKey = randomBigInt(1n, p - 1n);
            const publicKey = modExp(g, privateKey, p);
            const share = evaluatePolynomial(coefficients, publicKey, p);

            voters.push({ id: `V${i + 1}`, privateKey, publicKey, share });
        }

        const publicKeys = voters.map(v => v.publicKey);
        const predefinedScores = [
            [5n, 5n, 0n],
            [1n, 5n, 4n],
            [0n, 7n, 3n]
        ];

        const encryptedVotes = [];
        for (let i = 0; i < voters.length; i++) {
            const { encryptedVotes: encryptedVector } = encryptVoteComplete(
                predefinedScores[i],
                i,
                voters[i].privateKey,
                voters[i].share,
                g,
                publicKeys,
                p
            );
            encryptedVotes.push(encryptedVector);
        }

        const aggregatedVotes = [];
        for (let candidateIndex = 0; candidateIndex < numCandidates; candidateIndex++) {
            const candidateVotes = encryptedVotes.map(votes => votes[candidateIndex]);
            aggregatedVotes.push(aggregateVotes(candidateVotes, p));
        }

        const results = calculateResults(aggregatedVotes, puzzle, g, p, maxScore);

        console.log("Final results:", results);
    } catch (error) {
        console.error("Protocol failed:", error);
    }
}

runProtocol();
