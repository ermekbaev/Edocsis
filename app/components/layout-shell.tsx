"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";

interface LayoutShellProps {
  children: React.ReactNode;
}

export function LayoutShell({ children }: LayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar  = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="min-h-screen bg-zinc-50">

      {/* Backdrop — shown when sidebar overlays content (mobile/tablet) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      {/*
        Content area offset:
          mobile  → no offset  (sidebar is an overlay)
          tablet  → pl-14      (icon-only sidebar, 56px)
          desktop → pl-64      (full sidebar, 256px)
      */}
      <div className="md:pl-14 lg:pl-64">
        <Header onMenuClick={openSidebar} />
        <main className="p-4 pb-24 sm:p-6 md:pb-8 lg:p-8">
          {children}
        </main>
      </div>

      {/* Bottom tab bar — mobile only */}
      <BottomNav />
    </div>
  );
}
