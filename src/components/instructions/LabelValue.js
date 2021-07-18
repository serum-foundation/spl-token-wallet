import React from 'react';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';

export default function LabelValue({
  label,
  value,
  link = false,
  onClick,
  gutterBottom,
}) {
  return (
    <Typography gutterBottom={gutterBottom}>
      {label}:{' '}
      {link ? (
        <Link href="#" onClick={onClick}>
          {value}
        </Link>
      ) : (
        <span style={{ color: '#7B7B7B' }}>{value}</span>
      )}
    </Typography>
  );
}
