import React from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 pb-28 lg:pb-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
