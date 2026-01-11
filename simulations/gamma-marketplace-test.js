// gamma-marketplace-test.js
// Test the gamma (non-custodial) marketplace built into froggy-gamma-nft
// Flow:
//   1. Deploy contracts
//   2. Froggy holder premints NFT from froggy-nft-marketplace
//   3. Froggy holder transfers froggy to STX holder so they can premint
//   4. STX holder premints NFT from froggy-nft-marketplace
//   5. STX holder lists NFT on gamma marketplace (list-in-ustx) at 1 STX
//   6. Buyer purchases NFT from gamma marketplace (buy-in-ustx)
import fs from "node:fs";
import {
  ClarityVersion,
  uintCV,
  principalCV,
  contractPrincipalCV,
  noneCV,
} from "@stacks/transactions";
import { SimulationBuilder } from "stxer";

// ============================================================
// PRINCIPALS
// ============================================================
const DEPLOYER = "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22";
const ARTIST = "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R";

// Froggy holder - has 35.98M froggy tokens
const FROGGY_HOLDER = "SP8D5DYVACKV3XSG3Q7QR48H765RG3FRB9P7S99A";

// STX holder - has 5k STX, will receive froggy to premint, then list on gamma
const STX_HOLDER = "SPZSQNQF9SM88N00K4XYV05ZAZRACC748T78P5P3";

// Buyer - has 7 STX, will buy from gamma marketplace
const BUYER = "SPV00QHST52GD7D0SEWV3R5N04RD4Q1PMA3TE2MP";

// ============================================================
// CONTRACTS
// ============================================================
const NFT_CONTRACT = `${DEPLOYER}.froggy-gamma-nft`;
const MARKETPLACE_CONTRACT = `${DEPLOYER}.froggy-nft-marketplace`;
const FROG_FAKTORY = "SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R.frog-faktory";

// Commission contract for gamma marketplace (standard Gamma commission)
const COMMISSION_CONTRACT = "SPNWZ5V2TPWGQGVDR6T7B6RQ4XMGZ4PXTEE0VQ0S.gamma-commission-3-5";

// ============================================================
// PRICES
// ============================================================
const PREMINT_PRICE = 100000000000000n; // 100k froggy tokens
const GAMMA_LIST_PRICE = 1000000n; // 1 STX (in microSTX)

async function main() {
  console.log("=== GAMMA MARKETPLACE TEST ===\n");
  console.log("Flow:");
  console.log("1. Deploy NFT + Marketplace contracts");
  console.log("2. Initialize marketplace");
  console.log("3. Froggy holder premints NFT #2");
  console.log("4. Froggy holder transfers 100k froggy to STX holder");
  console.log("5. STX holder premints NFT #3");
  console.log("6. STX holder lists NFT #3 on gamma marketplace at 1 STX");
  console.log("7. Buyer purchases NFT #3 from gamma marketplace");
  console.log("8. Verify final ownership");
  console.log("\n");

  SimulationBuilder.new()
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
    // Step 2: Deploy froggy-nft-marketplace
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
    // Step 4: Froggy holder premints NFT #2
    // ============================================================
    .withSender(FROGGY_HOLDER)
    .addContractCall({
      contract_id: MARKETPLACE_CONTRACT,
      function_name: "premint",
      function_args: [
        uintCV(2),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV("SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R", "frog-faktory"),
      ],
    })

    // ============================================================
    // Step 5: Froggy holder transfers 100k froggy to STX holder
    // ============================================================
    .addContractCall({
      contract_id: FROG_FAKTORY,
      function_name: "transfer",
      function_args: [
        uintCV(PREMINT_PRICE),
        principalCV(FROGGY_HOLDER),
        principalCV(STX_HOLDER),
        noneCV(),
      ],
    })

    // ============================================================
    // Step 6: STX holder premints NFT #3
    // ============================================================
    .withSender(STX_HOLDER)
    .addContractCall({
      contract_id: MARKETPLACE_CONTRACT,
      function_name: "premint",
      function_args: [
        uintCV(3),
        contractPrincipalCV(DEPLOYER, "froggy-gamma-nft"),
        contractPrincipalCV("SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R", "frog-faktory"),
      ],
    })

    // ============================================================
    // Step 7: Verify STX holder owns NFT #3
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-owner",
      function_args: [uintCV(3)],
    })

    // ============================================================
    // Step 8: STX holder lists NFT #3 on gamma marketplace at 1 STX
    // Uses list-in-ustx from froggy-gamma-nft (non-custodial)
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "list-in-ustx",
      function_args: [
        uintCV(3),
        uintCV(GAMMA_LIST_PRICE),
        contractPrincipalCV("SPNWZ5V2TPWGQGVDR6T7B6RQ4XMGZ4PXTEE0VQ0S", "gamma-commission-3-5"),
      ],
    })

    // ============================================================
    // Step 9: Verify listing exists
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-listing-in-ustx",
      function_args: [uintCV(3)],
    })

    // ============================================================
    // Step 10: Buyer purchases NFT #3 from gamma marketplace
    // ============================================================
    .withSender(BUYER)
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "buy-in-ustx",
      function_args: [
        uintCV(3),
        contractPrincipalCV("SPNWZ5V2TPWGQGVDR6T7B6RQ4XMGZ4PXTEE0VQ0S", "gamma-commission-3-5"),
      ],
    })

    // ============================================================
    // Step 11: Verify buyer now owns NFT #3
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-owner",
      function_args: [uintCV(3)],
    })

    // ============================================================
    // Step 12: Verify listing is deleted
    // ============================================================
    .addContractCall({
      contract_id: NFT_CONTRACT,
      function_name: "get-listing-in-ustx",
      function_args: [uintCV(3)],
    })

    // ============================================================
    // Step 13: Check STX holder received payment (minus royalties)
    // The STX holder should have received ~0.9 STX (after royalties)
    // ============================================================

    .run()
    .catch(console.error);
}

main();
