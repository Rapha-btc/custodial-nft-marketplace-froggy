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
const SELLER = "SPV00QHST52GD7D0SEWV3R5N04RD4Q1PMA3TE2MP"; // Owns froggy NFTs
const BUYER = "SP1NPDHF9CQ8B9Q045CCQS1MR9M9SGJ5TT6WFFCD2"; // Has tokens
const RANDOM_USER = "SP2C7BCAP2NH3EYWCCVHJ6K0DMZBXDFKQ56KR7QN2"; // Random attacker

// ============================================================
// CONTRACTS
// ============================================================
const MARKETPLACE = `${DEPLOYER}.custodial-marketplace`;
const FROGGY_NFT = `${DEPLOYER}.froggy-gamma-nft`;
const PAYMENT_TOKEN = "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275.tokensoft-token-v4k68639zxz";
const NOT_WHITELISTED_TOKEN = "SP2TT71CXBRDDYP2P8XMVKRFYKRGSMBWCZ6W6FDGT.notastrategy";

// ============================================================
// NFT IDs owned by SELLER - UPDATE THESE
// ============================================================
const SELLER_NFT_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// ============================================================
// PRICES (adjust decimals based on payment token)
// ============================================================
const PRICE_10M = 10000000000;
const PRICE_50M = 50000000000;
const PRICE_100M = 100000000000;
const PRICE_422M = 422000000000; // More than buyer has!

