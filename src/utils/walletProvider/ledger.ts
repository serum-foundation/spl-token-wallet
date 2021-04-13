import TransportWebUsb from '@ledgerhq/hw-transport-webusb';
import {
  getPublicKey,
  solana_derivation_path,
  solana_ledger_sign_bytes,
  solana_ledger_sign_transaction,
  solana_ledger_confirm_public_key,
} from './ledger-core';
import { DERIVATION_PATH } from './localStorage';
import bs58 from 'bs58';
import { Message, PublicKey, Transaction } from '@solana/web3.js';

export class LedgerWalletProvider {
  onDisconnect: () => void;
  derivationPath: string;
  account: number;
  change: number;
  solanaDerivationPath: Buffer;
  pubKey: PublicKey | undefined;
  transport: TransportWebUsb;

  constructor({onDisconnect, derivationPath, account, change}: {onDisconnect: () => void, derivationPath: string, account: number, change: number}) {
    this.onDisconnect = onDisconnect || (() => {});
    this.derivationPath = derivationPath || DERIVATION_PATH.bip44Change;
    this.account = account;
    this.change = change;
    this.solanaDerivationPath = solana_derivation_path(
      this.account,
      this.change,
      this.derivationPath,
    );
  }

  async init() {
    this.transport = await TransportWebUsb.create();
    this.pubKey = await getPublicKey(this.transport, this.solanaDerivationPath);
    this.transport.on('disconnect', this.onDisconnect);
    return this;
  }

  get publicKey() {
    return this.pubKey;
  }

  async signTransaction(transaction: Transaction) {
    const sig_bytes = await solana_ledger_sign_transaction(
      this.transport,
      this.solanaDerivationPath,
      transaction,
    );
    if (!this.publicKey) {
      throw new Error('');
    }
    transaction.addSignature(this.publicKey, sig_bytes);
    return transaction;
  };

  async createSignature(message: Message) {
    const sig_bytes = await solana_ledger_sign_bytes(
      this.transport,
      this.solanaDerivationPath,
      message,
    );
    return bs58.encode(sig_bytes);
  };

  async confirmPublicKey() {
    return await solana_ledger_confirm_public_key(
      this.transport,
      this.solanaDerivationPath,
    );
  };
}
