import { useEffect, useState } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useStoreUser() {
  const { isAuthenticated } = useConvexAuth();
  const storeUser = useMutation(api.users.store);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function syncUser() {
      try {
        const id = await storeUser();
        setUserId(id);
      } catch (error) {
        console.error("Failed to sync user to database:", error);
      }
    }

    syncUser();
  }, [isAuthenticated, storeUser]);

  return userId;
}