import { Suspense } from "react";
import SignInForm from "./sign-in-form";

export default function SignInPage() {
  const hasGoogleAuth = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return (
    <Suspense fallback={<div className="text-center text-muted-foreground">Loading...</div>}>
      <SignInForm hasGoogleAuth={hasGoogleAuth} />
    </Suspense>
  );
}
