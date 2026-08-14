# HandMadeHub 🎨

> **A Privacy-Preserving Decentralized Handmade Marketplace & Authenticity NFT Protocol built on the Midnight Network.**

---

## 📌 Overview

HandMadeHub is a privacy-first decentralized marketplace for handmade products built on the **Midnight Network**.

The platform allows independent makers and creators to:

* 🛍️ List handmade products
* 🎨 Create authenticity NFTs for their products
* 🔐 Protect sensitive maker secrets using Zero-Knowledge Proofs
* ✅ Verify the authenticity of handmade products
* 💰 Purchase products through privacy-preserving blockchain transactions
* 🌐 Interact with the Midnight Preview Testnet
* 🔑 Connect through the 1AM / Midnight wallet infrastructure

HandMadeHub combines a decentralized marketplace with blockchain-based authenticity verification while keeping sensitive information private.

---

## 💡 Initial Product Idea

HandMadeHub aims to solve the problem of trust and authenticity in online handmade marketplaces.

Traditional marketplaces require users to trust centralized platforms and sellers when determining whether a handmade product is genuine. HandMadeHub introduces a blockchain-based authenticity layer where makers can create authenticity NFTs associated with their products.

The platform uses **Midnight Compact smart contracts and Zero-Knowledge Proofs** so that authenticity can be verified without exposing the maker's private secret. Product information and authenticity commitments are stored on-chain, while sensitive witness information remains private.

This creates a marketplace where buyers can verify product authenticity while makers can protect their private information.

---

# 🎯 Core Features

### 🛍️ Decentralized Handmade Marketplace

Creators can list handmade products with:

* Product title
* Category
* Price
* Seller information
* Product status
* Authenticity NFT information

Product listings are maintained through the Midnight smart contract.

### 🔐 Privacy-Preserving Authentication

HandMadeHub uses Zero-Knowledge Proofs to verify authenticity without revealing the private secret used to create the authenticity commitment.

### 🎨 Authenticity NFTs

Makers can mint an authenticity NFT associated with a handmade product.

The NFT contains an authenticity commitment that can later be verified without exposing the original secret.

### ✅ Authenticity Verification

A buyer or verifier can provide a candidate secret.

The Compact circuit checks whether:

```
H(candidateSecret, productId) == stored commitment

```

The private maker secret itself is never revealed.

### 💰 Product Purchase

Users can purchase listed handmade products through the Midnight marketplace contract.

### 📦 Product Withdrawal

Sellers can withdraw eligible products through the smart contract.

### 👛 1AM / Midnight Wallet

The application integrates with the Midnight wallet environment for:

* Wallet connection
* Transaction authorization
* DUST balance
* Network interaction
* ZK transaction signing

---

# 📋 Submission Checklist

| **RequirementStatusVerification** |   |                                               |
| --------------------------------- | - | --------------------------------------------- |
| **Compact Compiler Installed**    | ✅ | Compact compiler configured                   |
| **Smart Contract Compilation**    | ✅ | `npm run compile`                             |
| **Managed Directory Generated**   | ✅ | `contracts/managed/`                          |
| **Smart Contract Tests**          | ✅ | Vitest test suite                             |
| **Midnight Preview Deployment**   | ✅ | Contract deployed                             |
| **Visible Contract Address**      | ✅ | Contract address documented below             |
| **Privacy Architecture**          | ✅ | Public state/private witness model documented |
| **Setup Instructions**            | ✅ | Local development instructions included       |
| **ZK Authenticity Verification**  | ✅ | `verifyAuthenticity` circuit                  |
| **Marketplace Functionality**     | ✅ | Product listing and purchase circuits         |

---

# 🛡️ Public State vs Private Witness Architecture

