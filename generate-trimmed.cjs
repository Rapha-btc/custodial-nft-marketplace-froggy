const fs = require('fs');

// Read reserved IDs
const reserved = fs.readFileSync('takenfroggys.csv', 'utf8')
  .split('\n')
  .map(x => parseInt(x.trim()))
  .filter(x => !isNaN(x));

const reservedSet = new Set(reserved);

// Generate non-reserved IDs (1 to 10000)
const nonReserved = [];
for (let i = 1; i <= 10000; i++) {
  if (!reservedSet.has(i)) {
    nonReserved.push(i);
  }
}

// Only use first 325 batches (8125 NFTs) to stay under 100KB
const MAX_BATCHES = 325;
const BATCH_SIZE = 25;
const maxIds = MAX_BATCHES * BATCH_SIZE;
const trimmedIds = nonReserved.slice(0, maxIds);
const remainingIds = nonReserved.slice(maxIds);

console.log("Total non-reserved:", nonReserved.length);
console.log("Minting on deployment:", trimmedIds.length);
console.log("Remaining for post-deployment:", remainingIds.length);

// Split into batches of 25
const batches = [];
for (let i = 0; i < trimmedIds.length; i += BATCH_SIZE) {
  batches.push(trimmedIds.slice(i, i + BATCH_SIZE));
}

console.log("Total batches:", batches.length);

// Generate Clarity code
let code = '\n;; ========== NON-RESERVED IDS: MINT TO ADMIN ==========\n';
code += ';; ' + trimmedIds.length + ' non-reserved IDs in ' + batches.length + ' batches\n';
code += ';; Remaining ' + remainingIds.length + ' IDs can be minted post-deployment\n\n';

// Generate batch constants
batches.forEach((batch, i) => {
  const ids = batch.map(id => 'u' + id).join(' ');
  code += '(define-constant PUBLIC-BATCH-' + (i + 1) + ' (list ' + ids + '))\n';
});

code += '\n;; Step 4: Mint all non-reserved IDs to ADMIN_RECIPIENT\n';
code += '(map-set token-count ADMIN_RECIPIENT\n';
code += '  (+ (get-balance ADMIN_RECIPIENT)\n';

batches.forEach((batch, i) => {
  if (i < batches.length - 1) {
    code += '     (fold mint-deploy-iter PUBLIC-BATCH-' + (i + 1) + ' u0)\n';
  } else {
    code += '     (fold mint-deploy-iter PUBLIC-BATCH-' + batches.length + ' u0)))\n';
  }
});

// Write to file
fs.writeFileSync('non-reserved-trimmed.clar', code);
console.log("\nGenerated code size:", code.length, "bytes");

// Also output the remaining IDs for post-deployment
const remainingCode = remainingIds.map(id => 'u' + id).join(' ');
fs.writeFileSync('remaining-ids.txt', remainingIds.join('\n'));
console.log("Remaining IDs written to remaining-ids.txt");
