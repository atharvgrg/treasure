import { useEffect, useState } from "react";
import { supabaseDataStore } from "@/lib/supabaseDataStore";

export function useSupabaseStore() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeStore = async () => {
      await supabaseDataStore.waitForInitialization();
      setIsInitialized(true);
    };

    initializeStore();
  }, []);

  return {
    isInitialized,
    store: supabaseDataStore,
  };
}

// Keep backward compatibility
export const useRealtimeStore = useSupabaseStore;
