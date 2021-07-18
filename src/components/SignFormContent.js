import React, { useEffect } from 'react';
import CardContent from '@material-ui/core/CardContent';
import Warning from '@material-ui/icons/Warning';
import { Tooltip, Typography, Divider } from '@material-ui/core';
import { useWallet } from '../utils/wallet';

function toHex(buffer) {
  return Array.prototype.map
    .call(buffer, (x) => ('00' + x.toString(16)).slice(-2))
    .join('');
}

export default function SignFormContent({
  origin,
  message,
  messageDisplay,
  buttonRef,
}) {
  useEffect(() => {
    // brings window to front when we receive new instructions
    // this needs to be executed from wallet instead of adapter
    // to ensure chrome brings window to front
    window.focus();

    // Scroll to approve button and focus it to enable approve with enter.
    // Keep currentButtonRef in local variable, so the reference can't become
    // invalid until the timeout is over. this was happening to all auto-
    // approvals for unknown reasons.
    let currentButtonRef = buttonRef.current;
    if (currentButtonRef) {
      currentButtonRef.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => currentButtonRef.focus(), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buttonRef]);

  const wallet = useWallet();

  let messageTxt;
  switch (messageDisplay) {
    case 'utf8':
      messageTxt = new TextDecoder().decode(message);
      break;
    case 'hex':
      messageTxt = '0x' + toHex(message);
      break;
    default:
      throw new Error('Unexpected message type: ' + messageDisplay);
  }

  const renderAction = () => {
    switch (messageDisplay) {
      case 'utf8':
        return `Sign message with account ${wallet.publicKey}`;
      case 'hex':
        return (
          <>
            <Tooltip
              title="Be especially cautious when signing arbitrary data, you must trust the requester."
              arrow
            >
              <Warning style={{ marginBottom: '-7px' }} />
            </Tooltip>{' '}
            {`Sign data with account ${wallet.publicKey}`}
          </>
        );
      default:
        throw new Error('Unexpected message display type: ' + messageDisplay);
    }
  };

  return (
    <CardContent>
      <Typography variant="h6" gutterBottom>
        {`${origin} wants to:`}
      </Typography>
      <Typography
        variant="subtitle1"
        style={{ fontWeight: 'bold' }}
        gutterBottom
      >
        {renderAction()}
      </Typography>
      <Divider style={{ margin: 20 }} />
      <Typography style={{ wordBreak: 'break-all' }}>{messageTxt}</Typography>
      <Divider style={{ margin: 20 }} />
    </CardContent>
  );
}
