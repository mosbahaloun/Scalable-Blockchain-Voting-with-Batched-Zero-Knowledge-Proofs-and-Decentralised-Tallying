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
    console.log(`original secret s: ${s}`);

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


function computeGammaI(i, publicKeys, p) {
    console.log("\nComputing gammaI:");
    console.log(`Index i: ${i}`);
    console.log(`Public keys:`, publicKeys.map(pk => pk.toString()));

    // Ensure all values are BigInt
    i = BigInt(i);
    p = BigInt(p);
    publicKeys = publicKeys.map(pk => BigInt(pk));

    let gamma = 1n;
    const yi = publicKeys[Number(i)];

    console.log(`yi: ${yi}`);

    for (let z = 0; z < publicKeys.length; z++) {
        if (BigInt(z) !== i) {
            const yz = publicKeys[z];
            console.log(`\nProcessing z=${z}:`);
            console.log(`yz: ${yz}`);

            // Calculate yz - yi in the finite field
            let diff = (yz + p - yi) % p;  // Changed subtraction to ensure positive result
            console.log(`diff (yz - yi): ${diff}`);

            if (diff === 0n) {
                console.error("Public key collision detected:");
                console.error(`yz: ${yz}, yi: ${yi}, diff: ${diff}`);
                throw new Error(`Public keys collision detected at index ${z}`);
            }

            // Calculate yz/(yz - yi)
            const invDiff = modInverse(diff, p);
            const term = (yz * invDiff) % p;
            console.log(`term (yz/(yz-yi)): ${term}`);

            gamma = (gamma * term) % p;
            console.log(`Current gamma: ${gamma}`);
        }
    }

    console.log(`Final gamma: ${gamma}`);
    return gamma;
}



function zkProveKeyAndShare(g, xi, si, yi, tau_i, p) {
    console.log("\nGenerating key and share proof:");

    // Generate random values
    const r1 = randomBigInt(1n, p - 1n);
    const r2 = randomBigInt(1n, p - 1n);

    console.log(`Random values r1: ${r1}, r2: ${r2}`);

    // Compute commitments
    const ai = modExp(g, r1, p);
    const bi = modExp(yi, r2, p);

    console.log(`Commitments ai: ${ai}, bi: ${bi}`);

    // Generate challenge
    const challengeInput = `${ai.toString()}${bi.toString()}${yi.toString()}${tau_i.toString()}`;
    const hash = crypto.createHash('sha256').update(challengeInput).digest('hex');
    const c = BigInt('0x' + hash) % (p - 1n);

    console.log(`Challenge c: ${c}`);

    // Compute responses with proper modular arithmetic
    const di1 = (r1 - (c * xi % (p - 1n)) + (p - 1n)) % (p - 1n);
    const di2 = (r2 - (c * si % (p - 1n)) + (p - 1n)) % (p - 1n);

    console.log(`Responses di1: ${di1}, di2: ${di2}`);

    // Add verification check in proof generation
    const check1 = ai === (modExp(g, di1, p) * modExp(yi, c, p)) % p;
    const check2 = bi === (modExp(yi, di2, p) * modExp(tau_i, c, p)) % p;
    console.log(`Self-verification checks - check1: ${check1}, check2: ${check2}`);

    return {
        c: c,
        ai: ai,
        bi: bi,
        di1: di1,
        di2: di2
    };
}

