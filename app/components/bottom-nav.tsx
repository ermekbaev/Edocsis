"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  DocumentsIcon,
  TemplatesIcon,
  ApprovalsIcon,
} from "./icons";
import type { ComponentType, SVGProps } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────

interface TabItem {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const TABS: TabItem[] = [
  { label: "Dashboard",  href: "/",          icon: DashboardIcon  },
  { label: "Documents",  href: "/documents",  icon: DocumentsIcon  },
  { label: "Templates",  href: "/templates",  icon: TemplatesIcon  },
  { label: "Approvals",  href: "/approvals",  icon: ApprovalsIcon  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname();

  return (
    /*
      Visible only on mobile (< md).
      pb-[env(safe-area-inset-bottom)] handles iOS home-bar safe area.
    */
    <nav
      className="fixed bottom-0 inset-x-0 z-30 md:hidden border-t border-zinc-200 bg-white/90 backdrop-blur-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 items-stretch">
        {TABS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={[
                "relative flex flex-1 flex-col items-center justify-center gap-1 text-[10.5px] font-medium transition-colors",
                isActive ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600",
              ].join(" ")}
            >
              {/* Active indicator line at top */}
              {isActive && (
                <span
                  className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-zinc-900"
                  aria-hidden="true"
                />
              )}

              <Icon
                className={[
                  "h-5 w-5 transition-colors",
                  isActive ? "text-zinc-900" : "text-zinc-400",
                ].join(" ")}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
