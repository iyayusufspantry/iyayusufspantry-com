import { getContent } from "@/lib/content/server";
import { SignUp } from "@clerk/nextjs";
import { AuthPage } from "@/components/auth-page";

export async function generateMetadata() {
  const copy = (await getContent()).copy["app/sign-up/[[...sign-up]]/page.tsx"];
  return { title: copy["copy-1"] };
}

export default function SignUpPage() {
  return (
    <AuthPage mode="sign-up">
      <SignUp />
    </AuthPage>
  );
}
