import { Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "../icons";

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-[#94A3B8]">
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-white transition-colors"
        aria-label="Home"
      >
        <Home size={13} />
        <span>Home</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={item.label} className="flex items-center gap-1.5">
            <ChevronRight size={12} className="text-[#64748B]" />
            {isLast || !item.path ? (
              <span className="text-white font-medium truncate max-w-[200px] sm:max-w-none">
                {item.label}
              </span>
            ) : (
              <Link to={item.path} className="hover:text-white transition-colors">
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
