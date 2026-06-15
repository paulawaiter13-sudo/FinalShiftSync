import type { ReactNode } from 'react';

interface DataCardProps {
  children: ReactNode;
  className?: string;
}

export function DataCard({ children, className = '' }: DataCardProps) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

interface DataTableProps {
  children: ReactNode;
  className?: string;
}

export function DataTable({ children, className = '' }: DataTableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="data-table w-full text-left text-sm">{children}</table>
    </div>
  );
}
