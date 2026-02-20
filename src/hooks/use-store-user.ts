import { useEffect, useState, useRef } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs"; 
import { api } from "@convex/_generated/api";

export function useStoreUser() {
  const { isAuthenticated } = useConvexAuth();
  const { userId: clerkId } = useAuth();
  
  const storeUser = useMutation(api.users.store);
  const markOffline = useMutation(api.users.markOffline);
  
  const [userId, setUserId] = useState<string | null>(null);
  
  const clerkIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (clerkId) {
      clerkIdRef.current = clerkId;
    }
  }, [clerkId]);

  useEffect(() => {
    if (isAuthenticated) {
      async function syncUser() {
        try {
          const id = await storeUser();
          setUserId(id);
        } catch (error) {
          console.error("Failed to sync user to database:", error);
        }
      }
      syncUser();
    } 
    else if (!isAuthenticated && clerkIdRef.current) {
      markOffline({ clerkId: clerkIdRef.current }).catch(console.error);
      
      clerkIdRef.current = null;
      setUserId(null);
    }
  }, [isAuthenticated, storeUser, markOffline]);

  return userId;
}