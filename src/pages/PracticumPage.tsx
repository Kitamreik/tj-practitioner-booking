import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateBooking } from "@/hooks/useBookings";
import { useEnabledServices, hasMappedScenarios } from "@/lib/services";
import { useIsSignedIn } from "@/lib/useSession";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ClipboardList, CheckCircle, ArrowRight, User, Phone, Mail, AlertCircle, Search, LogIn, Lock, Copy, Hash } from "lucide-react";

/**
 * Generates a human-readable intake reference (e.g. INT-A3F91C).
 * Uses crypto.getRandomValues so the ID is unpredictable — clients must
 * hold on to it to retrieve their submission later.
 */
const generateIntakeRef = (): string => {
  const buf = new Uint8Array(3);
  crypto.getRandomValues(buf);
  return "INT-" + Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
};

const referralSources = [
  "Friend/Family",
  "Social Media",
  "Website Search",
  "Healthcare Provider",
  "Community Event",
  "Other",
];

const practitioners = [
  "Kit A. (they/she)",
  "Tree Y. (she/they)",
  "Cori F. (she/her)",
  "Timothy C. (he/him)",
  "Ray V. (he/him)",
];

const urgencyLevels = ["Low", "Medium", "High"];

interface IntakeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  service: string;
  practitioner: string;
  urgency: string;
  referralSource: string;
  concerns: string;
  goals: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  service?: string;
  concerns?: string;
}

interface PastIntake {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  service: string;
  practitioner: string;
  urgency: string;
  referralSource: string;
  concerns: string;
  goals: string;
}