Midnight provides a hybrid privacy model where public ledger information can be separated from private witness information used during Zero-Knowledge Proof generation.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        USER / BROWSER                                │
│                                                                      │
│   ┌────────────────────────┐       ┌─────────────────────────────┐  │
│   │   PRIVATE WITNESS      │       │      1AM / MIDNIGHT WALLET  │  │
│   │                        │       │                             │  │
│   │ • makerSecret          │       │ • Wallet Address            │  │
│   │ • candidateSecret      │       │ • DUST Balance              │  │
│   │ • buyerSecret          │       │ • Transaction Authorization │  │
│   └────────────┬───────────┘       └──────────────┬──────────────┘  │
│                │                                  │                 │
└────────────────┼──────────────────────────────────┼─────────────────┘
                 │                                  │
                 ▼                                  ▼
        ┌──────────────────┐              ┌──────────────────────┐
        │  ZERO-KNOWLEDGE  │              │  WALLET AUTHENTIC-   │
        │     PROOF        │              │      ATION           │
        │                  │              │                      │
        │ Private witness  │              │ Transaction signing  │
        └─────────┬────────┘              └──────────┬───────────┘
                  │                                  │
                  └────────────────┬─────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    MIDNIGHT PREVIEW NETWORK                          │
│                                                                      │
│  PUBLIC LEDGER STATE                                                 │
│                                                                      │
│  • productsMap                                                       │
│  • nftsMap                                                           │
│  • Product ID                                                         │
│  • Product title                                                      │
│  • Category                                                           │
│  • Price                                                              │
│  • Seller                                                             │
│  • NFT token ID                                                       │
│  • Authenticity commitment                                           │
│  • Product status                                                     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

```

---

## 🔍 Privacy Model

### Public State

The following information can exist as public ledger state:

| **ComponentDescription** |                                           |
| ------------------------ | ----------------------------------------- |
| `productsMap`            | Product information and marketplace state |
| `nftsMap`                | Authenticity NFT information              |
| `nextProductId`          | Product counter                           |
| `nextNftId`              | NFT counter                               |
| `commitment`             | Cryptographic authenticity commitment     |
| `seller`                 | Marketplace seller information            |
| `status`                 | Product marketplace status                |

### Private Witnesses

Sensitive values are handled as private witness inputs:

| **Private ValuePurpose** |                                                         |
| ------------------------ | ------------------------------------------------------- |
| `makerSecret`            | Private secret used to generate authenticity commitment |
| `candidateSecret`        | Secret supplied during authenticity verification        |
| `buyerSecret`            | Private authorization information used during purchase  |

The important privacy principle is:

```
Private Secret
      │
      ▼
Zero-Knowledge Circuit
      │
      ▼
Cryptographic Commitment
      │
      ▼
Public Ledger

```

The secret itself does not need to be published on-chain.

---

# 🧱 Smart Contract

The main Compact smart contract is:

```
contracts/handmade-marketplace.compact

```

The contract currently provides the following circuits:

```
listProduct(title, category, price)

mintAuthenticityNft(productId, certificateText)

verifyAuthenticity(tokenId, candidateSecret)

purchaseProduct(productId)

withdrawProduct(productId)

```

---

# ⚙️ Smart Contract Circuits

## 1. `listProduct`

Creates a marketplace product listing.

```
listProduct(
    title,
    category,
    price
)

```

The product is recorded in the on-chain marketplace state.

---

## 2. `mintAuthenticityNft`

Creates an authenticity NFT for a listed product.

```
mintAuthenticityNft(
    productId,
    certificateText
)

```

The NFT is associated with the product and contains an authenticity commitment.

---

## 3. `verifyAuthenticity`

Verifies that a candidate secret matches the authenticity commitment.

```
verifyAuthenticity(
    tokenId,
    candidateSecret
)

```

The Zero-Knowledge circuit verifies the secret without exposing the private maker secret.

---

## 4. `purchaseProduct`

Allows a user to purchase a listed product.

```
purchaseProduct(productId)

```

---

## 5. `withdrawProduct`

Allows the seller to withdraw an eligible product from the marketplace.

```
withdrawProduct(productId)

```

---

# 🌐 Deployed Contract Information

### Midnight Preview Testnet

| **InformationValue** |                                                                    |
| -------------------- | ------------------------------------------------------------------ |
| **Network**          | Midnight Preview Testnet                                           |
| **Contract Address** | `11f29a415f12812531d87e7c642215ae6d132e10810471d54a0b1025dbfa67bf` |
| **Network ID**       | `preview`                                                          |
| **1AM Gateway**      | Preview Gateway                                                    |
| **Indexer**          | Midnight Preview Indexer                                           |

The contract deployment and Preview configuration are documented in the project README.

---

# 🧩 Smart Contract Compilation

Compile the Compact contract using:

```
npm run compile
```

The project generates managed contract artifacts under:

```
contracts/managed/handmade-marketplace/

