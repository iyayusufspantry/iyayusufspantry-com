import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/owner-auth";
import { OperationError } from "@/lib/operations/validation";
import { OwnerDashboard } from "@/components/owner-dashboard";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Owner dashboard",
  robots: { index: false, follow: false },
};
export default async function Page() {
  try {
    await requireOwner();
  } catch (error) {
    if (error instanceof OperationError && error.status === 401)
      redirect("/sign-in?redirect_url=%2Fowner");
    if (error instanceof OperationError && error.status === 403)
      return (
        <div className="site-container page-bottom py-16">
          <h1>Owner access required</h1>
          <p className="mt-6">
            This account does not have access to the owner dashboard.
          </p>
        </div>
      );
    throw error;
  }
  return <OwnerDashboard />;
}
