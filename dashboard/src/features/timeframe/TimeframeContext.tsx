import React, { createContext, useContext, useState } from 'react';

type Timeframe = 'Heute' | 'Diese Woche' | 'Dieser Monat' | 'Dieses Jahr';

type Ctx = {
  timeframe: Timeframe;
  setTimeframe: (t: Timeframe) => void;
};

const TimeframeContext = createContext<Ctx | null>(null);

export const TimeframeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('Heute');
  return (
    <TimeframeContext.Provider value={{ timeframe, setTimeframe }}>
      {children}
    </TimeframeContext.Provider>
  );
};

export const useTimeframe = () => {
  const ctx = useContext(TimeframeContext);
  if (!ctx) throw new Error('useTimeframe must be used within TimeframeProvider');
  return ctx;
};

export type { Timeframe };
