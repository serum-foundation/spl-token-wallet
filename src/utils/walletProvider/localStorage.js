import { getUnlockedMnemonicAndSeed } from './../wallet-seed';
import * as bip32 from 'bip32';
import nacl from 'tweetnacl';
import { Account } from '@solana/web3.js';
import bs58 from 'bs58';
import { derivePath } from 'ed25519-hd-key';

export const DERIVATION_PATH = {
  deprecated: undefined,
  bip44: 'bip44',
  bip44Change: 'bip44Change',
  bip44Root: 'bip44Root', // Ledger only.
};

export function getAccountFromSeed(
  seed,
  walletIndex,
  dPath = undefined,
  accountIndex = 0,
) {
  const derivedSeed = deriveSeed(seed, walletIndex, dPath, accountIndex);
  return new Account(nacl.sign.keyPair.fromSeed(derivedSeed).secretKey);
}

function deriveSeed(seed, walletIndex, derivationPath, accountIndex) {
  switch (derivationPath) {
    case DERIVATION_PATH.deprecated:
      const path = `m/501'/${walletIndex}'/0/${accountIndex}`;
      return bip32.fromSeed(seed).derivePath(path).privateKey;
    case DERIVATION_PATH.bip44:
      const path44 = `m/44'/501'/${walletIndex}'`;
      return derivePath(path44, seed).key;
    case DERIVATION_PATH.bip44Change:
      const path44Change = `m/44'/501'/${walletIndex}'/0'`;
      return derivePath(path44Change, seed).key;
    default:
      throw new Error(`invalid derivation path: ${derivationPath}`);
  }
}

export class LocalStorageWalletProvider {
  constructor(args) {
    this.account = args.account;
    this.publicKey = this.account.publicKey;
  }

  init = async () => {
    const { seed } = await getUnlockedMnemonicAndSeed();
    this.listAddresses = async (walletCount) => {
      const seedBuffer = Buffer.from(seed, 'hex');
      return [...Array(walletCount).keys()].map((walletIndex) => {
        let address = getAccountFromSeed(seedBuffer, walletIndex).publicKey;
        let name = localStorage.getItem(`name${walletIndex}`);
        return { index: walletIndex, address, name };
      });
    };
    return this;
  };

  signTransaction = async (transaction) => {
    transaction.partialSign(this.account);
    return transaction;
  };

  createSignature = (message) => {
    return bs58.encode(nacl.sign.detached(message, this.account.secretKey));
  };
}
