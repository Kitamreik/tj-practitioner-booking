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
import { ClipboardList, CheckCircle, ArrowRight, User, Phone, Mail, AlertCircle, Search } from "lucide-react";

const referralSources = [
  "Friend/Family",
  "Social Media",
  "Website Search",
  "Healthcare Provider",
  "Community Event",
  "Other",
];

const services = [
  "Organizational Systems Work",
  "Panels and Talks",
  "Remote & In- Person Conferences",
  "Workshops",
  "One-on-One Consulting",
  "Short Term/Long Term Retainer",
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
  preferredDate: string;
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
  preferredDate?: string;
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
  const [isReturning, setIsReturning] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [pastIntakes, setPastIntakes] = useState<PastIntake[]>([]);
  const [formData, setFormData] = useState<IntakeFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    service: "",
    practitioner: "",
    preferredDate: "",
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

  const matchingClients = useMemo(() => {
    if (!clientSearch.trim()) return [];
    const q = clientSearch.toLowerCase();
    // Deduplicate by fullName
    const seen = new Set<string>();
    return pastIntakes.filter((r) => {
      if (seen.has(r.fullName)) return false;
      seen.add(r.fullName);
      return r.fullName.toLowerCase().includes(q);
    }).slice(0, 5);
  }, [clientSearch, pastIntakes]);

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

    if (!formData.preferredDate) {
      newErrors.preferredDate = "Please select a preferred date.";
    } else if (new Date(formData.preferredDate) < new Date()) {
      newErrors.preferredDate = "Date must be in the future.";
    }

    if (!formData.concerns.trim()) newErrors.concerns = "Please describe your primary concerns.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

    createBooking.mutate(
      {
        customer_name: fullName,
        service: formData.service,
        booking_time: new Date(formData.preferredDate).toISOString(),
        status: "pending",
        practitioner: formData.practitioner || undefined,
        duration: 60,
      },
      {
        onSuccess: () => {
          // Also store the intake details locally for fellow review
          const intakeRecords = JSON.parse(localStorage.getItem("practicum_intakes") || "[]");
          intakeRecords.push({
            id: crypto.randomUUID(),
            ...formData,
            fullName,
            submittedAt: new Date().toISOString(),
          });
          localStorage.setItem("practicum_intakes", JSON.stringify(intakeRecords));
          setSubmitted(true);
        },
      }
    );
  };

  const resetForm = () => {
    setFormData({
      firstName: "", lastName: "", email: "", phone: "",
      service: "", practitioner: "", preferredDate: "",
      urgency: "Medium", referralSource: "", concerns: "", goals: "",
    });
    setErrors({});
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-12">
        <Card className="w-full max-w-md text-center">
          <CardContent className="space-y-4 pb-8 pt-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Intake Submitted!</h2>
            <p className="text-muted-foreground">
              Your client intake has been recorded and a booking request created. A practitioner will follow up shortly.
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Information
            </CardTitle>
            <CardDescription>All fields marked with * are required.</CardDescription>
          </CardHeader>
          <CardContent>
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
                          <SelectItem key={s} value={s}>{s}</SelectItem>
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
                    <Label htmlFor="pi-date">Preferred Date *</Label>
                    <Input
                      id="pi-date"
                      type="datetime-local"
                      value={formData.preferredDate}
                      onChange={(e) => updateField("preferredDate", e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      aria-invalid={!!errors.preferredDate}
                    />
                    {errors.preferredDate && <p className="text-xs text-destructive">{errors.preferredDate}</p>}
                  </div>
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
                  {createBooking.isPending ? "Submitting Intake..." : "Submit Client Intake"}
                  <ArrowRight className="h-4 w-4" />
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
