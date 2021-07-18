import React from 'react';
import Typography from '@material-ui/core/Typography';
import LabelValue from './LabelValue';

const TYPE_LABELS = {
  stakeAuthorizeWithSeed: 'Stake authorize with seed',
  stakeAuthorize: 'Stake authorize',
  stakeDeactivate: 'Deactivate stake',
  stakeDelegate: 'Delegate stake',
  stakeInitialize: 'Initialize stake',
  stakeSplit: 'Split stake',
  stakeWithdraw: 'Withdraw stake',
};

const DATA_LABELS = {
  stakePubkey: { label: 'Stake', address: true },
  authorizedStaker: { label: 'Authorized staker', address: true },
  authorizedWithdrawer: { label: 'Authorized withdrawer', address: true },
  lockup: { label: 'Lockup', address: false },
  authorizedPubkey: { label: 'Authorized', address: true },
  votePubkey: { label: 'Vote', address: true },
  authorizedSeed: { label: 'Seed', address: false },
  noncePubkey: { label: 'Nonce', address: true },
  authorityBase: { label: 'Authority base', address: true },
  authoritySeed: { label: 'Authority seed', address: false },
  authorityOwner: { label: 'Authority owner', address: true },
  newAuthorizedPubkey: { label: 'New authorized', address: true },
  stakeAuthorizationType: { label: 'Stake authorization type', address: false, transform: () => JSON.stringify },
  custodianPubkey: { label: 'Custodian', address: true },
  splitStakePubkey: { label: 'Split to', address: true },
  lamports: { label: 'Lamports', address: false },
};

export default function StakeInstruction({ instruction, onOpenAddress }) {
  const { type, data } = instruction;

  return (
    <>
      <Typography
        variant="subtitle1"
        style={{ fontWeight: 'bold' }}
        gutterBottom
      >
        {TYPE_LABELS[type]}
      </Typography>
      {data &&
        Object.entries(data).map(([key, value]) => {
          const dataLabel = DATA_LABELS[key];
          if (!dataLabel) {
            return null;
          }
          const { label, address, transform } = dataLabel;
          return (
            <LabelValue
              key={key}
              label={label + ''}
              value={address ? value?.toBase58() : (transform ? transform(value) : value)}
              link={address}
              onClick={() => address && onOpenAddress(value?.toBase58())}
            />
          );
        })}
    </>
  );
}
