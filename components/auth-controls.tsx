"use client";
import { useContent } from "@/components/content-provider";
import { useEffect } from "react";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

// Clerk mounts its dialogs in a portal. Supply the accessible name omitted by
// this SDK version, without changing Clerk's focus or authentication behavior.
export function AuthModalAccessibility() {
  const { copy } = useContent();
  const label = copy["components/auth-controls.tsx"]["copy-1"];
  useEffect(() => {
    const labelDialogs = () => {
      document
        .querySelectorAll(
          '.pantry-auth-modal[role="dialog"]:not([aria-label]):not([aria-labelledby])',
        )
        .forEach((dialog) => dialog.setAttribute("aria-label", label));
    };
    labelDialogs();
    const observer = new MutationObserver(labelDialogs);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [label]);
  return null;
}

export function AuthControls() {
  const { copy: allCopy } = useContent();
  const copy = allCopy["components/auth-controls.tsx"];

  return (
    <div
      className="flex items-center gap-2"
      role="group"
      aria-label={copy["copy-1"]}
    >
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button variant="ghost" type="button">
            {" "}
            {copy["copy-2"]}{" "}
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button type="button">{copy["copy-3"]}</Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </div>
  );
}
