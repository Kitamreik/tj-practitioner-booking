import { useState, useEffect } from "react";
import { Star, Quote } from "lucide-react";
import { getTestimonials, type Testimonial } from "@/lib/testimonials";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

const TestimonialsCarousel = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    setTestimonials(getTestimonials());

    const handler = () => setTestimonials(getTestimonials());
    window.addEventListener("testimonials-updated", handler);
    return () => window.removeEventListener("testimonials-updated", handler);
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <section className="container pb-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-heading text-3xl font-bold text-foreground">
          What Our Clients Say
        </h2>
        <p className="mt-3 text-muted-foreground">
          Real experiences from our valued clients
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-3xl px-12">
        <Carousel opts={{ loop: true }}>
          <CarouselContent>
            {testimonials.map((t) => (
              <CarouselItem key={t.id}>
                <div className="rounded-xl border bg-card p-8 text-center">
                  <Quote className="mx-auto mb-4 h-8 w-8 text-primary/40" />
                  <p className="text-lg leading-relaxed text-foreground italic">
                    "{t.quote}"
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < t.rating
                            ? "fill-primary text-primary"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-3 font-heading font-semibold text-foreground">
                    {t.name}
                  </p>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
