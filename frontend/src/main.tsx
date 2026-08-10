import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { NETWORK_ID } from './midnight/selectWallet';
import App from './App';
import './index.css';

// Ensure the Midnight JS runtime network ID is configured immediately on app load
setNetworkId(NETWORK_ID);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

