import { getContent } from "@/lib/content/server";
import { SignIn } from "@clerk/nextjs";
import { AuthPage } from "@/components/auth-page";

export async function generateMetadata() {
  const copy = (await getContent()).copy["app/sign-in/[[...sign-in]]/page.tsx"];
  return { title: copy["copy-1"] };
}

export default function SignInPage() {
  return (
    <AuthPage mode="sign-in">
      <SignIn />
    </AuthPage>
  );
}
