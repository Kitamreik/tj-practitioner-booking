import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

const SSOCallbackPage = () => {
  try {
    return <AuthenticateWithRedirectCallback />;
  } catch {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted-foreground">Processing sign-in...</p>
      </div>
    );
  }
};

export default SSOCallbackPage;
