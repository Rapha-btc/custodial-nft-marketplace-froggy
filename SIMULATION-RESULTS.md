# Froggy NFT Marketplace - Simulation Results

## Simulation 1: Premint Flow

**Simulation ID:** `d8f910107b26d17a0d8b20613e37aafb`
**Link:** https://stxer.xyz/simulations/mainnet/d8f910107b26d17a0d8b20613e37aafb

### Description
Tests the full premint purchase flow where NFTs are minted directly to the marketplace and buyers can purchase using $FROGGY tokens.

### Flow
1. Deploy NFT contract (mints 258 reserved to artist, 9742 to marketplace)
2. Deploy Marketplace (auto-whitelists frog-faktory)
3. Initialize marketplace with NFT contract
4. Verify ownership distribution
5. Fund buyer with 500k froggy from whale
6. Buyer premints NFT #2 for 100k froggy
7. Buyer premints NFT #3 for 100k froggy

### Key Results

| Step | Action | Output |
|------|--------|--------|
| 3 | Initialize marketplace | `(ok true)` |
| 4 | Marketplace NFT balance | `u9742` |
| 5 | Artist NFT balance | `u258` |
| 9 | Default listing price | `u100000000000` (100k froggy) |
| 11 | Whale funds buyer | `(ok true)` |
| 12 | Premint NFT #2 | `(ok true)` |
| 16 | Premint NFT #3 | `(ok true)` |
| 17 | Buyer final NFT balance | `u2` |

### Payment Distribution (per NFT)
- **Price:** 100,000 $FROGGY
- **Artist (90%):** 90,000 $FROGGY
- **Platform (10%):** 10,000 $FROGGY

### Contracts Tested
- `SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.froggy-nft-marketplace`
- `SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.froggy-gamma-nft`
- `SP3E8B51MF5E28BD82FM95VDSQ71VK4KFNZX7ZK2R.frog-faktory`

---

## Simulation 2: [PENDING]

**Simulation ID:** `TBD`
**Link:** TBD

### Description
TBD

---
