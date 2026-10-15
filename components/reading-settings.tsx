"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useSyncExternalStore } from "react";
import { ALargeSmall, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const key = "pantry-text-size";
const eventName = "pantry-reading-change";
let fallback = "standard";
function snapshot() {
  try {
    const value = localStorage.getItem(key);
    return value === "large" || value === "largest" ? value : "standard";
  } catch {
    return fallback;
  }
}
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(eventName, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(eventName, onChange);
  };
}

function select(value: string) {
  fallback = value;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* The preference still works for this visit. */
  }
  window.dispatchEvent(new Event(eventName));
}

export function ReadingSettings({
  showLabel = false,
}: {
  showLabel?: boolean;
}) {
  const size = useSyncExternalStore(subscribe, snapshot, () => "standard");
  useEffect(() => {
    document.documentElement.dataset.textSize = size;
  }, [size]);
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          size={showLabel ? undefined : "icon"}
          aria-label="Reading settings"
        >
          <ALargeSmall size={20} />
          {showLabel && <span>Reading settings</span>}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="reading-overlay" />
        <Dialog.Content className="reading-dialog">
          <Dialog.Title>Make yourself comfortable</Dialog.Title>
          <Dialog.Description>
            Choose a text size for easier reading. Your choice is saved on this
            device.
          </Dialog.Description>
          <fieldset>
            <legend>Text size</legend>
            <div className="reading-options">
              {[
                ["standard", "Standard"],
                ["large", "Larger"],
                ["largest", "Largest"],
              ].map(([value, label]) => (
                <label key={value} data-selected={size === value}>
                  <input
                    type="radio"
                    name="reading-text-size"
                    value={value}
                    checked={size === value}
                    onChange={() => select(value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p>You can also zoom the whole page with your browser controls.</p>
          <Dialog.Close asChild>
            <button
              type="button"
              className="reading-close"
              aria-label="Close reading settings"
            >
              <X size={20} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
