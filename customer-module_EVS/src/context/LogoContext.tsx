import React, { createContext, useContext, useState, useEffect } from 'react';

const DEFAULT_LOGO = '/logoimages/logo.jpeg';

interface LogoContextType {
  logo: string;
  updateLogo: (newLogo: string) => void;
}

const LogoContext = createContext<LogoContextType>({
  logo: DEFAULT_LOGO,
  updateLogo: () => {},
});

const getValidLogo = (logoValue: string | null | undefined): string => {
  if (logoValue && typeof logoValue === 'string' && logoValue.trim()) {
    return logoValue.trim();
  }
  return DEFAULT_LOGO;
};

export function LogoProvider({ children }: { children: React.ReactNode }) {
  const [logo, setLogo] = useState(() => {
    return getValidLogo(localStorage.getItem('companyLogo'));
  });

  useEffect(() => {
    if (logo && logo !== DEFAULT_LOGO) {
      localStorage.setItem('companyLogo', logo);
    }
  }, [logo]);

  const updateLogo = (newLogo: string) => {
    const validLogo = getValidLogo(newLogo);
    setLogo(validLogo);
  };

  return (
    <LogoContext.Provider value={{ logo, updateLogo }}>
      {children}
    </LogoContext.Provider>
  );
}

export const useLogo = () => useContext(LogoContext);