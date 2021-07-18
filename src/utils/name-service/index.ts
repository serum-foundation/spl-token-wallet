import { PublicKey, Connection } from '@solana/web3.js';
import {
  getTwitterRegistry,
  getHashedName,
  getNameAccountKey,
  NameRegistryState,
  getFilteredProgramAccounts,
  NAME_PROGRAM_ID,
} from '@bonfida/spl-name-service';
import { useConnection } from '../connection';
import { useWallet } from '../wallet';
import BN from 'bn.js';
import { useAsyncData } from '../fetch-loop';
import tuple from 'immutable-tuple';

// Address of the SOL TLD
export const SOL_TLD_AUTHORITY = new PublicKey(
  '58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx',
);

export const PROGRAM_ID = new PublicKey(
  'jCebN34bUfdeUYJT13J1yG16XWQpt5PDx6Mse9GUqhR',
);

export const resolveTwitterHandle = async (
  connection: Connection,
  twitterHandle: string,
): Promise<string | undefined> => {
  try {
    const registry = await getTwitterRegistry(connection, twitterHandle);
    return registry.owner.toBase58();
  } catch (err) {
    console.warn(`err`);
    return undefined;
  }
};

export const resolveDomainName = async (
  connection: Connection,
  domainName: string,
): Promise<string | undefined> => {
  let hashedDomainName = await getHashedName(domainName);
  let inputDomainKey = await getNameAccountKey(
    hashedDomainName,
    undefined,
    SOL_TLD_AUTHORITY,
  );
  try {
    const registry = await NameRegistryState.retrieve(
      connection,
      inputDomainKey,
    );
    return registry.owner.toBase58();
  } catch (err) {
    console.warn(err);
    return undefined;
  }
};

export async function findOwnedNameAccountsForUser(
  connection: Connection,
  userAccount: PublicKey,
): Promise<PublicKey[]> {
  const filters = [
    {
      memcmp: {
        offset: 32,
        bytes: userAccount.toBase58(),
      },
    },
  ];
  const accounts = await getFilteredProgramAccounts(
    connection,
    NAME_PROGRAM_ID,
    filters,
  );
  return accounts.map((a) => a.publicKey);
}

export async function performReverseLookup(
  connection: Connection,
  nameAccount: PublicKey,
): Promise<string> {
  let [centralState] = await PublicKey.findProgramAddress(
    [PROGRAM_ID.toBuffer()],
    PROGRAM_ID,
  );
  let hashedReverseLookup = await getHashedName(nameAccount.toBase58());
  let reverseLookupAccount = await getNameAccountKey(
    hashedReverseLookup,
    centralState,
  );

  let name = await NameRegistryState.retrieve(connection, reverseLookupAccount);
  if (!name.data) {
    throw new Error('Could not retrieve name data');
  }
  let nameLength = new BN(name.data.slice(0, 4), 'le').toNumber();
  return name.data.slice(4, 4 + nameLength).toString();
}

export const useUserDomains = () => {
  const wallet = useWallet();
  const connection = useConnection();
  const fn = async () => {
    const domains = await findOwnedNameAccountsForUser(
      connection,
      wallet.publicKey,
    );
    let names: { name: string; nameKey: PublicKey }[] = [];
    const fn = async (d) => {
      try {
        const name = await performReverseLookup(connection, d);
        names.push({ name: name, nameKey: d });
      } catch (err) {
        console.log(`Passing account ${d.toBase58()} - err ${err}`);
      }
    };
    const promises = domains.map((d) => fn(d));
    await Promise.allSettled(promises);
    return names.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  };
  return useAsyncData(
    fn,
    tuple('useUserDomain', wallet?.publicKey?.toBase58()),
  );
};
