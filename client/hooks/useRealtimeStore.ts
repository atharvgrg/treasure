import { useEffect, useState } from "react";
import { productionDataStore } from "@/lib/productionDataStore";

export function useProductionStore() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeStore = async () => {
      await productionDataStore.waitForInitialization();
      setIsInitialized(true);
    };

    initializeStore();
  }, []);

  return {
    isInitialized,
    store: productionDataStore,
  };
}

// Keep backward compatibility
export const useRealtimeStore = useProductionStore;
