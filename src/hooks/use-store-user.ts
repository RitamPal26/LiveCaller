import { useEffect, useState, useRef } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";

export function useStoreUser() {
  const { isAuthenticated } = useConvexAuth();
  const { userId: clerkId } = useAuth();

  const storeUser = useMutation(api.users.store);
  const markOffline = useMutation(api.users.markOffline);
  const sendHeartbeat = useMutation(api.users.heartbeat);

  const [userId, setUserId] = useState<string | null>(null);
  const clerkIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (clerkId) clerkIdRef.current = clerkId;
  }, [clerkId]);

  useEffect(() => {
    if (isAuthenticated) {
      async function syncUser() {
        try {
          const id = await storeUser();
          setUserId(id);
          await sendHeartbeat();
        } catch (error) {
          console.error("Failed to sync user:", error);
        }
      }
      syncUser();

      const intervalId = setInterval(() => {
        sendHeartbeat().catch(console.error);
      }, 10000);

      return () => clearInterval(intervalId);
    } else if (!isAuthenticated && clerkIdRef.current) {
      markOffline({ clerkId: clerkIdRef.current }).catch(console.error);
      clerkIdRef.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserId(null);
    }
  }, [isAuthenticated, storeUser, markOffline, sendHeartbeat]);

  return userId;
}
