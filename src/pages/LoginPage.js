import React, { useEffect, useState } from 'react';
import {
  generateMnemonicAndSeed,
  useHasLockedMnemonicAndSeed,
  loadMnemonicAndSeed,
  mnemonicToSeed,
  storeMnemonicAndSeed,
  normalizeMnemonic,
} from '../utils/wallet-seed';
import {
  getAccountFromSeed,
  DERIVATION_PATH,
} from '../utils/walletProvider/localStorage.js';
import Container from '@material-ui/core/Container';
import LoadingIndicator from '../components/LoadingIndicator';
import { BalanceListItem } from '../components/BalancesList.js';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import { DialogActions, DialogContentText, DialogTitle, Typography } from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import Checkbox from '@material-ui/core/Checkbox';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { useCallAsync } from '../utils/notifications';
import Link from '@material-ui/core/Link';
import { validateMnemonic } from 'bip39';
import DialogForm from '../components/DialogForm';

export default function LoginPage() {
  const [restore, setRestore] = useState(false);
  const [hasLockedMnemonicAndSeed, loading] = useHasLockedMnemonicAndSeed();

  if (loading) {
    return null;
  }

  return (
    <Container maxWidth="sm">
      {restore ? (
        <RestoreWalletForm goBack={() => setRestore(false)} />
      ) : (
        <>
          {hasLockedMnemonicAndSeed ? <LoginForm /> : <CreateWalletForm />}
          <br />
          <Link style={{ cursor: 'pointer' }} onClick={() => setRestore(true)}>
            Restore existing wallet
          </Link>
        </>
      )}
    </Container>
  );
}

function CreateWalletForm() {
  const [mnemonicAndSeed, setMnemonicAndSeed] = useState(null);
  useEffect(() => {
    generateMnemonicAndSeed().then(setMnemonicAndSeed);
  }, []);
  const [savedWords, setSavedWords] = useState(false);
  const callAsync = useCallAsync();

  function submit(password) {
    const { mnemonic, seed } = mnemonicAndSeed;
    callAsync(
      storeMnemonicAndSeed(
        mnemonic,
        seed,
        password,
        DERIVATION_PATH.bip44Change,
      ),
      {
        progressMessage: 'Creating wallet...',
        successMessage: 'Wallet created',
      },
    );
  }

  if (!savedWords) {
    return (
      <SeedWordsForm
        mnemonicAndSeed={mnemonicAndSeed}
        goForward={() => setSavedWords(true)}
      />
    );
  }

  return (
    <ChoosePasswordForm
      mnemonicAndSeed={mnemonicAndSeed}
      goBack={() => setSavedWords(false)}
      onSubmit={submit}
    />
  );
}

