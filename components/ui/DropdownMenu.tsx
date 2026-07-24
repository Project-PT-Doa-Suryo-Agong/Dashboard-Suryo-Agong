"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

export type DropdownItem = {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
};

type DropdownMenuProps = {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
};

export default function DropdownMenu({
  trigger,
  items,
  align = "right",
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div onClick={() => setIsOpen((prev) => !prev)}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute ${align === "right" ? "right-0" : "left-0"} z-50 mt-2 min-w-[190px] rounded-xl border border-slate-200 bg-white shadow-lg py-1`}
        >
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  setIsOpen(false);
                }
              }}
              disabled={item.disabled}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
