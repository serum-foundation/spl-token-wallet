import { useCallback, useEffect, useRef, useState } from 'react';
import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import { useMediaQuery } from '@material-ui/core';
import * as bs58 from 'bs58';

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


export function useLocalStorageState<T>(
  key: string,
  defaultState: T,
): [T, (T) => void] {
  const [state, setState] = useState(() => {
    let storedState = localStorage.getItem(key);
    if (storedState) {
      return JSON.parse(storedState);
    }
    return defaultState;
  });

  const setLocalStorageState = useCallback(
    (newState) => {
      let changed = state !== newState;
      if (!changed) {
        return;
      }
      setState(newState);
      if (newState === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newState));
      }
    },
    [state, key],
  );

  return [state, setLocalStorageState];
}

export function useEffectAfterTimeout(effect: () => void, timeout: number) {
  useEffect(() => {
    let handle = setTimeout(effect, timeout);
    return () => clearTimeout(handle);
  });
}

export function useListener(emitter, eventName: string) {
  let [, forceUpdate] = useState(0);
  useEffect(() => {
    let listener = () => forceUpdate((i) => i + 1);
    emitter.on(eventName, listener);
    return () => emitter.removeListener(eventName, listener);
  }, [emitter, eventName]);
}

export function useRefEqual<T>(
  value: T,
  areEqual: (oldValue: T, newValue: T) => boolean,
): T {
  const prevRef = useRef<T>(value);
  if (prevRef.current !== value && !areEqual(prevRef.current, value)) {
    prevRef.current = value;
  }
  return prevRef.current;
}

export function abbreviateAddress(address: PublicKey) {
  let base58 = address.toBase58();
  return base58.slice(0, 4) + '…' + base58.slice(base58.length - 4);
}

export async function confirmTransaction(
  connection: Connection,
  signature: string,
) {
  let startTime = new Date();
  let result = await connection.confirmTransaction(signature, 'recent');
  if (result.value.err) {
    throw new Error(
      'Error confirming transaction: ' + JSON.stringify(result.value.err),
    );
  }
  console.log(
    'Transaction confirmed after %sms',
    new Date().getTime() - startTime.getTime(),
  );
  return result.value;
}

// TODO consolidate popup dimensions
export function useIsExtensionWidth() {
  return useMediaQuery('(max-width:450px)');
}

export const isExtension = window.location.protocol === 'chrome-extension:';

export const isExtensionPopup = isExtension && window.opener;
/**
 * Returns an account object when given the private key
 */
export const decodeAccount = (privateKey: string) => {
  try {
    return Keypair.fromSecretKey(new Uint8Array(JSON.parse(privateKey)));
  } catch (_) {
    try {
      return Keypair.fromSecretKey(new Uint8Array(bs58.decode(privateKey)));
    } catch (_) {
      return undefined;
    }
  }
}
