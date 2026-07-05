import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { GENERATION_STAGES } from "../../lib/insights";

export default function GenerationStages({ stage }: { stage: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24">
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "var(--color-accent-soft)" }}
      >
        <Sparkles className="h-7 w-7" style={{ color: "var(--color-accent)" }} />
      </motion.div>

      <div className="h-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={stage}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="font-display text-lg"
          >
            {GENERATION_STAGES[Math.min(stage, GENERATION_STAGES.length - 1)]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="flex gap-1.5">
        {GENERATION_STAGES.map((_, i) => (
          <span
            key={i}
            className="h-1.5 w-6 rounded-full transition-colors duration-300"
            style={{ background: i <= stage ? "var(--color-accent)" : "var(--color-border)" }}
          />
        ))}
      </div>
    </div>
  );
}
