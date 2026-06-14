// EcoPulse — Page wrapper with consistent padding and nav offset

import { Navigation } from "./Navigation";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ children, className = "" }: PageShellProps) {
  return (
    <>
      <main
        id="main-content"
        className={`min-h-screen max-w-md mx-auto px-4 pt-6 pb-28 ${className}`}
        tabIndex={-1}
      >
        {children}
      </main>
      <Navigation />
    </>
  );
}
