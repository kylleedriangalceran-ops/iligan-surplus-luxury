"use client";

import React, { useState, useTransition } from "react";
import { saveGlobalSetting } from "@/app/actions/admin";

interface GlobalSetting {
  key: string;
  value: string;
}

const settingsMeta: Record<string, { label: string; description: string; type: "toggle" | "number" }> = {
  maintenance_mode: {
    label: "Maintenance Mode",
    description: "Temporarily disable public access to the entire platform. Users will see a maintenance page.",
    type: "toggle",
  },
  platform_fee_percent: {
    label: "Platform Fee (%)",
    description: "The percentage fee charged to merchants on each successful reservation transaction.",
    type: "number",
  },
};

export function GlobalSettingsPanel({ settings }: { settings: GlobalSetting[] }) {
  return (
    <div className="border border-[#1C1C1E]/10 bg-[#FAF9F6] divide-y divide-[#1C1C1E]/5">
      {settings.map((setting) => (
        <SettingRow key={setting.key} setting={setting} />
      ))}
    </div>
  );
}

function SettingRow({ setting }: { setting: GlobalSetting }) {
  const meta = settingsMeta[setting.key];
  const [isPending, startTransition] = useTransition();

  if (!meta) {
    return (
      <div className="px-6 py-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-[#1C1C1E]">{setting.key}</p>
          <p className="text-[10px] text-[#1C1C1E]/40">Unknown setting</p>
        </div>
        <span className="text-xs text-[#1C1C1E]/60 font-mono">{setting.value}</span>
      </div>
    );
  }

  if (meta.type === "toggle") {
    return <ToggleSetting setting={setting} meta={meta} isPending={isPending} startTransition={startTransition} />;
  }

  return <NumberSetting setting={setting} meta={meta} isPending={isPending} startTransition={startTransition} />;
}

function ToggleSetting({
  setting,
  meta,
  isPending,
  startTransition,
}: {
  setting: GlobalSetting;
  meta: { label: string; description: string };
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
}) {
  const isOn = setting.value === "true";

  const handleToggle = () => {
    startTransition(async () => {
      await saveGlobalSetting(setting.key, isOn ? "false" : "true");
    });
  };

  return (
    <div className={`px-6 py-6 flex items-center justify-between gap-6 transition-opacity ${isPending ? "opacity-40" : ""}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-[#1C1C1E]">{meta.label}</p>
          {isOn && (
            <span className="text-[9px] uppercase tracking-widest font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5">
              Active
            </span>
          )}
        </div>
        <p className="text-[10px] text-[#1C1C1E]/40 mt-1 leading-relaxed max-w-md">{meta.description}</p>
      </div>

      {/* Toggle Switch */}
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${
          isOn ? "bg-amber-500" : "bg-[#1C1C1E]/15"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
            isOn ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function NumberSetting({
  setting,
  meta,
  isPending,
  startTransition,
}: {
  setting: GlobalSetting;
  meta: { label: string; description: string };
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
}) {
  const [localValue, setLocalValue] = useState(setting.value);
  const hasChanged = localValue !== setting.value;

  const handleSave = () => {
    if (!hasChanged) return;
    startTransition(async () => {
      await saveGlobalSetting(setting.key, localValue);
    });
  };

  return (
    <div className={`px-6 py-6 flex items-center justify-between gap-6 transition-opacity ${isPending ? "opacity-40" : ""}`}>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#1C1C1E]">{meta.label}</p>
        <p className="text-[10px] text-[#1C1C1E]/40 mt-1 leading-relaxed max-w-md">{meta.description}</p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="relative">
          <input
            type="number"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            min={0}
            max={100}
            className="w-20 bg-transparent border border-[#1C1C1E]/10 px-3 py-2 text-xs text-[#1C1C1E] text-center font-medium focus:outline-none focus:border-[#1C1C1E]/30"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#1C1C1E]/30">%</span>
        </div>
        {hasChanged && (
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-2 bg-[#1C1C1E] text-[#FAF9F6] text-[10px] uppercase tracking-widest font-semibold hover:bg-[#1C1C1E]/80 transition-colors"
          >
            Save
          </button>
        )}
      </div>
    </div>
  );
}
