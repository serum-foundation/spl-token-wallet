import { clusterApiUrl } from '@solana/web3.js';
import { MAINNET_URL, MAINNET_BACKUP_URL } from '../utils/connection';

export const CLUSTERS = [
  {
    name: 'mainnet-beta',
    apiUrl: MAINNET_URL,
    label: 'Mainnet Beta',
    clusterSlug: 'mainnet-beta',
  },
  {
    name: 'mainnet-beta-backup',
    apiUrl: MAINNET_BACKUP_URL,
      label: 'Mainnet Beta Backup',
    clusterSlug: 'mainnet-beta',
  },
  {
    name: 'devnet',
    apiUrl: clusterApiUrl('devnet'),
    label: 'Devnet',
    clusterSlug: 'devnet',
  },
  {
    name: 'testnet',
    apiUrl: clusterApiUrl('testnet'),
    label: 'Testnet',
    clusterSlug: 'testnet',
  },
  {
    name: 'localnet',
    apiUrl: 'http://localhost:8899',
    label: null,
    clusterSlug: 'localnet',
  }
];

export function clusterForEndpoint(endpoint) {
  return CLUSTERS.find(({ apiUrl }) => apiUrl === endpoint);
}
