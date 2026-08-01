import React from "react";

export const Skeleton = ({ variant = "text", className = "", count = 1 }) => {
  const baseStyles = "animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg";
  
  const styles = {
    text: "h-4 w-full my-2",
    title: "h-6 w-3/4 my-3",
    avatar: "h-12 w-12 rounded-full",
    card: "h-32 w-full",
    chart: "h-64 w-full"
  };

  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, index) => (
        <div
          key={index}
          className={`${baseStyles} ${styles[variant] || ""} ${className}`}
        />
      ))}
    </>
  );
};

export default Skeleton;
