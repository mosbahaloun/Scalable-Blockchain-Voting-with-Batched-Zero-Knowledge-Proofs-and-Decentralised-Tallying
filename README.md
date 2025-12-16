cat > README.md << 'EOF'
# Blockchain Voting System

A decentralized voting system built with Node.js, Hardhat, and zero-knowledge proofs.

## Features
- Privacy-preserving voting using zk-SNARKs
- Batch withdrawals for efficient vote tallying
- Next.js frontend interface
- Hardhat smart contract development environment

## Installation

### Prerequisites
- Node.js v14+
- npm or yarn

### Setup

1. **Install dependencies:**
```bash
npm install
cd Backend && npm install
cd ../frontend && npm install
```

2. **Install circomlib:**
```bash
cd circuit
npm install circomlib
```

3. **Download ceremony files** (if needed for circuit compilation)

## Usage

### Run Local Blockchain
```bash
npx hardhat node
```

### Deploy Contracts
```bash
cd Backend
npx hardhat run scripts/sample-script.js --network localhost
```

### Start Frontend
```bash
cd frontend
npm run dev
```

## Project Structure
- `/Backend` - Smart contracts and deployment scripts
- `/frontend` - Next.js web interface
- `/circuit` - Zero-knowledge circuit definitions
- `/contracts` - Solidity contracts
- `/test` - Test files

## Technologies
- Solidity
- Hardhat
- Next.js
- Circom (zk-SNARKs)
- ethers.js

## License
MIT
EOF

git add README.md
git commit -m "Add README"
