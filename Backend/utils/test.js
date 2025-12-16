const { ethers } = require("ethers");

// Example function to demonstrate usage
const exampleFunction = async () => {
  // Your hexadecimal value in Wei
  const weiValue = "0x21e19e0c9bab2400000";

  // Convert the value to Ether
  const ethValue = ethers.utils.formatUnits(weiValue.toString(), 18);
  console.log(`Ether Value: ${ethValue} ETH`);
};

// Run the example
exampleFunction();
