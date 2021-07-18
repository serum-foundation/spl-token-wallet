import React from 'react';
import LabelValue from './LabelValue';
import Typography from '@material-ui/core/Typography';

export default function UnknownInstruction({ instruction, onOpenAddress }) {
  return (
    <>
      <Typography
        variant="subtitle1"
        style={{ fontWeight: 'bold' }}
        gutterBottom
      >
        Unknown instruction:
      </Typography>
      <LabelValue
        key="Program"
        label="Program"
        value={instruction.programId?.toBase58()}
        link={true}
        gutterBottom={true}
        onClick={() => onOpenAddress(instruction.programId.toBase58())}
      />
      {instruction.accountMetas &&
        instruction.accountMetas.map((accountMeta, index) => {
          return (
            <>
              <LabelValue
                key={index + ''}
                label={'Account #' + (index + 1)}
                value={accountMeta.publicKey.toBase58()}
                link={true}
                onClick={() => onOpenAddress(accountMeta.publicKey.toBase58())}
              />
              <Typography gutterBottom>
                Writable: {accountMeta.isWritable.toString()}
              </Typography>
            </>
          );
        })}
      <Typography style={{ wordBreak: 'break-all' }}>
        Data: {instruction.rawData}
      </Typography>
    </>
  );
}
