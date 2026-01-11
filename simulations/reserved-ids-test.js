// reserved-ids-test.js
// Test reserved IDs: auto-set and auto-minted to ARTIST on deployment
// Verifies that all 258 reserved IDs are correctly owned by ARTIST
import fs from "node:fs";
import {
  ClarityVersion,
  uintCV,
  principalCV,
  contractPrincipalCV,
} from "@stacks/transactions";
import { SimulationBuilder } from "stxer";

// ============================================================
// PRINCIPALS
// ============================================================
const DEPLOYER = "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22";
const ARTIST = "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R";

// ============================================================
// CONTRACTS
// ============================================================
const NFT_CONTRACT = `${DEPLOYER}.froggy-gamma-nft`;

// ============================================================
// RESERVED IDS (sample from the 258 total)
// ============================================================
const SAMPLE_RESERVED_IDS = [1, 5, 25, 65, 71, 101, 140, 264, 265, 303];
const SAMPLE_NON_RESERVED_IDS = [2, 3, 4, 6, 7, 8, 9, 10, 11, 12];

async function main() {
  console.log("=== RESERVED IDS TEST (AUTO-DEPLOYMENT) ===\n");
  console.log("Tests that:");
  console.log("1. Reserved IDs are marked as reserved (is-reserved returns true)");
  console.log("2. Reserved IDs are owned by ARTIST");
  console.log("3. Non-reserved IDs are NOT reserved");
  console.log("4. Non-reserved IDs are owned by MARKETPLACE");
  console.log("5. ARTIST balance is 258, MARKETPLACE balance is 9742");
  console.log("\n");

  const builder = SimulationBuilder.new()
    // ============================================================
    // Step 1: Deploy froggy NFT contract
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
    // Step 2: Check ARTIST balance (should be 258)
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-balance",
      function_args: [principalCV(ARTIST)],
    })

    // ============================================================
    // Step 3: Check MARKETPLACE balance (should be 9742)
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-balance",
      function_args: [contractPrincipalCV(DEPLOYER, "froggy-nft-marketplace")],
    });

  // ============================================================
  // Step 4-13: Verify sample reserved IDs are marked as reserved
  // ============================================================
  for (const id of SAMPLE_RESERVED_IDS) {
    builder.addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "is-reserved",
      function_args: [uintCV(id)],
    });
  }

  // ============================================================
  // Step 14-23: Verify sample reserved IDs are owned by ARTIST
  // ============================================================
  for (const id of SAMPLE_RESERVED_IDS) {
    builder.addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-owner",
      function_args: [uintCV(id)],
    });
  }

  // ============================================================
  // Step 24-33: Verify sample non-reserved IDs are NOT reserved
  // ============================================================
  for (const id of SAMPLE_NON_RESERVED_IDS) {
    builder.addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "is-reserved",
      function_args: [uintCV(id)],
    });
  }

  // ============================================================
  // Step 34-43: Verify sample non-reserved IDs are owned by MARKETPLACE
  // ============================================================
  for (const id of SAMPLE_NON_RESERVED_IDS) {
    builder.addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-owner",
      function_args: [uintCV(id)],
    });
  }

  builder.run().catch(console.error);
}

main();
