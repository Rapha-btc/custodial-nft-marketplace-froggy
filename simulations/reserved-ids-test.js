// reserved-ids-test.js
// Test reserved IDs: auto-set and auto-minted on deployment, user mints skip reserved
import fs from "node:fs";
import {
  ClarityVersion,
  uintCV,
  principalCV,
} from "@stacks/transactions";
import { SimulationBuilder } from "stxer";

// ============================================================
// PRINCIPALS
// ============================================================
const DEPLOYER = "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22";
const ADMIN = "SP1KBVBP3AZP7YA968Y3G14A17P9XXFPBPEVF5EG9"; // ADMIN_RECIPIENT in contract
const RANDOM_USER = "SPV00QHST52GD7D0SEWV3R5N04RD4Q1PMA3TE2MP";

// ============================================================
// CONTRACTS
// ============================================================
const NFT_CONTRACT = `${DEPLOYER}.froggy-gamma-nft`;

// ============================================================
// RESERVED IDS (258 total, sorted ascending)
// These are auto-set and auto-minted to ADMIN on deployment
// ============================================================
const RESERVED_COUNT = 258;

async function main() {
  console.log("=== RESERVED IDS TEST (AUTO-DEPLOYMENT) ===\n");
  console.log(`Expected reserved IDs: ${RESERVED_COUNT}`);
  console.log(`Admin recipient: ${ADMIN}`);
  console.log("\nTests that:");
  console.log("1. Reserved IDs are auto-set on deployment");
  console.log("2. Reserved IDs are auto-minted to ADMIN on deployment");
  console.log("3. ADMIN balance should be 258 after deployment");
  console.log("4. Random user minting skips reserved IDs (gets ID 2, not 1)");
  console.log("\n");

  SimulationBuilder.new()
    // ============================================================
    // Step 1: Deploy froggy NFT contract
    // This auto-executes:
    //   - Set all 258 reserved IDs
    //   - Mint all 258 reserved IDs to ADMIN_RECIPIENT
    // ============================================================
    .withSender(DEPLOYER)
    .addContractDeploy({
      contract_name: "froggy-gamma-nft",
      source_code: fs.readFileSync(
        "./contracts/froggy-gamma-nft.clar",
        "utf8"
      ),
      clarity_version: ClarityVersion.Clarity3,
    })

    // ============================================================
    // Step 2: Verify ADMIN owns NFT #1 (should be minted on deployment)
    // Expected: (ok (some SP1KBVBP3AZP7YA968Y3G14A17P9XXFPBPEVF5EG9))
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-owner",
      function_args: [uintCV(1)],
    })

    // ============================================================
    // Step 3: Verify ADMIN owns NFT #5 (reserved, minted on deployment)
    // Expected: (ok (some SP1KBVBP3AZP7YA968Y3G14A17P9XXFPBPEVF5EG9))
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-owner",
      function_args: [uintCV(5)],
    })

    // ============================================================
    // Step 4: Verify ADMIN owns NFT #25 (reserved, minted on deployment)
    // Expected: (ok (some SP1KBVBP3AZP7YA968Y3G14A17P9XXFPBPEVF5EG9))
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-owner",
      function_args: [uintCV(25)],
    })

    // ============================================================
    // Step 5: Check ADMIN's balance (should be 258)
    // Expected: u258
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-balance",
      function_args: [principalCV(ADMIN)],
    })

    // ============================================================
    // Step 6: Check if ID 1 is reserved
    // Expected: true
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "is-reserved",
      function_args: [uintCV(1)],
    })

    // ============================================================
    // Step 7: Check if ID 2 is reserved (should NOT be)
    // Expected: false
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "is-reserved",
      function_args: [uintCV(2)],
    })

    // ============================================================
    // Step 8: Check if ID 9981 is reserved (last one in list)
    // Expected: true
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "is-reserved",
      function_args: [uintCV(9981)],
    })

    // ============================================================
    // Step 9: Enable sale so users can mint
    // ============================================================
    .withSender(DEPLOYER)
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "toggle-sale-state",
      function_args: [],
    })

    // ============================================================
    // Step 10: Unpause minting
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "toggle-pause",
      function_args: [],
    })

    // ============================================================
    // Step 11: Random user claims an NFT
    // Since ID 1 is reserved (already minted), should get ID 2
    // Expected: (ok u3) - returns next-id after minting
    // ============================================================
    .withSender(RANDOM_USER)
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "claim",
      function_args: [],
    })

    // ============================================================
    // Step 12: Check who owns NFT #2 (should be RANDOM_USER)
    // Expected: (ok (some SPV00QHST52GD7D0SEWV3R5N04RD4Q1PMA3TE2MP))
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-owner",
      function_args: [uintCV(2)],
    })

    // ============================================================
    // Step 13: Random user claims another NFT
    // Should get ID 3 (ID 4 is not reserved either)
    // Expected: (ok u4)
    // ============================================================
    .withSender(RANDOM_USER)
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "claim",
      function_args: [],
    })

    // ============================================================
    // Step 14: Check who owns NFT #3 (should be RANDOM_USER)
    // Expected: (ok (some SPV00QHST52GD7D0SEWV3R5N04RD4Q1PMA3TE2MP))
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-owner",
      function_args: [uintCV(3)],
    })

    // ============================================================
    // Step 15: Check random user's balance (should be 2)
    // Expected: u2
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-balance",
      function_args: [principalCV(RANDOM_USER)],
    })

    // ============================================================
    // Step 16: Verify ADMIN balance unchanged (still 258)
    // Expected: u258
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-balance",
      function_args: [principalCV(ADMIN)],
    })

    .run()
    .catch(console.error);
}

main();
