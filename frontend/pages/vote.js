import { useState } from "react";
import $u from '../utils/$u.js';
import { ethers } from "ethers";
import Link from 'next/link'; // Import Next.js Link component for navigation
import eccrypto from "eccrypto";



import Script from "next/script";

const wc = require("../circuit/witness_calculator.js");
const tornadoAddress = "0x8B6DD1502B7573680e936D82b7559fB7Df1dB78A";
const tornadoJSON = require("../../Backend/artifacts/contracts/Tornado.sol/Tornado.json");
const tornadoABI = tornadoJSON.abi;
const tornadoInterface = new ethers.utils.Interface(tornadoABI);

const ButtonState = { Normal: 0, Loading: 1, Disabled: 2 };

const vote = () => {
    const [account, updateAccount] = useState(null);
    const [proofElements, updateProofElements] = useState(null);
    const [proofStringEl, updateProofStringEl] = useState(null);
    const [textArea, updateTextArea] = useState(null);
    const [textArea2, updateTextArea2] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState("");
    const [withdrawalSuccessful, updateWithdrawalSuccessful] = useState(false);
    const [metamaskButtonState, updateMetamaskButtonState] = useState(ButtonState.Normal);
    const [withdrawButtonState, updateWithdrawButtonState] = useState(ButtonState.Normal);
    const [withdrawalAddresses, setWithdrawalAddresses] = useState([]);

    // const withdrawalAddresses1 = [
    //     { label: "Candidate 1", address: "0x3E326F236ED930B922B6F78064F7FaD1c520801d" },
    //     { label: "Candidate 2", address: "0x4089f12eCc289091001dA9E2d0954BdaFDdC5d22" },
    //     { label: "Candidate 3", address: "0x24d3Efbd5387b38c8FBC732c91B122F278a1B43E" }
    // ];


    const getCandiates = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const tornadoContract = new ethers.Contract(
                tornadoAddress,
                tornadoABI,
                provider
            );

            // Fetch data from the contract
            const [names, voteCounts, addresses] = await tornadoContract.getAllVotesOfCandidates();

            // Process the data
            const processedCandidates = names.map((name, index) => ({
                label: name,
                Vote_count: voteCounts[index].toString(),
                address: addresses[index]
            }));

            setWithdrawalAddresses(processedCandidates);

            console.log('Candidates:', processedCandidates);

            // Update table
            const table = document.getElementById("myTable");
            const tbody = table.querySelector("tbody");

            // Clear existing rows
            tbody.innerHTML = "";

            // Add rows for each candidate
            processedCandidates.forEach((candidate, index) => {
                const row = tbody.insertRow();
                const idCell = row.insertCell();
                const descCell = row.insertCell();
                const statusCell = row.insertCell();

                idCell.innerHTML = index; // Candidate index
                descCell.innerHTML = candidate.label; // Candidate name
                statusCell.innerHTML = candidate.Vote_count; // Vote count
            });

        } catch (error) {
            console.error('Error fetching candidates:', error);
        }
    };


    const handleButtonClick = () => {
        window.location.href = '/'; // Redirect to the admin page
    };

    const handleButtonClick2 = () => {
        window.location.href = '/vote'; // Redirect to the voting page
    };

    const connectMetamask1 = async () => {
        try {
            updateMetamaskButtonState(ButtonState.Disabled);
            if (!window.ethereum) {
                alert("Please install Metamask to use this app.");
                return;
            }

            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            const activeAccount = accounts[0];
            const balance = ethers.utils.formatEther(
                await window.ethereum.request({ method: "eth_getBalance", params: [activeAccount, "latest"] })
            );
            // console.log("come on dog"+withdrawalAddresses1)
            getCandiates();

            updateAccount({
                address: activeAccount,
                balance: balance
            });
        } catch (e) {
            console.error(e);
        } finally {
            updateMetamaskButtonState(ButtonState.Normal);
        }
    };

    const withdraw = async () => {
        updateWithdrawButtonState(ButtonState.Disabled);
        if (!textArea || !textArea.value) { alert("Please input the proof of deposit string."); return; }
        if (!selectedAddress) { alert("Please select an address."); return; }
        if (!textArea2 || !textArea2.value) { alert("Please input the private key of the deposit ."); return; }

        // console.log(selectedAddress);
        // console.log(selectedAddress);


        try {
            const decryptedProof = textArea2.value;
            const proofElements = await decryptProofElements(textArea.value, decryptedProof);
            console.log("Decrypted proof elements:", decryptedProof);
            // const proofElements = JSON.parse(atob(proofString));
            const receipt = await window.ethereum.request({ method: "eth_getTransactionReceipt", params: [proofElements.txHash] });

            if (!receipt || !receipt.logs || receipt.logs.length === 0) {
                throw new Error("Transaction receipt has no logs or is malformed");
            }

            // Optionally: filter logs by event signature if multiple exist
            const depositEventSignature = tornadoInterface.getEventTopic("Deposit");
            const log = receipt.logs.find(log => log.topics[0] === depositEventSignature);

            if (!log) {
                throw new Error("Deposit event log not found in receipt logs");
            }

            const decodedData = tornadoInterface.decodeEventLog("Deposit", log.data, log.topics);
            const SnarkJS = window['snarkjs'];
            const proofInput = {
                root: $u.BNToDecimal(decodedData.root),
                nullifierHash: proofElements.nullifierHash,
                recipient: selectedAddress,
                secret: $u.BN256ToBin(proofElements.secret).split(""),
                nullifier: $u.BN256ToBin(proofElements.nullifier).split(""),
                hashPairings: decodedData.hashPairings.map((n) => ($u.BNToDecimal(n))),
                hashDirections: decodedData.pairDirection
            };

            const { proof, publicSignals } = await SnarkJS.groth16.fullProve(proofInput, "/withdraw.wasm", "/setup_final.zkey");

            const callInputs = [
                proof.pi_a.slice(0, 2).map($u.BN256ToHex),
                proof.pi_b.slice(0, 2).map((row) => ($u.reverseCoordinate(row.map($u.BN256ToHex)))),
                proof.pi_c.slice(0, 2).map($u.BN256ToHex),
                publicSignals.slice(0, 2).map($u.BN256ToHex),
                selectedAddress
            ];
            console.log(proof.pi_a.slice(0, 2).map($u.BN256ToHex));
            console.log(proof.pi_b.slice(0, 2).map((row) => ($u.reverseCoordinate(row.map($u.BN256ToHex)))));
            console.log(proof.pi_c.slice(0, 2).map($u.BN256ToHex));
            console.log(publicSignals[3]);

            const tx = {
                to: tornadoAddress,
                from: account.address,
                data: tornadoInterface.encodeFunctionData("withdraw", callInputs)
            };

            const txHash = await window.ethereum.request({ method: "eth_sendTransaction", params: [tx] });



            while (!receipt) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            updateWithdrawalSuccessful(!!receipt);
        } catch (e) {
            console.error(e);
        } finally {
            updateWithdrawButtonState(ButtonState.Normal);
        }
    };


    const decryptProofElements = async (privateKeyHex, encryptedProofString) => {
        try {
            // Convert private key to Buffer
            const privateKeyBuffer = Buffer.from(privateKeyHex.slice(2), 'hex');
            console.log("the private key is: ", privateKeyBuffer);

            // Parse the Base64 string and convert fields back to Buffers
            const encryptedObject = JSON.parse(atob(encryptedProofString));
            const encryptedProofElements = {
                iv: Buffer.from(encryptedObject.iv, 'base64'),
                ephemPublicKey: Buffer.from(encryptedObject.ephemPublicKey, 'base64'),
                ciphertext: Buffer.from(encryptedObject.ciphertext, 'base64'),
                mac: Buffer.from(encryptedObject.mac, 'base64'),
            };

            // Decrypt the proof elements
            const decryptedBuffer = await eccrypto.decrypt(privateKeyBuffer, encryptedProofElements);
            const decryptedProofElements = JSON.parse(decryptedBuffer.toString());

            console.log("Decrypted proof elements:", decryptedProofElements);
            return decryptedProofElements;
        } catch (error) {
            console.error("Error decrypting proof elements:", error);
            throw error;
        }
    };


    return (
        <div>
            <Script src="/js/snarkjs.min.js" />
            <link
                href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css"
                rel="stylesheet"
            />

            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                <div className="container-fluid">
                    <button className="btn btn-primary me-2" onClick={handleButtonClick}>Admin</button>
                    <button className="btn btn-primary me-2" onClick={handleButtonClick2}>Vote</button>
                    <button
                        className="btn btn-primary"
                        onClick={connectMetamask1}
                        disabled={metamaskButtonState === ButtonState.Disabled}
                    >
                        Connect Metamask
                    </button>
                </div>
            </nav>

            <div className="container my-5">
                <div className="row g-4">
                    {/* Left Column: Withdrawal Form */}
                    <div className="col-lg-6">
                        <div className="card">
                            <div className="card-body">
                                {!!account ? (
                                    <>
                                        <h5 className="card-title mb-4">Select Withdrawal Address</h5>
                                        <select
                                            className="form-select mb-4"
                                            value={selectedAddress}
                                            onChange={(e) => setSelectedAddress(e.target.value)}
                                        >
                                            <option value="">Select an address</option>
                                            {withdrawalAddresses.map((address) => (
                                                <option key={address.address} value={address.address}>
                                                    {address.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="mb-3">
                                            <label htmlFor="privateKey" className="form-label"> Private Key</label>
                                            <textarea
                                                id="privateKey"
                                                className="form-control"
                                                ref={updateTextArea}
                                                placeholder="Enter Private Key here..."
                                            ></textarea>
                                        </div>

                                        <div className="mb-3">
                                            <label htmlFor="secretNullifier" className="form-label"> Secret Nullifier</label>
                                            <textarea
                                                id="secretNullifier"
                                                className="form-control"
                                                ref={updateTextArea2}
                                                placeholder="Enter Secret Nullifier here..."
                                            ></textarea>
                                        </div>


                                        <button
                                            className="btn btn-primary w-100"
                                            onClick={withdraw}
                                            disabled={withdrawButtonState === ButtonState.Disabled}
                                        >
                                            Withdraw 0.1 ETH
                                        </button>

                                        {withdrawalSuccessful && (
                                            <div className="alert alert-success mt-3">Withdrawal Successful!</div>
                                        )}
                                    </>
                                ) : (
                                    <p>Please connect your wallet to withdraw funds.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Candidate Table */}
                    <div className="col-lg-6">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">Candidates</h5>
                                <div className="table-responsive">
                                    <table id="myTable" className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>Index</th>
                                                <th>Candidate Name</th>
                                                <th>Votes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Rows will be dynamically added here */}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default vote;
