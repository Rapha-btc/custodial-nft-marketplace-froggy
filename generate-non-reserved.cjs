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

console.log("Total non-reserved:", nonReserved.length);
console.log("First 10:", nonReserved.slice(0, 10).join(', '));
console.log("Last 10:", nonReserved.slice(-10).join(', '));

// Split into batches of 200 (was 25, now larger to reduce contract size)
const BATCH_SIZE = 200;
const batches = [];
for (let i = 0; i < nonReserved.length; i += BATCH_SIZE) {
  batches.push(nonReserved.slice(i, i + BATCH_SIZE));
}

console.log("Total batches:", batches.length);
console.log("Last batch size:", batches[batches.length - 1].length);

// Generate Clarity code
let code = '\n;; ========== NON-RESERVED IDS: MINT TO ADMIN ==========\n';
code += ';; ' + nonReserved.length + ' non-reserved IDs in ' + batches.length + ' batches\n\n';

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
fs.writeFileSync('non-reserved-code.clar', code);
console.log("\nGenerated code size:", code.length, "bytes");
console.log("Generated code written to non-reserved-code.clar");