function SeedWordsForm({ mnemonicAndSeed, goForward }) {
  const [confirmed, setConfirmed] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [seedCheck, setSeedCheck] = useState('');

  const downloadMnemonic = (mnemonic) => {
    const url = window.URL.createObjectURL(new Blob([mnemonic]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sollet.bak');
    document.body.appendChild(link);
    link.click();
  }

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Create New Wallet
          </Typography>
          <Typography paragraph>
            Create a new wallet to hold Solana and SPL tokens.
          </Typography>
          <Typography>
            Please write down the following twenty four words and keep them in a
            safe place:
          </Typography>
          {mnemonicAndSeed ? (
            <TextField
              variant="outlined"
              fullWidth
              multiline
              margin="normal"
              value={mnemonicAndSeed.mnemonic}
              label="Seed Words"
              onFocus={(e) => e.currentTarget.select()}
            />
          ) : (
            <LoadingIndicator />
          )}
          <Typography paragraph>
            Your private keys are only stored on your current computer or device.
            You will need these words to restore your wallet if your browser's
            storage is cleared or your device is damaged or lost.
          </Typography>
          <Typography paragraph>
            By default, sollet will use <code>m/44'/501'/0'/0'</code> as the
            derivation path for the main wallet. To use an alternative path, try
            restoring an existing wallet.
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={confirmed}
                disabled={!mnemonicAndSeed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
            }
            label="I have saved these words in a safe place."
          />
          <Typography paragraph>
          <Button variant="contained" color="primary" style={{ marginTop: 20 }} onClick={() => {
            downloadMnemonic(mnemonicAndSeed?.mnemonic);
            setDownloaded(true);
          }}>
            Download Backup Mnemonic File (Required)
          </Button>
          </Typography>
        </CardContent>
        <CardActions style={{ justifyContent: 'flex-end' }}>
          <Button color="primary" disabled={!confirmed || !downloaded} onClick={() => setShowDialog(true)}>
            Continue
          </Button>
        </CardActions>
      </Card>
      <DialogForm
        open={showDialog}
        onClose={() => setShowDialog(false)}
        onSubmit={goForward}
        fullWidth
      >
        <DialogTitle>{'Confirm Mnemonic'}</DialogTitle>
        <DialogContentText style={{ margin: 20 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            Please re-enter your seed phrase to confirm that you have saved it.
          </div>
          <TextField
            label={`Please type your seed phrase to confirm`}
            fullWidth
            variant="outlined"
            margin="normal"
            value={seedCheck}
            onChange={(e) => setSeedCheck(e.target.value)}
          />
        </DialogContentText>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>Close</Button>
          <Button
            type="submit"
            color="secondary"
            disabled={normalizeMnemonic(seedCheck) !== mnemonicAndSeed?.mnemonic}
          >
            Continue
          </Button>
        </DialogActions>
      </DialogForm>
    </>
  );
}

function ChoosePasswordForm({ goBack, onSubmit }) {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Choose a Password (Optional)
        </Typography>
        <Typography>
          Optionally pick a password to protect your wallet.
        </Typography>
        <TextField
          variant="outlined"
          fullWidth
          margin="normal"
          label="New Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          variant="outlined"
          fullWidth
          margin="normal"
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
        />
        <Typography>
          If you forget your password you will need to restore your wallet using
          your seed words.
        </Typography>
      </CardContent>
      <CardActions style={{ justifyContent: 'space-between' }}>
        <Button onClick={goBack}>Back</Button>
        <Button
          color="primary"
          disabled={password !== passwordConfirm}
          onClick={() => onSubmit(password)}
        >
          Create Wallet
        </Button>
      </CardActions>
    </Card>
  );
}

function LoginForm() {
  const [password, setPassword] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const callAsync = useCallAsync();

  const submit = () => {
    callAsync(loadMnemonicAndSeed(password, stayLoggedIn), {
      progressMessage: 'Unlocking wallet...',
      successMessage: 'Wallet unlocked',
    });
  }
  const submitOnEnter = (e) => {
    if (e.code === "Enter" || e.code === "NumpadEnter") {
      e.preventDefault();
      e.stopPropagation();
      submit();
    }
  }
  const setPasswordOnChange = (e) => setPassword(e.target.value);
  const toggleStayLoggedIn = (e) => setStayLoggedIn(e.target.checked);

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Unlock Wallet
        </Typography>
        <TextField
          variant="outlined"
          fullWidth
          margin="normal"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPasswordOnChange}
          onKeyDown={submitOnEnter}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={stayLoggedIn}
              onChange={toggleStayLoggedIn}
            />
          }
          label="Keep wallet unlocked"
        />
      </CardContent>
      <CardActions style={{ justifyContent: 'flex-end' }}>
        <Button color="primary" onClick={submit}>
          Unlock
        </Button>
      </CardActions>
    </Card>
  );
}

function RestoreWalletForm({ goBack }) {
  const [rawMnemonic, setRawMnemonic] = useState('');
  const [seed, setSeed] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [next, setNext] = useState(false);

  const mnemonic = normalizeMnemonic(rawMnemonic);
  const isNextBtnEnabled =
    password === passwordConfirm && validateMnemonic(mnemonic);
  const displayInvalidMnemonic = validateMnemonic(mnemonic) === false && mnemonic.length > 0;
  return (
    <>
      {next ? (
        <DerivedAccounts
          goBack={() => setNext(false)}
          mnemonic={mnemonic}
          password={password}
          seed={seed}
        />
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Restore Existing Wallet
            </Typography>
            <Typography>
              Restore your wallet using your twelve or twenty-four seed words.
              Note that this will delete any existing wallet on this device.
            </Typography>
            <br />
            <Typography fontWeight="fontWeightBold">
              <b>Do not enter your hardware wallet seedphrase here.</b> Hardware
              wallets can be optionally connected after a web wallet is created.
            </Typography>
            {displayInvalidMnemonic && (
               <Typography fontWeight="fontWeightBold" style={{ color: 'red' }}>
                 Mnemonic validation failed. Please enter a valid BIP 39 seed phrase.
               </Typography>
            )}
            <TextField
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              margin="normal"
              label="Seed Words"
              value={rawMnemonic}
              onChange={(e) => setRawMnemonic(e.target.value)}
            />
            <TextField
              variant="outlined"
              fullWidth
              margin="normal"
              label="New Password (Optional)"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              variant="outlined"
              fullWidth
              margin="normal"
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          </CardContent>
          <CardActions style={{ justifyContent: 'space-between' }}>
            <Button onClick={goBack}>Cancel</Button>
            <Button
              color="primary"
              disabled={!isNextBtnEnabled}
              onClick={() => {
                mnemonicToSeed(mnemonic).then((seed) => {
                  setSeed(seed);
                  setNext(true);
                });
              }}
            >
              Next
            </Button>
          </CardActions>
        </Card>
      )}
    </>
  );
}

