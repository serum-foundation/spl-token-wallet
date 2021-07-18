import React, { useState } from 'react';
import {
  Typography,
  Paper,
  ListItemText,
  ListItem,
  List,
  Button,
  Collapse,
  ListItemIcon,
  Toolbar,
  AppBar,
  InputLabel,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@material-ui/core';
import LoadingIndicator from './LoadingIndicator';
import SendIcon from '@material-ui/icons/Send';
import { useUserDomains } from '../utils/name-service';
import { makeStyles } from '@material-ui/core/styles';
import { PublicKey, Transaction } from '@solana/web3.js';
import DnsIcon from '@material-ui/icons/Dns';
import Modal from '@material-ui/core/Modal';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import GavelIcon from '@material-ui/icons/Gavel';
import { signAndSendTransaction } from '../utils/tokens';
import { useSnackbar } from 'notistack';
import { SOL_TLD_AUTHORITY } from '../utils/name-service';
import { transferNameOwnership } from '@bonfida/spl-name-service';
import { useConnection } from '../utils/connection';
import { useWallet } from '../utils/wallet';
import { refreshCache } from '../utils/fetch-loop';
import tuple from 'immutable-tuple';

const useStyles = makeStyles((theme) => ({
  address: {
    textOverflow: 'ellipsis',
    overflowX: 'hidden',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-evenly',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  itemDetails: {
    marginLeft: theme.spacing(3),
    marginRight: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  text: {
    color: 'white',
    fontSize: 24,
    marginTop: '2%',
    marginBottom: '2%',
    opacity: 0.8,
  },
  input: {
    color: 'white',
    fontWeight: 600,
    width: 500,
  },
  transferContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  paper: {
    width: '50%',
    height: '80%',
    overflowY: 'scroll',
  },
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

const TransferDialog = ({
  domainName,
  open,
  setOpen,
}: {
  domainName: string;
  open: boolean;
  setOpen: (args: boolean) => void;
}) => {
  const classes = useStyles();
  const connection = useConnection();
  const wallet = useWallet();
  const [checked, setChecked] = useState(false);
  const [newOwner, setNewOwner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const onChange = (e) => {
    setNewOwner(e.target.value.trim());
  };
  const canSumbit = newOwner && checked;
  const onClick = async () => {
    if (!newOwner) {
      return enqueueSnackbar('Invalid input', { variant: 'error' });
    }
    let newOwnerPubkey: PublicKey;
    try {
      newOwnerPubkey = new PublicKey(newOwner);
    } catch {
      return enqueueSnackbar('Invalid input', { variant: 'error' });
    }
    try {
      setLoading(true);
      const instructions = await transferNameOwnership(
        connection,
        domainName,
        newOwnerPubkey,
        undefined,
        SOL_TLD_AUTHORITY,
      );
      await signAndSendTransaction(
        connection,
        new Transaction().add(instructions),
        wallet,
        [],
      );
      enqueueSnackbar('Domain name transfered', { variant: 'success' });
      setOpen(false);
    } catch (err) {
      console.warn(`Error transferring domain name ${err}`);
      return enqueueSnackbar('Error transferring domain name', {
        variant: 'error',
      });
    } finally {
      refreshCache(tuple('useUserDomain', wallet?.publicKey?.toBase58()));
      setLoading(false);
    }
  };
  return (
    <Modal
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      open={open}
      onClose={() => setOpen(false)}
    >
      <Paper>
        <AppBar position="sticky" elevation={1}>
          <Toolbar>
            <Typography variant="h6" style={{ flexGrow: 1 }} component="h2">
              Ownership transfer
            </Typography>
          </Toolbar>
        </AppBar>
        <div className={classes.transferContainer}>
          <div>
            <InputLabel className={classes.text} shrink>
              New Owner
            </InputLabel>
            <TextField
              placeholder="New owner"
              InputProps={{
                className: classes.input,
              }}
              value={newOwner}
              onChange={onChange}
            />
          </div>
          <FormControlLabel
            control={
              <Checkbox
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2">
                I understand that transferring ownership is irreversible
              </Typography>
            }
          />
          <Button
            onClick={onClick}
            disabled={!canSumbit || loading}
            variant="outlined"
            color="primary"
            style={{ padding: 10 }}
          >
            {loading ? <LoadingIndicator height="10px" /> : 'Transfer'}
          </Button>
        </div>
      </Paper>
    </Modal>
  );
};

const DomainListItemDetails = ({ domainName }: { domainName: string }) => {
  const classes = useStyles();
  const [transferVisible, setTransferVisible] = useState(false);
  return (
    <>
      <div className={classes.buttonContainer}>
        <Button
          onClick={() => setTransferVisible(true)}
          startIcon={<SendIcon />}
          variant="outlined"
          color="primary"
        >
          Transfer
        </Button>
        <TransferDialog
          domainName={domainName}
          open={transferVisible}
          setOpen={setTransferVisible}
        />
        <Button
          onClick={() =>
            window.open(
              `https://naming.bonfida.org/#/domain-registration/${domainName}`,
              '_blank',
            )
          }
          startIcon={<GavelIcon />}
          variant="outlined"
          color="secondary"
        >
          Sell
        </Button>
      </div>
    </>
  );
};

const DomainListItem = ({
  domainName,
  domainKey,
}: {
  domainName: string;
  domainKey: PublicKey;
}) => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  return (
    <>
      <ListItem onClick={() => setOpen((prev) => !prev)}>
        <ListItemIcon>
          <DnsIcon />
        </ListItemIcon>
        <ListItemText
          primary={`${domainName}.sol`}
          secondary={domainKey.toBase58()}
          secondaryTypographyProps={{ className: classes.address }}
        />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <DomainListItemDetails domainName={domainName} />
      </Collapse>
    </>
  );
};

const DomainsList = () => {
  const [userDomains, userDomainsLoaded] = useUserDomains();
  if (!userDomainsLoaded) {
    return <LoadingIndicator />;
  }
  if (userDomainsLoaded && userDomains?.length === 0) {
    return (
      <Typography variant="body1" align="center">
        You don't own any domain
      </Typography>
    );
  }
  return (
    <>
      <List>
        {userDomains?.map((d) => {
          return (
            <DomainListItem
              key={d.nameKey.toBase58()}
              domainName={d.name}
              domainKey={d.nameKey}
            />
          );
        })}
      </List>
    </>
  );
};

const DomainDialog = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (arg: boolean) => void;
}) => {
  const classes = useStyles();
  return (
    <Modal open={open} onClose={() => setOpen(false)} className={classes.modal}>
      <Paper className={classes.paper}>
        <AppBar position="sticky" color="default" elevation={1}>
          <Toolbar>
            <Typography variant="h6" style={{ flexGrow: 1 }} component="h2">
              Your domains
            </Typography>
          </Toolbar>
        </AppBar>
        <DomainsList />
      </Paper>
    </Modal>
  );
};

export default DomainDialog;
