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

## Simulation 2: Full Mint Test

**Simulation ID:** `49d27b4744a0d5e555d2cc5786c333eb`
**Link:** https://stxer.xyz/simulations/mainnet/49d27b4744a0d5e555d2cc5786c333eb

### Description
Verifies all 10,000 NFTs are minted correctly on deployment (258 reserved + 9,742 non-reserved).

### Key Results

| Step | Check | Output |
|------|-------|--------|
| 2 | Artist balance | `u258` |
| 3 | Marketplace balance | `u9742` |
| 4 | NFT #1 owner | Artist |
| 5 | NFT #2 owner | Marketplace |
| 6 | NFT #10000 owner | Marketplace |
| 7 | is-reserved(5) | `true` |
| 8 | is-reserved(2) | `false` |

---

## Simulation 3: Reserved IDs Test

**Simulation ID:** `f20776c5cce072eb4b9d84534d619b0f`
**Link:** https://stxer.xyz/simulations/mainnet/f20776c5cce072eb4b9d84534d619b0f

### Description
Tests that reserved IDs are correctly marked and minted to Artist, while non-reserved IDs go to Marketplace.

### Key Results

**Balances:**
| Owner | Balance |
|-------|---------|
| Artist | `u258` |
| Marketplace | `u9742` |

**Reserved IDs (should be `true`, owned by Artist):**
| ID | is-reserved | Owner |
|----|-------------|-------|
| 1 | `true` | Artist |
| 5 | `true` | Artist |
| 25 | `true` | Artist |
| 65 | `true` | Artist |
| 71 | `true` | Artist |
| 101 | `true` | Artist |
| 140 | `true` | Artist |
| 264 | `true` | Artist |
| 265 | `true` | Artist |
| 303 | `true` | Artist |

**Non-reserved IDs (should be `false`, owned by Marketplace):**
| ID | is-reserved | Owner |
|----|-------------|-------|
| 2-12 | `false` | Marketplace |

---

## Simulation 4: Marketplace Comprehensive Test

**Simulation ID:** `d816ee301c7aa6e6941273dbc83c0402`
**Link:** https://stxer.xyz/simulations/mainnet/d816ee301c7aa6e6941273dbc83c0402

### Description
Comprehensive marketplace test: list, buy, unlist, price updates, and expected failure cases.

### Happy Path Results

| Step | Action | Output |
|------|--------|--------|
| 3 | Initialize | `(ok true)` |
| 4 | Fund buyer 800k froggy | `(ok true)` |
| 5 | List NFT #1 @ 50k | `(ok true)` |
| 6 | Buy NFT #1 | `(ok true)` |
| 7 | List NFT #5 | `(ok true)` |
| 8 | Unlist NFT #5 | `(ok true)` |
| 9 | List NFT #25 | `(ok true)` |
| 10 | Update price #25 | `(ok true)` |
| 11 | List NFT #65 | `(ok true)` |
| 12 | Update price #65 | `(ok true)` |

### Fee Distribution (Step 6 - 50k sale)
- Seller: 47,500 froggy (95%)
- Royalty: 1,250 froggy (2.5%)
- Platform: 1,250 froggy (2.5%)

### Expected Failure Results

| Step | Test | Output | Error |
|------|------|--------|-------|
| 13 | Non-whitelisted FT | `(err u204)` | ERR-FT-NOT-WHITELISTED |
| 15 | Insufficient funds | `(err u1)` | FT transfer fail |
| 16 | Buy own NFT | `(err u206)` | ERR-CANNOT-BUY-OWN |
| 17 | Unlist others NFT | `(err u203)` | ERR-NOT-OWNER |
| 18 | Wrong FT | `(err u211)` | ERR-WRONG-FT |
| 19 | Init twice | `(err u209)` | ERR-ALREADY-INITIALIZED |
| 20 | Non-admin whitelist | `(err u200)` | ERR-NOT-AUTHORIZED |
| 21 | Non-admin pause | `(err u200)` | ERR-NOT-AUTHORIZED |
| 23 | Buy when paused | `(err u207)` | ERR-PAUSED |
| 25 | List NFT not owned | `(err u1)` | NFT transfer fail |

### Admin Functions
| Step | Action | Output |
|------|--------|--------|
| 22 | Admin pause | `(ok true)` |
| 24 | Admin unpause | `(ok true)` |
| 26 | Admin emergency return | `(ok true)` |
| 27 | Final buy #25 | `(ok true)` |

---

## Simulation 5: Marketplace Edge Cases

