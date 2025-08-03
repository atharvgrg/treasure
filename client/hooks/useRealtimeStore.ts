import { useEffect, useState } from "react";
import { centralDataStore } from "@/lib/centralDataStore";

export function useCentralStore() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeStore = async () => {
      await centralDataStore.waitForInitialization();
      setIsInitialized(true);
    };

    initializeStore();
  }, []);

  return {
    isInitialized,
    store: centralDataStore,
  };
}

// Keep backward compatibility
export const useRealtimeStore = useCentralStore;
