"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  DocumentsIcon,
  TemplatesIcon,
  ApprovalsIcon,
  UsersIcon,
  RoutesIcon,
  RolesIcon,
  SettingsIcon,
  XIcon,
} from "./icons";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import type { ComponentType, SVGProps } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

// ─── Nav Config ───────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { label: "Главная",          href: "/",          icon: DashboardIcon  },
  { label: "Документы",        href: "/documents",  icon: DocumentsIcon  },
  { label: "Шаблоны",          href: "/templates",  icon: TemplatesIcon  },
  { label: "Мои согласования", href: "/approvals",  icon: ApprovalsIcon  },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: "Пользователи",      href: "/users",    icon: UsersIcon    },
  { label: "Справочник Ролей",  href: "/roles",    icon: RolesIcon    },
  { label: "Маршруты",          href: "/routes",   icon: RoutesIcon   },
  { label: "Настройки",         href: "/settings", icon: SettingsIcon },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const user = useCurrentUser();

  // Filter nav items based on role
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (!user) return true;
    // ADMIN sees everything; USER sees all main nav items
    return true;
  });

  // Filter admin items based on role
  const visibleAdminItems = user?.role === "ADMIN" ? ADMIN_ITEMS : [];

  // Label visibility:
  //   - Always visible on mobile (sidebar is off-screen when closed, so no harm)
  //   - Hidden on tablet when sidebar is closed (icon-only mode)
  //   - Always visible on desktop
  //   - Always visible when open (overlay mode on mobile/tablet)
  const labelClass = open
    ? "block truncate"
    : "truncate md:hidden lg:block";

  // Nav item flex alignment:
  //   - Centered on tablet when icon-only (closed)
  //   - Left-aligned otherwise
  const itemClass = (isActive: boolean) =>
    [
      "group relative flex w-full items-center rounded-lg py-2 text-[13.5px] font-medium transition-colors",
      "gap-3 px-3",
      // Tablet icon-only: center icon, remove gap/padding
      !open && "md:justify-center md:px-0 md:gap-0 lg:justify-start lg:px-3 lg:gap-3",
      isActive
        ? "bg-zinc-900 text-white"
        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <aside
      className={[
        // Base
        "fixed inset-y-0 left-0 flex flex-col border-r border-zinc-200 bg-white overflow-hidden",
        "transition-all duration-200 ease-in-out",
        // Mobile closed: off-screen. Mobile open: overlay.
        // Tablet closed: icon-only (w-14), always visible.
        // Desktop: full width (w-64), always visible.
        open
          ? "translate-x-0 w-64 z-50 lg:z-30"
          : "-translate-x-full w-64 md:translate-x-0 md:w-14 lg:w-64 z-30",
      ]
        .join(" ")}
    >
      {/* ── Logo ───────────────────────────────────────────────────────── */}
      <div className="relative flex h-16 shrink-0 items-center justify-center border-b border-zinc-200">
        {/* Logo always visible */}
        <div className="flex items-center justify-center">
          {/* Collapsed: show icon-only square */}
          <img
            src="/EDSIS_logo.svg"
            alt="Edocsis"
            className={`h-7 w-6 shrink-0 object-contain ${open ? "hidden" : "block md:block lg:hidden"}`}
          />
          {/* Expanded: show full logo */}
          <img
            src="/EDSIS_logo.svg"
            alt="Edocsis"
            className={`h-7 object-contain ${open ? "block" : "hidden md:hidden lg:block"}`}
          />
        </div>

        {/* Close button — visible only when sidebar is open as overlay (mobile/tablet) */}
        {open && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 lg:hidden"
            aria-label="Закрыть боковую панель"
          >
            <XIcon width={16} height={16} />
          </button>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-3 pt-4">
        <p
          className={[
            "mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-400",
            labelClass,
          ].join(" ")}
        >
          Основное
        </p>

        {visibleNavItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              title={!open ? item.label : undefined}
              className={itemClass(isActive)}
            >
              <item.icon
                className={[
                  "h-4.5 w-4.5 shrink-0",
                  isActive
                    ? "text-white"
                    : "text-zinc-400 group-hover:text-zinc-600",
                ].join(" ")}
              />
              <span className={labelClass}>{item.label}</span>
            </Link>
          );
        })}

        {visibleAdminItems.length > 0 && (
          <>
            <div className="my-3 border-t border-zinc-100" />

            <p
              className={[
                "mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-400",
                labelClass,
              ].join(" ")}
            >
              Настройки
            </p>
          </>
        )}

        {visibleAdminItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              title={!open ? item.label : undefined}
              className={itemClass(isActive)}
            >
              <item.icon
                className={[
                  "h-4.5 w-4.5 shrink-0",
                  isActive
                    ? "text-white"
                    : "text-zinc-400 group-hover:text-zinc-600",
                ].join(" ")}
              />
              <span className={labelClass}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── User Card ──────────────────────────────────────────────────── */}
      <Link
        href="/profile"
        onClick={onClose}
        title={!open ? "Мой профиль" : undefined}
        className={[
          "shrink-0 border-t border-zinc-200 p-3 transition-colors hover:bg-zinc-50",
          open
            ? "flex items-center gap-3"
            : "flex items-center justify-center md:justify-center lg:gap-3 lg:p-4",
        ].join(" ")}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-indigo-600 text-xs font-semibold text-white">
          {user?.name ? user.name[0].toUpperCase() : "?"}
        </div>
        <div className={`min-w-0 flex-1 ${labelClass}`}>
          <p className="truncate text-[13px] font-medium text-zinc-900">
            {user?.name ?? "Пользователь"}
          </p>
          <p className="truncate text-[11.5px] text-zinc-400">
            {user?.role === "ADMIN" ? "Администратор системы" : "Пользователь"}
          </p>
        </div>
      </Link>
    </aside>
  );
}
