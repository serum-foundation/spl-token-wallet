import React, { useState } from 'react';
import {
  Tooltip,
  Popover,
  IconButton,
  DialogActions,
  Button,
} from '@material-ui/core';
import SwapHoriz from '@material-ui/icons/SwapHoriz';
import PopupState, { bindTrigger, bindPopover } from 'material-ui-popup-state';
import Swap from '@project-serum/swap-ui';
import { Provider } from '@project-serum/anchor';
import { Connection, TransactionSignature } from '@solana/web3.js';
import { TokenListContainer } from '@solana/spl-token-registry';
import { useTokenInfos } from '../utils/tokens/names';
import { useSendTransaction } from '../utils/notifications';
import { useWallet } from '../utils/wallet';
import { useConnection } from '../utils/connection';
import { useIsExtensionWidth } from '../utils/utils';
import DialogForm from './DialogForm';

export default function SwapButton({ size }) {
  const isExtensionWidth = useIsExtensionWidth();
  if (isExtensionWidth) {
    return <SwapButtonDialog />;
  } else {
    return <SwapButtonPopover />;
  }
}

function SwapButtonDialog({ size }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sendTransaction] = useSendTransaction();
  const connection = useConnection();
  const wallet = useWallet();
  const tokenInfos = useTokenInfos();
  const tokenList = tokenInfos && new TokenListContainer(tokenInfos);
  const provider = new NotifyingProvider(connection, wallet, sendTransaction);
  return (
    <>
      <Tooltip title="Swap Tokens">
        <IconButton size={size} onClick={() => setDialogOpen(true)}>
          <SwapHoriz />
        </IconButton>
      </Tooltip>
      <DialogForm
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <Swap
            provider={provider}
            tokenList={tokenList}
            containerStyle={{
              width: '100%',
              boxShadow: 'none',
            }}
          />
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogActions>
        </div>
      </DialogForm>
    </>
  );
}

function SwapButtonPopover({ size }) {
  const [sendTransaction] = useSendTransaction();
  const connection = useConnection();
  const wallet = useWallet();
  const tokenInfos = useTokenInfos();
  const tokenList = tokenInfos && new TokenListContainer(tokenInfos);
  const provider = new NotifyingProvider(connection, wallet, sendTransaction);
  return (
    tokenList && (
      <PopupState variant="popover">
        {(popupState) => (
          <div style={{ display: 'flex' }}>
            <Tooltip title="Swap Tokens">
              <IconButton {...bindTrigger(popupState)} size={size}>
                <SwapHoriz />
              </IconButton>
            </Tooltip>
            <Popover
              {...bindPopover(popupState)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{ style: { borderRadius: '10px' } }}
              disableRestoreFocus
              keepMounted
            >
              <Swap
                provider={provider}
                tokenList={tokenList}
                containerStyle={{ width: '432px' }}
              />
            </Popover>
          </div>
        )}
      </PopupState>
    )
  );
}

class NotifyingProvider extends Provider {
  constructor(
    connection: Connection,
    wallet: Wallet,
    sendTransaction: (Promise<TransactionSignature>, Function) => void,
  ) {
    super(connection, wallet, {
      commitment: 'recent',
    });
    this.sendTransaction = sendTransaction;
  }

  async send(
    tx: Transaction,
    signers?: Array<Signer | undefined>,
    opts?: ConfirmOptions,
  ): Promise<TransactionSignature> {
    return new Promise((onSuccess, onError) => {
      this.sendTransaction(super.send(tx, signers, opts), {
        onSuccess,
        onError,
      });
    });
  }

  async sendAll(
    txs: Array<{ tx: Transaction, signers: Array<Signer | undefined> }>,
    opts?: ConfirmOptions,
  ): Promise<Array<TransactionSignature>> {
    return new Promise(async (resolve, onError) => {
      let txSigs: Array<TransactionSignature> = [];
      for (const tx of txs) {
        txSigs.push(
          await new Promise((onSuccess) => {
            this.sendTransaction(super.send(tx.tx, tx.signers, opts), {
              onSuccess,
              onError,
            });
          }),
        );
      }
      resolve(txSigs);
    });
  }
}
