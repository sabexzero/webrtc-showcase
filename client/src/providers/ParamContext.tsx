import React, { createContext, useState, ReactNode, useEffect } from 'react';

// переделать типизацию и поработать с кэшированием
interface SelectorContextType {
    params: Record<string, string>;
    setParam: (key: string, value: string) => void;
}


export const ParamContext = createContext<SelectorContextType | undefined>(undefined);

export const ParamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [params, setParams] = useState<Record<string, string>>({});

    const setParam = (key: string, value: string) => {
        setParams(prevParams => ({ ...prevParams, [key]: value }));
    };

    useEffect(() => {
        console.log(params);
    }, [params]);

    return (
        <ParamContext.Provider value={{ params, setParam }}>
            {children}
        </ParamContext.Provider>
    );
};