const PracticumPage = () => {
  const services = useEnabledServices();
  const { isSignedIn } = useIsSignedIn();
  const navigate = useNavigate();
  const [isReturning, setIsReturning] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [pastIntakes, setPastIntakes] = useState<PastIntake[]>([]);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [formData, setFormData] = useState<IntakeFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    service: "",
    practitioner: "",
    urgency: "Medium",
    referralSource: "",
    concerns: "",
    goals: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const createBooking = useCreateBooking();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("practicum_intakes") || "[]");
    setPastIntakes(stored);
  }, []);

  // Search access model (mirrors what a server would enforce):
  //  - Guests may look up an intake ONLY by its exact reference ID.
  //    Name-based lookup would leak other clients' PII to any visitor.
  //  - Signed-in practitioners (fellow/admin/webmaster) may search by
  //    partial name OR reference ID.
  const matchingClients = useMemo(() => {
    const raw = clientSearch.trim();
    if (!raw) return [];
    const q = raw.toLowerCase();
    const looksLikeRef = /^int-[0-9a-f]{6}$/i.test(raw);

    if (!isSignedIn) {
      if (!looksLikeRef) return [];
      return pastIntakes.filter((r) => r.id.toLowerCase() === q).slice(0, 1);
    }

    const seen = new Set<string>();
    return pastIntakes.filter((r) => {
      if (r.id.toLowerCase() === q) return true;
      if (seen.has(r.fullName)) return false;
      seen.add(r.fullName);
      return r.fullName.toLowerCase().includes(q);
    }).slice(0, 5);
  }, [clientSearch, pastIntakes, isSignedIn]);

  const prefillFromRecord = (record: PastIntake) => {
    setFormData((prev) => ({
      ...prev,
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phone: record.phone || "",
      service: record.service || "",
      practitioner: record.practitioner || "",
      referralSource: record.referralSource || "",
    }));
    setClientSearch("");
    toast.success(`Prefilled from intake ${record.id}`);
  };

  const updateField = (field: keyof IntakeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required.";
    else if (formData.firstName.trim().length < 2) newErrors.firstName = "Must be at least 2 characters.";

    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required.";
    else if (formData.lastName.trim().length < 2) newErrors.lastName = "Must be at least 2 characters.";

    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) newErrors.email = "Invalid email address.";

    if (!formData.service) newErrors.service = "Please select a service.";

    if (!formData.concerns.trim()) newErrors.concerns = "Please describe your primary concerns.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const persistIntakeRecord = (fullName: string): string => {
    const intakeRecords = JSON.parse(localStorage.getItem("practicum_intakes") || "[]");
    const ref = generateIntakeRef();
    const record = {
      id: ref,
      ...formData,
      fullName,
      submittedAt: new Date().toISOString(),
      submittedBy: isSignedIn ? "practitioner" : "guest",
    };
    intakeRecords.push(record);
    localStorage.setItem("practicum_intakes", JSON.stringify(intakeRecords));
    setPastIntakes(intakeRecords);
    return ref;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!hasMappedScenarios(formData.service)) {
      toast.warning(`Heads up: "${formData.service}" has no onboarding scenarios mapped yet.`);
    }

    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

    if (!isSignedIn) {
      const ref = persistIntakeRecord(fullName);
      setSubmittedRef(ref);
      setSubmitted(true);
      return;
    }

    createBooking.mutate(
      {
        customer_name: fullName,
        service: formData.service,
        booking_time: new Date().toISOString(),
        status: "pending",
        practitioner: formData.practitioner || undefined,
        duration: 60,
      },
      {
        onSuccess: () => {
          const ref = persistIntakeRecord(fullName);
          setSubmittedRef(ref);
          setSubmitted(true);
        },
      }
    );
  };

  const resetForm = () => {
    setFormData({
      firstName: "", lastName: "", email: "", phone: "",
      service: "", practitioner: "",
      urgency: "Medium", referralSource: "", concerns: "", goals: "",
    });
    setErrors({});
    setSubmitted(false);
    setSubmittedRef(null);
  };

  const copyRef = async () => {
    if (!submittedRef) return;
    try {
      await navigator.clipboard.writeText(submittedRef);
      toast.success("Reference ID copied");
    } catch {
      toast.error("Copy failed — please copy manually.");
    }
  };

  if (submitted && submittedRef) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-12">
        <Card className="w-full max-w-md text-center">
          <CardContent className="space-y-4 pb-8 pt-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Intake Submitted</h2>
            <p className="text-sm text-muted-foreground">
              Save your reference ID — you'll need it to look up this intake later.
            </p>
            <div className="mx-auto flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <Hash className="h-4 w-4 text-primary" />
              <code className="font-mono text-lg font-bold tracking-wider text-foreground" data-testid="intake-ref">
                {submittedRef}
              </code>
              <Button size="sm" variant="ghost" onClick={copyRef} aria-label="Copy reference ID">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              To retrieve this intake, check "I am a returning client" and paste your
              reference ID into the search field.
            </p>
            <Button onClick={resetForm} variant="outline" className="mt-4">
              Submit Another Intake
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <ClipboardList className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Client Intake — Practicum</h1>
          <p className="mt-2 text-muted-foreground">
            Complete this mock intake form to emulate a new client onboarding
          </p>
        </div>

        {!isSignedIn && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              Anyone can submit this intake — a practitioner will follow up by email. You'll receive a reference ID after submitting; keep it safe to look up your intake later.
            </span>
          </div>
        )}


        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Information
            </CardTitle>
            <CardDescription>All fields marked with * are required.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Returning client checkbox */}
            <div className="mb-6 flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
              <Checkbox
                id="returning"
                checked={isReturning}
                onCheckedChange={(checked) => setIsReturning(!!checked)}
              />
              <Label htmlFor="returning" className="cursor-pointer text-sm font-medium">
                I am a returning client
              </Label>
            </div>

            {isReturning && (
              <div className="mb-6 space-y-2">
                <Label className="flex items-center gap-1">
                  <Search className="h-3.5 w-3.5" />
                  {isSignedIn ? "Search by name or reference ID" : "Enter your reference ID"}
                </Label>
                <Input
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder={isSignedIn ? "e.g. Jane Doe or INT-A3F91C" : "INT-XXXXXX"}
                />
                {!isSignedIn && (
                  <p className="text-xs text-muted-foreground">
                    For privacy, guests can only retrieve an intake using the exact reference ID shown after submission.
                  </p>
                )}
                {matchingClients.length > 0 && (
                  <div className="rounded-lg border bg-card p-1">
                    {matchingClients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => prefillFromRecord(c)}
                        className="flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className="font-medium text-foreground">{c.fullName}</span>
                          <code className="font-mono text-[10px] text-primary">{c.id}</code>
                        </div>
                        {isSignedIn && (
                          <span className="text-xs text-muted-foreground">{c.email}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {!isSignedIn && clientSearch.trim() && matchingClients.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No intake found for that reference ID.
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Personal Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pi-first">First Name *</Label>
                  <Input
                    id="pi-first"
                    value={formData.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    placeholder="Jane"
                    aria-invalid={!!errors.firstName}
                  />
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pi-last">Last Name *</Label>
                  <Input
                    id="pi-last"
                    value={formData.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    placeholder="Doe"
                    aria-invalid={!!errors.lastName}
                  />
                  {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pi-email" className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> Email *
                  </Label>
                  <Input
                    id="pi-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="jane@example.com"
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pi-phone" className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> Phone
                  </Label>
                  <Input
                    id="pi-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* Service & Scheduling */}
              <div className="border-t pt-6">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Service & Scheduling</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Service Requested *</Label>
                    <Select value={formData.service} onValueChange={(v) => updateField("service", v)}>
                      <SelectTrigger aria-invalid={!!errors.service}>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((s) => (
                          <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.service && <p className="text-xs text-destructive">{errors.service}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Practitioner</Label>
                    <Select value={formData.practitioner} onValueChange={(v) => updateField("practitioner", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any available" />
                      </SelectTrigger>
                      <SelectContent>
                        {practitioners.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Urgency
                    </Label>
                    <Select value={formData.urgency} onValueChange={(v) => updateField("urgency", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {urgencyLevels.map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Clinical Details */}
              <div className="border-t pt-6">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Intake Details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pi-concerns">Primary Concerns *</Label>
                    <Textarea
                      id="pi-concerns"
                      value={formData.concerns}
                      onChange={(e) => updateField("concerns", e.target.value)}
                      placeholder="Describe the client's primary concerns or reasons for seeking services..."
                      rows={3}
                      aria-invalid={!!errors.concerns}
                    />
                    {errors.concerns && <p className="text-xs text-destructive">{errors.concerns}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pi-goals">Goals & Desired Outcomes</Label>
                    <Textarea
                      id="pi-goals"
                      value={formData.goals}
                      onChange={(e) => updateField("goals", e.target.value)}
                      placeholder="What outcomes is the client hoping to achieve?"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Referral Source</Label>
                    <Select value={formData.referralSource} onValueChange={(v) => updateField("referralSource", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="How did they hear about us?" />
                      </SelectTrigger>
                      <SelectContent>
                        {referralSources.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t pt-6">
                <Button type="submit" className="w-full gap-2" disabled={createBooking.isPending}>
                  {createBooking.isPending ? (
                    "Submitting Intake..."
                  ) : (
                    <>
                      Submit Client Intake
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PracticumPage;
