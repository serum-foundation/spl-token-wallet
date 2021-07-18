import React, { useState } from 'react';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogForm from './DialogForm';
import { abbreviateAddress } from '../utils/utils';
import CopyableDisplay from './CopyableDisplay';
import { useSolanaExplorerUrlSuffix } from '../utils/connection';
import Typography from '@material-ui/core/Typography';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import { useAsyncData } from '../utils/fetch-loop';
import tuple from 'immutable-tuple';
import { useCallAsync } from '../utils/notifications';
import {
  ConnectToMetamaskButton,
  getErc20Balance,
  swapErc20ToSpl,
  useEthAccount,
  estimateErc20SwapFees,
} from '../utils/swap/eth';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import CircularProgress from '@material-ui/core/CircularProgress';
import Link from '@material-ui/core/Link';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { DialogContentText, Tooltip } from '@material-ui/core';
import { EthFeeEstimate } from './EthFeeEstimate';

const DISABLED_MINTS = new Set(['ABE7D8RU1eHfCJWzHYZZeymeE8k9nPPXfqge2NQYyKoL']);

export default function DepositDialog({
  open,
  onClose,
  publicKey,
  balanceInfo,
  swapInfo,
  isAssociatedToken,
}) {
  const ethAccount = useEthAccount();
  const urlSuffix = useSolanaExplorerUrlSuffix();
  const { mint, tokenName, tokenSymbol, owner } = balanceInfo;
  const [tab, setTab] = useState(0);

  let tabs = null;
  if (swapInfo) {
    let firstTab = `SPL ${tokenSymbol ?? swapInfo.coin.ticker}`;
    let secondTab = swapInfo.coin.ticker;
    if (!mint) {
      firstTab = 'SOL';
    } else {
      secondTab = `${
        swapInfo.coin.erc20Contract ? 'ERC20' : 'Native'
      } ${secondTab}`;
    }
    tabs = (
      <Tabs
        value={tab}
        variant="fullWidth"
        onChange={(e, value) => setTab(value)}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab label={firstTab} />
        {(!DISABLED_MINTS.has(mint && mint.toString()) ||
          localStorage.getItem('sollet-private')) && <Tab label={secondTab} />}
      </Tabs>
    );
  }
  const displaySolAddress = publicKey.equals(owner) || isAssociatedToken;
  const depositAddressStr = displaySolAddress
    ? owner.toBase58()
    : publicKey.toBase58();
  return (
    <DialogForm open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Deposit {tokenName ?? mint.toBase58()}
        {tokenSymbol ? ` (${tokenSymbol})` : null}
        {ethAccount && (
          <div>
            <Typography color="textSecondary" style={{ fontSize: '14px' }}>
              Metamask connected: {ethAccount}
            </Typography>
          </div>
        )}
      </DialogTitle>
      {tabs}
      <DialogContent style={{ paddingTop: 16 }}>
        {tab === 0 ? (
          <>
            {!displaySolAddress && isAssociatedToken === false ? (
              <DialogContentText>
                This address can only be used to receive{' '}
                {tokenSymbol ?? abbreviateAddress(mint)}. Do not send SOL to
                this address.
                <br />
                <b style={{ color: 'red' }}>WARNING</b>: You are using a deprecated account type. Please migrate your tokens. Ideally, create a new wallet. If you send to this address from a poorly implemented wallet, you may burn tokens.
              </DialogContentText>
            ) : (
              <DialogContentText>
                This address can be used to receive{' '}
                {tokenSymbol ?? abbreviateAddress(mint)}.
              </DialogContentText>
            )}
            <CopyableDisplay
              value={depositAddressStr}
              label={'Deposit Address'}
              autoFocus
              qrCode
            />
            <DialogContentText variant="body2">
              <Link
                href={
                  `https://solscan.io/account/${depositAddressStr}` +
                  urlSuffix
                }
                target="_blank"
                rel="noopener"
              >
                View on Solscan
              </Link>
            </DialogContentText>
          </>
        ) : (
          <SolletSwapDepositAddress
            balanceInfo={balanceInfo}
            swapInfo={swapInfo}
            ethAccount={ethAccount}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </DialogForm>
  );
}

function SolletSwapDepositAddress({ balanceInfo, swapInfo, ethAccount }) {
  const [ethBalance] = useAsyncData(
    () => getErc20Balance(ethAccount),
    'ethBalance',
    {
      refreshInterval: 2000,
    },
  );

  const ethFeeData = useAsyncData(
    swapInfo.coin &&
      (() =>
        estimateErc20SwapFees({
          erc20Address: swapInfo.coin.erc20Contract,
          swapAddress: swapInfo.address,
          ethAccount,
        })),
    'depositEthFee',
    {
      refreshInterval: 2000,
    },
  );

  if (!swapInfo) {
    return null;
  }

  const ethFeeEstimate = Array.isArray(ethFeeData[0])
    ? ethFeeData[0].reduce((acc, elem) => acc + elem)
    : ethFeeData[0];
  const insufficientEthBalance =
    typeof ethBalance === 'number' &&
    typeof ethFeeEstimate === 'number' &&
    ethBalance < ethFeeEstimate;

  const { blockchain, address, memo, coin } = swapInfo;
  const { mint, tokenName } = balanceInfo;

  if (blockchain === 'btc' && memo === null) {
    return (
      <>
        <DialogContentText>
          Native BTC can be converted to SPL {tokenName} by sending it to the
          following address:
        </DialogContentText>
        <CopyableDisplay
          value={address}
          label="Native BTC Deposit Address"
          autoFocus
          qrCode={`bitcoin:${address}`}
        />
      </>
    );
  }

  if (blockchain === 'eth') {
    return (
      <>
        <DialogContentText>
          {coin.erc20Contract ? 'ERC20' : 'Native'} {coin.ticker} can be
          converted to {mint ? 'SPL' : 'native'} {tokenName} via MetaMask. To
          convert, you must already have SOL in your wallet.
        </DialogContentText>
        <DialogContentText>
          Estimated withdrawal transaction fee:
          <EthFeeEstimate
            ethFeeData={ethFeeData}
            insufficientEthBalance={insufficientEthBalance}
          />
        </DialogContentText>
        <MetamaskDeposit
          swapInfo={swapInfo}
          insufficientEthBalance={insufficientEthBalance}
        />
      </>
    );
  }

  return null;
}

function MetamaskDeposit({ swapInfo, insufficientEthBalance }) {
  const ethAccount = useEthAccount();
  const [amount, setAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState(null);
  const callAsync = useCallAsync();

  const {
    address: swapAddress,
    memo: destination,
    coin: { erc20Contract: erc20Address, ticker },
  } = swapInfo;

  const [maxAmount, maxAmountLoaded] = useAsyncData(async () => {
    if (ethAccount) {
      return Math.min(
        await getErc20Balance(ethAccount, erc20Address),
        swapInfo.maxSize ?? Infinity,
      );
    }
    return 0;
  }, tuple(getErc20Balance, ethAccount, erc20Address));

  if (!ethAccount) {
    return <ConnectToMetamaskButton />;
  }

  async function submit() {
    setSubmitted(true);
    setStatus({ step: 0 });
    await callAsync(
      (async () => {
        let parsedAmount = parseFloat(amount);

        if (!parsedAmount || parsedAmount > maxAmount || parsedAmount <= 0) {
          throw new Error('Invalid amount');
        }
        await swapErc20ToSpl({
          ethAccount,
          erc20Address,
          swapAddress,
          destination,
          amount,
          onStatusChange: (e) => setStatus((status) => ({ ...status, ...e })),
        });
      })(),
      { onError: () => setSubmitted(false) },
    );
  }

  if (!submitted) {
    let convertButton = (
      <Button
        color="primary"
        style={{ marginLeft: 8 }}
        onClick={submit}
        disabled={insufficientEthBalance}
      >
        Convert
      </Button>
    );

    if (insufficientEthBalance) {
      convertButton = (
        <Tooltip
          title="Insufficient ETH for withdrawal transaction fee"
          placement="top"
        >
          <span>{convertButton}</span>
        </Tooltip>
      );
    }

    return (
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <TextField
          label="Amount"
          fullWidth
          variant="outlined"
          margin="normal"
          type="number"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">{ticker}</InputAdornment>
            ),
            inputProps: {
              step: 'any',
            },
          }}
          value={amount}
          onChange={(e) => setAmount(e.target.value.trim())}
          helperText={
            maxAmountLoaded ? (
              <span onClick={() => setAmount(maxAmount.toFixed(6))}>
                Max: {maxAmount.toFixed(6)}
              </span>
            ) : null
          }
        />
        {convertButton}
      </div>
    );
  }

  return (
    <>
      <Stepper activeStep={status.step}>
        <Step>
          <StepLabel>Approve Conversion</StepLabel>
        </Step>
        <Step>
          <StepLabel>Send Funds</StepLabel>
        </Step>
        <Step>
          <StepLabel>Wait for Confirmations</StepLabel>
        </Step>
      </Stepper>
      {status.step === 2 ? (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div style={{ marginRight: 16 }}>
              <CircularProgress />
            </div>
            <div>
              {status.confirms ? (
                <Typography>{status.confirms} / 12 Confirmations</Typography>
              ) : (
                <Typography>Transaction Pending</Typography>
              )}
              <Typography variant="body2">
                <Link
                  href={`https://etherscan.io/tx/${status.txid}`}
                  target="_blank"
                  rel="noopener"
                >
                  View on Etherscan
                </Link>
              </Typography>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
