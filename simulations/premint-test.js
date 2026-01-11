// premint-test.js
// Test full flow: deployment + premint purchase with frog-faktory tokens
import fs from "node:fs";
import {
  ClarityVersion,
  uintCV,
  principalCV,
  contractPrincipalCV,
  boolCV,
} from "@stacks/transactions";
import { SimulationBuilder } from "stxer";

// ============================================================
// PRINCIPALS
// ============================================================
const DEPLOYER = "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22";
const ARTIST = "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R"; // Receives 90% of premint
const BUYER = "SP8D5DYVACKV3XSG3Q7QR48H765RG3FRB9P7S99A"; // Real froggy holder (has 35.98M froggy)

// ============================================================
// CONTRACTS
// ============================================================
const NFT_CONTRACT = `${DEPLOYER}.froggy-gamma-nft`;
const MARKETPLACE_CONTRACT = `${DEPLOYER}.froggy-nft-marketplace`;
const FROG_FAKTORY = "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R.frog-faktory";

// ============================================================
// PRICES
// ============================================================
const PREMINT_PRICE = 100000000000000n; // 100k froggy tokens

async function main() {
  console.log("=== PREMINT TEST ===\n");
  console.log("Flow:");
  console.log("1. Deploy NFT contract (mints 258 reserved to ARTIST, 9742 to marketplace)");
  console.log("2. Deploy Marketplace (auto-whitelists frog-faktory)");
  console.log("3. Initialize marketplace with NFT contract");
  console.log("4. Verify marketplace owns non-reserved NFTs");
  console.log("5. Verify artist owns reserved NFTs");
  console.log("6. Buyer premints NFT #2 (non-reserved) for 100k froggy");
  console.log("7. Verify buyer now owns NFT #2");
  console.log("8. Verify artist received 90% payment");
  console.log("\n");

  SimulationBuilder.new()
    // ============================================================
    // Step 1: Deploy froggy NFT contract
    // Auto-executes:
    //   - Mint 258 reserved IDs to ARTIST
    //   - Mint 9,742 non-reserved IDs to MARKETPLACE
    //   - Enable sale + unpause
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
    // Step 2: Deploy custodial marketplace
    // Auto-executes:
    //   - Whitelist frog-faktory FT
    //   - Set default-ft to frog-faktory
    // Requires Clarity 4 for as-contract? syntax
    // ============================================================
    .addContractDeploy({
      contract_name: "froggy-nft-marketplace",
      source_code: fs.readFileSync(
        "./contracts/froggy-nft-marketplace.clar",
        "utf8"
      ),
      clarity_version: 4,
    })

    // ============================================================
    // Step 3: Initialize marketplace with NFT contract
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE_CONTRACT,
      function_name: "initialize",
      function_args: [principalCV(NFT_CONTRACT)],
    })

    // ============================================================
    // Step 4: Check marketplace balance (should be 9742)
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-balance",
      function_args: [contractPrincipalCV(DEPLOYER, "froggy-nft-marketplace")],
    })

    // ============================================================
    // Step 5: Check artist balance (should be 258)
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-balance",
      function_args: [principalCV(ARTIST)],
    })

    // ============================================================
    // Step 6: Verify marketplace owns NFT #2 (non-reserved)
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-owner",
      function_args: [uintCV(2)],
    })

    // ============================================================
    // Step 7: Verify artist owns NFT #1 (reserved)
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-owner",
      function_args: [uintCV(1)],
    })

    // ============================================================
    // Step 8: Check if frog-faktory is whitelisted
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE_CONTRACT,
      function_name: "is-ft-whitelisted",
      function_args: [contractPrincipalCV("SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R", "frog-faktory")],
    })

    // ============================================================
    // Step 9: Check default listing info
    // Expected: {price: 100k, seller: ARTIST, ft-contract: frog-faktory}
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE_CONTRACT,
      function_name: "get-default-listing-info",
      function_args: [],
    })

    // ============================================================
    // Step 10: Buyer premints NFT #2
    // Pays 100k froggy: 90k to artist, 10k platform fee
    // ============================================================
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE_CONTRACT,
      function_name: "premint",
      function_args: [
        uintCV(2), // token-id
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"), // nft-contract
        contractPrincipalCV("SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R", "frog-faktory"), // ft-contract
      ],
    })

    // ============================================================
    // Step 11: Verify buyer now owns NFT #2
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-owner",
      function_args: [uintCV(2)],
    })

    // ============================================================
    // Step 12: Check buyer's NFT balance (should be 1)
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-balance",
      function_args: [principalCV(BUYER)],
    })

    // ============================================================
    // Step 13: Check marketplace balance (should be 9741 now)
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-balance",
      function_args: [contractPrincipalCV(DEPLOYER, "froggy-nft-marketplace")],
    })

    // ============================================================
    // Step 14: Buyer premints another NFT #3
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE_CONTRACT,
      function_name: "premint",
      function_args: [
        uintCV(3), // token-id
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV("SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R", "frog-faktory"),
      ],
    })

    // ============================================================
    // Step 15: Check buyer's final NFT balance (should be 2)
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-balance",
      function_args: [principalCV(BUYER)],
    })

    .run()
    .catch(console.error);
}

main();
