import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import DialogForm from './DialogForm';
import { useWallet } from '../utils/wallet';
import { useUnlockedMnemonicAndSeed } from '../utils/wallet-seed';

export default function ExportAccountDialog({ open, onClose }) {
  const wallet = useWallet();
  const [isHidden, setIsHidden] = useState(true);
  const keyOutput = `[${Array.from(wallet.provider.account.secretKey)}]`;
  return (
    <DialogForm open={open} onClose={onClose} fullWidth>
      <DialogTitle>Export account</DialogTitle>
      <DialogContent>
        <TextField
          label="Private key"
          fullWidth
          type={isHidden && 'password'}
          variant="outlined"
          margin="normal"
          value={keyOutput}
        />
        <FormControlLabel
          control={
            <Switch
              checked={!isHidden}
              onChange={() => setIsHidden(!isHidden)}
            />
          }
          label="Reveal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </DialogForm>
  );
}

export function ExportMnemonicDialog({ open, onClose }) {
  const [isHidden, setIsHidden] = useState(true);
  const [mnemKey] = useUnlockedMnemonicAndSeed();
  return (
    <DialogForm open={open} onClose={onClose} fullWidth>
      <DialogTitle>Export mnemonic</DialogTitle>
      <DialogContent>
        <TextField
          label="Mnemonic"
          fullWidth
          type={isHidden && 'password'}
          variant="outlined"
          margin="normal"
          value={mnemKey.mnemonic}
        />
        <FormControlLabel
          control={
            <Switch
              checked={!isHidden}
              onChange={() => setIsHidden(!isHidden)}
            />
          }
          label="Reveal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </DialogForm>
  );
}
