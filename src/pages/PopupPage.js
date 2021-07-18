import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useWallet, useWalletSelector } from '../utils/wallet';
import { PublicKey } from '@solana/web3.js';
import {
  Divider,
  FormControlLabel,
  SnackbarContent,
  Switch,
  Typography,
} from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import ImportExportIcon from '@material-ui/icons/ImportExport';
import { makeStyles } from '@material-ui/core/styles';
import assert from 'assert';
import bs58 from 'bs58';
import WarningIcon from '@material-ui/icons/Warning';
import { useLocalStorageState, isExtension } from '../utils/utils';
import SignTransactionFormContent from '../components/SignTransactionFormContent';
import SignFormContent from '../components/SignFormContent';

function getInitialRequests() {
  if (!isExtension) {
    return [];
  }

  // TODO CHECK OPENER (?)

  const urlParams = new URLSearchParams(window.location.hash.slice(1));
  const request = JSON.parse(urlParams.get('request'));
  
  if (request.method === 'sign') {
    const dataObj = request.params.data;
    // Deserialize `data` into a Uint8Array
    if (!dataObj) {
      throw new Error('Missing "data" params for "sign" request');
    }

    const data = new Uint8Array(Object.keys(dataObj).length);
    for (const [index, value] of Object.entries(dataObj)) {
      data[index] = value;
    }
    request.params.data = data;
  }

  return [request];
}

