"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cacheGet, cacheRemove } from "@/lib/cache";

import { CacheKey } from "@/services/constant";
import { ContextValue } from "@/types/context";
import { User } from "@/types/user";
import useOneTapLogin from "@/hooks/useOneTapLogin";
import { useSession } from "next-auth/react";

const AppContext = createContext({} as ContextValue);

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  if (
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED === "true" &&
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID
  ) {
    useOneTapLogin();
  }

  const { data: session } = useSession();

  const [theme, setTheme] = useState<string>(() => {
    return process.env.NEXT_PUBLIC_DEFAULT_THEME || "";
  });
  const [showSignModal, setShowSignModal] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const hasFetchedUserRef = useRef(false);

  const updateInvite = useCallback(async (user: User) => {
    try {
      if (user.invited_by) {
        // user already been invited
        console.log("user already been invited", user.invited_by);
        return;
      }

      const inviteCode = cacheGet(CacheKey.InviteCode);
      if (!inviteCode) {
        // no invite code
        return;
      }

      const userCreatedAt = Date.parse(String(user.created_at || ""));
      if (Number.isNaN(userCreatedAt)) {
        return;
      }

      const timeDiff = Math.floor((Date.now() - userCreatedAt) / 1000);

      if (timeDiff <= 0 || timeDiff > 7200) {
        // user created more than 2 hours
        console.log("user created more than 2 hours");
        return;
      }

      // update invite relation
      console.log("update invite", inviteCode, user.uuid);
      const req = {
        invite_code: inviteCode,
        user_uuid: user.uuid,
      };
      const resp = await fetch("/api/update-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req),
      });
      if (!resp.ok) {
        throw new Error("update invite failed with status: " + resp.status);
      }
      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      setUser(data);
      cacheRemove(CacheKey.InviteCode);
    } catch (e) {
      console.log("update invite failed: ", e);
    }
  }, []);

  const fetchUserInfo = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const resp = await fetch("/api/get-user-info", {
          method: "POST",
          signal,
        });

        if (!resp.ok) {
          throw new Error("fetch user info failed with status: " + resp.status);
        }

        const { code, message, data } = await resp.json();
        if (code !== 0) {
          throw new Error(message);
        }

        if (signal?.aborted) {
          return;
        }

        setUser(data);
        await updateInvite(data);
      } catch (e: any) {
        if (e?.name === "AbortError") {
          return;
        }
        console.log("fetch user info failed");
      }
    },
    [updateInvite]
  );

  useEffect(() => {
    if (!session?.user) {
      hasFetchedUserRef.current = false;
      setUser(null);
      return;
    }

    if (hasFetchedUserRef.current) {
      return;
    }

    hasFetchedUserRef.current = true;
    const controller = new AbortController();
    const run = () => {
      void fetchUserInfo(controller.signal);
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(run, { timeout: 1200 });
      return () => {
        controller.abort();
        window.cancelIdleCallback(idleId);
      };
    }

    const timer = setTimeout(run, 120);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [fetchUserInfo, session]);

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        showSignModal,
        setShowSignModal,
        user,
        setUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
