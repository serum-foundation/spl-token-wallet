import React, { useState } from 'react';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Switch from '@material-ui/core/Switch';
import { decodeAccount } from '../utils/utils';
import DialogForm from './DialogForm';

export default function AddAccountDialog({ open, onAdd, onClose }) {
  const [name, setName] = useState('');
  const [isImport, setIsImport] = useState(false);
  const [importedPrivateKey, setPrivateKey] = useState('');

  const importedAccount = isImport
    ? decodeAccount(importedPrivateKey)
    : undefined;
  const isAddEnabled = isImport ? name && importedAccount !== undefined : name;

  return (
    <DialogForm
      open={open}
      onEnter={() => {
        setName('');
        setIsImport(false);
        setPrivateKey('');
      }}
      onClose={onClose}
      onSubmit={() => onAdd({ name, importedAccount })}
      fullWidth
    >
      <DialogTitle>Add account</DialogTitle>
      <DialogContent style={{ paddingTop: 16 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <TextField
            label="Name"
            fullWidth
            variant="outlined"
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value.trim())}
          />
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={isImport}
                  onChange={() => setIsImport(!isImport)}
                />
              }
              label="Import private key"
            />
          </FormGroup>
          {isImport && (
            <TextField
              label="Paste your private key here"
              fullWidth
              type="password"
              value={importedPrivateKey}
              variant="outlined"
              margin="normal"
              onChange={(e) => setPrivateKey(e.target.value.trim())}
            />
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button type="submit" color="primary" disabled={!isAddEnabled}>
          Add
        </Button>
      </DialogActions>
    </DialogForm>
  );
}
