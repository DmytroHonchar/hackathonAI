import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import type { Provider } from '../lib/types';

export type OwnedProvider = Provider & {
  owner_id: string;
  services: string[];
  gallery: string[];
};

const COLUMNS = 'id, name, category, description, photo_url, lat, lng, city, price_from, languages, rating, review_count, emergency, available, created_at, owner_id, services, gallery';

interface ProviderContextValue {
  listing: OwnedProvider | null;
  isLoading: boolean;
  reload: () => Promise<void>;
}

const ProviderContext = createContext<ProviderContextValue>({
  listing: null,
  isLoading: true,
  reload: async () => {},
});

export function ProviderProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [listing, setListing] = useState<OwnedProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setListing(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data } = await supabase
      .from('providers')
      .select(COLUMNS)
      .eq('owner_id', user.id)
      .maybeSingle();
    setListing((data as OwnedProvider) ?? null);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <ProviderContext.Provider value={{ listing, isLoading, reload }}>
      {children}
    </ProviderContext.Provider>
  );
}

export function useProviderContext() {
  return useContext(ProviderContext);
}
