HandMadeHub 🧶

A blockchain-powered decentralized marketplace for handmade creations.

HandMadeHub is a decentralized marketplace designed to connect creators and buyers through a transparent, secure, and blockchain-powered platform.

The project combines a modern React + Vite frontend with Midnight Network smart contracts to explore how blockchain technology can be applied to digital marketplaces, creator ownership, and verifiable transactions.

✨ Overview

Traditional online marketplaces rely on centralized platforms to manage product listings, ownership information, and transactions.

HandMadeHub explores a decentralized approach where blockchain technology can provide:

🔗 Transparent and verifiable records
🔐 Secure blockchain-based interactions
👩‍🎨 A platform for creators to showcase their work
🛍️ A decentralized marketplace experience
📜 Verifiable ownership and transaction history
🌐 Privacy-focused blockchain infrastructure
🚀 Key Features
Decentralized Marketplace
Browse and interact with handmade creations through a blockchain-enabled application.
Creator Showcase
Provides creators with a platform to present their handmade work.
Blockchain Integration
Application functionality is connected to smart contracts deployed on the Midnight Network.
Verifiable Ownership
Blockchain technology enables transparent and verifiable records associated with digital assets.
Privacy-Focused Architecture
Built using the Midnight ecosystem to explore privacy-preserving blockchain applications.
Modern Web Interface
Built with React and Vite for a responsive and efficient user experience.
🏗️ Technology Stack
Layer	Technology
Frontend	React
Build Tool	Vite
Language	TypeScript / JavaScript
Blockchain	Midnight Network
Smart Contracts	Compact
Runtime	Node.js
Development Environment	WSL2
Containerization	Docker
Version Control	Git & GitHub
📁 Project Structure
HandMadeHub/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── contracts/
│   ├── services/
│   └── ...
│
├── public/
├── package.json
├── package-lock.json
├── README.md
└── ...

The structure may evolve as the project continues to develop.

⚙️ Prerequisites

Before running HandMadeHub locally, ensure you have:

Node.js
npm
Git
Docker Desktop
WSL2
Midnight Network development tools

Verify your installation:

node --version
npm --version
docker --version
🛠️ Installation
1. Clone the repository
git clone <YOUR_REPOSITORY_URL>
2. Navigate to the project
cd HandMadeHub
3. Install dependencies
npm install
▶️ Run Locally

Start the development server:

npm run dev

The terminal will display the local development URL.

⛓️ Blockchain Development

HandMadeHub uses the Midnight Network for its blockchain layer and Compact for smart-contract development.

Typical development commands include:

npm run compile

and, when the environment is configured for deployment:

npm run deploy

Deployment commands and environment configuration may vary depending on the selected Midnight Network environment.

🔐 Security

Security is an important consideration when developing a blockchain application.

Never commit sensitive information such as:

Private keys
Seed phrases
Wallet credentials
API keys
.env files containing secrets

Use environment variables for sensitive configuration and keep secret credentials outside the repository.

🎯 Project Goals

HandMadeHub aims to demonstrate how blockchain technology can be used to build a decentralized marketplace while focusing on:

Creator empowerment
Transparent ownership
Secure blockchain interactions
Decentralized marketplace infrastructure
Privacy-focused application development
Practical implementation of blockchain technology
🔮 Future Improvements

Planned or potential enhancements include:

Complete marketplace transaction flow

NFT minting and management

Creator profiles

Product search and filtering

Ratings and reviews

Order management

Blockchain-based payments

Enhanced privacy features

Production deployment

Mobile-friendly improvements
