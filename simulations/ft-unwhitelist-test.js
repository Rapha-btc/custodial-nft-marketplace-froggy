// ft-unwhitelist-test.js
// Test FT un-whitelist behavior: buy blocked, unlist still works
import fs from "node:fs";
import {
  ClarityVersion,
  uintCV,
  principalCV,
  contractPrincipalCV,
  boolCV,
  noneCV,
} from "@stacks/transactions";
import { SimulationBuilder } from "stxer";

// ============================================================
// PRINCIPALS
// ============================================================
const DEPLOYER = "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22";
const ARTIST = "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R"; // Owns reserved NFTs
const SELLER = ARTIST; // Artist is the seller for reserved NFTs
const BUYER = "SP8D5DYVACKV3XSG3Q7QR48H765RG3FRB9P7S99A";
const FROG_WHALE = "SP2FPQSPBEGJTNJV99XHSS82QXWWHSRFN0AEVZBVH"; // Has 35M froggy tokens

// ============================================================
// CONTRACTS
// ============================================================
const MARKETPLACE = `${DEPLOYER}.froggy-nft-marketplace`;
const FROGGY_NFT = `${DEPLOYER}.froggy-gamma-nft`;
const FROG_FAKTORY = "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R.frog-faktory";

// Prices (frog-faktory has 6 decimals)
const PRICE_10K = 10_000_000_000n; // 10k froggy
const BUYER_FUNDING = 100_000_000_000n; // 100k froggy for buyer

async function main() {
  console.log("=== FT UN-WHITELIST TEST ===\n");
  console.log("Tests that:");
  console.log("1. Buy is blocked when FT is un-whitelisted (ERR-FT-NOT-WHITELISTED u204)");
  console.log("2. Seller can still unlist when FT is un-whitelisted (ok true)");
  console.log("3. Buy works again after FT is re-whitelisted (ok true)");
  console.log("\n");

  SimulationBuilder.new()
    // ============================================================
    // Step 0: Deploy froggy NFT contract
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
    // Step 1: Deploy marketplace contract
    // (frog-faktory auto-whitelisted on deployment)
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
    // Step 2: Initialize
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "initialize",
      function_args: [principalCV(FROGGY_NFT)],
    })

    // ============================================================
    // Step 3: Fund buyer with froggy tokens from whale
    // ============================================================
    .withSender(FROG_WHALE)
    .addContractCall({
      contract_id: FROG_FAKTORY,
      function_name: "transfer",
      function_args: [
        uintCV(BUYER_FUNDING),
        principalCV(FROG_WHALE),
        principalCV(BUYER),
        noneCV(),
      ],
    })

    // ============================================================
    // Step 4: Seller lists NFT #1 (reserved, owned by Artist)
    // Expected: (ok true)
    // ============================================================
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(1),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
        uintCV(PRICE_10K),
      ],
    })

    // ============================================================
    // Step 5: Admin UN-WHITELISTS frog-faktory
    // Expected: (ok true)
    // ============================================================
    .withSender(DEPLOYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "whitelist-ft",
      function_args: [
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
        boolCV(false), // UN-WHITELIST!
      ],
    })

    // ============================================================
    // Step 6: Buyer tries to buy - SHOULD FAIL!
    // Expected: (err u204) ERR-FT-NOT-WHITELISTED
    // ============================================================
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(1),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
      ],
    })

    // ============================================================
    // Step 7: Seller can still UNLIST even with un-whitelisted FT
    // Expected: (ok true) - seller must be able to reclaim NFT!
    // ============================================================
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "unlist-nft",
      function_args: [
        uintCV(1),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
      ],
    })

    // ============================================================
    // Step 8: Admin RE-WHITELISTS frog-faktory
    // Expected: (ok true)
    // ============================================================
    .withSender(DEPLOYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "whitelist-ft",
      function_args: [
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
        boolCV(true), // RE-WHITELIST
      ],
    })

    // ============================================================
    // Step 9: Seller lists NFT #1 again
    // Expected: (ok true)
    // ============================================================
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(1),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
        uintCV(PRICE_10K),
      ],
    })

    // ============================================================
    // Step 10: Buyer can now buy after FT is re-whitelisted
    // Expected: (ok true)
    // ============================================================
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(1),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
      ],
    })

    // ============================================================
    // BONUS: Test that listing with un-whitelisted FT also fails
    // ============================================================

    // Step 11: Un-whitelist again
    .withSender(DEPLOYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "whitelist-ft",
      function_args: [
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
        boolCV(false),
      ],
    })

    // Step 12: Try to list with un-whitelisted FT
    // Expected: (err u204) ERR-FT-NOT-WHITELISTED
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(5), // Reserved ID #5
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
        uintCV(PRICE_10K),
      ],
    })

    .run()
    .catch(console.error);
}

main();