```

The compiled contract includes the marketplace and authenticity circuits.

### Generated Structure

```
contracts/managed/handmade-marketplace/
├── contract/
│   ├── index.js
│   ├── index.d.ts
│   └── index.cjs
│
└── zkConfig/
    ├── listProduct.pk
    ├── listProduct.vk
    ├── mintAuthenticityNft.pk
    ├── mintAuthenticityNft.vk
    ├── verifyAuthenticity.pk
    ├── verifyAuthenticity.vk
    ├── purchaseProduct.pk
    ├── purchaseProduct.vk
    ├── withdrawProduct.pk
    └── withdrawProduct.vk

```

---

# 🧪 Testing

The project uses **Vitest** for smart contract testing.

Run:

```
npm run test
```

The current test suite covers:

* Product listing
* Authenticity NFT minting
* Authenticity commitment generation
* Authenticity verification
* Invalid-secret rejection

The provided project README records **4 passing tests**.

Example:

```
✓ lists a product with no NFT
✓ mints an authenticity NFT with ZK commitment
✓ verifies authenticity with matching secret
✓ rejects verification with invalid secret

Test Files  1 passed
Tests       4 passed

```

---

# 🏗️ Architecture

```
                    ┌──────────────────────┐
                    │     HandMadeHub      │
                    │    React Frontend    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  1AM / Midnight      │
                    │       Wallet         │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     Midnight.js      │
                    │        SDK           │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
       ┌───────────────────┐       ┌──────────────────┐
       │  Compact Contract │       │  Proof Server    │
       │                   │       │     Docker       │
       │ Marketplace       │       │                  │
       │ Authenticity NFT  │       │ ZK Proofs        │
       │ Verification      │       │                  │
       └─────────┬─────────┘       └──────────────────┘
                 │
                 ▼
       ┌───────────────────────────┐
       │ Midnight Preview Testnet  │
       │                           │
       │ Public Ledger State       │
       └───────────────────────────┘

```

---

# 🛠️ Technology Stack

| **LayerTechnology**   |                          |
| --------------------- | ------------------------ |
| **Frontend**          | React 18                 |
| **Language**          | TypeScript / JavaScript  |
| **Build Tool**        | Vite                     |
| **Styling**           | Tailwind CSS v4          |
| **Icons**             | Lucide Icons             |
| **Smart Contract**    | Compact                  |
| **Blockchain**        | Midnight Network         |
| **Network**           | Midnight Preview Testnet |
| **Wallet**            | 1AM / Midnight Wallet    |
| **Blockchain SDK**    | Midnight.js              |
| **Proof Generation**  | Midnight Proof Server    |
| **Infrastructure**    | Docker                   |
| **Testing**           | Vitest                   |
| **State Persistence** | Browser localStorage     |
| **Indexer**           | Midnight GraphQL Indexer |

The project's documented technology stack includes React, TypeScript, Tailwind CSS, Compact, Midnight Preview, 1AM, the Midnight proof server, and local persistence/indexer state merging.

---

# 📂 Project Structure

```
HandMade/
│
├── contracts/
│   ├── handmade-marketplace.compact
│   │
│   └── managed/
│       └── handmade-marketplace/
│           ├── contract/
│           └── zkConfig/
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── App.tsx
│       └── ...
│
├── src/
│   ├── midnight/
│   ├── components/
│   └── ...
│
├── tests/
│   └── handmade-marketplace.test.ts
│
├── compose.yml
├── package.json
├── vite.config.ts
└── README.md

