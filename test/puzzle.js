// Import a library for working with big integers if needed (e.g., jsbn or BigInt is natively supported)
// Install crypto if advanced random number generation or hashing is needed

const bigInt = require('big-integer');

// Function to generate a strong integer N and related parameters
function generateStrongInteger(lambda) {
    const generatePrime = () => {
        let p;
        do {
            p = bigInt.randBetween(2 ** (lambda - 1), 2 ** lambda).next();
        } while (!p.isProbablePrime());
        return p;
    };

    const aPrime = generatePrime();
    const bPrime = generatePrime();

    const a = bigInt(2).multiply(aPrime).add(1);
    const b = bigInt(2).multiply(bPrime).add(1);

    return a.isProbablePrime() && b.isProbablePrime()
        ? { N: a.multiply(b), aPrime, bPrime, a, b }
        : generateStrongInteger(lambda); // Retry if the conditions are not met
}

// Compute the Jacobi symbol (for simplicity, we assume inputs are correct and in Z*N)
function jacobiSymbol(a, n) {
    if (a.equals(0)) return 0;
    if (a.equals(1)) return 1;
    let a1 = a;
    let e = 0;

    while (a1.isEven()) {
        a1 = a1.divide(2);
        e++;
    }

    const s = (e % 2 === 0 || n.mod(8).equals(1) || n.mod(8).equals(7))
        ? 1
        : -1;

    return s * jacobiSymbol(n.mod(a1), a1);
}

// Generate the tuple (N, μ, t, T)
function generateTuple(N, t) {
    const mu = bigInt.randBetween(2, N).modPow(2, N); // Random generator in JN
    const T = mu.modPow(bigInt(2).pow(t), N.pow(2));
    return { mu, T };
}

// Sequential Squaring Verification
function verifySequentialSquaring(N, mu, t, T) {
    const computedT = mu.modPow(bigInt(2).pow(t), N.pow(2));
    return computedT.equals(T);
}

// Simulate Sequential Squaring Assumption Experiment
function sequentialSquaringAssumption(lambda, t) {
    const { N, aPrime, bPrime, a, b } = generateStrongInteger(lambda);
    const { mu, T } = generateTuple(N, t);

    console.log("Generated strong integer N:", N.toString());
    console.log("Generated μ:", mu.toString());
    console.log("Generated T:", T.toString());

    const isValid = verifySequentialSquaring(N, mu, t, T);

    return {
        N,
        mu,
        t,
        T,
        isValid,
    };
}

// Example usage
const lambda = 128; // Security parameter
const t = 200000;       // Time parameter

const result = sequentialSquaringAssumption(lambda, t);
console.log("Result of Sequential Squaring Assumption:", result);