function verifyKeyAndShareProof(g, yi, tau_i, c, ai, bi, di1, di2, p) {
    console.log("\nVerifying key and share proof:");

    // Ensure all inputs are BigInt
    g = BigInt(g);
    yi = BigInt(yi);
    tau_i = BigInt(tau_i);
    c = BigInt(c);
    ai = BigInt(ai);
    bi = BigInt(bi);
    di1 = BigInt(di1);
    di2 = BigInt(di2);
    p = BigInt(p);

    // Verify challenge
    const challengeInput = `${ai.toString()}${bi.toString()}${yi.toString()}${tau_i.toString()}`;
    const hash = crypto.createHash('sha256').update(challengeInput).digest('hex');
    const cComputed = BigInt('0x' + hash) % (p - 1n);

    console.log(`Challenge check - Computed: ${cComputed}, Original: ${c}`);

    if (c !== cComputed) {
        console.log("Challenge verification failed");
        return false;
    }

    // Verify equations
    const lhs1 = ai;
    const rhs1 = (modExp(g, di1, p) * modExp(yi, c, p)) % p;

    const lhs2 = bi;
    const rhs2 = (modExp(yi, di2, p) * modExp(tau_i, c, p)) % p;

    console.log(`Equation checks:
        First:  LHS = ${lhs1}, RHS = ${rhs1}
        Second: LHS = ${lhs2}, RHS = ${rhs2}`);

    return lhs1 === rhs1 && lhs2 === rhs2;
}

// Helper function to ensure proper modular arithmetic
function modSub(a, b, m) {
    return ((a % m) - (b % m) + m) % m;
}

// Helper function to ensure proper modular multiplication
function modMul(a, b, m) {
    return (BigInt(a) * BigInt(b)) % BigInt(m);
}




function zkProveBallotRange(g, Wi, xi, pij, rhoij, beta_ij, yi, P, p) {
    console.log("\nGenerating range proof:");

    // Ensure BigInt conversion
    g = BigInt(g);
    Wi = BigInt(Wi);
    xi = BigInt(xi);
    pij = BigInt(pij);
    rhoij = BigInt(rhoij);
    beta_ij = BigInt(beta_ij);
    yi = BigInt(yi);
    P = BigInt(P);
    p = BigInt(p);

    // Generate random r for yˉi = g^r
    const r = randomBigInt(1n, p - 1n);
    const y_bar = modExp(g, r, p);
    console.log(`r=${r}, y_bar=${y_bar}`);

    const d_values = [];
    const e_values = [];
    const f_values = [];
    const a_values = [];

    // Simulate proofs for k ≠ pij
    for (let k = 0n; k <= P; k++) {
        if (k !== pij) {
            const dk = randomBigInt(1n, p - 1n);
            const ek = randomBigInt(1n, p - 1n);
            const fk = randomBigInt(1n, p - 1n);

            const g_k = modExp(g, k, p);
            const fraction = (beta_ij * modInverse(g_k, p)) % p;

            const ak = (modExp(Wi, fk, p) *
                modExp(g, ek, p) % p *
                modExp(fraction, dk, p)) % p;

            d_values.push([k, dk]);
            e_values.push([k, ek]);
            f_values.push([k, fk]);
            a_values.push([k, ak]);

            console.log(`k=${k}: dk=${dk}, ek=${ek}, fk=${fk}, ak=${ak}`);
        }
    }

    // Compute al for k = pij
    const al = (modExp(Wi, r, p) * modExp(g, r, p)) % p;
    a_values.push([pij, al]);
    console.log(`pij=${pij}: al=${al}`);

    // Generate challenge
    const sorted_a_values = a_values.sort((a, b) => Number(a[0] - b[0]));
    let challenge_str = sorted_a_values.map(([_, ak]) => ak.toString()).join('');
    challenge_str += `${y_bar}${yi}${beta_ij}`;
    const hash = crypto.createHash('sha256').update(challenge_str).digest('hex');
    const c = BigInt('0x' + hash) % (p - 1n);
    console.log(`Challenge c=${c}`);

    // Compute dl with proper modular arithmetic
    let dl = c;
    for (const [_, dk] of d_values) {
        dl = modSub(dl, dk, p - 1n);
    }
    console.log(`dl=${dl}`);

    // Use r directly for el and fl as per the protocol
    const el = r;  // Instead of calculating r - dl * pij
    const fl = r;  // Instead of calculating r - dl * xi
    const x_bar = modSub(r, c * xi, p - 1n);

    console.log(`el=${el}, fl=${fl}, x_bar=${x_bar}`);

    return {
        d_values,
        e_values,
        f_values,
        a_values,
        y_bar,
        dl,
        el,
        fl,
        x_bar,
        c,
        pij
    };
}



