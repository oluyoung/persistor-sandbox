import { createContext } from 'react';
import type { Persistor } from '../types';

export const PersistorContext = createContext<Persistor<Record<string, unknown>> | null>(null);
