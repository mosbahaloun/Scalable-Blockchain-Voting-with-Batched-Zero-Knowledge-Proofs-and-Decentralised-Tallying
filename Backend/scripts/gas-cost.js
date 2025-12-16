const hre = require("hardhat");
const { ethers } = hre;
const { mimc5Sponge } = require("../scripts/mimc5"); // Your MiMC implementation
const SnarkJS = require("snarkjs");
const path = require("path");
const $u = require("../utils/$u.js");

const wasmPath = path.join(__dirname, "withdraw.wasm");
const zkeyPath = path.join(__dirname, "setup_final.zkey");

const levelDefaults = [
    23183772226880328093887215408966704399401918833188238128725944610428185466379n,
    24000819369602093814416139508614852491908395579435466932859056804037806454973n,
    90767735163385213280029221395007952082767922246267858237072012090673396196740n,
    36838446922933702266161394000006956756061899673576454513992013853093276527813n,
    68942419351509126448570740374747181965696714458775214939345221885282113404505n,
    50082386515045053504076326033442809551011315580267173564563197889162423619623n,
    73182421758286469310850848737411980736456210038565066977682644585724928397862n,
    60176431197461170637692882955627917456800648458772472331451918908568455016445n,
    105740430515862457360623134126179561153993738774115400861400649215360807197726n,
    76840483767501885884368002925517179365815019383466879774586151314479309584255n
];

async function main() {
    const [deployer] = await ethers.getSigners();

    // Deploy Hasher
    const Hasher = await ethers.getContractFactory("Hasher");
    const hasher = await Hasher.deploy();
    await hasher.deployed();

    // Deploy Verifier
    const Verifier = await ethers.getContractFactory("Groth16Verifier");
    const verifier = await Verifier.deploy();
    await verifier.deployed();

    // Deploy Tornado
    const Tornado = await ethers.getContractFactory("Tornado");
    const candidates = ["Alice", "Bob", "Charlie"];
    const candidateAddresses = Array(3).fill(deployer.address);
    const tornado = await Tornado.deploy(hasher.address, verifier.address, candidates, candidateAddresses);
    await tornado.deployed();

    console.log(`Tornado deployed at: ${tornado.address}`);

    // === Step 1: Prepare secret and nullifier ===
    const secret = ethers.BigNumber.from(ethers.utils.randomBytes(32));
    const nullifier = ethers.BigNumber.from(ethers.utils.randomBytes(32));
    const secretBig = BigInt(secret.toString());
    const nullifierBig = BigInt(nullifier.toString());

    // === Step 2: Compute hashes ===
    const commitment = mimc5Sponge([secretBig, nullifierBig], secretBig);
    const nullifierHash = mimc5Sponge([nullifierBig], nullifierBig);

    // === Step 3: Off-chain Merkle root calculation ===
    let idx = 0;
    let hash = commitment;
    const key = commitment;
    const hashPairings = [];
    const hashDirections = [];

    for (let i = 0; i < 10; i++) {
        const isLeft = idx % 2 === 0;
        const sibling = levelDefaults[i];
        const left = isLeft ? hash : sibling;
        const right = isLeft ? sibling : hash;

        hashPairings.push(sibling);
        hashDirections.push(isLeft ? 0 : 1);

        hash = mimc5Sponge([left, right], key);
        idx = Math.floor(idx / 2);
    }

    const newRoot = hash;

    // === Step 4: Send deposit and log gas ===
    const depositTx = await tornado.deposit(
        commitment,
        newRoot,
        hashPairings,
        hashDirections,
        { value: ethers.utils.parseEther("0.01") }
    );
    const depositReceipt = await depositTx.wait();
    console.log("✅ Deposit gas used:", depositReceipt.gasUsed.toString());

    // === Step 5: Generate zk-SNARK proof ===
    const proofInput = {
        root: newRoot.toString(),
        nullifierHash: nullifierHash.toString(),
        recipient: deployer.address,
        secret: $u.BN256ToBin(secretBig.toString()).split("").map(Number),
        nullifier: $u.BN256ToBin(nullifierBig.toString()).split("").map(Number),
        hashPairings: hashPairings.map(n => n.toString()),
        hashDirections
    };

    console.log("🧠 Generating proof...");
    const { proof, publicSignals } = await SnarkJS.groth16.fullProve(
        proofInput,
        wasmPath,
        zkeyPath
    );

    // === Step 6: Prepare and send withdraw ===
    const callInputs = [
        proof.pi_a.slice(0, 2),
        proof.pi_b.slice(0, 2),
        proof.pi_c.slice(0, 2),
        publicSignals.slice(0, 2),
        deployer.address
    ];

    const withdrawTx = await tornado.withdraw(...callInputs);
    const withdrawReceipt = await withdrawTx.wait();
    console.log("✅ Withdraw gas used:", withdrawReceipt.gasUsed.toString());
}

main().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
});
