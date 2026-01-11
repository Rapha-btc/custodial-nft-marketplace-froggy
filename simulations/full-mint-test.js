// full-mint-test.js
// Test full deployment: 258 reserved to ARTIST + 9742 non-reserved to MARKETPLACE = 10000 NFTs
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
const ARTIST = "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R"; // ADMIN_RECIPIENT

// ============================================================
// CONTRACTS
// ============================================================
const NFT_CONTRACT = `${DEPLOYER}.froggy-gamma-nft`;

async function main() {
  console.log("=== FULL MINT TEST (10,000 NFTs on Deployment) ===\n");
  console.log("Tests that:");
  console.log("1. All 258 reserved IDs minted to ARTIST (balance: 258)");
  console.log("2. All 9,742 non-reserved IDs minted to MARKETPLACE (balance: 9742)");
  console.log("3. Total: 10,000 NFTs minted on deployment");
  console.log("\n");

  SimulationBuilder.new()
    // ============================================================
    // Step 1: Deploy froggy NFT contract
    // This auto-executes:
    //   - Set all 258 reserved IDs
    //   - Mint all 258 reserved IDs to ARTIST
    //   - Mint all 9,742 non-reserved IDs to MARKETPLACE
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
    // Step 2: Check ARTIST's balance (should be 258)
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-balance",
      function_args: [principalCV(ARTIST)],
    })

    // ============================================================
    // Step 3: Check MARKETPLACE's balance (should be 9742)
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-balance",
      function_args: [contractPrincipalCV(DEPLOYER, "froggy-nft-marketplace")],
    })

    // ============================================================
    // Step 4: Verify ARTIST owns NFT #1 (reserved)
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-owner",
      function_args: [uintCV(1)],
    })

    // ============================================================
    // Step 5: Verify MARKETPLACE owns NFT #2 (non-reserved)
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-owner",
      function_args: [uintCV(2)],
    })

    // ============================================================
    // Step 6: Verify MARKETPLACE owns NFT #10000 (last non-reserved)
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-owner",
      function_args: [uintCV(10000)],
    })

    // ============================================================
    // Step 7: Verify NFT #5 is reserved (one of the reserved IDs)
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "is-reserved",
      function_args: [uintCV(5)],
    })

    // ============================================================
    // Step 8: Verify NFT #2 is NOT reserved
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "is-reserved",
      function_args: [uintCV(2)],
    })

    .run()
    .catch(console.error);
}

main();
