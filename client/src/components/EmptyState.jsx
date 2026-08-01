import React from "react";
import { Info } from "lucide-react";
import Button from "./Button";

export const EmptyState = ({
  icon: Icon = Info,
  title = "No Data Available",
  description = "There are no records found for this section.",
  actionText,
  onActionClick
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/40 dark:bg-slate-900/20 backdrop-blur-sm">
      <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 mb-4 border border-slate-200/50 dark:border-slate-800/30">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-semibold text-slate-850 dark:text-slate-200 mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-450 max-w-sm mb-6">
        {description}
      </p>
      {actionText && onActionClick && (
        <Button onClick={onActionClick} variant="outline" size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