function verifyBallotRange(g, Wi, yi, beta_ij, proof, P, p) {
    console.log("\nVerifying range proof:");

    // Ensure BigInt conversion
    g = BigInt(g);
    Wi = BigInt(Wi);
    yi = BigInt(yi);
    beta_ij = BigInt(beta_ij);
    p = BigInt(p);
    P = BigInt(P);

    // Verify challenge
    const sorted_a_values = proof.a_values.sort((a, b) => Number(a[0] - b[0]));
    let challenge_str = sorted_a_values.map(([_, ak]) => ak.toString()).join('');
    challenge_str += `${proof.y_bar}${yi}${beta_ij}`;
    const hash = crypto.createHash('sha256').update(challenge_str).digest('hex');
    const c_computed = BigInt('0x' + hash) % (p - 1n);

    if (c_computed !== proof.c) {
        console.log("Challenge verification failed");
        return false;
    }

    // Verify sum of d values
    let d_sum = proof.dl;
    for (const [_, dk] of proof.d_values) {
        d_sum = (d_sum + dk) % (p - 1n);
    }
    if (d_sum !== c_computed) {
        console.log("Sum verification failed");
        return false;
    }

    // Verify all ak values
    for (const [k, ak] of sorted_a_values) {
        if (k !== proof.pij) {
            // Regular case verification
            const dk = proof.d_values.find(([k_d]) => k_d === k)[1];
            const ek = proof.e_values.find(([k_e]) => k_e === k)[1];
            const fk = proof.f_values.find(([k_f]) => k_f === k)[1];

            const g_k = modExp(g, k, p);
            const fraction = (beta_ij * modInverse(g_k, p)) % p;

            const expected_ak = (modExp(Wi, fk, p) *
                modExp(g, ek, p) % p *
                modExp(fraction, dk, p)) % p;

            if (ak !== expected_ak) {
                console.log(`ak verification failed for k=${k}`);
                return false;
            }
        } else {
            // Special case (al) verification
            const expected_al = (modExp(Wi, proof.fl, p) * modExp(g, proof.el, p)) % p;
            if (ak !== expected_al) {
                console.log("al verification failed");
                console.log(`Expected: ${expected_al}, Got: ${ak}`);
                return false;
            }
        }
    }

    // Verify yˉi
    const expected_y_bar = (modExp(yi, c_computed, p) * modExp(g, proof.x_bar, p)) % p;
    if (proof.y_bar !== expected_y_bar) {
        console.log("yˉi verification failed");
        return false;
    }

    return true;
}

function zkProveBallotSum(g, Wi, xi, pij_values, rhoij_values, beta_values, P, m, p) {
    console.log("\nGenerating sum proof:");
    // Ensure BigInt conversion
    g = BigInt(g);
    Wi = BigInt(Wi);
    xi = BigInt(xi);
    P = BigInt(P);
    m = BigInt(m);
    p = BigInt(p);

    const pij_values_bn = pij_values.map(v => BigInt(v));
    const rhoij_values_bn = rhoij_values.map(v => BigInt(v));
    const beta_values_bn = beta_values.map(v => BigInt(v));

    // Random value e
    const e = randomBigInt(1n, p - 1n);

    // Random values rij for each vote
    const r_values = Array(Number(m)).fill().map(() => randomBigInt(1n, p - 1n));

    // Compute y_bar = g^e
    const y_bar = modExp(g, e, p);

    // Compute a_prod = g^∑r
    const r_sum = r_values.reduce((acc, r) => (acc + r) % (p - 1n), 0n);
    const a_prod = modExp(g, r_sum, p);

    // Compute b = Wi^(me)
    const me = (m * e) % (p - 1n);
    const b = modExp(Wi, me, p);

    // Generate challenge
    let challenge_input = `${a_prod}${b}${y_bar}`;
    beta_values_bn.forEach(beta => challenge_input += beta.toString());

    const c = BigInt('0x' + crypto.createHash('sha256').update(challenge_input).digest('hex')) % (p - 1n);

    // Compute h_values: hij = rij - c * ρij
    const h_values = r_values.map((rij, idx) => {
        const h = modSub(rij, (c * rhoij_values_bn[idx]) % (p - 1n), p - 1n);
        return h;
    });

    // Compute d = e - c * xi
    const d = modSub(e, (c * xi) % (p - 1n), p - 1n);

    // Verify vote sum equals P
    const vote_sum = pij_values_bn.reduce((acc, val) => acc + val, 0n);
    if (vote_sum !== P) {
        throw new Error(`Vote sum ${vote_sum} doesn't equal P ${P}`);
    }

    // Debug output
    console.log('Sum proof values:');
    console.log(`e: ${e}`);
    console.log(`r_values: ${r_values.join(', ')}`);
    console.log(`y_bar: ${y_bar}`);
    console.log(`a_prod: ${a_prod}`);
    console.log(`b: ${b}`);
    console.log(`c: ${c}`);
    console.log(`h_values: [${h_values.join(', ')}]`);
    console.log(`d: ${d}`);

    return {
        y_bar,
        a_prod,
        b,
        c,
        h_values,
        d,
        _debug: { e, r_values } // for debugging
    };
}