export default function PopupPage({ opener }) {
  const origin = useMemo(() => {
    let params = new URLSearchParams(window.location.hash.slice(1));
    return params.get('origin');
  }, []);
  const selectedWallet = useWallet();
  const selectedWalletAddress = selectedWallet && selectedWallet.publicKey.toBase58();
  const { accounts, setWalletSelector } = useWalletSelector();
  const [wallet, setWallet] = useState(isExtension ? null : selectedWallet);

  const [connectedAccount, setConnectedAccount] = useState(null);
  const hasConnectedAccount = !!connectedAccount;
  const [requests, setRequests] = useState(getInitialRequests);
  const [autoApprove, setAutoApprove] = useState(false);
  const postMessage = useCallback(
    (message) => {
      if (isExtension) {
        chrome.runtime.sendMessage({
          channel: 'sollet_extension_background_channel',
          data: message,
        });
      } else {
        opener.postMessage({ jsonrpc: '2.0', ...message }, origin);
      }
    },
    [opener, origin],
  );

  // Keep selectedWallet and wallet in sync.
  useEffect(() => {
    if (!isExtension) {
      setWallet(selectedWallet);
    }
  // using stronger condition here
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWalletAddress]);


  // (Extension only) Fetch connected wallet for site from local storage.
  useEffect(() => {
    if (isExtension) {
      chrome.storage.local.get('connectedWallets', (result) => {
        const connectedWallet = (result.connectedWallets || {})[origin];
        if (connectedWallet) {
          setWalletSelector(connectedWallet.selector);
          setConnectedAccount(new PublicKey(connectedWallet.publicKey));
          setAutoApprove(connectedWallet.autoApprove);
        } else {
          setConnectedAccount(selectedWallet.publicKey);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin]);

  // (Extension only) Set wallet once connectedWallet is retrieved.
  useEffect(() => {
    if (isExtension && connectedAccount) {
      setWallet(selectedWallet);
    }
  // using stronger condition here
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAccount, selectedWalletAddress]);

  // Send a disconnect event if this window is closed, this component is
  // unmounted, or setConnectedAccount(null) is called.
  useEffect(() => {
    if (hasConnectedAccount && !isExtension) {
      function unloadHandler() {
        postMessage({ method: 'disconnected' });
      }
      window.addEventListener('beforeunload', unloadHandler);
      return () => {
        unloadHandler();
        window.removeEventListener('beforeunload', unloadHandler);
      };
    }
  }, [hasConnectedAccount, postMessage, origin]);

  // Disconnect if the user switches to a different wallet.
  useEffect(() => {
    if (
      !isExtension &&
      wallet &&
      connectedAccount &&
      !connectedAccount.equals(wallet.publicKey)
    ) {
      setConnectedAccount(null);
    }
  }, [connectedAccount, wallet]);

  // Push requests from the parent window into a queue.
  useEffect(() => {
    function messageHandler(e) {
      if (e.origin === origin && e.source === window.opener) {
        if (
          e.data.method !== 'signTransaction' &&
          e.data.method !== 'signAllTransactions' &&
          e.data.method !== 'sign'
        ) {
          postMessage({ error: 'Unsupported method', id: e.data.id });
        }

        setRequests((requests) => [...requests, e.data]);
      }
    }
    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, [origin, postMessage]);

  const request = requests[0];
  const popRequest = () => setRequests((requests) => requests.slice(1));

  const { messages, messageDisplay } = useMemo(() => {
    if (!request || request.method === 'connect') {
      return { messages: [], messageDisplay: 'tx' }
    }
    switch (request.method) {
      case 'signTransaction':
        return {
          messages: [bs58.decode(request.params.message)],
          messageDisplay: 'tx',
        };
      case 'signAllTransactions':
        return {
          messages: request.params.messages.map((m) => bs58.decode(m)),
          messageDisplay: 'tx',
        };
      case 'sign':
        if (!(request.params.data instanceof Uint8Array)) {
          throw new Error('Data must be an instance of Uint8Array');
        }
        return {
          messages: [request.params.data],
          messageDisplay: request.params.display === 'utf8' ? 'utf8' : 'hex',
        }
      default:
        throw new Error('Unexpected method: ' + request.method);
    }
  }, [request]);

  if (hasConnectedAccount && requests.length === 0) {
    if (isExtension) {
      window.close();
    } else {
      focusParent();
    }

    return (
      <Typography>
        {isExtension
          ? 'Submitting...'
          : 'Please keep this window open in the background.'}
      </Typography>
    );
  }

  if (!wallet) {
    return <Typography>Loading wallet...</Typography>;
  }

  const mustConnect =
    !connectedAccount || !connectedAccount.equals(wallet.publicKey);
  // We must detect when to show the connection form on the website as it is not sent as a request.
  if (
    (isExtension && request.method === 'connect') ||
    (!isExtension && mustConnect)
  ) {
    // Approve the parent page to connect to this wallet.
    function connect(autoApprove) {
      setConnectedAccount(wallet.publicKey);
      if (isExtension) {
        chrome.storage.local.get('connectedWallets', (result) => {
          // TODO better way to do this
          const account = accounts.find((account) =>
            account.address.equals(wallet.publicKey),
          );
          const connectedWallets = {
            ...(result.connectedWallets || {}),
            [origin]: {
              publicKey: wallet.publicKey.toBase58(),
              selector: account.selector,
              autoApprove,
            },
          };
          chrome.storage.local.set({ connectedWallets });
        });
      }
      postMessage({
        method: 'connected',
        params: { publicKey: wallet.publicKey.toBase58(), autoApprove },
        id: isExtension ? request.id : undefined,
      });
      setAutoApprove(autoApprove);
      if (!isExtension) {
        focusParent();
      } else {
        popRequest();
      }
    }

    return <ApproveConnectionForm origin={origin} onApprove={connect} />;
  }

  assert(
    (request.method === 'signTransaction' ||
      request.method === 'signAllTransactions' ||
      request.method === 'sign') &&
      wallet,
  );

  async function onApprove() {
    popRequest();
    switch (request.method) {
      case 'signTransaction':
      case 'sign':
        sendSignature(messages[0]);
        break;
      case 'signAllTransactions':
        sendAllSignatures(messages);
        break;
      default:
        throw new Error('Unexpected method: ' + request.method);
    }
  }

  async function sendSignature(message) {
    postMessage({
      result: {
        signature: await wallet.createSignature(message),
        publicKey: wallet.publicKey.toBase58(),
      },
      id: request.id,
    });
  }

  async function sendAllSignatures(messages) {
    let signatures;
    // Ledger must sign one by one.
    if (wallet.type === 'ledger') {
      signatures = [];
      for (let k = 0; k < messages.length; k += 1) {
        signatures.push(await wallet.createSignature(messages[k]));
      }
    } else {
      signatures = await Promise.all(
        messages.map((m) => wallet.createSignature(m)),
      );
    }
    postMessage({
      result: {
        signatures,
        publicKey: wallet.publicKey.toBase58(),
      },
      id: request.id,
    });
  }

  function sendReject() {
    popRequest();
    postMessage({
      error: 'Transaction cancelled',
      id: request.id,
    });
  }

  return (
    <ApproveSignatureForm
      key={request.id}
      autoApprove={autoApprove}
      origin={origin}
      messages={messages}
      messageDisplay={messageDisplay}
      onApprove={onApprove}
      onReject={sendReject}
    />
  );
}

/**
 * Switch focus to the parent window. This requires that the parent runs
 * `window.name = 'parent'` before opening the popup.
 */
function focusParent() {
  try {
    window.open('', 'parent');
  } catch (err) {
    console.log('err', err);
  }
}

const useStyles = makeStyles((theme) => ({
  connection: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    textAlign: 'center',
  },
  transaction: {
    wordBreak: 'break-all',
  },
  approveButton: {
    backgroundColor: '#43a047',
    color: 'white',
  },
  actions: {
    justifyContent: 'space-between',
  },
  snackbarRoot: {
    backgroundColor: theme.palette.background.paper,
  },
  warningMessage: {
    margin: theme.spacing(1),
    color: theme.palette.text.primary,
  },
  warningIcon: {
    marginRight: theme.spacing(1),
    fontSize: 24,
  },
  warningTitle: {
    color: theme.palette.warning.light,
    fontWeight: 600,
    fontSize: 16,
    alignItems: 'center',
    display: 'flex',
  },
  warningContainer: {
    marginTop: theme.spacing(1),
  },
  divider: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
}));

function ApproveConnectionForm({ origin, onApprove }) {
  const wallet = useWallet();
  const { accounts, hardwareWalletAccount } = useWalletSelector();
  // TODO better way to do this
  const account = accounts
    .concat([hardwareWalletAccount])
    .find((account) => account && account.address.equals(wallet.publicKey));
  const classes = useStyles();
  const [autoApprove, setAutoApprove] = useState(false);
  let [dismissed, setDismissed] = useLocalStorageState(
    'dismissedAutoApproveWarning',
    false,
  );
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="h1" gutterBottom>
          Allow this site to access your Solana account?
        </Typography>
        <div className={classes.connection}>
          <Typography>{origin}</Typography>
          <ImportExportIcon fontSize="large" />
          <Typography>{account.name}</Typography>
          <Typography variant="caption">
            ({wallet.publicKey.toBase58()})
          </Typography>
        </div>
        <Typography>Only connect with sites you trust.</Typography>
        <Divider className={classes.divider} />
        <FormControlLabel
          control={
            <Switch
              checked={autoApprove}
              onChange={() => setAutoApprove(!autoApprove)}
              color="primary"
            />
          }
          label={`Automatically approve transactions from ${origin}`}
        />
        {!dismissed && autoApprove && (
          <SnackbarContent
            className={classes.warningContainer}
            message={
              <div>
                <span className={classes.warningTitle}>
                  <WarningIcon className={classes.warningIcon} />
                  Use at your own risk.
                </span>
                <Typography className={classes.warningMessage}>
                  This setting allows sending some transactions on your behalf
                  without requesting your permission for the remainder of this
                  session.
                </Typography>
              </div>
            }
            action={[
              <Button onClick={() => setDismissed('1')}>I understand</Button>,
            ]}
            classes={{ root: classes.snackbarRoot }}
          />
        )}
      </CardContent>
      <CardActions className={classes.actions}>
        <Button onClick={window.close}>Cancel</Button>
        <Button
          color="primary"
          onClick={() => onApprove(autoApprove)}
          disabled={!dismissed && autoApprove}
        >
          Connect
        </Button>
      </CardActions>
    </Card>
  );
}

function ApproveSignatureForm({
  origin,
  messages,
  messageDisplay,
  onApprove,
  onReject,
  autoApprove,
}) {
  const classes = useStyles();
  const buttonRef = useRef();

  const isMultiTx = messageDisplay === 'tx' && messages.length > 1;

  const renderFormContent = () => {
    if (messageDisplay === 'tx') {
      return (
        <SignTransactionFormContent
          autoApprove={autoApprove}
          origin={origin}
          messages={messages}
          onApprove={onApprove}
          buttonRef={buttonRef}
        />
      );
    } else {
      return (
        <SignFormContent
          origin={origin}
          message={messages[0]}
          messageDisplay={messageDisplay}
          buttonRef={buttonRef}
        />
      );
    }
  };

  return (
    <Card>
      {renderFormContent()}
      <CardActions className={classes.actions}>
        <Button onClick={onReject}>Cancel</Button>
        <Button
          ref={buttonRef}
          className={classes.approveButton}
          variant="contained"
          color="primary"
          onClick={onApprove}
        >
          Approve{isMultiTx ? ' All' : ''}
        </Button>
      </CardActions>
    </Card>
  );
}
