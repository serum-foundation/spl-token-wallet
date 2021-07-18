import React, { useState } from 'react';
import {
  AppBar,
  Button,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
  Paper,
  Toolbar,
  Typography,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import { DoneAll, ExpandLess, ExpandMore } from '@material-ui/icons';
import { useConnectedWallets } from '../utils/connected-wallets';
import { useIsExtensionWidth } from '../utils/utils';
import { useWalletSelector } from '../utils/wallet';

export default function ConnectionsList() {
  const isExtensionWidth = useIsExtensionWidth();
  const connectedWallets = useConnectedWallets();

  return (
    <Paper>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography
            variant="h6"
            style={{ flexGrow: 1, fontSize: isExtensionWidth && '1rem' }}
            component="h2"
          >
            Connected Dapps
          </Typography>
        </Toolbar>
      </AppBar>
      <List disablePadding>
        {Object.entries(connectedWallets).map(([origin, connectedWallet]) => (
          <ConnectionsListItem
            origin={origin}
            connectedWallet={connectedWallet}
            key={origin}
          />
        ))}
      </List>
    </Paper>
  );
}

const ICON_SIZE = 28;
const IMAGE_SIZE = 24;

const useStyles = makeStyles((theme) => ({
  itemDetails: {
    marginLeft: theme.spacing(3),
    marginRight: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-evenly',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  listItemIcon: {
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: ICON_SIZE,
    width: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
  },
  listItemImage: {
    height: IMAGE_SIZE,
    width: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
  },
}));

function ConnectionsListItem({ origin, connectedWallet }) {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  // TODO better way to get high res icon?
  const appleIconUrl = origin + '/apple-touch-icon.png';
  const faviconUrl = origin + '/favicon.ico';
  const [iconUrl, setIconUrl] = useState(appleIconUrl);
  const { accounts } = useWalletSelector();
  // TODO better way to do this
  const account = accounts.find(
    (account) => account.address.toBase58() === connectedWallet.publicKey,
  );

  const setAutoApprove = (autoApprove) => {
    chrome.storage.local.get('connectedWallets', (result) => {
      result.connectedWallets[origin].autoApprove = autoApprove;
      chrome.storage.local.set({ connectedWallets: result.connectedWallets });
    });
  };

  const disconnectWallet = () => {
    chrome.storage.local.get('connectedWallets', (result) => {
      delete result.connectedWallets[origin];
      chrome.storage.local.set({ connectedWallets: result.connectedWallets });
    });
  };

  return (
    <>
      <ListItem button onClick={() => setOpen((open) => !open)}>
        <ListItemIcon>
          <div className={classes.listItemIcon}>
            <img
              src={iconUrl}
              onError={() => setIconUrl(faviconUrl)}
              className={classes.listItemImage}
              alt=""
            />
          </div>
        </ListItemIcon>
        <div style={{ display: 'flex', flex: 1 }}>
          <ListItemText primary={origin} secondary={account.name} />
        </div>
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <div class={classes.itemDetails}>
          <div class={classes.buttonContainer}>
            <Button
              variant={connectedWallet.autoApprove ? 'contained' : 'outlined'}
              color="primary"
              size="small"
              startIcon={<DoneAll />}
              onClick={() => setAutoApprove(!connectedWallet.autoApprove)}
            >
              {connectedWallet.autoApprove ? 'Auto-Approved' : 'Auto-Approve'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={disconnectWallet}
            >
              Disconnect
            </Button>
          </div>
        </div>
      </Collapse>
    </>
  );
}
