export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  createdAt: string;
}

const STORAGE_KEY = "bookflow_testimonials";

const defaultTestimonials: Testimonial[] = [
  {
    id: "default-1",
    name: "Sarah Johnson",
    role: "Wellness Client",
    quote: "BookFlow made scheduling my weekly massage effortless. I love how simple it is!",
    rating: 5,
    createdAt: "2026-01-15T10:00:00",
  },
  {
    id: "default-2",
    name: "Michael Torres",
    role: "Physical Therapy Patient",
    quote: "The practitioners here are top-notch. Booking through BookFlow is a breeze.",
    rating: 5,
    createdAt: "2026-02-20T14:00:00",
  },
  {
    id: "default-3",
    name: "Amanda Liu",
    role: "Regular Client",
    quote: "I've been using BookFlow for months and it keeps getting better. Highly recommend!",
    rating: 4,
    createdAt: "2026-03-01T09:00:00",
  },
];

export function getTestimonials(): Testimonial[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultTestimonials;
}

export function saveTestimonials(testimonials: Testimonial[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(testimonials));
}

export function addTestimonial(testimonial: Omit<Testimonial, "id" | "createdAt">): Testimonial {
  const all = getTestimonials();
  const newEntry: Testimonial = {
    ...testimonial,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  all.push(newEntry);
  saveTestimonials(all);
  return newEntry;
}

export function deleteTestimonial(id: string) {
  const all = getTestimonials().filter((t) => t.id !== id);
  saveTestimonials(all);
}
