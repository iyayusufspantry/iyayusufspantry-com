import type { Appearance } from "@clerk/ui";
import { shadcn } from "@clerk/ui/themes";

// One appearance cascade covers authentication, verification, and account settings.
export const clerkAppearance: Appearance = {
  theme: shadcn,
  options: {
    logoLinkUrl: "/",
    logoPlacement: "inside",
    socialButtonsVariant: "blockButton",
  },
  variables: {
    colorPrimary: "#087862",
    colorPrimaryForeground: "#ffffff",
    colorBackground: "#fcfaf5",
    colorForeground: "#29325f",
    colorMuted: "#e7f4ec",
    colorMutedForeground: "#586760",
    colorInput: "#ffffff",
    colorInputForeground: "#29325f",
    colorDanger: "#b42318",
    colorWarning: "#8a4b08",
    colorRing: "#087862",
    fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
    fontFamilyButtons: '"Trebuchet MS", Arial, Helvetica, sans-serif',
    borderRadius: "0.75rem",
  },
  elements: {
    modalContent: "pantry-auth-modal",
    modalBackdrop: {
      backgroundColor: "rgba(20, 37, 31, 0.42)",
      backdropFilter: "blur(7px)",
    },
    cardBox: {
      border: "1px solid #d9e2d9",
      borderRadius: "24px",
      boxShadow: "0 18px 60px -28px rgb(7 94 78 / 30%)",
    },
    card: { backgroundColor: "#fcfaf5" },
    logoImage: { width: "208px", height: "auto", maxHeight: "58px" },
    headerTitle: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: 400,
      fontSize: "1.9rem",
      letterSpacing: "-0.04em",
      color: "#29325f",
    },
    headerSubtitle: { color: "#586760", lineHeight: 1.6 },
    formFieldLabel: { fontWeight: 600, color: "#29325f" },
    formFieldInput: { minHeight: "44px", borderRadius: "12px" },
    formButtonPrimary: {
      minHeight: "44px",
      borderRadius: "999px",
      fontWeight: 600,
      boxShadow: "none",
      "&:hover": { backgroundColor: "#075e4e" },
    },
    socialButtonsBlockButton: {
      minHeight: "44px",
      borderRadius: "999px",
      backgroundColor: "#ffffff",
      border: "1px solid #d9e2d9",
      color: "#29325f",
      "&:hover": { backgroundColor: "#e7f4ec" },
    },
    footer: { background: "#fcfaf5", borderTop: "1px solid #e7e8df" },
    footerActionLink: { color: "#087862", fontWeight: 600 },
    userButtonTrigger: {
      padding: "4px",
      border: "1px solid #d9e2d9",
      borderRadius: "999px",
    },
    userButtonPopoverCard: {
      border: "1px solid #d9e2d9",
      borderRadius: "20px",
      backgroundColor: "#fcfaf5",
    },
    userButtonPopoverActionButton: {
      "&:hover": { backgroundColor: "#e7f4ec" },
    },
    navbar: { background: "#e7f4ec" },
    navbarButton: { borderRadius: "999px" },
    pageScrollBox: { backgroundColor: "#fcfaf5" },
    profileSectionTitleText: { fontWeight: 600, color: "#29325f" },
  },
};
