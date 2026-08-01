import React from "react";
import { motion } from "framer-motion";

export const Card = ({ children, className = "", hoverEffect = true, onClick }) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hoverEffect ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={`glass-card rounded-2xl p-6 ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Card;
