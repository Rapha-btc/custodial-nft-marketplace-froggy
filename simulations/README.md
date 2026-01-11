# Stxer Simulations

These simulation files test the froggy-marketplace contracts using [stxer](https://stxer.xyz) mainnet simulations.

## Contracts Being Tested

- **froggy-gamma-nft.clar** - NFT contract that mints all 10,000 NFTs on deployment

  - 258 reserved IDs → Artist wallet
  - 9,742 non-reserved IDs → Marketplace contract

- **froggy-nft-marketplace.clar** - Custodial marketplace where users can buy NFTs with frog-faktory tokens

## Simulation Files

### Core Flow Tests

| File                | Purpose                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| `premint-test.js`   | **Main test** - Full flow: deploy both contracts, initialize marketplace, user buys NFT with 100k froggy tokens |
| `full-mint-test.js` | Verifies all 10,000 NFTs are minted correctly on deployment (258 reserved + 9,742 non-reserved)                 |

### Reserved IDs Tests

| File                   | Purpose                                                                         |
| ---------------------- | ------------------------------------------------------------------------------- |
| `reserved-ids-test.js` | Tests that reserved IDs are correctly marked and minted to Artist on deployment |

### Marketplace Tests (froggy-nft-marketplace - custodial)

| File                        | Purpose                                                             |
| --------------------------- | ------------------------------------------------------------------- |
| `marketplace-test.js`       | Comprehensive marketplace tests: list, buy, unlist, price updates   |
| `marketplace-edge-cases.js` | Edge cases: wrong NFT contract, wrong FT, buying own listing, etc.  |
| `ft-unwhitelist-test.js`    | Tests FT un-whitelist behavior: buys blocked but unlist still works |

### Gamma Tests (froggy-gamma-nft - non-custodial STX marketplace)

| File                        | Purpose                                                                        |
| --------------------------- | ------------------------------------------------------------------------------ |
| `gamma-marketplace-test.js` | Tests gamma marketplace: premint NFT, list-in-ustx, buy-in-ustx with royalties |

## Running Simulations

```bash
# Install dependencies
npm install

# Run a specific simulation
node simulations/premint-test.js
```

## Key Principals (Mainnet)

| Role          | Address                                     | Balance       |
| ------------- | ------------------------------------------- | ------------- |
| Deployer      | `SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22`  | -             |
| Artist        | `SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R` | -             |
| Froggy Holder | `SP8D5DYVACKV3XSG3Q7QR48H765RG3FRB9P7S99A`  | 35.98M froggy |
| STX Holder    | `SPZSQNQF9SM88N00K4XYV05ZAZRACC748T78P5P3`  | 5k STX        |
| STX Buyer     | `SPV00QHST52GD7D0SEWV3R5N04RD4Q1PMA3TE2MP`  | 7 STX         |

## Premint Pricing

- Price: 100,000 froggy tokens (100k)
- 90% → Artist
- 10% → Platform fee

// green Rapha read
