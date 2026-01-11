// marketplace-test.js
// Comprehensive test simulation for froggy-marketplace contract
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
const DEPLOYER = "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22"; // Marketplace deployer/admin
const ARTIST = "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R"; // Owns reserved NFTs (258 total)
const SELLER = ARTIST; // Artist is our seller - owns reserved NFTs
const FROG_WHALE = "SP2FPQSPBEGJTNJV99XHSS82QXWWHSRFN0AEVZBVH"; // Has 35M froggy tokens
const BUYER = "SP1NPDHF9CQ8B9Q045CCQS1MR9M9SGJ5TT6WFFCD2"; // Will receive tokens from whale
const RANDOM_USER = "SP2C7BCAP2NH3EYWCCVHJ6K0DMZBXDFKQ56KR7QN2"; // Random attacker

// ============================================================
// CONTRACTS
// ============================================================
const MARKETPLACE = `${DEPLOYER}.froggy-nft-marketplace`;
const FROGGY_NFT = `${DEPLOYER}.froggy-gamma-nft`;
const FROG_FAKTORY = "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R.frog-faktory";
const NOT_WHITELISTED_TOKEN = "SP2TT71CXBRDDYP2P8XMVKRFYKRGSMBWCZ6W6FDGT.notastrategy";

// ============================================================
// NFT IDs owned by ARTIST (reserved IDs)
// ============================================================
const RESERVED_IDS = [1, 5, 25, 65, 71, 101, 140, 264, 265, 303];

// ============================================================
// PRICES (frog-faktory has 6 decimals)
// ============================================================
const PRICE_10K = 10_000_000_000n; // 10k froggy
const PRICE_50K = 50_000_000_000n; // 50k froggy
const PRICE_100K = 100_000_000_000n; // 100k froggy
const PRICE_500K = 500_000_000_000n; // 500k froggy
const PRICE_1M = 1_000_000_000_000n; // 1M froggy - more than buyer has!
const BUYER_FUNDING = 800_000_000_000n; // 800k froggy for buyer

