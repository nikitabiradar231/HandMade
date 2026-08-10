import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { NETWORK_ID } from './midnight/selectWallet';
import App from './App';
import './index.css';

// Ensure global Buffer is defined for browser execution of Midnight JS dependencies
if (typeof globalThis !== 'undefined' && !globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}
if (typeof window !== 'undefined' && !(window as any).Buffer) {
  (window as any).Buffer = Buffer;
}

// Ensure the Midnight JS runtime network ID is configured immediately on app load
setNetworkId(NETWORK_ID);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