function DerivedAccounts({ goBack, mnemonic, seed, password }) {
  const callAsync = useCallAsync();
  const [dPathMenuItem, setDPathMenuItem] = useState(
    DerivationPathMenuItem.Bip44Change,
  );
  const accounts = [...Array(10)].map((_, idx) => {
    return getAccountFromSeed(
      Buffer.from(seed, 'hex'),
      idx,
      toDerivationPath(dPathMenuItem),
    );
  });

  function submit() {
    callAsync(
      storeMnemonicAndSeed(
        mnemonic,
        seed,
        password,
        toDerivationPath(dPathMenuItem),
      ),
    );
  }

  return (
    <Card>
      <AccountsSelector
        showDeprecated={true}
        accounts={accounts}
        dPathMenuItem={dPathMenuItem}
        setDPathMenuItem={setDPathMenuItem}
      />
      <CardActions style={{ justifyContent: 'space-between' }}>
        <Button onClick={goBack}>Back</Button>
        <Button color="primary" onClick={submit}>
          Restore
        </Button>
      </CardActions>
    </Card>
  );
}

export function AccountsSelector({
  showRoot,
  showDeprecated,
  accounts,
  dPathMenuItem,
  setDPathMenuItem,
  onClick,
}) {
  return (
    <CardContent>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h5" gutterBottom>
          Derivable Accounts
        </Typography>
        <FormControl variant="outlined">
          <Select
            value={dPathMenuItem}
            onChange={(e) => {
              setDPathMenuItem(e.target.value);
            }}
          >
            {showRoot && (
              <MenuItem value={DerivationPathMenuItem.Bip44Root}>
                {`m/44'/501'`}
              </MenuItem>
            )}
            <MenuItem value={DerivationPathMenuItem.Bip44}>
              {`m/44'/501'/0'`}
            </MenuItem>
            <MenuItem value={DerivationPathMenuItem.Bip44Change}>
              {`m/44'/501'/0'/0'`}
            </MenuItem>
            {showDeprecated && (
              <MenuItem value={DerivationPathMenuItem.Deprecated}>
                {`m/501'/0'/0/0 (deprecated)`}
              </MenuItem>
            )}
          </Select>
        </FormControl>
      </div>
      {accounts.map((acc) => {
        return (
          <div onClick={onClick ? () => onClick(acc) : {}}>
            <BalanceListItem
              key={acc.publicKey.toString()}
              onClick={onClick}
              publicKey={acc.publicKey}
              expandable={false}
            />
          </div>
        );
      })}
    </CardContent>
  );
}

// Material UI's Select doesn't render properly when using an `undefined` value,
// so we define this type and the subsequent `toDerivationPath` translator as a
// workaround.
//
// DERIVATION_PATH.deprecated is always undefined.
export const DerivationPathMenuItem = {
  Deprecated: 0,
  Bip44: 1,
  Bip44Change: 2,
  Bip44Root: 3, // Ledger only.
};

export function toDerivationPath(dPathMenuItem) {
  switch (dPathMenuItem) {
    case DerivationPathMenuItem.Deprecated:
      return DERIVATION_PATH.deprecated;
    case DerivationPathMenuItem.Bip44:
      return DERIVATION_PATH.bip44;
    case DerivationPathMenuItem.Bip44Change:
      return DERIVATION_PATH.bip44Change;
    case DerivationPathMenuItem.Bip44Root:
      return DERIVATION_PATH.bip44Root;
    default:
      throw new Error(`invalid derivation path: ${dPathMenuItem}`);
  }
}