function verifyBallotSum(g, Wi, yi, beta_values, P, m, proof, p) {
    console.log("\nVerifying sum proof:");
    // Ensure BigInt conversion
    g = BigInt(g);
    Wi = BigInt(Wi);
    yi = BigInt(yi);
    P = BigInt(P);
    m = BigInt(m);
    p = BigInt(p);
    const beta_values_bn = beta_values.map(v => BigInt(v));

    // Recompute challenge
    let challenge_input = `${proof.a_prod}${proof.b}${proof.y_bar}`;
    beta_values_bn.forEach(beta => challenge_input += beta.toString());

    const c = BigInt('0x' + crypto.createHash('sha256').update(challenge_input).digest('hex')) % (p - 1n);

    if (c !== proof.c) {
        console.log("Challenge verification failed");
        return false;
    }

    // Verify equation: b * a_prod = Wi^(md) * g^∑hij * (∏βij/g^P)^c

    // 1. Compute left side: b * a_prod
    const lhs = (proof.b * proof.a_prod) % p;

    // 2. Compute right side terms:
    // Term 1: Wi^(md)
    const md = (m * proof.d) % (p - 1n);
    const term1 = modExp(Wi, md, p);

    // Term 2: g^∑hij
    const h_sum = proof.h_values.reduce((acc, h) => (acc + BigInt(h)) % (p - 1n), 0n);
    const term2 = modExp(g, h_sum, p);

    // Term 3: (∏βij/g^P)^c
    const beta_prod = beta_values_bn.reduce((acc, beta) => (acc * beta) % p, 1n);
    const g_P = modExp(g, P, p);
    const g_P_inv = modInverse(g_P, p);
    const fraction = (beta_prod * g_P_inv) % p;
    const term3 = modExp(fraction, c, p);

    // Combine terms
    const rhs = (((term1 * term2) % p) * term3) % p;

    // Debug output
    console.log('Equation verification:');
    console.log(`LHS (b * a_prod): ${lhs}`);
    console.log(`RHS components:`);
    console.log(`- term1 (Wi^(md)): ${term1}`);
    console.log(`- term2 (g^∑hij): ${term2}`);
    console.log(`- term3 ((∏βij/g^P)^c): ${term3}`);
    console.log(`RHS combined: ${rhs}`);

    if (lhs !== rhs) {
        console.log("Equation verification failed");
        return false;
    }

    // Verify second equation: y_bar = yi^c * g^d
    const expected_y_bar = (modExp(yi, c, p) * modExp(g, proof.d, p)) % p;

    if (proof.y_bar !== expected_y_bar) {
        console.log("y_bar verification failed");
        return false;
    }

    return true;
}
function computeWi(i, publicKeys, p) {
    console.log(`Computing Wi for voter ${i}:`);
    // Ensure i is 1-based as per the paper
    i = BigInt(i);
    p = BigInt(p);
    publicKeys = publicKeys.map(pk => BigInt(pk));

    let numerator = 1n;
    let denominator = 1n;

    // Compute numerator: ∏(j=1 to i-1) yj
    for (let j = 0n; j < i - 1n; j++) {
        numerator = (numerator * publicKeys[Number(j)]) % p;
        console.log(`Numerator after y${j + 1n}: ${numerator}`);
    }

    // Compute denominator: ∏(j=i+1 to m) yj
    for (let j = i; j < BigInt(publicKeys.length); j++) {
        denominator = (denominator * publicKeys[Number(j)]) % p;
        console.log(`Denominator after y${j + 1n}: ${denominator}`);
    }

    // Wi = ∏(j=1 to i-1) yj / ∏(j=i+1 to m) yj
    console.log(`Final numerator: ${numerator}, denominator: ${denominator}`);
    const Wi = (numerator * modInverse(denominator, p)) % p;
    console.log(`Final Wi: ${Wi}`);

    return Wi;
}