async function main() {
  console.log("=== FROGGY MARKETPLACE - COMPREHENSIVE TEST SIMULATION ===\n");
  console.log("Deployer/Admin:", DEPLOYER);
  console.log("Seller (Artist):", SELLER);
  console.log("Buyer:", BUYER);
  console.log("Random user:", RANDOM_USER);
  console.log("\n");

  console.log("=== SETUP ===");
  console.log("1. Deploy NFT contract");
  console.log("2. Deploy marketplace contract");
  console.log("3. Initialize marketplace");
  console.log("4. Fund buyer with 800k froggy from whale");
  console.log("\n");

  console.log("=== HAPPY PATH TESTS ===");
  console.log("5. Seller lists NFT #1 for 50k froggy");
  console.log("6. Buyer purchases NFT #1");
  console.log("7. Seller lists NFT #5, then unlists it");
  console.log("8. Seller lists NFT #25, updates price");
  console.log("9. Seller lists NFT #65, then changes price");
  console.log("\n");

  console.log("=== EXPECTED FAILURE TESTS ===");
  console.log("10. List with non-whitelisted FT (ERR u204)");
  console.log("11. Buy with insufficient funds (FT transfer fails)");
  console.log("12. Buy own NFT (ERR u206)");
  console.log("13. Unlist someone else's NFT (ERR u203)");
  console.log("14. Buy with wrong FT contract (ERR u211)");
  console.log("15. Initialize twice (ERR u209)");
  console.log("16. Non-admin whitelist FT (ERR u200)");
  console.log("17. Non-admin pause (ERR u200)");
  console.log("18. Buy when paused (ERR u207)");
  console.log("19. List NFT not owned (transfer fails)");
  console.log("\n");

  SimulationBuilder.new()
    // ============================================================
    // STEP 1: Deploy froggy NFT contract
    // ============================================================
    .withSender(DEPLOYER)
    .addContractDeploy({
      contract_name: "froggy-gamma-nft",
      source_code: fs.readFileSync("./contracts/froggy-gamma-nft.clar", "utf8"),
      clarity_version: ClarityVersion.Clarity3,
    })

    // ============================================================
    // STEP 2: Deploy marketplace contract
    // ============================================================
    .addContractDeploy({
      contract_name: "froggy-nft-marketplace",
      source_code: fs.readFileSync(
        "./contracts/froggy-nft-marketplace.clar",
        "utf8"
      ),
      clarity_version: ClarityVersion.Clarity4,
    })

    // ============================================================
    // STEP 3: Initialize with froggy NFT
    // Expected: (ok true)
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "initialize",
      function_args: [principalCV(FROGGY_NFT)],
    })

    // ============================================================
    // STEP 4: Fund buyer with froggy tokens from whale
    // Expected: (ok true)
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
    // STEP 5: Seller (Artist) lists reserved NFT #1 for 50k froggy
    // Expected: (ok true)
    // ============================================================
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(1), // token-id (reserved, owned by Artist)
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(ARTIST, "frog-faktory"),
        uintCV(PRICE_50K),
      ],
    })

    // ============================================================
    // STEP 6: Buyer purchases NFT #1
    // Expected: (ok true)
    // ============================================================
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(1),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(ARTIST, "frog-faktory"),
      ],
    })

    // ============================================================
    // STEP 7a: Seller lists NFT #5
    // Expected: (ok true)
    // ============================================================
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(5), // reserved ID
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(ARTIST, "frog-faktory"),
        uintCV(PRICE_100K),
      ],
    })

    // ============================================================
    // STEP 7b: Seller unlists NFT #5
    // Expected: (ok true) - NFT returned to seller
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "unlist-nft",
      function_args: [
        uintCV(5),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
      ],
    })

    // ============================================================
    // STEP 8a: Seller lists NFT #25
    // Expected: (ok true)
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(25), // reserved ID
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(ARTIST, "frog-faktory"),
        uintCV(PRICE_50K),
      ],
    })

    // ============================================================
    // STEP 8b: Seller updates price on NFT #25
    // Expected: (ok true)
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "update-price",
      function_args: [uintCV(25), uintCV(PRICE_100K)],
    })

    // ============================================================
    // STEP 9a: Seller lists NFT #65
    // Expected: (ok true)
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(65), // reserved ID
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(ARTIST, "frog-faktory"),
        uintCV(PRICE_10K),
      ],
    })

    // ============================================================
    // STEP 9b: Seller updates listing price on NFT #65
    // Expected: (ok true)
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "update-price",
      function_args: [uintCV(65), uintCV(PRICE_50K)],
    })

    // ============================================================
    // === EXPECTED FAILURE TESTS ===
    // ============================================================

    // ============================================================
    // STEP 10: List with non-whitelisted FT
    // Expected: (err u204) ERR-FT-NOT-WHITELISTED
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(71), // reserved ID
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP2TT71CXBRDDYP2P8XMVKRFYKRGSMBWCZ6W6FDGT",
          "notastrategy"
        ), // NOT WHITELISTED!
        uintCV(PRICE_10K),
      ],
    })

    // ============================================================
    // STEP 11a: Seller lists NFT #71 at price buyer can't afford
    // Expected: (ok true)
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(71),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(ARTIST, "frog-faktory"),
        uintCV(PRICE_1M), // Buyer can't afford 1M!
      ],
    })

    // ============================================================
    // STEP 11b: Buyer tries to buy but can't afford
    // Expected: FT transfer fails (err u1)
    // ============================================================
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(71),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(ARTIST, "frog-faktory"),
      ],
    })

    // ============================================================
    // STEP 12: Seller tries to buy own NFT #65
    // Expected: (err u206) ERR-CANNOT-BUY-OWN
    // ============================================================
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(65), // Listed by SELLER
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(ARTIST, "frog-faktory"),
      ],
    })

    // ============================================================
    // STEP 13: Random user tries to unlist seller's NFT #25
    // Expected: (err u203) ERR-NOT-OWNER
    // ============================================================
    .withSender(RANDOM_USER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "unlist-nft",
      function_args: [
        uintCV(25), // Listed by SELLER, not RANDOM_USER
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
      ],
    })

    // ============================================================
    // STEP 14: Buyer tries to buy with wrong FT contract
    // Expected: (err u211) ERR-WRONG-FT
    // ============================================================
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(25),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP2TT71CXBRDDYP2P8XMVKRFYKRGSMBWCZ6W6FDGT",
          "notastrategy"
        ), // WRONG FT!
      ],
    })

    // ============================================================
    // STEP 15: Admin tries to initialize again
    // Expected: (err u209) ERR-ALREADY-INITIALIZED
    // ============================================================
    .withSender(DEPLOYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "initialize",
      function_args: [principalCV(FROGGY_NFT)],
    })

    // ============================================================
    // STEP 16: Random user tries to whitelist FT
    // Expected: (err u200) ERR-NOT-AUTHORIZED
    // ============================================================
    .withSender(RANDOM_USER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "whitelist-ft",
      function_args: [
        contractPrincipalCV(
          "SP2TT71CXBRDDYP2P8XMVKRFYKRGSMBWCZ6W6FDGT",
          "notastrategy"
        ),
        boolCV(true),
      ],
    })

    // ============================================================
    // STEP 17: Random user tries to pause contract
    // Expected: (err u200) ERR-NOT-AUTHORIZED
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "set-paused",
      function_args: [boolCV(true)],
    })

    // ============================================================
    // STEP 18a: Admin pauses the contract
    // Expected: (ok true)
    // ============================================================
    .withSender(DEPLOYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "set-paused",
      function_args: [boolCV(true)],
    })

    // ============================================================
    // STEP 18b: Buyer tries to buy when paused
    // Expected: (err u207) ERR-PAUSED
    // ============================================================
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(25),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(ARTIST, "frog-faktory"),
      ],
    })

    // ============================================================
    // STEP 18c: Admin unpauses the contract
    // Expected: (ok true)
    // ============================================================
    .withSender(DEPLOYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "set-paused",
      function_args: [boolCV(false)],
    })

    // ============================================================
    // STEP 19: Random user tries to list NFT they don't own
    // Expected: NFT transfer fails (err u1)
    // ============================================================
    .withSender(RANDOM_USER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(101), // Reserved, owned by ARTIST not RANDOM_USER
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(ARTIST, "frog-faktory"),
        uintCV(PRICE_10K),
      ],
    })

    // ============================================================
    // STEP 20: Admin emergency return - return NFT #71 to seller
    // Expected: (ok true)
    // ============================================================
    .withSender(DEPLOYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "admin-emergency-return",
      function_args: [
        uintCV(71),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
      ],
    })

    // ============================================================
    // STEP 21: Buyer successfully purchases NFT #25 (100k)
    // Expected: (ok true)
    // ============================================================
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(25),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(ARTIST, "frog-faktory"),
      ],
    })

    .run()
    .catch(console.error);
}

main();
