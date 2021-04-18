import { createContext, useContext, useState } from 'react';

const defaultValue = {
  page: 'wallet',
  setPage: () => {},
  addHardwareWalletDialogOpen: false,
  setAddHardwareWalletDialogOpen: () => {},
};

const PageContext = createContext(defaultValue);

export const PageProvider = ({ children }) => {
  const [page, setPage] = useState(defaultValue.page);
  const [addHardwareWalletDialogOpen, setAddHardwareWalletDialogOpen ] = useState(defaultValue.addHardwareWalletDialogOpen);
 
  const value = {page, setPage, addHardwareWalletDialogOpen, setAddHardwareWalletDialogOpen}

  return (
    <PageContext.Provider value={value}>
      {children}
    </PageContext.Provider>
  );
};

export const usePage = () => useContext(PageContext);
