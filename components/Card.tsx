"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  tag?: string;
  children: ReactNode;
  delay?: number;
}

export default function Card({ icon: Icon, title, tag, children, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-xl border border-panelBorder bg-panel/70 backdrop-blur-sm p-5 md:p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-void border border-panelBorder flex items-center justify-center shrink-0">
            <Icon size={15} className="text-safelight" />
          </div>
          <h3 className="font-display font-medium text-paper text-sm tracking-wide uppercase">
            {title}
          </h3>
        </div>
        {tag && (
          <span className="text-[10px] font-mono text-muted border border-panelBorder rounded-full px-2 py-0.5">
            {tag}
          </span>
        )}
      </div>
      {children}
    </motion.div>
  );
}
