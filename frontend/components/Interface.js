import { useState } from "react";
import $u from '../utils/$u.js';
import { ethers } from "ethers";
import eccrypto from "eccrypto";
import Link from 'next/link'; // Import Next.js Link component for navigation
// import * as snarkjs from "snarkjs";
// const path = require("path");
// console.log(path.resolve("../circuit/witness_calculator.js"));
const wc = require("../circuit/witness_calculator.js");

const tornadoAddress = "0xB5bC72183A7aEf34664f84e98FcfE5210ebf2e8D";
const tornadoJSON = require("../../Backend/artifacts/contracts/Tornado.sol/Tornado.json");
const tornadoABI = tornadoJSON.abi;
const tornadoInterface = new ethers.utils.Interface(tornadoABI);


// Pseudo-code: buildMerkleProofFromLeaves
import { mimc5Sponge } from './mimc5';
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



const ButtonState = { Normal: 0, Loading: 1, Disabled: 2 };

const Interface = () => {
    const [account, updateAccount] = useState(null);
    const [proofElements, updateProofElements] = useState(null);
    const [proofStringEl, updateProofStringEl] = useState(null);
    const [textArea, updateTextArea] = useState(null);
    const [section, updateSection] = useState("Deposit");
    const [displayCopiedMessage, updateDisplayCopiedMessage] = useState(false);
    const [metamaskButtonState, updateMetamaskButtonState] = useState(ButtonState.Normal);
    const [depositButtonState, updateDepositButtonState] = useState(ButtonState.Normal);
    const [withdrawalSuccessful, updateWithdrawalSuccessful] = useState(false);
    const [withdrawButtonState, updateWithdrawButtonState] = useState(ButtonState.Normal);

    const [voters, setVoters] = useState([]);


    const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:7545');
    const GANACHE_PRIVATE_KEY = '505a382a06083333b3322dcbcbc9accbbe49de7134eb0c7660efe570d71e71d0';
    const ganacheAccount = new ethers.Wallet(GANACHE_PRIVATE_KEY, provider);

    const handleButtonClick = () => {
        window.location.href = '/'; // Redirect to the admin page
    };

    const handleButtonClick2 = () => {
        window.location.href = '/vote';

    };


    const connectMetamask1 = async () => {
        try {
            updateMetamaskButtonState(ButtonState.Disabled);
            if (!window.ethereum) {
                alert("Please install Metamask to use this app.");
                throw "no-metamask";
            }

            var accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            var chainId = window.ethereum.networkVersion;

            // if(chainId != "5"){
            //     alert("Please switch to Goerli Testnet");
            //     throw "wrong-chain";
            // }

            var activeAccount = accounts[0];
            var balance = await window.ethereum.request({ method: "eth_getBalance", params: [activeAccount, "latest"] });
            balance = $u.moveDecimalLeft(ethers.BigNumber.from(balance).toString(), 18);

            var newAccountState = {
                chainId: chainId,
                address: activeAccount,
                balance: balance
            };
            updateAccount(newAccountState);
        } catch (e) {
            console.log(e);
        }

        updateMetamaskButtonState(ButtonState.Normal);
    };

    // const addUser = async () => {
    //     // Get form field values
    //     const firstName = document.querySelector("input[name='fname']").value;
    //     const lastName = document.querySelector("input[name='lname']").value;
    //     const NId = document.getElementById("NId").value;
    //     const userSecret = document.querySelector("input[name='secret']").value;

    //     // Validation
    //     if (!firstName || !lastName || !NId || !userSecret) {
    //         alert("Please fill in all the fields.");
    //         return;
    //     }

    //     if (!/^\d{10}$/.test(NId)) {  // Regex to check if NId is exactly 10 digits
    //         alert("The NI Card Number must be exactly 10 digits.");
    //         return;
    //     }

    //     try {
    //         // Connect to Ethereum provider
    //         const provider = new ethers.providers.Web3Provider(window.ethereum);
    //         await provider.send("eth_requestAccounts", []);

    //         // Get the signer from the provider
    //         const signer = provider.getSigner();

    //         // Connect the contract with the signer
    //         const tornadoContract = new ethers.Contract(
    //             tornadoAddress,
    //             tornadoABI,
    //             signer
    //         );

    //         // Call the contract function `addVoter` with NId as argument
    //         const tx = await tornadoContract.addVoter(NId);
    //         await tx.wait();

    //         console.log("Voter added successfully.");
    //         alert("Voter added successfully.");
    //     } catch (error) {
    //         console.error("Error adding voter:", error);
    //         alert("An error occurred while adding the voter. Please try again.");
    //     }
    // };
    const addCandidate = async () => {
        // Get form field values
        const Candidate_Name = document.getElementById("CId_name").value;
        const Candidate_Address = document.getElementById("CId").value;

        // Validation for empty fields
        if (!Candidate_Name || !Candidate_Address) {
            alert("Please fill in all the fields.");
            return;
        }


        // Validate Candidate_Address is a valid Ethereum address
        if (!ethers.utils.isAddress(Candidate_Address)) {
            alert("The Candidate Address must be a valid Ethereum address.");
            return;
        }

        try {
            // Connect to Ethereum provider
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);

            // Get the signer from the provider
            const signer = provider.getSigner();

            // Connect the contract with the signer
            const tornadoContract = new ethers.Contract(
                tornadoAddress,
                tornadoABI,
                signer
            );

            // Call the contract function `addVoter` with NId as argument
            const tx = await tornadoContract.addCandidate(Candidate_Name, Candidate_Address);
            await tx.wait();

            console.log("Candidate added successfully.");
            alert("Candidate added successfully.");
        } catch (error) {
            console.error("Error adding Candidate:", error);
            alert("An error occurred while adding the Candidate. Please try again.");
        }
    };

    //     async function estimateGasUsage() {
    //         try {
    //             // Connect to Ethereum provider
    //             const provider = new ethers.providers.Web3Provider(window.ethereum);
    //             await provider.send("eth_requestAccounts", []);

    //             // Get the signer from the provider
    //             const signer = provider.getSigner();

    //             // Connect the contract with the signer
    //             const tornadoContract = new ethers.Contract(
    //                 tornadoAddress,
    //                 tornadoABI,
    //                 signer
    //             );

    //             // Call the contract function `addVoter` with NId as argument



    //             const sampleNId = "1234554322"; // Replace with an actual NId
    //             const gasEstimateAddVoter = await tornadoContract.estimateGas.addVoter(sampleNId);
    //             console.log("Estimated Gas for addVoter:", gasEstimateAddVoter.toString());



    // } catch (error) {
    //     console.error("Error adding voter:", error);
    //     alert("An error occurred while adding the voter. Please try again.");
    // }}





    const depositEther = async () => {
        try {
            updateDepositButtonState(ButtonState.Loading);
            updateWithdrawButtonState(ButtonState.Loading);

            const SnarkJS = window["snarkjs"];
            if (!SnarkJS) {
                console.error("❌ SnarkJS not loaded in browser");
                return;
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const selectedAddress = await signer.getAddress();
            const tornadoContract = new ethers.Contract(tornadoAddress, tornadoABI, signer);

            const depositWC = await wc((await (await fetch("/deposit.wasm")).arrayBuffer()));

            const decodedEvents = [];
            const decryptedProofs = [];

            for (let t = 0; t < 4; t++) {
                const secret = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toString();
                const nullifier = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toString();

                const input = {
                    secret: $u.BN256ToBin(secret).split(""),
                    nullifier: $u.BN256ToBin(nullifier).split("")
                };

                const witness = await depositWC.calculateWitness(input, 0);
                const commitment = BigInt(witness[1]);
                const nullifierHash = BigInt(witness[2]);

                let currentIdx = Number(await tornadoContract.nextLeafIdx());
                let currentHash = commitment;
                const key = commitment;

                const hashPairings = [];
                const pairDirection = [];

                for (let i = 0; i < levelDefaults.length; i++) {
                    const isLeft = currentIdx % 2 === 0;

                    let sibling;
                    if (isLeft) {
                        sibling = levelDefaults[i];
                    } else {
                        try {
                            sibling = BigInt(await tornadoContract.lastLevelHash(i));
                        } catch {
                            sibling = levelDefaults[i];
                        }
                    }

                    const left = isLeft ? currentHash : sibling;
                    const right = isLeft ? sibling : currentHash;

                    hashPairings.push(sibling.toString());
                    pairDirection.push(isLeft ? 0 : 1);

                    currentHash = mimc5Sponge([left, right], key);
                    currentIdx = Math.floor(currentIdx / 2);
                }

                const newRoot = currentHash;

                const tx = await tornadoContract.deposit(
                    commitment,
                    newRoot,
                    hashPairings.map(BigInt),
                    pairDirection,
                    { value: ethers.utils.parseEther("0.01") }
                );
                await tx.wait();

                decodedEvents.push({ root: newRoot.toString(), hashPairings, pairDirection });
                decryptedProofs.push({
                    secret,
                    nullifier,
                    nullifierHash: nullifierHash.toString()
                });
            }

            // Prepare proof input
            const proofInput = {
                root: decodedEvents.map(e => $u.BNToDecimal(e.root)),
                nullifierHash: decryptedProofs.map(p => p.nullifierHash),
                recipient: Array(4).fill($u.BNToDecimal(selectedAddress)),
                secret: decryptedProofs.map(p => $u.BN256ToBin(p.secret).split("")),
                nullifier: decryptedProofs.map(p => $u.BN256ToBin(p.nullifier).split("")),
                hashPairings: decodedEvents.map(e => e.hashPairings.map($u.BNToDecimal)),
                hashDirections: decodedEvents.map(e => e.pairDirection)
            };

            const { proof, publicSignals } = await SnarkJS.groth16.fullProve(
                proofInput,
                "/BatchWithdraw.wasm",
                "/setup_final.zkey"
            );

            const a = proof.pi_a.slice(0, 2).map($u.BN256ToHex);
            const b = proof.pi_b
                .slice(0, 2)
                .map(row => $u.reverseCoordinate(row.map($u.BN256ToHex)));
            const c = proof.pi_c.slice(0, 2).map($u.BN256ToHex);

            const input = [
                ...publicSignals.slice(0, 4),   // roots
                ...publicSignals.slice(4, 8),   // nullifierHashes
                ...publicSignals.slice(8, 12)   // recipients
            ];

            const recipients = publicSignals.slice(8, 12).map(value =>
                ethers.utils.getAddress("0x" + BigInt(value).toString(16).padStart(40, "0"))
            );

            const withdrawTx = await tornadoContract.withdraw(a, b, c, input, recipients);
            await withdrawTx.wait();

            console.log("✅ Withdraw successful");
            updateWithdrawalSuccessful(true);
        } catch (err) {
            console.error("❌ Error in depositAndWithdrawEther:", err);
        } finally {
            updateDepositButtonState(ButtonState.Normal);
            updateWithdrawButtonState(ButtonState.Normal);
        }
    };


    const copyProof = () => {
        if (!!proofStringEl) {
            flashCopiedMessage();
            navigator.clipboard.writeText(proofStringEl.innerHTML);
        }
    };
    const withdrawEther = async (proofElements) => {
        try {
            updateWithdrawButtonState(ButtonState.Disabled);

            const receipt = await window.ethereum.request({
                method: "eth_getTransactionReceipt",
                params: [proofElements.txHash]
            });

            if (!receipt || !receipt.logs || receipt.logs.length === 0) {
                throw new Error("Transaction receipt has no logs or is malformed");
            }

            const depositEventSig = tornadoInterface.getEventTopic("Deposit");
            const log = receipt.logs.find(log => log.topics[0] === depositEventSig);

            if (!log) {
                throw new Error("Deposit event log not found");
            }

            const decoded = tornadoInterface.decodeEventLog("Deposit", log.data, log.topics);

            const SnarkJS = window["snarkjs"];
            const selectedAddress = await window.ethereum.request({
                method: "eth_requestAccounts"
            }).then(a => a[0]);

            const proofInput = {
                root: $u.BNToDecimal(decoded.root),
                nullifierHash: proofElements.nullifierHash,
                recipient: selectedAddress,
                secret: $u.BN256ToBin(proofElements.secret).split(""),
                nullifier: $u.BN256ToBin(proofElements.nullifier).split(""),
                hashPairings: decoded.hashPairings.map(n => $u.BNToDecimal(n)),
                hashDirections: decoded.pairDirection
            };

            const { proof, publicSignals } = await SnarkJS.groth16.fullProve(
                proofInput,
                "/withdraw.wasm",
                "/setup_final.zkey"
            );

            const callInputs = [
                proof.pi_a.slice(0, 2).map($u.BN256ToHex),
                proof.pi_b.slice(0, 2).map(row => $u.reverseCoordinate(row.map($u.BN256ToHex))),
                proof.pi_c.slice(0, 2).map($u.BN256ToHex),
                publicSignals.slice(0, 2).map($u.BN256ToHex),
                selectedAddress
            ];

            const withdrawTx = {
                to: tornadoAddress,
                from: selectedAddress,
                data: tornadoInterface.encodeFunctionData("withdraw", callInputs)
            };

            const txHash = await window.ethereum.request({
                method: "eth_sendTransaction",
                params: [withdrawTx]
            });

            console.log("Withdraw TX:", txHash);

            let confirm = null;
            while (!confirm) {
                confirm = await window.ethereum.request({
                    method: "eth_getTransactionReceipt",
                    params: [txHash]
                });
                if (!confirm) await new Promise(r => setTimeout(r, 1000));
            }

            updateWithdrawalSuccessful(true);
            console.log("Withdrawal complete!");

        } catch (e) {
            console.error("Withdraw error:", e);
            updateWithdrawButtonState(ButtonState.Error);
        } finally {
            updateWithdrawButtonState(ButtonState.Normal);
        }
    };






    const generateVoterKey = async () => {

    };


    const decryptMessage = async (privateKeyHex, encrypted) => {
        const privateKeyBuffer = Buffer.from(privateKeyHex.slice(2), 'hex');
        const decryptedBuffer = await eccrypto.decrypt(privateKeyBuffer, encrypted);
        const decryptedMessage = decryptedBuffer.toString();
        console.log("Decrypted message:", decryptedMessage);
        return decryptedMessage;
    };



    // const withdraw = async () => {
    //     updateWithdrawButtonState(ButtonState.Disabled);

    //     if (!textArea || !textArea.value) { alert("Please input the proof of deposit string."); }

    //     try {
    //         const proofString = textArea.value;
    //         const proofElements = JSON.parse(atob(proofString));

    //         receipt = await window.ethereum.request({ method: "eth_getTransactionReceipt", params: [proofElements.txHash] });
    //         if (!receipt) { throw "empty-receipt"; }

    //         const log = receipt.logs[0];
    //         const decodedData = tornadoInterface.decodeEventLog("Deposit", log.data, log.topics);

    //         const SnarkJS = window['snarkjs'];

    //         const proofInput = {
    //             "root": $u.BNToDecimal(decodedData.root),
    //             "nullifierHash": proofElements.nullifierHash,
    //             "recipient": $u.BNToDecimal(account.address),
    //             "secret": $u.BN256ToBin(proofElements.secret).split(""),
    //             "nullifier": $u.BN256ToBin(proofElements.nullifier).split(""),
    //             "hashPairings": decodedData.hashPairings.map((n) => ($u.BNToDecimal(n))),
    //             "hashDirections": decodedData.pairDirection
    //         };

    //         const { proof, publicSignals } = await SnarkJS.groth16.fullProve(proofInput, "/withdraw.wasm", "/setup_final.zkey");

    //         const callInputs = [
    //             proof.pi_a.slice(0, 2).map($u.BN256ToHex),
    //             proof.pi_b.slice(0, 2).map((row) => ($u.reverseCoordinate(row.map($u.BN256ToHex)))),
    //             proof.pi_c.slice(0, 2).map($u.BN256ToHex),
    //             publicSignals.slice(0, 2).map($u.BN256ToHex)
    //         ];

    //         const callData = tornadoInterface.encodeFunctionData("withdraw", callInputs);
    //         const tx = {
    //             to: tornadoAddress,
    //             from: account.address,
    //             data: callData
    //         };
    //         const txHash = await window.ethereum.request({ method: "eth_sendTransaction", params: [tx] });

    //         var receipt;
    //         while (!receipt) {
    //             receipt = await window.ethereum.request({ method: "eth_getTransactionReceipt", params: [txHash] });
    //             await new Promise((resolve, reject) => { setTimeout(resolve, 1000); });
    //         }

    //         if (!!receipt) { updateWithdrawalSuccessful(true); }
    //     } catch (e) {
    //         console.log(e);
    //     }

    //     updateWithdrawButtonState(ButtonState.Normal);
    // };

    const flashCopiedMessage = async () => {
        updateDisplayCopiedMessage(true);
        setTimeout(() => {
            updateDisplayCopiedMessage(false);
        }, 1000);
    }
    return (
        <div>
            <link
                href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css"
                rel="stylesheet"
            />

            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                <div className="container-fluid">
                    <button className="btn btn-primary me-2" onClick={handleButtonClick}>
                        Admin
                    </button>
                    <button className="btn btn-primary me-2" onClick={handleButtonClick2}>
                        Vote
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={connectMetamask1}
                        disabled={metamaskButtonState === ButtonState.Disabled}
                    >
                        Connect Metamask
                    </button>
                </div>
            </nav>

            <div className="container mt-5">
                {account && (
                    <div className="alert alert-info">
                        <strong>Account Details</strong>
                        <ul className="list-unstyled mb-0">
                            <li><strong>ChainId:</strong> {account.chainId}</li>
                            <li><strong>Address:</strong> {account.address}</li>
                            <li><strong>Balance:</strong> {account.balance.slice(0, 10)} ETH</li>
                        </ul>
                    </div>
                )}
                <div className="text-center mt-4">
                    <button
                        className={`btn ${section === "Add Voter" ? "btn-primary" : "btn-outline-primary"} me-2`}
                        onClick={() => updateSection("Add Voter")}
                    >
                        Add Voter
                    </button>
                    <button
                        className={`btn ${section !== "Add Voter" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => updateSection("Add Candidate")}
                    >
                        Add Candidate
                    </button>
                </div>

                <div className="card mt-4">
                    <div className="card-body">
                        <h4 className="card-title mb-4">{section === "Add Voter" ? "Add Voter" : "Add Candidate"}</h4>

                        {section === "Add Voter" && !!account && (
                            <div>
                                {proofElements ? (
                                    <div>
                                        <div className="alert alert-success">
                                            <h5 className="alert-heading">Proof of Deposit</h5>
                                            <p>Your proof of deposit has been generated. Copy it for future use.</p>
                                            <textarea
                                                className="form-control mb-2"
                                                style={{ fontSize: "12px", height: "100px" }}
                                                ref={(proofStringEl) => updateProofStringEl(proofStringEl)}
                                                readOnly
                                            >
                                                {proofElements}
                                            </textarea>
                                            <button
                                                className="btn btn-success me-2"
                                                onClick={copyProof}
                                            >
                                                Copy Proof String
                                            </button>
                                            {displayCopiedMessage && (
                                                <span className="text-success small"><strong>Copied!</strong></span>
                                            )}
                                        </div>

                                        <h5 className="mt-4">Registered Voters</h5>
                                        <div className="table-responsive">
                                            <table className="table table-bordered">
                                                <thead className="table-dark">
                                                    <tr>
                                                        <th>Voter ID</th>
                                                        <th>NId</th>
                                                        <th>Voter Address</th>
                                                        <th>Private Key</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {voters.map((voter) => (
                                                        <tr key={voter.id}>
                                                            <td>{voter.id}</td>
                                                            <td>{voter.status}</td>
                                                            <td >
                                                                {voter.address}
                                                            </td>
                                                            <td >
                                                                {voter.privateKey}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="mb-3">
                                            <label htmlFor="NId" className="form-label">NI Card Number</label>
                                            <input
                                                type="text"
                                                id="NId"
                                                name="NId"
                                                className="form-control"
                                                placeholder="Enter your NI Card Number..."
                                            />
                                        </div>
                                        <p className="text-secondary small">
                                            Note: All deposits and withdrawals are of the same denomination (0.1 ETH).
                                        </p>
                                        <button
                                            className="btn btn-success w-100"
                                            onClick={depositEther}
                                            disabled={depositButtonState === ButtonState.Disabled}
                                        >
                                            Deposit 0.1 ETH
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {section !== "Add Voter" && !!account && (
                            <div>
                                <div className="mb-3">
                                    <label htmlFor="CId_name" className="form-label">Candidate Name</label>
                                    <input
                                        type="text"
                                        id="CId_name"
                                        className="form-control"
                                        placeholder="Enter Candidate Name..."
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="CId" className="form-label">Candidate Address</label>
                                    <input
                                        type="text"
                                        id="CId"
                                        className="form-control"
                                        placeholder="Enter Candidate Address..."
                                    />
                                </div>
                                <button className="btn btn-success w-100" onClick={addCandidate}>
                                    Add Candidate
                                </button>
                            </div>
                        )}

                        {!account && (
                            <div>
                                <p className="text-danger">Please connect your wallet to use this section.</p>
                            </div>
                        )}
                    </div>
                </div>


            </div>

            <footer className="text-center mt-5">
                <p className="small text-secondary">
                    <strong>Disclaimer:</strong> Products intended for educational purposes are <i>not</i> to be used with commercial intent.
                </p>
            </footer>
        </div>
    );
};

export default Interface;
