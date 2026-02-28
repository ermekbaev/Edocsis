"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ("ADMIN" | "APPROVER" | "USER" | "INITIATOR")[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const user = useCurrentUser();

  useEffect(() => {
    if (user && !allowedRoles.includes(user.role)) {
      router.replace("/");
    }
  }, [user, allowedRoles, router]);

  // Don't render until user is loaded
  if (!user) return null;

  // Don't render if role not allowed
  if (!allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
