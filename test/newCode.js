// // Implementation of the voting protocol without ZKP, with seeded randomness

// const bigInt = require('big-integer');
// const seedrandom = require('seedrandom');

// // Initialize a seeded random number generator
// const rng = seedrandom('seed'); // Replace 'seed' with any string for consistent results

// // Custom random function using the seeded RNG
// function randomBigInt(min, max) {
//     min = bigInt(min); // Ensure min is a bigInt
//     max = bigInt(max); // Ensure max is a bigInt
//     const range = max.subtract(min).add(1);
//     const randomValue = bigInt(Math.floor(rng() * Number(range)));
//     return min.add(randomValue);
// }


// // Function to generate a strong integer N and related parameters
// function generateStrongInteger(lambda) {
//     const generatePrime = () => {
//         let p;
//         do {
//             p = randomBigInt(bigInt(2).pow(lambda - 1), bigInt(2).pow(lambda));
//         } while (!p.isProbablePrime());
//         return p;
//     };

//     const aPrime = generatePrime();
//     const bPrime = generatePrime();

//     const a = bigInt(2).multiply(aPrime).add(1);
//     const b = bigInt(2).multiply(bPrime).add(1);

//     return a.isProbablePrime() && b.isProbablePrime()
//         ? { N: a.multiply(b), aPrime, bPrime, a, b }
//         : generateStrongInteger(lambda); // Retry if the conditions are not met
// }

// // Compute modular exponentiation
// function modExp(base, exp, mod) {
//     let result = bigInt(1);
//     base = base.mod(mod);
//     exp = bigInt(exp); // Ensure exp is a bigInt instance
//     while (exp.greater(0)) {
//         if (exp.mod(2).equals(1)) {
//             result = result.multiply(base).mod(mod);
//         }
//         base = base.multiply(base).mod(mod);
//         exp = exp.divide(2);
//     }
//     return result;
// }

// // Time-lock puzzle generation
// function generatePuzzle(N, t) {
//     const mu = randomBigInt(2, N); // Random generator
//     const T = modExp(mu, bigInt(2).pow(t), N.pow(2));
//     const s = randomBigInt(1, N);
//     const C = s.add(T).mod(N);
//     console.log("the s value is: ", s);
//     return { N, mu, t, C, T, s };
// }

// // Time-lock puzzle solving
// function solvePuzzle(puzzle) {
//     const { N, mu, t, C } = puzzle;
//     let T = mu;
//     for (let i = 0; i < t; i++) {
//         T = T.multiply(T).mod(N.pow(2));
//     }
//     const s = C.subtract(T).mod(N).add(N).mod(N);

//     console.log("the s value is: ", s);
//     return s;
// }

// // Generate polynomial for secret sharing
// function generatePolynomial(s, k, p) {
//     const coefficients = [s];
//     for (let i = 1; i < k; i++) {
//         coefficients.push(randomBigInt(1, p));
//     }
//     return coefficients;
// }

// // Evaluate polynomial
// function evaluatePolynomial(coefficients, x, p) {
//     return coefficients.reduce((acc, coeff, i) => {
//         return acc.add(coeff.multiply(x.pow(i)).mod(p)).mod(p);
//     }, bigInt(0));
// }

// // Key generation by voters
// function keyGen(g, p) {
//     const x = randomBigInt(1, p); // Private key
//     const y = modExp(g, x, p);         // Public key
//     return { x, y };
// }

// // Register voters and distribute shares
// function registerVoters(voters, polynomial, g, p) {
//     const shares = voters.map(voter => {
//         const share = evaluatePolynomial(polynomial, voter.y, p);
//         return { id: voter.id, share };
//     });
//     return shares;
// }

// // Voting
// function vote(voter, scores, g, p, W, gamma) {
//     const m = scores.length;
//     const ballot = [];

//     for (let j = 0; j < m; j++) {
//         const rho = randomBigInt(1, p);
//         const alpha = modExp(g, rho, p).multiply(modExp(g, gamma.multiply(voter.s), p)).mod(p);
//         const beta = modExp(g, scores[j], p).multiply(modExp(W, voter.x, p)).multiply(modExp(g, rho, p)).mod(p);
//         ballot.push({ alpha, beta });
//     }
//     return ballot;
// }

// // Tallying
// function tally(puzzle, ballots, g, p, t) {
//     const s = solvePuzzle(puzzle);
//     const gsInv = modExp(g, p.subtract(s), p);

//     const results = ballots[0].map((_, j) => {
//         let delta1 = bigInt(1);
//         let delta2 = bigInt(1);

//         ballots.forEach(ballot => {
//             delta1 = delta1.multiply(ballot[j].alpha).mod(p);
//             delta2 = delta2.multiply(ballot[j].beta).mod(p);
//         });

//         const pj = delta2.multiply(modExp(delta1.multiply(gsInv), p.subtract(1), p)).mod(p);
//         return pj;
//     });

//     return results;
// }

// // Example usage
// const lambda = 128; // Security parameter
// const t = 10;       // Time parameter
// const p = bigInt(23); // Example small prime
// const g = bigInt(2);  // Example generator

// // Setup phase
// const { N, mu, C } = generatePuzzle(p, t);
// const polynomial = generatePolynomial(bigInt(5), 3, p);

