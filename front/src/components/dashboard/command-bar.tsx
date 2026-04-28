"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

const COMMANDS = [
  { label: "رفتن به انبار", description: "مدیریت رسیدها و حواله‌ها", href: "/warehouse" },
  { label: "رفتن به بازارگاه", description: "عرضه و فروش بازارگاه", href: "/b2b" },
  { label: "رفتن به مالی", description: "پروفورماهای خرید و فروش", href: "/finance" },
  { label: "رفتن به کالاها", description: "مدیریت محصولات", href: "/products" },
  { label: "رفتن به طرف‌های تجاری", description: "مشتریان، تامین‌کنندگان، گیرندگان", href: "/parties" },
  { label: "رفتن به تنظیمات", description: "شاخص‌ها و پیکربندی", href: "/settings" },
];

interface CommandBarProps {
  open: boolean;
  onClose: () => void;
}

export function CommandBar({ open, onClose }: CommandBarProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const filtered = query.trim()
    ? COMMANDS.filter(
        (c) =>
          c.label.includes(query) ||
          c.description.includes(query) ||
          c.href.includes(query)
      )
    : COMMANDS;

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو یا رفتن به..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400 font-light"
          />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <ul className="py-2 max-h-72 overflow-y-auto">
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-center text-sm font-light text-gray-400">
              نتیجه‌ای یافت نشد
            </li>
          )}
          {filtered.map((cmd) => (
            <li key={cmd.href}>
              <button
                className="w-full flex flex-col items-start gap-0.5 px-4 py-2.5 hover:bg-indigo-50 transition-colors text-right"
                onClick={() => navigate(cmd.href)}
              >
                <span className="text-sm font-medium text-gray-800">{cmd.label}</span>
                <span className="text-xs font-light text-gray-400">{cmd.description}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-400">
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">↑↓</kbd>
          <span>انتخاب</span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd>
          <span>رفتن</span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd>
          <span>بستن</span>
        </div>
      </div>
    </div>
  );
}
