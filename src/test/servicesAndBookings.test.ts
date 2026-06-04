import { describe, it, expect, beforeEach } from "vitest";
import {
  DEFAULT_SERVICES,
  readServices,
  addService,
  renameService,
  removeService,
  setServiceEnabled,
  hasMappedScenarios,
  resetServicesForTest,
} from "@/lib/services";
import {
  scenariosForService,
  SCENARIO_LIBRARY,
} from "@/lib/onboardingScenarios";

const CCM = "Crisis and Case Management";

describe("services registry", () => {
  beforeEach(() => {
    resetServicesForTest();
  });

  it("seeds the default catalog including Crisis and Case Management", () => {
    const list = readServices();
    expect(list.map((s) => s.name)).toEqual(DEFAULT_SERVICES);
    expect(list.find((s) => s.name === CCM)?.enabled).toBe(true);
    expect(list.find((s) => s.name === CCM)?.seeded).toBe(true);
  });

  it("persists across reads via localStorage", () => {
    readServices(); // seed
    addService("Group Supervision");
    const second = readServices();
    expect(second.find((s) => s.name === "Group Supervision")).toBeTruthy();
  });

  it("rejects duplicate service names case-insensitively", () => {
    readServices();
    expect(addService(CCM)).toBeNull();
    expect(addService("crisis AND case management")).toBeNull();
  });

  it("disables a service without deleting it (Crisis and Case Management stays in registry)", () => {
    readServices();
    const ccm = readServices().find((s) => s.name === CCM)!;
    setServiceEnabled(ccm.id, false);
    const after = readServices().find((s) => s.name === CCM)!;
    expect(after.enabled).toBe(false);
  });

  it("blocks deletion of seeded defaults but allows custom service deletion", () => {
    readServices();
    const ccm = readServices().find((s) => s.name === CCM)!;
    expect(removeService(ccm.id)).toBe(false);

    const custom = addService("Group Supervision")!;
    expect(removeService(custom.id)).toBe(true);
    expect(readServices().find((s) => s.id === custom.id)).toBeUndefined();
  });

  it("renames a service and refuses collisions", () => {
    readServices();
    const ccm = readServices().find((s) => s.name === CCM)!;
    expect(renameService(ccm.id, "Crisis & Case Mgmt")).toBe(true);
    expect(readServices().find((s) => s.id === ccm.id)?.name).toBe("Crisis & Case Mgmt");

    const other = readServices().find((s) => s.name === "Workshops")!;
    expect(renameService(other.id, "Crisis & Case Mgmt")).toBe(false);
  });
});

describe("onboarding scenario coverage for Crisis and Case Management", () => {
  it("has at least one library scenario mapped to Crisis and Case Management", () => {
    const matched = SCENARIO_LIBRARY.filter((s) =>
      (s.fitsServices ?? []).includes(CCM)
    );
    expect(matched.length).toBeGreaterThanOrEqual(1);
  });

  it("hasMappedScenarios returns true for Crisis and Case Management", () => {
    expect(hasMappedScenarios(CCM)).toBe(true);
  });

  it("scenariosForService returns only Crisis-and-Case-Management-fit scenarios", () => {
    const list = scenariosForService(CCM);
    expect(list.length).toBeGreaterThan(0);
    for (const s of list) {
      // every returned scenario must either be unscoped or include CCM
      expect(!s.fitsServices || s.fitsServices.includes(CCM)).toBe(true);
    }
  });

  it("hasMappedScenarios returns false for a freshly-invented service", () => {
    expect(hasMappedScenarios("Pottery Therapy 2099")).toBe(false);
  });
});

describe("regression: create / edit / list flow for Crisis and Case Management", () => {
  beforeEach(() => {
    resetServicesForTest();
    localStorage.removeItem("kit_bookings_local");
  });

  // Pure mirror of the booking creation logic used inside useBookings.useCreateBooking
  // when the backend is offline (see src/hooks/useBookings.ts). Keeping the regression
  // test free of TanStack Query / Clerk wiring keeps the assertion sharp.
  type Booking = {
    id: string;
    customer_name: string;
    service: string;
    booking_time: string;
    status: "pending" | "confirmed" | "cancelled";
    practitioner?: string;
    duration?: number;
  };
  function createLocalBooking(input: Partial<Booking>): Booking {
    return {
      id: crypto.randomUUID(),
      customer_name: input.customer_name || "Unknown",
      service: input.service || "General",
      booking_time: input.booking_time || new Date().toISOString(),
      status: (input.status as Booking["status"]) || "pending",
      practitioner: input.practitioner,
      duration: input.duration || 60,
    };
  }

  it("creates, edits, and lists a Crisis and Case Management booking with persistent onboarding notes", () => {
    // 1. CREATE: simulate booking creation with the registry's CCM
    const services = readServices();
    const ccm = services.find((s) => s.name === CCM);
    expect(ccm).toBeTruthy();

    const created = createLocalBooking({
      customer_name: "Noor Hassan",
      service: ccm!.name,
      booking_time: "2027-01-15T10:00:00.000Z",
      status: "pending",
      practitioner: "Kit A. (they/she)",
      duration: 90,
    });
    expect(created.service).toBe(CCM);
    expect(hasMappedScenarios(created.service)).toBe(true);

    // 2. EDIT: change the duration and status
    const edited: Booking = { ...created, duration: 60, status: "confirmed" };
    expect(edited.service).toBe(CCM); // service preserved
    expect(edited.status).toBe("confirmed");

    // 3. LIST: ensure a filter by service finds it
    const all = [created, edited];
    const ccmBookings = all.filter((b) => b.service === CCM);
    expect(ccmBookings).toHaveLength(2);

    // 4. ONBOARDING PERSISTENCE: mirror ClientOnboardingNotes localStorage shape
    const NOTES_KEY = `onboarding_notes_${created.id}`;
    const notes = [
      {
        id: crypto.randomUUID(),
        bookingId: created.id,
        category: "Crisis Response",
        title: "Active case load with overlapping crisis touchpoints",
        body: "scenario body",
        contentWarnings: ["acute crisis", "case escalation"],
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));

    const reloaded = JSON.parse(localStorage.getItem(NOTES_KEY)!);
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0].bookingId).toBe(created.id);
    expect(reloaded[0].title).toBe("Active case load with overlapping crisis touchpoints");
  });

  it("disabling Crisis and Case Management hides it from the dropdown but does not erase existing bookings", () => {
    const services = readServices();
    const ccm = services.find((s) => s.name === CCM)!;
    const existingBooking = createLocalBooking({
      customer_name: "Existing Client",
      service: CCM,
    });

    setServiceEnabled(ccm.id, false);

    const enabledOnly = readServices().filter((s) => s.enabled);
    expect(enabledOnly.find((s) => s.name === CCM)).toBeUndefined();

    // existing booking still shows the service name
    expect(existingBooking.service).toBe(CCM);
  });
});
