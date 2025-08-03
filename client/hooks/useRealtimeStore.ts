import { useEffect, useState } from "react";
import { postgresDataStore } from "@/lib/postgresDataStore";

export function usePostgreSQLStore() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeStore = async () => {
      await postgresDataStore.waitForInitialization();
      setIsInitialized(true);
    };

    initializeStore();
  }, []);

  return {
    isInitialized,
    store: postgresDataStore,
  };
}

// Keep backward compatibility
export const useRealtimeStore = usePostgreSQLStore;
