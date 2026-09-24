type OwnerUser = {
  id: string;
  emailAddresses: {
    emailAddress: string;
    verification: { status: string } | null;
  }[];
};
export function isOwner(user: OwnerUser | null, ids = "", emails = "") {
  if (!user) return false;
  if (
    ids
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .includes(user.id)
  )
    return true;
  const allowed = emails
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  return user.emailAddresses.some(
    (email) =>
      email.verification?.status === "verified" &&
      allowed.includes(email.emailAddress.toLowerCase()),
  );
}
