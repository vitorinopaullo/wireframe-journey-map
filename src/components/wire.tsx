import { Link } from "@tanstack/react-router";
import type { ReactNode, HTMLAttributes, ComponentType } from "react";

/* Wireframe primitives — grayscale, dashed, monospace annotations */

export function WireBox({
  label,
  children,
  className = "",
  variant = "solid",
}: {
  label?: string;
  children?: ReactNode;
  className?: string;
  variant?: "solid" | "dashed" | "ghost";
}) {
  const border =
    variant === "dashed"
      ? "border border-dashed border-muted-foreground/40"
      : variant === "ghost"
      ? "border border-muted-foreground/20 bg-muted/30"
      : "border border-foreground/15";
  return (
    <div className={`relative rounded-card ${border} bg-background p-4 ${className}`}>
      {label && (
        <div className="absolute -top-2 left-3 bg-background px-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

export function Annotation({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

export function WireBtn({
  children,
  variant = "primary",
  to,
  params,
  className = "",
  ...rest
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "ghost";
  to?: string;
  params?: Record<string, string>;
  className?: string;
} & Omit<HTMLAttributes<HTMLButtonElement>, "children">) {
  const styles =
    variant === "primary"
      ? "bg-[var(--color-primary)] text-[var(--color-white)] border-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] hover:border-[var(--color-primary-hover)] hover:opacity-100"
      : variant === "secondary"
      ? "bg-background text-foreground border-foreground/15"
      : variant === "tertiary"
      ? "border-transparent bg-transparent px-0 text-[var(--color-interactive)] underline-offset-4 hover:underline hover:opacity-100"
      : "bg-transparent text-foreground border-dashed border-muted-foreground/50";
  const cls = `inline-flex items-center justify-center rounded-button border px-4 py-2.5 text-sm font-medium transition-[background-color,border-color,box-shadow,opacity,transform] ease-standard duration-150 hover:opacity-80 active:scale-[0.97] ${styles} ${className}`;
  if (to) {
    const LinkAny = Link as unknown as ComponentType<Record<string, unknown>>;
    return <LinkAny to={to} params={params} className={cls}>{children}</LinkAny>;
  }
  return <button className={cls} {...rest}>{children}</button>;
}

export function WireField({
  label,
  placeholder,
  type = "text",
  hint,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex h-11 items-center rounded-button border border-muted-foreground/25 bg-muted/20 px-3 text-sm text-muted-foreground">
        {type === "select" ? `▾ ${placeholder ?? ""}` : placeholder ?? `[ ${label} ]`}
      </div>
      {hint && <span className="mt-1 block font-mono text-[10px] text-muted-foreground/70">{hint}</span>}
    </label>
  );
}

export function StatusDot({ state }: { state: "done" | "active" | "pending" }) {
  const cls =
    state === "done"
      ? "bg-foreground"
      : state === "active"
      ? "bg-foreground/60 ring-2 ring-foreground/30"
      : "bg-background border border-foreground/40";
  return <span className={`inline-block h-3 w-3 rounded-full ${cls}`} />;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-foreground/20 pb-6">
      <div>
        {eyebrow && (
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function WireTag({
  children,
  onClick,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  const cls = `inline-flex items-center rounded-pill border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors duration-150 ${
    active
      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-white)]"
      : "border-foreground/40"
  } ${onClick ? "cursor-pointer hover:border-foreground" : ""}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {children}
      </button>
    );
  }
  return <span className={cls}>{children}</span>;
}
