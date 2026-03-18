import { Link } from "react-router-dom";
import { Calendar, ArrowRight, Users, Clock, CheckCircle } from "lucide-react";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";

const stats = [
  { label: "Active Practitioners", value: "5", icon: Users },
  { label: "Bookings This Week", value: "3", icon: Calendar },
  { label: "Avg. Session", value: "60 min", icon: Clock },
  { label: "Satisfaction", value: "98%", icon: CheckCircle },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="container py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            Book Your Next
            <span className="text-primary"> Wellness Session</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Connect with expert practitioners and schedule appointments effortlessly.
            Manage your bookings, track your sessions, and take control of your healing journey.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              to="/bookings"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-heading text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
            >
              Browse Bookings
              <ArrowRight className="h-4 w-4" />
            </Link>
            {/* <Link
              to="/sign-in"
              className="inline-flex items-center gap-2 rounded-lg border bg-card px-6 py-3 font-heading text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Sign In
            </Link> */}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container pb-20">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border bg-card p-6 text-center transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <stat.icon className="mx-auto mb-3 h-6 w-6 text-primary" />
              <p className="font-heading text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground">How It Works</h2>
          <p className="mt-3 text-muted-foreground">Three simple steps to your next appointment</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            { step: "1", title: "Choose a Service", desc: "Browse our range of services from qualified practitioners." },
            { step: "2", title: "Pick a Time", desc: "Select from available time slots that fit your schedule." },
            { step: "3", title: "Confirm & Go", desc: "Receive instant confirmation for your session." },
          ].map((item) => (
            <div key={item.step} className="rounded-xl border bg-card p-8">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-heading text-lg font-bold text-primary-foreground">
                {item.step}
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsCarousel />
    </div>
  );
};

export default Index;