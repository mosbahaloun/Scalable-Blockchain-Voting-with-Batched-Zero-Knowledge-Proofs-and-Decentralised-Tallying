const secrets = require('secrets.js-grempe');

// Your existing code
const secret = '12345';
const shares = secrets.share(secret, 5, 3);
console.log('Shares:', shares);

const reconstructedSecret = secrets.combine(shares.slice(1, 5));
console.log('Reconstructed Secret:', reconstructedSecret);
