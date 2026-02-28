"use client";

import { useState, useEffect } from "react";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER" | "APPROVER" | "INITIATOR";
}

export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(() => {
    // Initialize state from localStorage immediately
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  useEffect(() => {
    // Function to read user from localStorage
    const loadUser = () => {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const parsed = JSON.parse(userStr);
          setUser(parsed);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    // Load user on mount
    loadUser();

    // Listen for storage changes (cross-tab updates)
    window.addEventListener("storage", loadUser);

    // Listen for custom event (same-tab updates)
    window.addEventListener("user-updated", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("user-updated", loadUser);
    };
  }, []);

  return user;
}
