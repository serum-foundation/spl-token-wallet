import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogForm from './DialogForm';
import TextField from '@material-ui/core/TextField';
import FormHelperText from '@material-ui/core/FormHelperText';

export default function CustomEndpointsDialog({
  customEndpoints,
  open,
  onAdd,
  onRemove,
  onClose,
}) {
  const [userInput, setUserInput] = useState('');
  const [hasError, setHasError] = useState(false);

  return (
    <DialogForm
      open={open}
      onEnter={() => {}}
      onClose={() => {
        onClose();
      }}
      fullWidth
    >
      <DialogTitle>Manage Custom Endpoints</DialogTitle>
      <DialogContent>
        <div
          style={{
            width: 'fit-content',
            marginBottom: '8px',
            maxWidth: '100%',
          }}
        >
          {customEndpoints.map((endpoint) => {
            return (
              <div
                key={endpoint}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                {endpoint}{' '}
                <Button
                  color="primary"
                  onClick={() => onRemove(endpoint)}
                  style={{ marginLeft: '8px' }}
                >
                  Remove
                </Button>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', paddingTop: '16px' }}>
          <TextField
            error={hasError}
            label="Custom Endpoint"
            fullWidth
            variant="outlined"
            placeholder="e.g. https://solana-api.projectserum.com"
            value={userInput}
            onChange={(e) => {
              setUserInput(e.target.value);
              setHasError(false);
            }}
            style={{ marginRight: '16px' }}
          />
          <Button
            type="submit"
            color="primary"
            onClick={() => {
              const valid = userInput.match(/^(http|https):\/\//);
              if (!valid) {
                setHasError(true);
              } else {
                onAdd(userInput);
                setUserInput('');
              }
            }}
          >
            Add
          </Button>
        </div>
        {hasError && (
          <FormHelperText error>
            Endpoint must start with http:// or https://
          </FormHelperText>
        )}

        <div
          style={{
            padding: '16px 0 4px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Button
            onClick={() => {
              setUserInput('');
              onClose();
            }}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </DialogForm>
  );
}