function encryptVoteComplete(vote_vector, i, private_key, share, g, public_keys, p) {
    // Ensure BigInt conversion
    i = BigInt(i);
    private_key = BigInt(private_key);
    share = BigInt(share);
    g = BigInt(g);
    p = BigInt(p);
    const vote_vector_bn = vote_vector.map(v => BigInt(v));
    const public_keys_bn = public_keys.map(pk => BigInt(pk));

    // Compute Wi
    const Wi = computeWi(i + 1n, public_keys_bn, p);
    console.log(`Computed Wi: ${Wi}`);

    // Compute γi
    const gammaI = computeGammaI(i, public_keys_bn, p);
    console.log(`Computed gammaI: ${gammaI}`);

    const encryptedVotes = [];

    for (const vote of vote_vector_bn) {
        // Choose random ρij
        const rhoIJ = randomBigInt(1n, p - 1n);

        // Compute αij = g^ρij * g^(γi*si)
        const gRho = modExp(g, rhoIJ, p);
        const gGammaSi = modExp(g, (gammaI * share) % (p - 1n), p);
        const alpha = (gRho * gGammaSi) % p;

        // Compute βij = g^v * (Wi^xi * g^ρij)
        const gV = modExp(g, vote, p);
        const WiXi = modExp(Wi, private_key, p);
        const gRhoIJ = modExp(g, rhoIJ, p);
        const beta = (gV * WiXi % p * gRhoIJ) % p;

        console.log(`\nEncrypting vote ${vote}:`);
        console.log(`alpha: ${alpha}`);
        console.log(`beta: ${beta}`);
        console.log(`rhoIJ: ${rhoIJ}`);

        encryptedVotes.push({ alpha, beta, rhoIJ });
    }

    return { encryptedVotes, Wi };
}

function aggregateVotes(encrypted_votes, p) {
    console.log("\nAggregating votes:");
    p = BigInt(p);

    let alphaAgg = 1n;
    let betaAgg = 1n;

    for (const { alpha, beta } of encrypted_votes) {
        alphaAgg = (alphaAgg * BigInt(alpha)) % p;
        betaAgg = (betaAgg * BigInt(beta)) % p;

        console.log(`Current aggregation:`);
        console.log(`alpha: ${alphaAgg}`);
        console.log(`beta: ${betaAgg}`);
    }

    console.log(`Final aggregation: { alpha: ${alphaAgg}, beta: ${betaAgg} }`);
    return { alphaAgg, betaAgg };
}


