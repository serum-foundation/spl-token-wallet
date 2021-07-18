import { createContext, useContext, useState } from 'react';

const PageContext = createContext(['wallet', () => {}]);

export const PageProvider = ({ children }) => {
  const [page, setPage] = useState('wallet');

  return (
    <PageContext.Provider value={[page, setPage]}>
      {children}
    </PageContext.Provider>
  );
};

export const usePage = () => useContext(PageContext);