**Simulation ID:** `7108b5448a206aae9350bb140540def4`
**Link:** https://stxer.xyz/simulations/mainnet/7108b5448a206aae9350bb140540def4

### Description
Comprehensive edge case tests covering pre-initialization, wrong contracts, double actions, invalid parameters, permission checks, wrong FT tokens, stale listings, price updates, and paused contract behavior.

### Pre-Initialization Tests

| Step | Test | Output | Expected |
|------|------|--------|----------|
| 3 | List before init | `(err u210)` | ERR-NOT-INITIALIZED |
| 4 | Buy before init | `(err u202)` | ERR-NOT-LISTED |

### Wrong NFT Contract Tests

| Step | Test | Output | Expected |
|------|------|--------|----------|
| 8 | List with wrong NFT | `(err u208)` | ERR-WRONG-NFT |
| 10 | Buy with wrong NFT | `(err u208)` | ERR-WRONG-NFT |
| 11 | Unlist with wrong NFT | `(err u208)` | ERR-WRONG-NFT |

### Double Actions

| Step | Test | Output | Expected |
|------|------|--------|----------|
| 12 | Initialize again | `(err u209)` | ERR-ALREADY-INITIALIZED |
| 13 | List same token | `(err u201)` | ERR-ALREADY-LISTED |

### Invalid Parameters

| Step | Test | Output | Expected |
|------|------|--------|----------|
| 14 | List price = 0 | `(err u205)` | ERR-INVALID-PRICE |
| 15 | Update price = 0 | `(err u205)` | ERR-INVALID-PRICE |
| 16 | Royalty > 10% | `(err u200)` | ERR-NOT-AUTHORIZED |
| 17 | Platform fee > 5% | `(err u200)` | ERR-NOT-AUTHORIZED |

### Non-Existent Listings

| Step | Test | Output | Expected |
|------|------|--------|----------|
| 18 | Buy #9999 | `(err u202)` | ERR-NOT-LISTED |
| 19 | Unlist #9999 | `(err u202)` | ERR-NOT-LISTED |
| 20 | Update price #9999 | `(err u202)` | ERR-NOT-LISTED |
| 21 | Emergency return #9999 | `(err u202)` | ERR-NOT-LISTED |

### Permission Tests

| Step | Test | Output | Expected |
|------|------|--------|----------|
| 22 | Non-admin emergency return | `(err u200)` | ERR-NOT-AUTHORIZED |
| 23 | Non-owner update price | `(err u203)` | ERR-NOT-OWNER |
| 24 | Non-owner update FT | `(err u203)` | ERR-NOT-OWNER |
| 25 | Non-admin set royalty | `(err u200)` | ERR-NOT-AUTHORIZED |
| 26 | Non-admin set royalty recipient | `(err u200)` | ERR-NOT-AUTHORIZED |
| 27 | Non-admin set platform fee | `(err u200)` | ERR-NOT-AUTHORIZED |
| 28 | Non-admin set platform recipient | `(err u200)` | ERR-NOT-AUTHORIZED |

### Wrong Whitelisted FT Tests

| Step | Test | Output | Expected |
|------|------|--------|----------|
| 29 | Buy with wrong FT (notastrategy) | `(err u211)` | ERR-WRONG-FT |
| 31 | Buy with wrong FT (frog-faktory) | `(err u211)` | ERR-WRONG-FT |

### Stale Listing Tests

| Step | Test | Output |
|------|------|--------|
| 32 | List #25 | `(ok true)` |
| 33 | Unlist #25 | `(ok true)` |
| 34 | Buy unlisted #25 | `(err u202)` - ERR-NOT-LISTED |

### Price Update Tests

| Step | Test | Output |
|------|------|--------|
| 35 | List #65 @ 10k | `(ok true)` |
| 36 | Update price to 50k | `(ok true)` |
| 37 | Buy @ updated 50k price | `(ok true)` - Paid 50k, not 10k |

### Paused Contract Tests

| Step | Test | Output | Expected |
|------|------|--------|----------|
| 39 | Pause contract | `(ok true)` | - |
| 40 | List when paused | `(err u207)` | ERR-PAUSED |
| 41 | Buy when paused | `(err u207)` | ERR-PAUSED |
| 42 | Update price when paused | `(err u207)` | ERR-PAUSED |
| 43 | Update FT when paused | `(err u207)` | ERR-PAUSED |
| 44 | **Unlist when paused** | `(ok true)` | Seller can always reclaim! |
| 45 | Admin emergency when paused | `(ok true)` | Admin functions work |