function calculateResults(aggregatedVotes, puzzle, g, p, maxScore) {
    g = BigInt(g);
    p = BigInt(p);
    maxScore = BigInt(maxScore);

    const s = (BigInt(puzzle.C) - modExp(BigInt(puzzle.mu), 2n ** BigInt(puzzle.t), BigInt(puzzle.N))) % BigInt(puzzle.N);
    const g_neg_s = modExp(g, p - 1n - s, p);

    console.log(`Recovered secret s: ${s}`);
    console.log(`g^(-s) mod p: ${g_neg_s}`);

    const results = [];

    for (let idx = 0; idx < aggregatedVotes.length; idx++) {
        const { alphaAgg, betaAgg } = aggregatedVotes[idx];

        console.log(`\nProcessing candidate ${idx + 1}:`);
        console.log(`Aggregated alpha: ${alphaAgg}, Aggregated beta: ${betaAgg}`);

        const denominator = (BigInt(alphaAgg) * g_neg_s) % p;
        if (denominator === 0n) {
            console.error(`Error: Denominator is zero for candidate ${idx + 1}`);
            continue;
        }

        const inv_denominator = modInverse(denominator, p);
        const decrypted = (BigInt(betaAgg) * inv_denominator) % p;

        console.log(`Decrypted value: ${decrypted}`);
        console.log("Generating all g^i mod p values:");

        let found = false;
        for (let i = 0n; i <= maxScore * BigInt(aggregatedVotes.length); i++) {
            const g_power = modExp(g, i, p);
            console.log(`g^${i} mod p = ${g_power}`);
            if (g_power === decrypted) {
                results.push(Number(i));
                console.log(`Decoded vote sum for candidate ${idx + 1}: ${i}`);
                found = true;
                break;
            }
        }

        if (!found) {
            console.error(`Error: Could not decode vote result for candidate ${idx + 1}`);
        }
    }

    return results;
}


