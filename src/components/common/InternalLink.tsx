import type { AnchorHTMLAttributes, ReactNode } from "react";

type InternalLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> & {
  to: string;
  children?: ReactNode;
};

/**
 * String-path link for data-driven dynamic routes.
 * TanStack's typed Link requires route-pattern params, while this site stores
 * concrete content paths in data objects. A normal anchor preserves those
 * paths without weakening the generated route types.
 */
export function InternalLink({ to, children, ...props }: InternalLinkProps) {
  return (
    <a href={to} {...props}>
      {children}
    </a>
  );
}
