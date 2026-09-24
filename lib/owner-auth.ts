import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isOwner } from "./owner-access";
import { OperationError } from "./operations/validation";

export async function requireOwner() {
  const { userId } = await auth();
  if (!userId) throw new OperationError(401, "Sign in to continue.");
  const user = await currentUser();
  if (
    !isOwner(user, process.env.OWNER_CLERK_USER_IDS, process.env.OWNER_EMAILS)
  )
    throw new OperationError(403, "This account does not have owner access.");
  return userId;
}
