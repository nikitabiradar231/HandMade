HandMadeHub 🎨

A privacy-focused handmade marketplace built on the Midnight Network.

HandMadeHub is a decentralized marketplace that allows artists and creators to showcase handmade artwork, create authenticity NFTs, and interact with buyers while leveraging Midnight's privacy-preserving blockchain technology.

The project combines a modern React frontend with a Compact smart contract deployed on the Midnight Network.

🚀 Project Overview

HandMadeHub is designed to provide a decentralized platform for handmade artists and creators.

Artists can create profiles and showcase their handmade work. Each artwork can be associated with an authenticity NFT, providing a blockchain-based representation of ownership and authenticity.

The project demonstrates how privacy-preserving blockchain technology can be used to build applications where users can interact with decentralized systems while keeping sensitive information protected.

✨ Features
👩‍🎨 Artist Profiles
Create and manage artist profiles
Display artist information
Showcase handmade artwork
Artist-focused marketplace experience
🖼️ Handmade Artwork
Add handmade products/artworks
Display artwork information
Browse available creations
Support creator-focused marketplace functionality
🔐 Authenticity NFT
Generate authenticity NFTs for artwork
Associate NFTs with handmade creations
Provide blockchain-based authenticity
Improve trust between artists and buyers
🛡️ Privacy-Preserving Blockchain

HandMadeHub uses the Midnight Network and Compact smart contracts to demonstrate privacy-preserving decentralized application functionality.

Sensitive blockchain operations can be handled using Midnight's privacy-focused architecture.

⛓️ Smart Contract Integration
Compact smart contract
Midnight Network integration
Contract deployment support
Blockchain-based state management
💻 Modern Web Interface
React-based frontend
Vite development environment
Responsive marketplace interface
Clean artist and artwork presentation

🛠️ Technology Stack
Frontend
React
Vite
TypeScript
CSS
Blockchain
Midnight Network
Compact
Midnight Wallet
Midnight Proof Server
Midnight Node
Midnight Indexer
Development Tools
Node.js
npm
Docker
WSL2
Git
GitHub

🔗 Smart Contract

HandMadeHub uses a Compact smart contract for blockchain-based functionality.

The contract is responsible for handling decentralized application state and blockchain interactions required by the marketplace.

The project uses Midnight's privacy-preserving smart contract architecture rather than a traditional Ethereum Solidity contract.

📜 Contract Deployment Details

The HandMadeHub contract has been successfully deployed in the local Midnight development environment.

Deployment Status
Status: Successfully Deployed
Network: Local Midnight Development Network
Contract Language: Compact
Contract Address
9179c501783942ab18521482387195f3098418a73bbe04a38ea16358dbbeadd6
Local RPC
ws://127.0.0.1:9944
Local State File
.midnight-state.json

The deployment was performed using the Midnight local development environment with the required node, indexer, and proof-server infrastructure.


⚙️ Prerequisites

Before running the project, make sure the following are installed:

Node.js
npm
Docker Desktop
WSL
Midnight development tools
Compact compiler

Check Node.js:

node --version

Check npm:

npm --version

Check Docker:

docker --version
🚀 Installation

Install dependencies:

npm install
🔧 Midnight Setup

Start the required Midnight development services using the project's setup command:

npm run setup

This prepares the required local services such as:

Midnight Node
Midnight Indexer
Midnight Proof Server

Docker containers are used for the local blockchain environment.

🧱 Compile the Smart Contract

Compile the Compact contract using:

npm run compile

The compilation process generates the required contract artifacts for deployment and interaction.

🚀 Deploy the Contract

To deploy the contract:

npm run deploy

After deployment, the generated contract information can be used by the frontend/application for blockchain interaction.

The currently deployed local contract address is:

9179c501783942ab18521482387195f3098418a73bbe04a38ea16358dbbeadd6
💰 Check Balance

The project also provides a balance command:

npm run check-balance

This can be used to check the available balance in the configured Midnight development environment.

🖥️ Run the Frontend

Start the frontend development server using:

npm run dev

Vite will start the development server and provide a local URL that can be opened in the browser.


 Why HandMadeHub?

Traditional handmade marketplaces generally depend on centralized platforms.

This can create problems such as:

Centralized ownership of marketplace data
Limited transparency
Difficulty proving artwork authenticity
Dependence on a central platform
Limited blockchain-based verification

HandMadeHub explores how decentralized and privacy-preserving technology can address these challenges.

🔮 Future Scope

Future versions of HandMadeHub can include:

Real Midnight Preview/Testnet deployment
Marketplace purchasing functionality
Decentralized payments
Advanced artist verification
NFT-based ownership tracking
Artwork provenance history
Buyer reviews and ratings
Private buyer/seller interactions
Improved wallet integration
IPFS or decentralized storage
Production-ready deployment
Mobile-friendly interface
📊 Project Status
Component	Status
React Frontend	✅ Implemented

Vite Setup	✅ Implemented

Artist Profiles	✅ Implemented

Artwork Marketplace UI	✅ Implemented

Compact Contract	✅ Implemented

Local Midnight Setup	✅ Implemented

Contract Compilation	✅ Implemented

Local Contract Deployment	✅ Successfully Deployed

Midnight Node	✅ Configured

Midnight Indexer	✅ Configured

Midnight Proof Server	✅ Configured

🧪 Testing

Before deploying changes, test the application locally.

Start the Midnight environment:

npm run setup

Compile the contract:

npm run compile

Deploy the contract:

npm run deploy

Run the frontend:

npm run dev

Then test:

Wallet connection
Artist profile creation
Artwork creation
Artwork display
NFT/authenticity functionality
Smart contract interactions
Blockchain state updates
🐳 Docker Services

The Midnight local environment uses Docker containers for required services.

Typical services include:

my-midnight-app-node
my-midnight-app-indexer
my-midnight-app-proof-server

These services work together to provide the local Midnight development environment.

📌 Important Deployment Note

The contract address listed in this README corresponds to the local Midnight deployment:

9179c501783942ab18521482387195f3098418a73bbe04a38ea16358dbbeadd6

It should not be treated as a public Preview Network contract address.

When the application is deployed to the Midnight Preview Network, the README should be updated with the new Preview Network contract address and network information.

📚 Project Purpose

HandMadeHub was developed as a blockchain application project to explore:

Privacy-preserving smart contracts
Zero-knowledge technology
Midnight Network
Compact smart contracts
NFT authenticity
Decentralized marketplaces
Blockchain-based ownership
Web3 application development

Conclusion

HandMadeHub demonstrates how handmade marketplaces can be combined with blockchain technology and privacy-preserving infrastructure.

By using the Midnight Network and Compact smart contracts, the project explores a more privacy-focused approach to decentralized applications while providing artists with a platform for showcasing and verifying their handmade creations.

The current version successfully demonstrates local Midnight contract deployment and provides a foundation for future Preview Network and production deployment.
