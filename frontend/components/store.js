import { useState } from "react";
import $u from '../utils/$u.js';
import { ethers } from "ethers";
import Link from 'next/link'; // Import Next.js Link component for navigation

const wc = require("../circuit/witness_calculator.js");

const tornadoAddress = "0x3E67CB928144eC142763f36d619d126a7e4fC907";
const tornadoJSON = require("../../Backend/artifacts/contracts/Tornado.sol/Tornado.json");
const tornadoABI = tornadoJSON.abi;
const tornadoInterface = new ethers.utils.Interface(tornadoABI);


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

    const addUser = async () => {
        // Get form field values
        const firstName = document.querySelector("input[name='fname']").value;
        const lastName = document.querySelector("input[name='lname']").value;
        const NId = document.getElementById("NId").value;
        const userSecret = document.querySelector("input[name='secret']").value;

        // Validation
        if (!firstName || !lastName || !NId || !userSecret) {
            alert("Please fill in all the fields.");
            return;
        }

        if (!/^\d{10}$/.test(NId)) {  // Regex to check if NId is exactly 10 digits
            alert("The NI Card Number must be exactly 10 digits.");
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
            const tx = await tornadoContract.addVoter(NId);
            await tx.wait();

            console.log("Voter added successfully.");
            alert("Voter added successfully.");
        } catch (error) {
            console.error("Error adding voter:", error);
            alert("An error occurred while adding the voter. Please try again.");
        }
    };
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
            console.log("Starting deposit...");
            updateDepositButtonState(ButtonState.Disabled);

            // Log input values
            const secret = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toString();
            console.log("Secret:", secret);
            const nullifier = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toString();
            console.log("Nullifier:", nullifier);

            const input = {
                secret: $u.BN256ToBin(secret).split(""),
                nullifier: $u.BN256ToBin(nullifier).split("")
            };
            console.log("Input:", input);
            var res = await fetch("/deposit.wasm");
            var buffer = await res.arrayBuffer();
            var depositWC = await wc(buffer);



            // Log commitment and nullifierHash
            const r = await depositWC.calculateWitness(input, 0);
            console.log("Witness result:", r);
            const commitment = r[1];
            const nullifierHash = r[2];
            console.log("Commitment:", commitment);

            // Verify value matches contract denomination
            const value = ethers.BigNumber.from("10000000000000000");
            console.log("Value in wei:", value.toString());

            // Create and log the transaction
            const tx = {
                to: tornadoAddress,
                from: account.address,
                value: value.toHexString(),
                data: tornadoInterface.encodeFunctionData("deposit", [commitment])
            };
            console.log("Transaction payload:", tx);

            const txHash = await window.ethereum.request({
                method: "eth_sendTransaction",
                params: [tx]
            });

            const proofElements = {
                nullifierHash: `${nullifierHash}`,
                secret: secret,
                nullifier: nullifier,
                commitment: `${commitment}`,
                txHash: txHash
            };
            console.log("Proof elements:", proofElements);
            updateProofElements(btoa(JSON.stringify(proofElements)));

        } catch (e) {
            console.error("Detailed error:", e);
            // Add error state handling
            updateDepositButtonState(ButtonState.Error);
            throw e;
        } finally {
            updateDepositButtonState(ButtonState.Normal);
        }
    };
    const copyProof = () => {
        if (!!proofStringEl) {
            flashCopiedMessage();
            navigator.clipboard.writeText(proofStringEl.innerHTML);
        }
    };
    const withdraw = async () => {
        updateWithdrawButtonState(ButtonState.Disabled);

        if (!textArea || !textArea.value) { alert("Please input the proof of deposit string."); }

        try {
            const proofString = textArea.value;
            const proofElements = JSON.parse(atob(proofString));

            receipt = await window.ethereum.request({ method: "eth_getTransactionReceipt", params: [proofElements.txHash] });
            if (!receipt) { throw "empty-receipt"; }

            const log = receipt.logs[0];
            const decodedData = tornadoInterface.decodeEventLog("Deposit", log.data, log.topics);

            const SnarkJS = window['snarkjs'];

            const proofInput = {
                "root": $u.BNToDecimal(decodedData.root),
                "nullifierHash": proofElements.nullifierHash,
                "recipient": $u.BNToDecimal(account.address),
                "secret": $u.BN256ToBin(proofElements.secret).split(""),
                "nullifier": $u.BN256ToBin(proofElements.nullifier).split(""),
                "hashPairings": decodedData.hashPairings.map((n) => ($u.BNToDecimal(n))),
                "hashDirections": decodedData.pairDirection
            };

            const { proof, publicSignals } = await SnarkJS.groth16.fullProve(proofInput, "/withdraw.wasm", "/setup_final.zkey");

            const callInputs = [
                proof.pi_a.slice(0, 2).map($u.BN256ToHex),
                proof.pi_b.slice(0, 2).map((row) => ($u.reverseCoordinate(row.map($u.BN256ToHex)))),
                proof.pi_c.slice(0, 2).map($u.BN256ToHex),
                publicSignals.slice(0, 2).map($u.BN256ToHex)
            ];

            const callData = tornadoInterface.encodeFunctionData("withdraw", callInputs);
            const tx = {
                to: tornadoAddress,
                from: account.address,
                data: callData
            };
            const txHash = await window.ethereum.request({ method: "eth_sendTransaction", params: [tx] });

            var receipt;
            while (!receipt) {
                receipt = await window.ethereum.request({ method: "eth_getTransactionReceipt", params: [txHash] });
                await new Promise((resolve, reject) => { setTimeout(resolve, 1000); });
            }

            if (!!receipt) { updateWithdrawalSuccessful(true); }
        } catch (e) {
            console.log(e);
        }

        updateWithdrawButtonState(ButtonState.Normal);
    };

    const flashCopiedMessage = async () => {
        updateDisplayCopiedMessage(true);
        setTimeout(() => {
            updateDisplayCopiedMessage(false);
        }, 1000);
    }
    return (
        <div>
            <style jsx>{`
                .navbar {
                    position: fixed;
                    top: 0;
                    width: 100%;
                    display: flex;
                    justify-content: flex-start;
                    align-items: left;
                    background-color: #343a40;
                    color: white;
                    padding: 10px;
                    font-size: 14px;
                    display: block;
                }
                .container {
                    max-width: 960px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .navbar2 {
                    float: left;
                    position: fixed;
                    top: 20;
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    align-items: left;
                    background-color: #343a40;
                    color: white;
                    padding: 10px;
                    font-size: 14px;
                    display: block;
                }
                .card {
                    margin-top: 60px;
                    max-width: 450px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    border: 1px solid #ddd;
                    border-radius: 5px;
                }
                .card-body, .card-footer {
                    padding: 60px;
                }
                .btn {
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    margin: 5px;
                }
                .btn-primary {
                    background-color: #007bff;
                    color: white;
                    border: none;
                }
                .btn-success {
                    background-color: #28a745;
                    color: white;
                    border: none;
                }
                .btn-outline-primary {
                    background-color: transparent;
                    color: #007bff;
                    border: 1px solid #007bff;
                }
                .alert-success {
                    background-color: #d4edda;
                    color: #155724;
                    padding: 10px;
                    border-radius: 5px;
                    font-size: 12px;
                }
                .form-group textarea {
                    width: 100%;
                    padding: 10px;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                    resize: none;
                    font-size: 14px;
                     margin-bottom: 15px; /* Add spacing between rows */
                }
                      .form-group2 input {
                    width: 10;
                    padding: 10px;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                    resize: none;
                    font-size: 14px;
                     margin-bottom: 15px; /* Add spacing between rows */
                }
                       .form-group3 input {
                    width: 10;
                    padding: 10px;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                    resize: none;
                    font-size: 14px;
                     margin-bottom: 15px; /* Add spacing between rows */
                }
                       .form-group4 input {
                    width: 10;
                    padding: 10px;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                    resize: none;
                    font-size: 14px;
                     margin-bottom: 15px; /* Add spacing between rows */
                }
                .small {
                    font-size: 12px;
                    color: #6c757d;
                }
        

            `}</style>

            <nav className="navbar">
                <div style={{ float: 'left' }}>
                    <button className="btn btn-primary" onClick={handleButtonClick}>Admin</button>
                    <button className="btn btn-primary" onClick={handleButtonClick2}>Vote</button>
                    <button className="btn btn-primary" onClick={connectMetamask1} disabled={metamaskButtonState === ButtonState.Disabled}>
                        Connect Metamask
                    </button>
                </div>
            </nav>

            <div style={{ height: "60px" }}></div>

            <nav className="navbar2">
                <div className="container" style={{ float: 'left' }}>
                    {account && (
                        <div>
                            <span><strong>ChainId:</strong> {account.chainId}</span>
                        </div>
                    )}
                    {account && (
                        <div>
                            <span><strong>Address:</strong> {account.address}</span>
                        </div>
                    )}
                    {account && (
                        <div>
                            <span><strong>Balance:</strong> {account.balance.slice(0, 10)} ETH</span>
                        </div>
                    )}
                    <div className="btn-group" style={{ marginBottom: 20 }}>
                        {
                            (section == "Deposit") ? (
                                <button className="btn btn-primary">Add Voter</button>
                            ) : (
                                <button onClick={() => { updateSection("Deposit"); }} className="btn btn-outline-primary">Add Voter</button>
                            )
                        }
                        {
                            (section == "Deposit") ? (
                                <button onClick={() => { updateSection("Withdraw"); }} className="btn btn-outline-primary">Add candidate</button>
                            ) : (
                                <button className="btn btn-primary">Add candidate</button>
                            )
                        }
                    </div>
                </div>
            </nav>

            <div style={{ height: "60px" }}></div>

            <div style={{ height: "60px" }}></div>

            <div className="container" style={{ marginTop: 60 }}>
                <div className="card mx-auto" style={{ maxWidth: 450 }}>

                    <div className="card-body">



                        {
                            (section == "Deposit" && !!account) && (
                                <div>
                                    {
                                        (!!proofElements) ? (
                                            <div>
                                                <div className="alert alert-success">
                                                    <span><strong>Proof of Deposit:</strong></span>
                                                    <div className="p-1" style={{ lineHeight: "12px" }}>
                                                        <span style={{ fontSize: 10 }} ref={(proofStringEl) => { updateProofStringEl(proofStringEl); }}>{proofElements}</span>
                                                    </div>

                                                </div>

                                                <div>
                                                    <button className="btn btn-success" onClick={copyProof}><span className="small">Copy Proof String</span></button>
                                                    {
                                                        (!!displayCopiedMessage) && (
                                                            <span className="small" style={{ color: 'green' }}><strong> Copied!</strong></span>
                                                        )
                                                    }
                                                </div>

                                            </div>
                                        ) : (
                                            <div>



                                                {/* <div className="form-group2">First Name: <input type="text" name="fname" placeholder="First Name..." /></div>
                                            <div className="form-group2">Last Name: <input type="text" name="lname" placeholder="Last Name..." /></div> */}
                                                <div className="form-group2">NI Card number: <input type="text" name="NId" id="NId" placeholder="Last Name..." /></div>
                                                {/* <div className="form-group2">User Secret: <input type="text" name="secret" placeholder="User Secret..." /></div> */}



                                                <p className="text-secondary">Note: All deposits and withdrawals are of the same denomination of 0.1 ETH.</p>
                                                <button
                                                    className="btn btn-success"
                                                    onClick={depositEther}
                                                    disabled={depositButtonState == ButtonState.Disabled}
                                                ><span className="small">Deposit 0.1 ETH</span></button>
                                            </div>

                                        )
                                    }
                                </div>
                            )
                        }

                        {
                            (section != "Deposit" && !!account) && (
                                <div>
                                    {
                                        (
                                            <div>
                                                <div className="form-group2">Candidate Name: <input type="text" name="fname" id="CId_name" placeholder="Candidate Name..." /></div>
                                                <div className="form-group2">Candidate Addre: <input type="text" name="_candidateAddress" id="CId" placeholder="Candidate Address..." /></div>

                                                <div> <button
                                                    className="btn btn-success"
                                                    onClick={addCandidate}

                                                ><span className="small">Add candidate</span></button></div>
                                            </div>
                                        )
                                    }
                                </div>
                            )
                        }

                        {
                            (!account) && (
                                <div>
                                    <p>Please connect your wallet to use the sections.</p>
                                </div>
                            )
                        }


                    </div>

                    <div className="card-footer p-4" style={{ lineHeight: "15px" }}>
                        <span className="small text-secondary" style={{ fontSize: "12px" }}>
                            <strong>Disclaimer:</strong> Products intended for educational purposes are <i>not</i> to be used with commercial intent. NFTA, the organization who sponsored the development of this project, explicitly prohibits and assumes no responsibilities for losses due to such use.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Interface;
