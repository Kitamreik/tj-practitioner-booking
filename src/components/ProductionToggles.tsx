import { Settings2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useFeatureFlags, setFeatureFlags } from "@/lib/featureFlags";
import { toast } from "sonner";

const ProductionToggles = () => {
  const flags = useFeatureFlags();

  const handleToggle = (key: "demoAccountsEnabled" | "googleSignInEnabled", value: boolean) => {
    setFeatureFlags({ [key]: value });
    toast.success(
      `${key === "demoAccountsEnabled" ? "Demo accounts" : "Google sign-in"} ${value ? "enabled" : "disabled"}`
    );
  };

  return (
    <Card className="mt-8">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold text-foreground">Production toggles</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Disable demo entry points and third-party providers when preparing for production.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium text-foreground">Demo account view</p>
              <p className="text-xs text-muted-foreground">
                Show the "Quick Demo Login" student/admin shortcuts on the sign-in page.
              </p>
            </div>
            <Switch
              checked={flags.demoAccountsEnabled}
              onCheckedChange={(v) => handleToggle("demoAccountsEnabled", v)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium text-foreground">Google sign-in</p>
              <p className="text-xs text-muted-foreground">
                Show the "Continue with Google" OAuth button on the sign-in page.
              </p>
            </div>
            <Switch
              checked={flags.googleSignInEnabled}
              onCheckedChange={(v) => handleToggle("googleSignInEnabled", v)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductionToggles;
