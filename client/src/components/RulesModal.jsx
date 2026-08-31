import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Xmark, CircleQuestion, CircleInfo, Layers, Bell } from '@gravity-ui/icons';

export default function RulesModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, translateY: 15 }}
            animate={{ scale: 1, opacity: 1, translateY: 0 }}
            exit={{ scale: 0.95, opacity: 0, translateY: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative text-left max-h-[85vh] flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              <Xmark className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-neutral-800">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <CircleQuestion className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">How to Play UNO</h3>
                <p className="text-xs text-neutral-400">Rules, special cards & scoring guide</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs text-neutral-300 pr-1 scrollbar-thin">
              <div className="bg-neutral-800/60 p-3.5 rounded-2xl border border-neutral-700/60">
                <div className="flex items-center gap-1.5 mb-1 text-white font-bold text-sm">
                  <CircleInfo className="w-4 h-4 text-blue-400" />
                  <h4>Objective</h4>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  Be the first player to empty all cards from your hand by matching the current card by <strong className="text-neutral-200">Color</strong> or <strong className="text-neutral-200">Number/Symbol</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <h4>Action Cards</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 bg-neutral-800/40 rounded-xl border border-neutral-800">
                    <span className="font-bold text-amber-400">Skip</span>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Skips the next player's turn entirely.</p>
                  </div>
                  <div className="p-3 bg-neutral-800/40 rounded-xl border border-neutral-800">
                    <span className="font-bold text-blue-400">Reverse</span>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Reverses direction of play. Acts like Skip in 2-player match.</p>
                  </div>
                  <div className="p-3 bg-neutral-800/40 rounded-xl border border-neutral-800">
                    <span className="font-bold text-emerald-400">Draw +2</span>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Next player draws 2 cards and loses their turn.</p>
                  </div>
                  <div className="p-3 bg-neutral-800/40 rounded-xl border border-neutral-800">
                    <span className="font-bold text-rose-400">Wild & Wild +4</span>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Allows you to change the active color. +4 forces next player to draw 4 cards.</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/20 text-amber-200">
                <div className="flex items-center gap-1.5 mb-1 text-amber-300 font-bold text-xs">
                  <Bell className="w-3.5 h-3.5" />
                  <h4>Calling UNO</h4>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  When you have only <strong>1 card left</strong>, click the <strong>UNO!</strong> button immediately. If another player catches you before you call UNO, you must draw 2 penalty cards!
                </p>
              </div>
            </div>


            <div className="pt-3 mt-2 border-t border-neutral-800">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Got It!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