```

---

# 🚀 Getting Started

## Prerequisites

Before running HandMadeHub, install:

* **Node.js >= 22.0.0**
* **npm >= 10.0.0**
* **Docker Desktop**
* **WSL2** on Windows
* **Compact Compiler**
* **1AM / Midnight Wallet browser extension**
* Preview Testnet configured in the wallet

The project documentation specifies Node.js 22+, npm 10+, Docker Desktop, the Compact compiler, and the 1AM Midnight extension as prerequisites.

---

## 1. Clone the Repository

```
git clone https://github.com/nikitabiradar231/HandMade.git
cd HandMade
```

---

## 2. Install Dependencies

```
npm install
```

---

## 3. Start Docker Infrastructure

```
docker compose up -d
```

This starts the required local infrastructure, including the Midnight proof server.

---

## 4. Compile the Smart Contract

```
npm run compile
```

---

## 5. Run Tests

```
npm run test
```

---

## 6. Start the Frontend

```
npm run frontend:dev
```

The project documentation currently specifies:

```
http://localhost:5175/

```

for the frontend development server.

---

# 🔄 Complete User Flow

```
┌─────────────────┐
│  Connect Wallet │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  Create/List Product│
└────────┬────────────┘
         │
         ▼
┌──────────────────────┐
│ Mint Authenticity NFT│
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Store Commitment     │
│ On Midnight Ledger   │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Buyer Verifies NFT   │
│ Using Candidate      │
│ Secret                │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ ZK Proof Verification│
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Purchase Product     │
└──────────────────────┘

```

---

# 🔐 Why Zero-Knowledge Proofs?

Traditional product-authenticity systems may require users to reveal sensitive information or rely completely on centralized databases.

HandMadeHub uses Zero-Knowledge Proofs to provide a different approach.

### The blockchain can verify:

* A product exists
* An authenticity NFT exists
* An authenticity commitment exists
* A verification transaction occurred
* Marketplace state

### The blockchain does not need to receive:

* The original maker secret
* The private authenticity witness
* Sensitive information used to generate the commitment

The authenticity verification is based on proving knowledge of the correct secret rather than publicly revealing the secret.

---

# 🔒 Security Considerations

Never commit sensitive information to GitHub.

Do **not** commit:

```
.env
private keys
wallet seeds
mnemonic phrases
private-state passwords
secret credentials

```

Use environment variables and local configuration for sensitive information.

---

# 📊 Deployment Status

| **ComponentStatus**          |            |
| ---------------------------- | ---------- |
| Compact Smart Contract       | ✅ Deployed |
| Midnight Preview Testnet     | ✅          |
| Authenticity NFT             | ✅          |
| ZK Authenticity Verification | ✅          |
| Product Listing              | ✅          |
| Product Purchase             | ✅          |
| Product Withdrawal           | ✅          |
| Wallet Integration           | ✅          |
| Docker Proof Server          | ✅          |
| React Frontend               | ✅          |
| Vitest Tests                 | ✅          |

---

# 📸 Evidence

## 1. Compact Compilation

The HandMadeHub Compact smart contract compiles successfully and generates the managed contract artifacts required for the application.

## 2. Midnight Preview Deployment

The HandMadeHub smart contract has been deployed to the Midnight Preview Testnet.

```
Contract Address:

11f29a415f12812531d87e7c642215ae6d132e10810471d54a0b1025dbfa67bf

```

![Midnight Preview Deployment](preview_dep.png)

---

# 🌟 Project Highlights

### Privacy First

HandMadeHub uses Midnight's privacy architecture to keep sensitive witness values private.

### Blockchain Authenticity

Each authenticity NFT provides a cryptographic authenticity layer for handmade products.

### Decentralized Marketplace

The platform connects makers and buyers through blockchain-based marketplace functionality.

### Zero-Knowledge Verification

Users can verify authenticity without exposing the original secret.

### Midnight Integration

The project demonstrates practical use of:

* Compact smart contracts
* Midnight Preview Testnet
* Midnight.js
* 1AM Wallet
* ZK Proof generation
* Midnight indexer

---

# 👩‍💻 Author

**Nikita Biradar**

GitHub:

https://github.com/nikitabiradar231

Project Repository:

https://github.com/nikitabiradar231/HandMade

---

# 📄 License

This project is open source and available under the **MIT License**.

---

## ⭐ HandMadeHub

**A privacy-preserving decentralized marketplace for handmade products with blockchain-powered authenticity verification.**

Built with ❤️ using **React + TypeScript + Compact + Midnight Network + Zero-Knowledge Proofs**.