// // Voters
// const voters = Array.from({ length: 3 }, (_, i) => ({
//     id: `Voter${i + 1}`,
//     ...keyGen(g, p)
// }));

// const shares = registerVoters(voters, polynomial, g, p);
// voters.forEach((voter, i) => {
//     voter.s = shares[i].share;
// });

// // Voting
// const scores = [[3, 2, 0], [4, 0, 1], [1, 3, 1]]; // Example scores
// const ballots = voters.map((voter, i) => vote(voter, scores[i], g, p, g, g));

// // Tallying
// const results = tally({ N, mu, t, C }, ballots, g, p, t);
// console.log("Final results:", results);






const bigInt = require('big-integer');
const seedrandom = require('seedrandom');

// Initialize seeded RNG
const rng = seedrandom('seed');

function randomBigInt(min, max) {
    min = bigInt(min);
    max = bigInt(max);
    const range = max.subtract(min).add(1);
    const randomValue = bigInt(Math.floor(rng() * Number(range)));
    return min.add(randomValue);
}

function mod(a, p) {
    return bigInt(a).mod(p).add(p).mod(p);
}

function modExp(base, exp, modulus) {
    let result = bigInt(1);
    base = bigInt(base).mod(modulus);
    exp = bigInt(exp);

    while (exp.greater(0)) {
        if (exp.mod(2).equals(1)) {
            result = result.multiply(base).mod(modulus);
        }
        base = base.multiply(base).mod(modulus);
        exp = exp.divide(2);
    }
    return result;
}

function generateKeys(g, p) {
    const x = randomBigInt(1, p.subtract(1));
    const h = modExp(g, x, p);
    return { privateKey: x, publicKey: h };
}

function discreteLog(base, value, modulo, maxValue) {
    base = bigInt(base);
    value = bigInt(value);
    modulo = bigInt(modulo);

    let current = bigInt(1);
    const lookup = new Map();

    // Build lookup table
    for (let i = 0; i <= maxValue; i++) {
        lookup.set(current.toString(), i);
        current = current.multiply(base).mod(modulo);
    }

    return lookup.get(value.toString()) || 0;
}

function encryptVote(vote, publicKey, g, p) {
    const r = randomBigInt(1, p.subtract(2));
    const c1 = modExp(g, r, p);
    const s = modExp(publicKey, r, p);
    const gm = modExp(g, bigInt(vote), p);
    const c2 = mod(gm.multiply(s), p);
    return { c1, c2 };
}

function aggregateVotes(encryptedVotes, p) {
    return encryptedVotes.reduce((acc, vote) => ({
        c1: mod(acc.c1.multiply(vote.c1), p),
        c2: mod(acc.c2.multiply(vote.c2), p)
    }), { c1: bigInt(1), c2: bigInt(1) });
}

function decryptVote(c1, c2, privateKey, g, p, maxValue) {
    const s = modExp(c1, privateKey, p);
    const sInverse = modExp(s, p.subtract(2), p);
    const m = mod(c2.multiply(sInverse), p);
    return discreteLog(g, m, p, maxValue);
}

function runVotingSystem() {
    // Using a larger prime to handle vote totals properly
    const p = bigInt(2039); // Larger prime for better range
    const g = bigInt(2);    // Generator
    const numVoters = 3;
    const numCandidates = 3;
    const maxTotalScore = 30; // Maximum possible total per candidate

    // Election authority setup
    const EA = generateKeys(g, p);

    // Predefined scores for testing
    const predefinedScores = [
        [5, 5, 0],   // V1's votes
        [1, 5, 4],   // V2's votes
        [0, 7, 3]    // V3's votes
    ];

    // Generate voter keys and print scores
    const voters = [];
    for (let i = 0; i < numVoters; i++) {
        const voterKeys = generateKeys(g, p);
        voters.push({
            id: `V${i + 1}`,
            ...voterKeys,
            scores: predefinedScores[i].map(s => bigInt(s))
        });
        console.log(`${voters[i].id}'s original scores:`, voters[i].scores.map(s => s.toString()));
    }

    // Encrypt all votes
    const allEncryptedVotes = voters.map(voter =>
        voter.scores.map(score => encryptVote(score, EA.publicKey, g, p))
    );

    // Calculate final tally for each candidate
    const finalTally = [];
    for (let candidateIndex = 0; candidateIndex < numCandidates; candidateIndex++) {
        // Get all votes for this candidate
        const candidateVotes = allEncryptedVotes.map(votes => votes[candidateIndex]);

        // Aggregate the encrypted votes
        const aggregated = aggregateVotes(candidateVotes, p);

        // Decrypt the aggregated result
        const result = decryptVote(
            aggregated.c1,
            aggregated.c2,
            EA.privateKey,
            g,
            p,
            maxTotalScore
        );

        finalTally.push(result);
    }

    // Print results
    console.log("\nFinal tally for each candidate:",
        finalTally.map((total, i) => `Candidate ${i + 1}: ${total.toString()}`));

    // Calculate and print expected totals
    const expectedTotals = Array(numCandidates).fill(0);
    predefinedScores.forEach(voterScores => {
        voterScores.forEach((score, i) => {
            expectedTotals[i] += score;
        });
    });

    console.log("\nExpected totals:",
        expectedTotals.map((total, i) => `Candidate ${i + 1}: ${total.toString()}`));
}

runVotingSystem();