async function runProtocol() {
    try {
        // Parameters
        console.log("=== Preparation Stage ===");
        const p = nextPrime(2039n);
        const g = 2n;
        const numCandidates = 3;
        const maxScore = 10;
        const k = 2;
        const N = nextPrime(2047n);
        const t = 20;
        const P = maxScore;
        const m = numCandidates;

        const CList = ["C1", "C2", "C3"];
        const puzzle = generateTimeLockPuzzle(N, t);
        const coefficients = generatePolynomial(puzzle.s, k, p);

        console.log("Public Parameters:", {
            g: g.toString(),
            p: p.toString(),
            k,
            CList,
            maxScore,
            puzzle: {
                N: puzzle.N.toString(),
                t,
                C: puzzle.C.toString()
            }
        });

        // Voter Registration
        console.log("\n=== Voter Registration ===");
        const voters = [];
        const numVoters = 3;

        for (let i = 0; i < numVoters; i++) {
            const privateKey = randomBigInt(1n, p - 1n);
            const publicKey = modExp(g, privateKey, p);

            const share = evaluatePolynomial(coefficients, publicKey, p);
            const tau_i = computeTau(publicKey, share, p);

            console.log(`\nRegistering Voter ${i + 1}:`);
            console.log(`Private Key: ${privateKey}`);
            console.log(`Public Key: ${publicKey}`);
            console.log(`Share: ${share}`);
            console.log(`Tau: ${tau_i}`);

            const proof = zkProveKeyAndShare(g, privateKey, share, publicKey, tau_i, p);
            const isValid = verifyKeyAndShareProof(
                g, publicKey, tau_i, proof.c, proof.ai, proof.bi, proof.di1, proof.di2, p
            );

            if (!isValid) {
                console.log("\nProof verification details:");
                console.log(proof);
                throw new Error(`ZKP for key and share ownership failed for voter ${i + 1}`);
            }

            voters.push({
                id: `V${i + 1}`,
                privateKey,
                publicKey,
                share,
                tau: tau_i,
                proof
            });

            console.log(`Voter ${i + 1} registered: Public Key=${publicKey}, τ=${tau_i}`);
            console.log(`ZKPoK1_2i=(${proof.c}, ${proof.ai}, ${proof.bi}, ${proof.di1}, ${proof.di2})`);
        }

        const publicKeys = voters.map(v => v.publicKey);

        // Voting Stage
        console.log("\n=== Voting Stage ===");
        const predefinedScores = [
            [5n, 5n, 0n],   // V1's votes
            [1n, 5n, 4n],   // V2's votes
            [0n, 7n, 3n]    // V3's votes
        ];

        const encryptedVotes = [];
        const allProofs = [];

        for (let i = 0; i < voters.length; i++) {
            const voter = voters[i];
            const scores = predefinedScores[i];

            console.log(`\nProcessing votes for Voter ${voter.id}`);

            const { encryptedVotes: encryptedVector, Wi } = encryptVoteComplete(
                scores,
                i,
                voter.privateKey,
                voter.share,
                g,
                publicKeys.map(pk => BigInt(pk)),
                p
            );

            const voterVotes = [];
            const voterRhos = [];
            const voterBetas = [];
            const rangeProofs = [];

            for (let j = 0; j < encryptedVector.length; j++) {
                const { alpha, beta, rhoIJ } = encryptedVector[j];

                const rangeProof = zkProveBallotRange(
                    g, Wi, voter.privateKey, scores[j], rhoIJ, beta, voter.publicKey, P, p
                );

                if (!verifyBallotRange(g, Wi, voter.publicKey, beta, rangeProof, P, p)) {
                    throw new Error(`ZKPoK2,j_2i range proof failed for vote ${j + 1}`);
                }

                voterVotes.push({ alpha, beta, rhoIJ });
                voterRhos.push(rhoIJ);
                voterBetas.push(beta);
                rangeProofs.push(rangeProof);
            }

            const sumProof = zkProveBallotSum(
                g, Wi, voter.privateKey, scores, voterRhos, voterBetas, P, m, p
            );

            if (!verifyBallotSum(g, Wi, voter.publicKey, voterBetas, P, m, sumProof, p)) {
                throw new Error("ZKPoK3_2i sum proof failed");
            }

            console.log(`Voter ${voter.id}: Sum proof verified`);

            const fullProof = {
                voterId: voter.id,
                ZKPoK1_2i: voter.proof,
                ZKPoK2_2i: rangeProofs,
                ZKPoK3_2i: sumProof
            };

            allProofs.push(fullProof);
            encryptedVotes.push(voterVotes);

            console.log(`Voter ${voter.id} published complete proof ZKPoK2i`);
        }

        // Aggregation and Tallying Stage
        console.log("\n=== Aggregation and Tallying Stage ===");


        const aggregatedVotes = [];
        for (let candidateIndex = 0; candidateIndex < numCandidates; candidateIndex++) {
            // Extract all encrypted votes for the current candidate
            const candidateVotes = encryptedVotes.map(votes => votes[candidateIndex]);

            // Aggregate the votes for the current candidate
            const aggregatedVote = aggregateVotes(candidateVotes, p);

            // Add the aggregated vote to the list
            aggregatedVotes.push(aggregatedVote);

            // Log detailed output for debugging

        } console.log("Mosbah - Candidate", aggregatedVotes);


        try {
            const results = calculateResults(aggregatedVotes, puzzle, g, p, maxScore);
            console.log("\nFinal tally for each candidate:",
                results.map((result, i) => `Candidate ${i + 1}: ${result}`));

            const expectedTotals = predefinedScores.reduce((acc, scores) => {
                scores.forEach((score, idx) => {
                    acc[idx] = (acc[idx] || 0n) + score;
                });
                return acc;
            }, []);

            console.log("\nExpected totals:",
                expectedTotals.map((total, i) => `Candidate ${i + 1}: ${total}`));

            return { allProofs, results };
        } catch (error) {
            console.error("\nError in vote tallying:");
            console.error(error);
            throw error;
        }

    } catch (error) {
        console.error("Protocol execution failed:", error);
        throw error;
    }
}

module.exports = {
    runProtocol,
    generateTimeLockPuzzle,
    generatePolynomial,
    computeTau,
    zkProveKeyAndShare,
    verifyKeyAndShareProof,
    encryptVoteComplete,
    zkProveBallotRange,
    verifyBallotRange,
    zkProveBallotSum,
    verifyBallotSum,
    aggregateVotes,
    calculateResults
};
runProtocol();