async function main() {
  console.log("=== FROGGY MARKETPLACE - COMPREHENSIVE TEST SIMULATION ===\n");
  console.log("Deployer/Admin:", DEPLOYER);
  console.log("Seller (NFT owner):", SELLER);
  console.log("Buyer:", BUYER);
  console.log("Random user:", RANDOM_USER);
  console.log("\n");

  console.log("=== HAPPY PATH TESTS ===");
  console.log("1. Deploy marketplace contract");
  console.log("2. Initialize with froggy NFT");
  console.log("3. Whitelist payment token");
  console.log("4. Seller lists NFT #1 for 10M tokens");
  console.log("5. Buyer purchases NFT #1");
  console.log("6. Seller lists NFT #2, then unlists it");
  console.log("7. Seller lists NFT #3, updates price");
  console.log("8. Seller lists NFT #4, changes FT and price");
  console.log("\n");

  console.log("=== EXPECTED FAILURE TESTS ===");
  console.log("9. List with non-whitelisted FT (ERR-FT-NOT-WHITELISTED u204)");
  console.log("10. Buy with insufficient funds (transfer fails)");
  console.log("11. Buy own NFT (ERR-CANNOT-BUY-OWN u206)");
  console.log("12. Unlist someone else's NFT (ERR-NOT-OWNER u203)");
  console.log("13. Buy with wrong FT contract (ERR-WRONG-FT u211)");
  console.log("14. Initialize twice (ERR-ALREADY-INITIALIZED u209)");
  console.log("15. Non-admin tries to whitelist FT (ERR-NOT-AUTHORIZED u200)");
  console.log("16. Non-admin tries to pause (ERR-NOT-AUTHORIZED u200)");
  console.log("17. Buy when paused (ERR-PAUSED u207)");
  console.log("18. List NFT not owned (transfer fails)");
  console.log("\n");

  SimulationBuilder.new()
    // ============================================================
    // STEP 0: Deploy froggy NFT contract
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
    // STEP 1: Deploy marketplace contract
    // ============================================================
    .addContractDeploy({
      contract_name: "custodial-marketplace",
      source_code: fs.readFileSync(
        "./contracts/custodial-marketplace.clar",
        "utf8"
      ),
      clarity_version: ClarityVersion.Clarity4,
    })

    // ============================================================
    // STEP 2: Initialize with froggy NFT
    // Expected: (ok true)
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "initialize",
      function_args: [
        principalCV(FROGGY_NFT),
      ],
    })

    // ============================================================
    // STEP 3: Whitelist payment token
    // Expected: (ok true)
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "whitelist-ft",
      function_args: [
        contractPrincipalCV(
          "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275",
          "tokensoft-token-v4k68639zxz"
        ),
        boolCV(true),
      ],
    })

    // ============================================================
    // STEP 4: Seller lists NFT #1
    // Expected: (ok true)
    // ============================================================
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(1), // token-id
        contractPrincipalCV(
          DEPLOYER,
          "froggy-gamma-nft"
        ), // nft-contract
        contractPrincipalCV(
          "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275",
          "tokensoft-token-v4k68639zxz"
        ), // ft-contract
        uintCV(PRICE_10M), // price
      ],
    })

    // ============================================================
    // STEP 5: Buyer purchases NFT #1
    // Expected: (ok true)
    // Fee split: 2.5% royalty + 2.5% platform = 5% fees
    // ============================================================
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(1), // token-id
        contractPrincipalCV(
          DEPLOYER,
          "froggy-gamma-nft"
        ), // nft-contract
        contractPrincipalCV(
          "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275",
          "tokensoft-token-v4k68639zxz"
        ), // ft-contract
      ],
    })

    // ============================================================
    // STEP 6a: Seller lists NFT #2
    // Expected: (ok true)
    // ============================================================
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(2),
        contractPrincipalCV(
          DEPLOYER,
          "froggy-gamma-nft"
        ),
        contractPrincipalCV(
          "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275",
          "tokensoft-token-v4k68639zxz"
        ),
        uintCV(PRICE_50M),
      ],
    })

    // ============================================================
    // STEP 6b: Seller unlists NFT #2
    // Expected: (ok true) - NFT returned to seller
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "unlist-nft",
      function_args: [
        uintCV(2),
        contractPrincipalCV(
          DEPLOYER,
          "froggy-gamma-nft"
        ),
      ],
    })

    // ============================================================
    // STEP 7a: Seller lists NFT #3
    // Expected: (ok true)
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(3),
        contractPrincipalCV(
          DEPLOYER,
          "froggy-gamma-nft"
        ),
        contractPrincipalCV(
          "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275",
          "tokensoft-token-v4k68639zxz"
        ),
        uintCV(PRICE_50M),
      ],
    })

    // ============================================================
    // STEP 7b: Seller updates price on NFT #3
    // Expected: (ok true)
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "update-price",
      function_args: [
        uintCV(3),
        uintCV(PRICE_100M), // new price
      ],
    })

    // ============================================================
    // STEP 8a: Seller lists NFT #4
    // Expected: (ok true)
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(4),
        contractPrincipalCV(
          DEPLOYER,
          "froggy-gamma-nft"
        ),
        contractPrincipalCV(
          "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275",
          "tokensoft-token-v4k68639zxz"
        ),
        uintCV(PRICE_10M),
      ],
    })

    // ============================================================
    // STEP 8b: Seller updates listing FT and price on NFT #4
    // Expected: (ok true)
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "update-listing-ft",
      function_args: [
        uintCV(4),
        contractPrincipalCV(
          "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275",
          "tokensoft-token-v4k68639zxz"
        ),
        uintCV(PRICE_50M),
      ],
    })

    // ============================================================
    // === EXPECTED FAILURE TESTS ===
    // ============================================================

    // ============================================================
    // STEP 9: List with non-whitelisted FT
    // Expected: (err u204) ERR-FT-NOT-WHITELISTED
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(5),
        contractPrincipalCV(
          DEPLOYER,
          "froggy-gamma-nft"
        ),
        contractPrincipalCV(
          "SP2TT71CXBRDDYP2P8XMVKRFYKRGSMBWCZ6W6FDGT",
          "notastrategy"
        ), // NOT WHITELISTED!
        uintCV(PRICE_10M),
      ],
    })

    // ============================================================
    // STEP 10a: Seller lists NFT #5 at insane price
    // Expected: (ok true)
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(5),
        contractPrincipalCV(
          DEPLOYER,
          "froggy-gamma-nft"
        ),
        contractPrincipalCV(
          "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275",
          "tokensoft-token-v4k68639zxz"
        ),
        uintCV(PRICE_422M), // Buyer can't afford!
      ],
    })

    // ============================================================
    // STEP 10b: Buyer tries to buy NFT #5 but can't afford it
    // Expected: FT transfer fails (insufficient balance)
    // ============================================================
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(5),
        contractPrincipalCV(
          DEPLOYER,
          "froggy-gamma-nft"
        ),
        contractPrincipalCV(
          "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275",
          "tokensoft-token-v4k68639zxz"
        ),
      ],
    })

    // ============================================================
    // STEP 11: Seller tries to buy own NFT #4
    // Expected: (err u206) ERR-CANNOT-BUY-OWN
    // ============================================================
    .withSender(SELLER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(4), // Listed by SELLER
        contractPrincipalCV(
          DEPLOYER,
          "froggy-gamma-nft"
        ),
        contractPrincipalCV(
          "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275",
          "tokensoft-token-v4k68639zxz"
        ),
      ],
    })

    // ============================================================
    // STEP 12: Random user tries to unlist seller's NFT #3
    // Expected: (err u203) ERR-NOT-OWNER
    // ============================================================
    .withSender(RANDOM_USER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "unlist-nft",
      function_args: [
        uintCV(3), // Listed by SELLER, not RANDOM_USER
        contractPrincipalCV(
          DEPLOYER,
          "froggy-gamma-nft"
        ),
      ],
    })

    // ============================================================
    // STEP 13: Buyer tries to buy with wrong FT contract
    // Expected: (err u211) ERR-WRONG-FT
    // ============================================================
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(3),
        contractPrincipalCV(
          DEPLOYER,
          "froggy-gamma-nft"
        ),
        contractPrincipalCV(
          "SP2TT71CXBRDDYP2P8XMVKRFYKRGSMBWCZ6W6FDGT",
          "notastrategy"
        ), // WRONG FT!
      ],
    })

    // ============================================================
    // STEP 14: Admin tries to initialize again
    // Expected: (err u209) ERR-ALREADY-INITIALIZED
    // ============================================================
    .withSender(DEPLOYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "initialize",
      function_args: [
        principalCV(FROGGY_NFT),
      ],
    })

    // ============================================================
    // STEP 15: Random user tries to whitelist FT
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
    // STEP 16: Random user tries to pause contract
    // Expected: (err u200) ERR-NOT-AUTHORIZED
    // ============================================================
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "set-paused",
      function_args: [boolCV(true)],
    })

    // ============================================================
    // STEP 17a: Admin pauses the contract
    // Expected: (ok true)
    // ============================================================
    .withSender(DEPLOYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "set-paused",
      function_args: [boolCV(true)],
    })

    // ============================================================
    // STEP 17b: Buyer tries to buy when paused
    // Expected: (err u207) ERR-PAUSED
    // ============================================================
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(3),
        contractPrincipalCV(
          DEPLOYER,
          "froggy-gamma-nft"
        ),
        contractPrincipalCV(
          "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275",
          "tokensoft-token-v4k68639zxz"
        ),
      ],
    })

    // ============================================================
    // STEP 17c: Admin unpauses the contract
    // Expected: (ok true)
    // ============================================================
    .withSender(DEPLOYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "set-paused",
      function_args: [boolCV(false)],
    })

    // ============================================================
    // STEP 18: Random user tries to list NFT they don't own
    // Expected: NFT transfer fails (not owner)
    // ============================================================
    .withSender(RANDOM_USER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "list-nft",
      function_args: [
        uintCV(6), // Owned by SELLER, not RANDOM_USER
        contractPrincipalCV(
          DEPLOYER,
          "froggy-gamma-nft"
        ),
        contractPrincipalCV(
          "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275",
          "tokensoft-token-v4k68639zxz"
        ),
        uintCV(PRICE_10M),
      ],
    })

    // ============================================================
    // STEP 19: Admin emergency return - return NFT #5 to seller
    // Expected: (ok true)
    // ============================================================
    .withSender(DEPLOYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "admin-emergency-return",
      function_args: [
        uintCV(5),
        contractPrincipalCV(
          DEPLOYER,
          "froggy-gamma-nft"
        ),
      ],
    })

    // ============================================================
    // STEP 20: Buyer successfully purchases NFT #3 (100M)
    // Expected: (ok true)
    // ============================================================
    .withSender(BUYER)
    .addContractCall({
      contract_id: MARKETPLACE,
      function_name: "buy-nft",
      function_args: [
        uintCV(3),
        contractPrincipalCV(
          DEPLOYER,
          "froggy-gamma-nft"
        ),
        contractPrincipalCV(
          "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275",
          "tokensoft-token-v4k68639zxz"
        ),
      ],
    })

    .run()
    .catch(console.error);
}

main();
