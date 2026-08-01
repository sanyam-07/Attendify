import React from "react";

export const Badge = ({ children, variant = "primary", className = "" }) => {
  const styles = {
    primary: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    secondary: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    accent: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    danger: "bg-red-500/10 text-red-500 border-red-500/20",
    neutral: "bg-slate-500/10 text-slate-500 border-slate-500/20 dark:text-slate-400"
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant] || styles.primary} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
