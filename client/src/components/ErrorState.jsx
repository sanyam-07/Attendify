import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import Button from "./Button";

export const ErrorState = ({
  title = "An Error Occurred",
  description = "Something went wrong while processing. Please try again.",
  errorType = "general",
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center border border-red-500/20 rounded-2xl bg-red-500/5 dark:bg-red-500/10 backdrop-blur-sm">
      <div className="p-3.5 rounded-full bg-red-500/10 dark:bg-red-500/20 text-red-500 mb-4 border border-red-500/30">
        <AlertCircle size={28} />
      </div>
      <h3 className="text-md font-semibold text-slate-850 dark:text-red-400 mb-1">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
        {description}
      </p>
      {errorType && (
        <span className="inline-block text-[10px] uppercase font-mono tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 rounded px-2 py-0.5 mb-5">
          ERR_CODE: {errorType.toUpperCase()}
        </span>
      )}
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="gap-2 border-red-500/20 text-red-500 hover:bg-red-500/10">
          <RotateCcw size={14} />
          Retry Operation
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
