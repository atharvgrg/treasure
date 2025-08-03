import { useEffect, useState } from "react";
import { netlifyDataStore } from "@/lib/netlifyDataStore";

export function useNetlifyStore() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeStore = async () => {
      await netlifyDataStore.waitForInitialization();
      setIsInitialized(true);
    };

    initializeStore();
  }, []);

  return {
    isInitialized,
    store: netlifyDataStore,
  };
}

// Keep backward compatibility
export const useRealtimeStore = useNetlifyStore;
