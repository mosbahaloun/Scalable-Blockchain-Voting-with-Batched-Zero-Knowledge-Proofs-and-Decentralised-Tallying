// Utility functions for cryptographic operations
const modPow = (base, exponent, modulus) => {
    if (modulus === 1n) return 0n;
    let result = 1n;
    base = base % modulus;
    while (exponent > 0n) {
        if (exponent % 2n === 1n) {
            result = (result * base) % modulus;
        }
        base = (base * base) % modulus;
        exponent = exponent >> 1n;
    }
    return result;
};

const modInverse = (a, m) => {
    let [old_r, r] = [a, m];
    let [old_s, s] = [1n, 0n];
    let [old_t, t] = [0n, 1n];

    while (r !== 0n) {
        const quotient = old_r / r;
        [old_r, r] = [r, old_r - quotient * r];
        [old_s, s] = [s, old_s - quotient * s];
        [old_t, t] = [t, old_t - quotient * t];
    }

    return ((old_s % m) + m) % m;
};

// Generate a random BigInt in range [1, max-1]
const randomBigInt = (max) => {
    const range = max - 1n;
    const bits = range.toString(2).length;
    let value;
    do {
        value = BigInt('0b' + Array.from(
            { length: bits },
            () => Math.random() < 0.5 ? '0' : '1'
        ).join(''));
    } while (value >= range);
    return value + 1n;
};

class Ballot {
    constructor(components) {
        this.components = components; // Array of [alpha, beta] pairs
    }
}

class EncryptedTally {
    constructor(components) {
        this.components = components; // Array of [alpha, beta] pairs for each option
    }
}

class SimpleElGamal {
    constructor(maxVoteValue = 10n) {
        // Using fixed prime and generator for simplicity
        this.p = 2027n;  // Small prime for demonstration
        this.g = 2n;     // Generator
        this.maxVote = BigInt(maxVoteValue);
    }

    generateKeypair() {
        const privateKey = randomBigInt(this.p - 1n);
        const publicKey = modPow(this.g, privateKey, this.p);
        return { publicKey, privateKey };
    }

    encryptVote(vote, publicKey) {
        if (vote < 0n || vote > this.maxVote) {
            throw new Error(`Vote must be in range [0, ${this.maxVote}]`);
        }

        const r = randomBigInt(this.p - 1n);
        const gM = modPow(this.g, vote, this.p);

        const alpha = modPow(this.g, r, this.p);
        const beta = (gM * modPow(publicKey, r, this.p)) % this.p;

        return [alpha, beta];
    }

    prepareBallot(votes, publicKey) {
        const components = votes.map(vote =>
            this.encryptVote(BigInt(vote), publicKey)
        );
        return new Ballot(components);
    }

    addEncryptedVotes(cipher1, cipher2) {
        const [alpha1, beta1] = cipher1;
        const [alpha2, beta2] = cipher2;

        return [
            (alpha1 * alpha2) % this.p,
            (beta1 * beta2) % this.p
        ];
    }

    tallyVotes(ballots) {
        if (!ballots.length) {
            throw new Error('No ballots to tally');
        }

        const numOptions = ballots[0].components.length;
        const encryptedSums = [];

        for (let i = 0; i < numOptions; i++) {
            // Start with first ballot's votes
            let tally = ballots[0].components[i];
            // Add remaining ballots
            for (let j = 1; j < ballots.length; j++) {
                tally = this.addEncryptedVotes(tally, ballots[j].components[i]);
            }
            encryptedSums.push(tally);
        }

        return new EncryptedTally(encryptedSums);
    }

    decryptTally(encryptedTally, privateKey) {
        return encryptedTally.components.map(ciphertext => {
            const [alpha, beta] = ciphertext;
            const s = modPow(alpha, privateKey, this.p);
            const sInv = modInverse(s, this.p);
            const gM = (beta * sInv) % this.p;

            // Brute force discrete log for small values
            let m = 0n;
            while (m <= this.maxVote * 3n) {
                if (modPow(this.g, m, this.p) === gM) {
                    return m;
                }
                m += 1n;
            }
            throw new Error('Could not decrypt sum');
        });
    }
}

// Example usage
function runExample() {
    const system = new SimpleElGamal();

    // Generate election keypair
    const { publicKey, privateKey } = system.generateKeypair();

    // Create three voter ballots
    const votes = [
        [3n, 5n, 10n],  // Voter 1
        [2n, 5n, 10n],  // Voter 2
        [3n, 5n, 10n]   // Voter 3
    ];

    // Encrypt all ballots
    const ballots = votes.map(voterVotes =>
        system.prepareBallot(voterVotes, publicKey)
    );

    // Tally votes (without decryption)
    const encryptedTally = system.tallyVotes(ballots);

    // Decrypt final tallies
    const finalResults = system.decryptTally(encryptedTally, privateKey);

    // Print results
    finalResults.forEach((total, index) => {
        console.log(`Option ${index + 1} total: ${total}`);
    });
}

// Run the example
runExample();