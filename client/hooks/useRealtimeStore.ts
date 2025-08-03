import { useEffect, useState } from "react";
import { realtimeDataStore } from "@/lib/realtimeDataStore";

export function useRealtimeStore() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeStore = async () => {
      await realtimeDataStore.waitForInitialization();
      setIsInitialized(true);
    };

    initializeStore();
  }, []);

  return {
    isInitialized,
    store: realtimeDataStore,
  };
}
