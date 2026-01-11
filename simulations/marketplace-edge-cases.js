// marketplace-edge-cases.js
// Additional edge case tests for froggy froggy-nft-marketplace contract
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
const RANDOM_USER = "SP2C7BCAP2NH3EYWCCVHJ6K0DMZBXDFKQ56KR7QN2";
const FROG_WHALE = "SP2FPQSPBEGJTNJV99XHSS82QXWWHSRFN0AEVZBVH"; // Has 35M froggy tokens

// ============================================================
// CONTRACTS
// ============================================================
const MARKETPLACE = `${DEPLOYER}.froggy-nft-marketplace`;
const FROGGY_NFT = `${DEPLOYER}.froggy-gamma-nft`;
const FROG_FAKTORY = "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R.frog-faktory";

// Wrong NFT - not the initialized one
const WRONG_NFT = "SP2N959SER36FZ5QT1CX9BR63W3E8X35WQCMBYYWC.leo-cats";
// Another whitelisted FT for wrong FT tests
const OTHER_FT = "SP2TT71CXBRDDYP2P8XMVKRFYKRGSMBWCZ6W6FDGT.notastrategy";

// Reserved IDs that Artist owns: [1, 5, 25, 65, 71, 101, 140, 264, 265, 303, ...]
// We'll use several of these for our tests
const RESERVED_IDS = [1, 5, 25, 65, 71, 101, 140, 264, 265, 303];

// Prices (frog-faktory has 6 decimals)
const PRICE_10K = 10_000_000_000n; // 10k froggy
const PRICE_50K = 50_000_000_000n; // 50k froggy
const BUYER_FUNDING = 500_000_000_000n; // 500k froggy for buyer