### Post-Unpause Tests

| Step | Test | Output |
|------|------|--------|
| 46 | Unpause | `(ok true)` |
| 47 | List #101 after unpause | `(ok true)` |
| 48 | Buy #101 after unpause | `(ok true)` |

### Post Emergency Return

| Step | Test | Output |
|------|------|--------|
| 49 | Buy after emergency return | `(err u202)` - ERR-NOT-LISTED |

### Cleanup Verification

| Step | Test | Output |
|------|------|--------|
| 50 | Unlist #5 | `(ok true)` |
| 51 | Set royalty 5% | `(ok true)` |
| 52 | Set platform fee 3% | `(ok true)` |

---

## Simulation 6: FT Un-Whitelist Test

**Simulation ID:** `dce6598454e88357891e584c3f3cf972`
**Link:** https://stxer.xyz/simulations/mainnet/dce6598454e88357891e584c3f3cf972

### Description
Tests FT whitelist/un-whitelist behavior: buy blocked when un-whitelisted, seller can still unlist, buy works after re-whitelist.

### Key Results

| Step | Action | Output | Notes |
|------|--------|--------|-------|
| 3 | Initialize | `(ok true)` | - |
| 4 | Fund buyer 100k froggy | `(ok true)` | - |
| 5 | List NFT #1 | `(ok true)` | - |
| 6 | **Un-whitelist frog-faktory** | `(ok true)` | - |
| 7 | Buy when un-whitelisted | `(err u204)` | ERR-FT-NOT-WHITELISTED |
| 8 | **Unlist when un-whitelisted** | `(ok true)` | Seller can always reclaim! |
| 9 | Re-whitelist frog-faktory | `(ok true)` | - |
| 10 | List NFT #1 again | `(ok true)` | - |
| 11 | Buy after re-whitelist | `(ok true)` | Success |
| 12 | Un-whitelist again | `(ok true)` | - |
| 13 | List with un-whitelisted FT | `(err u204)` | ERR-FT-NOT-WHITELISTED |

### Key Findings
- **Buy blocked**: When FT is un-whitelisted, buy-nft returns `(err u204)`
- **Unlist always works**: Seller can reclaim NFT even with un-whitelisted FT
- **List blocked**: Cannot create new listings with un-whitelisted FT
- **Re-whitelist restores**: After re-whitelisting, all operations work normally

---

## Simulation 7: Gamma Marketplace Test (Non-Custodial STX)

**Simulation ID:** `3cb704f86eebfa5323a63258d3b18335`
**Link:** https://stxer.xyz/simulations/mainnet/3cb704f86eebfa5323a63258d3b18335

### Description
Tests the gamma marketplace (non-custodial STX marketplace) built into froggy-gamma-nft. Flow: premint NFT with froggy tokens, list on gamma marketplace in STX, buy with STX.

### Flow Results

| Step | Action | Output |
|------|--------|--------|
| 3 | Initialize marketplace | `(ok true)` |
| 4 | Whale funds FROGGY_HOLDER 200k froggy | `(ok true)` |
| 5 | FROGGY_HOLDER premints NFT #2 | `(ok true)` |
| 6 | Transfer 100k froggy to STX_HOLDER | `(ok true)` |
| 7 | STX_HOLDER premints NFT #3 | `(ok true)` |
| 8 | Verify STX_HOLDER owns NFT #3 | `(ok (some STX_HOLDER))` |
| 9 | List NFT #3 on gamma @ 1 STX | `(ok true)` |
| 10 | Verify listing exists | `(some {price: u1000000, royalty: u500})` |
| 11 | Buyer purchases NFT #3 | `(ok true)` |
| 12 | Verify buyer owns NFT #3 | `(ok (some BUYER))` |
| 13 | Verify listing deleted | `none` |

### Payment Distribution (Step 11 - 1 STX sale)

| Recipient | Amount | Purpose |
|-----------|--------|---------|
| Seller (STX_HOLDER) | 1,000,000 uSTX | Sale price |
| Artist | 25,000 uSTX | 2.5% royalty |
| Platform | 25,000 uSTX | 2.5% platform fee |
| Gamma Commission | 35,000 uSTX | 3.5% gamma fee |

### Key Findings
- **Premint with froggy**: Users can premint NFTs from froggy-nft-marketplace using $FROGGY
- **List on gamma**: NFT owners can list on gamma marketplace (non-custodial) in STX
- **Buy with STX**: Buyers pay in STX with automatic royalty/fee distribution
- **Listing cleanup**: Listing is automatically deleted after purchase

---
