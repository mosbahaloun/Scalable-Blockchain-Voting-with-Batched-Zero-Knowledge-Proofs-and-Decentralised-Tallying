// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  // deploy hasher
  const Hasher = await hre.ethers.getContractFactory("Hasher");
  const hasher = await Hasher.deploy();
  await hasher.deployed();
  console.log("Hasher address: " + hasher.address);
  const hasherAddress = hasher.address;

  // deploy verifier
  const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.deployed();
  console.log("verifier address: " + verifier.address);
  const verifierAddress = verifier.address;

  // deploy tornado
  const Tornado = await hre.ethers.getContractFactory("Tornado");
  const candidateNames = ["Alice", "Bob", "Charlie"];
  const candidateAddresses = ["0x3E326F236ED930B922B6F78064F7FaD1c520801d", "0x4089f12eCc289091001dA9E2d0954BdaFDdC5d22", "0x24d3Efbd5387b38c8FBC732c91B122F278a1B43E"];
  const tornado = await Tornado.deploy(hasherAddress, verifierAddress, candidateNames, candidateAddresses);
  await tornado.deployed();
  console.log("Tornado address: " + tornado.address);
  // const receipt = await Hasher.deployTransaction.wait();
  // console.log("Deployed by address:", receipt.from);
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});