async function main() {
  console.log("=== FROGGY MARKETPLACE - EDGE CASE TESTS ===\n");

  console.log("=== PRE-INITIALIZATION TESTS ===");
  console.log("1. Try to list before initialization (ERR-NOT-INITIALIZED u210)");
  console.log("2. Try to buy before initialization (ERR-NOT-LISTED u202)");
  console.log("\n");

  console.log("=== WRONG NFT CONTRACT TESTS ===");
  console.log("3. Initialize marketplace");
  console.log("4. Try to list with wrong NFT contract (ERR-WRONG-NFT u208)");
  console.log("5. List valid NFT, try to buy with wrong NFT contract (ERR-WRONG-NFT u208)");
  console.log("6. Try to unlist with wrong NFT contract (ERR-WRONG-NFT u208)");
  console.log("\n");

  console.log("=== DOUBLE ACTIONS ===");
  console.log("7. Try to initialize a second time (ERR-ALREADY-INITIALIZED u209)");
  console.log("8. List NFT #1, try to list same token again (ERR-ALREADY-LISTED u201)");
  console.log("\n");

  console.log("=== INVALID PARAMETERS ===");
  console.log("9. Try to list with price = 0 (ERR-INVALID-PRICE u205)");
  console.log("10. Try to update price to 0 (ERR-INVALID-PRICE u205)");
  console.log("11. Try to set royalty > 10% (ERR-NOT-AUTHORIZED u200)");
  console.log("12. Try to set platform fee > 5% (ERR-NOT-AUTHORIZED u200)");
  console.log("\n");

  console.log("=== NON-EXISTENT LISTINGS ===");
  console.log("13. Try to buy non-existent listing (ERR-NOT-LISTED u202)");
  console.log("14. Try to unlist non-existent listing (ERR-NOT-LISTED u202)");
  console.log("15. Try to update price on non-existent listing (ERR-NOT-LISTED u202)");
  console.log("16. Try emergency return on non-existent listing (ERR-NOT-LISTED u202)");
  console.log("\n");

  console.log("=== PERMISSION TESTS ===");
  console.log("17. Non-admin tries emergency return (ERR-NOT-AUTHORIZED u200)");
  console.log("18. Non-owner tries to update price (ERR-NOT-OWNER u203)");
  console.log("19. Non-owner tries to update listing FT (ERR-NOT-OWNER u203)");
  console.log("20. Non-admin tries to set royalty percent (ERR-NOT-AUTHORIZED u200)");
  console.log("21. Non-admin tries to set royalty recipient (ERR-NOT-AUTHORIZED u200)");
  console.log("22. Non-admin tries to set platform fee (ERR-NOT-AUTHORIZED u200)");
  console.log("23. Non-admin tries to set platform recipient (ERR-NOT-AUTHORIZED u200)");
  console.log("\n");

  console.log("=== WRONG WHITELISTED FT TESTS ===");
  console.log("24. List for frog-faktory, buy with notastrategy (ERR-WRONG-FT u211)");
  console.log("25. List for notastrategy, buy with frog-faktory (ERR-WRONG-FT u211)");
  console.log("\n");

  console.log("=== STALE LISTING TESTS ===");
  console.log("26. List #25, unlist it, then try to buy (ERR-NOT-LISTED u202)");
  console.log("\n");

  console.log("=== PRICE UPDATE TESTS ===");
  console.log("27. List #65 at 10k, update to 50k, buy pays 50k (ok true)");
  console.log("    - Verifies buyer pays UPDATED price, not original");
  console.log("\n");

  console.log("=== PAUSED CONTRACT TESTS ===");
  console.log("28. Pause contract, then try:");
  console.log("    - list-nft (ERR-PAUSED u207)");
  console.log("    - buy-nft (ERR-PAUSED u207)");
  console.log("    - update-price (ERR-PAUSED u207)");
  console.log("    - update-listing-ft (ERR-PAUSED u207)");
  console.log("    - unlist-nft (OK - seller can always reclaim!)");
  console.log("29. Unpause, verify operations work again");
  console.log("\n");

  console.log("=== POST EMERGENCY RETURN TESTS ===");
  console.log("30. Try to buy NFT after admin-emergency-return (ERR-NOT-LISTED u202)");
  console.log("\n");

  SimulationBuilder.new()
    // ============================================================
    // Deploy froggy NFT contract
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
    // Deploy marketplace contract
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
    // STEP 1: Try to list BEFORE initialization
    // Expected: (err u210) ERR-NOT-INITIALIZED
    // ============================================================
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(1), // Reserved ID owned by Artist
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
        uintCV(PRICE_10K),
      ],
    })

    // ============================================================
    // STEP 2: Try to buy BEFORE initialization (no listings anyway)
    // Expected: (err u202) ERR-NOT-LISTED
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
    // STEP 3: Initialize marketplace properly
    // Expected: (ok true)
    // ============================================================
    .withSender(DEPLOYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "initialize",
      function_args: [principalCV(FROGGY_NFT)],
    })

    // Whitelist notastrategy token for wrong FT tests
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

    // Fund buyer with froggy tokens from whale
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
    // STEP 4: Try to list with WRONG NFT contract (leo-cats)
    // Expected: (err u208) ERR-WRONG-NFT
    // ============================================================
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(1),
        contractPrincipalCV(
          "SP2N959SER36FZ5QT1CX9BR63W3E8X35WQCMBYYWC",
          "leo-cats"
        ), // WRONG NFT CONTRACT!
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
        uintCV(PRICE_10K),
      ],
    })

    // ============================================================
    // STEP 5a: List valid NFT #1 (reserved, owned by Artist)
    // Expected: (ok true)
    // ============================================================
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
    // STEP 5b: Try to buy with WRONG NFT contract
    // Expected: (err u208) ERR-WRONG-NFT
    // ============================================================
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(1),
        contractPrincipalCV(
          "SP2N959SER36FZ5QT1CX9BR63W3E8X35WQCMBYYWC",
          "leo-cats"
        ), // WRONG NFT CONTRACT!
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
      ],
    })

    // ============================================================
    // STEP 6: Try to unlist with WRONG NFT contract
    // Expected: (err u208) ERR-WRONG-NFT
    // ============================================================
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "unlist-nft",
      function_args: [
        uintCV(1),
        contractPrincipalCV(
          "SP2N959SER36FZ5QT1CX9BR63W3E8X35WQCMBYYWC",
          "leo-cats"
        ), // WRONG NFT CONTRACT!
      ],
    })

    // ============================================================
    // STEP 7: Try to initialize AGAIN
    // Expected: (err u209) ERR-ALREADY-INITIALIZED
    // ============================================================
    .withSender(DEPLOYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "initialize",
      function_args: [principalCV(FROGGY_NFT)],
    })

    // ============================================================
    // STEP 8: Try to list same token #1 again (already listed)
    // Expected: (err u201) ERR-ALREADY-LISTED
    // ============================================================
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(1), // Already listed!
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
        uintCV(PRICE_10K),
      ],
    })

    // ============================================================
    // STEP 9: Try to list with price = 0
    // Expected: (err u205) ERR-INVALID-PRICE
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(5), // Different token
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
        uintCV(0), // ZERO PRICE!
      ],
    })

    // ============================================================
    // STEP 10: Try to update price to 0
    // Expected: (err u205) ERR-INVALID-PRICE
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "update-price",
      function_args: [
        uintCV(1),
        uintCV(0), // ZERO PRICE!
      ],
    })

    // ============================================================
    // STEP 11: Try to set royalty > 10% (max is 1000 basis points)
    // Expected: (err u200) ERR-NOT-AUTHORIZED
    // ============================================================
    .withSender(DEPLOYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "set-royalty-percent",
      function_args: [
        uintCV(1500), // 15% - exceeds 10% max!
      ],
    })

    // ============================================================
    // STEP 12: Try to set platform fee > 5% (max is 500 basis points)
    // Expected: (err u200) ERR-NOT-AUTHORIZED
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "set-platform-fee",
      function_args: [
        uintCV(600), // 6% - exceeds 5% max!
      ],
    })

    // ============================================================
    // STEP 13: Try to buy non-existent listing (token #9999)
    // Expected: (err u202) ERR-NOT-LISTED
    // ============================================================
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(9999), // Does not exist!
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
      ],
    })

    // ============================================================
    // STEP 14: Try to unlist non-existent listing
    // Expected: (err u202) ERR-NOT-LISTED
    // ============================================================
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "unlist-nft",
      function_args: [
        uintCV(9999), // Does not exist!
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
      ],
    })

    // ============================================================
    // STEP 15: Try to update price on non-existent listing
    // Expected: (err u202) ERR-NOT-LISTED
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "update-price",
      function_args: [
        uintCV(9999), // Does not exist!
        uintCV(PRICE_10K),
      ],
    })

    // ============================================================
    // STEP 16: Try emergency return on non-existent listing
    // Expected: (err u202) ERR-NOT-LISTED
    // ============================================================
    .withSender(DEPLOYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "admin-emergency-return",
      function_args: [
        uintCV(9999), // Does not exist!
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
      ],
    })

    // ============================================================
    // STEP 17: Non-admin tries emergency return on valid listing
    // Expected: (err u200) ERR-NOT-AUTHORIZED
    // ============================================================
    .withSender(RANDOM_USER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "admin-emergency-return",
      function_args: [
        uintCV(1), // Valid listing
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
      ],
    })

    // ============================================================
    // STEP 18: Non-owner tries to update price
    // Expected: (err u203) ERR-NOT-OWNER
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "update-price",
      function_args: [
        uintCV(1), // Listed by SELLER, not RANDOM_USER
        uintCV(PRICE_10K * 2n),
      ],
    })

    // ============================================================
    // STEP 19: Non-owner tries to update listing FT
    // Expected: (err u203) ERR-NOT-OWNER
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "update-listing-ft",
      function_args: [
        uintCV(1), // Listed by SELLER, not RANDOM_USER
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
        uintCV(PRICE_10K * 2n),
      ],
    })

    // ============================================================
    // STEP 20: Non-admin tries to set royalty percent
    // Expected: (err u200) ERR-NOT-AUTHORIZED
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "set-royalty-percent",
      function_args: [
        uintCV(100), // 1%
      ],
    })

    // ============================================================
    // STEP 21: Non-admin tries to set royalty recipient
    // Expected: (err u200) ERR-NOT-AUTHORIZED
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "set-royalty-recipient",
      function_args: [principalCV(RANDOM_USER)],
    })

    // ============================================================
    // STEP 22: Non-admin tries to set platform fee
    // Expected: (err u200) ERR-NOT-AUTHORIZED
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "set-platform-fee",
      function_args: [
        uintCV(100), // 1%
      ],
    })

    // ============================================================
    // STEP 23: Non-admin tries to set platform recipient
    // Expected: (err u200) ERR-NOT-AUTHORIZED
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "set-platform-recipient",
      function_args: [principalCV(RANDOM_USER)],
    })

    // ============================================================
    // STEP 24: Buy with WRONG whitelisted FT
    // Listed for frog-faktory, try buy with notastrategy
    // Expected: (err u211) ERR-WRONG-FT
    // ============================================================
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(1), // Listed for frog-faktory
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP2TT71CXBRDDYP2P8XMVKRFYKRGSMBWCZ6W6FDGT",
          "notastrategy"
        ), // WRONG FT!
      ],
    })

    // ============================================================
    // STEP 25: List for notastrategy, try buy with frog-faktory
    // Expected: (err u211) ERR-WRONG-FT
    // ============================================================
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(5), // Reserved ID #5
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP2TT71CXBRDDYP2P8XMVKRFYKRGSMBWCZ6W6FDGT",
          "notastrategy"
        ), // Listed for notastrategy
        uintCV(PRICE_10K),
      ],
    })

    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(5), // Listed for notastrategy
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ), // WRONG FT!
      ],
    })

    // ============================================================
    // STEP 26: List #25, unlist it, then try to buy
    // Expected: (err u202) ERR-NOT-LISTED
    // ============================================================
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(25), // Reserved ID #25
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
        uintCV(PRICE_10K),
      ],
    })

    // Seller unlists #25
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "unlist-nft",
      function_args: [
        uintCV(25),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
      ],
    })

    // Buyer tries to buy #25 which was unlisted
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(25), // Was listed then unlisted!
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
      ],
    })

    // ============================================================
    // STEP 27: List at 10k, update to 50k, verify buy pays 50k
    // ============================================================

    // 27a: Seller lists #65 at 10k
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(65), // Reserved ID #65
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
        uintCV(PRICE_10K), // Original: 10k
      ],
    })

    // 27b: Seller updates price to 50k
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "update-price",
      function_args: [
        uintCV(65),
        uintCV(PRICE_50K), // Updated: 50k
      ],
    })

    // 27c: Buyer purchases at UPDATED price (50k)
    // Expected: (ok true) - buyer pays 50k, not 10k
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(65),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
      ],
    })

    // ============================================================
    // STEP 28: Pause contract and try all public functions
    // ============================================================

    // First, list #71 so we have something to test with
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(71), // Reserved ID #71
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
        uintCV(PRICE_10K),
      ],
    })

    // Admin pauses contract
    .withSender(DEPLOYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "set-paused",
      function_args: [boolCV(true)],
    })

    // 28a: Try to list when paused
    // Expected: (err u207) ERR-PAUSED
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(101), // Reserved ID #101
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
        uintCV(PRICE_10K),
      ],
    })

    // 28b: Try to buy when paused
    // Expected: (err u207) ERR-PAUSED
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(71),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
      ],
    })

    // 28c: Try to update price when paused
    // Expected: (err u207) ERR-PAUSED
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "update-price",
      function_args: [
        uintCV(71),
        uintCV(PRICE_10K * 2n),
      ],
    })

    // 28d: Try to update listing FT when paused
    // Expected: (err u207) ERR-PAUSED
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "update-listing-ft",
      function_args: [
        uintCV(71),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
        uintCV(PRICE_10K * 3n),
      ],
    })

    // 28e: Unlist when paused - THIS SHOULD WORK!
    // Seller can always reclaim their NFT even when paused
    // Expected: (ok true)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "unlist-nft",
      function_args: [
        uintCV(71),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
      ],
    })

    // 28f: Admin emergency return works when paused
    // First need to list another NFT (we'll use #1 which is still listed)
    .withSender(DEPLOYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "admin-emergency-return",
      function_args: [
        uintCV(1),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
      ],
    })

    // ============================================================
    // STEP 29: Unpause and verify operations work again
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "set-paused",
      function_args: [boolCV(false)],
    })

    // List #101 should work now
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(101), // Reserved ID #101
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
        uintCV(PRICE_10K),
      ],
    })

    // Buy #101 should work now
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(101),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
      ],
    })

    // ============================================================
    // STEP 30: Try to buy NFT after admin-emergency-return
    // #1 was emergency-returned in step 28f, listing is deleted
    // Expected: (err u202) ERR-NOT-LISTED
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(1), // Was emergency-returned, no longer listed!
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV(
          "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R",
          "frog-faktory"
        ),
      ],
    })

    // ============================================================
    // CLEANUP: Verify contract still works
    // ============================================================

    // Seller unlists #5
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "unlist-nft",
      function_args: [
        uintCV(5),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
      ],
    })

    // Admin can still set valid royalty (5%)
    .withSender(DEPLOYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "set-royalty-percent",
      function_args: [
        uintCV(500), // 5% - valid
      ],
    })

    // Admin can still set valid platform fee (3%)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "set-platform-fee",
      function_args: [
        uintCV(300), // 3% - valid
      ],
    })

    .run()
    .catch(console.error);
}

main();
