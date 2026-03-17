import { useState, useEffect } from "react";
import { Plus, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getTestimonials,
  addTestimonial,
  deleteTestimonial,
  type Testimonial,
} from "@/lib/testimonials";
import { toast } from "@/hooks/use-toast";

const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [isOpen, setIsOpen] = useState(false);

  const refresh = () => setTestimonials(getTestimonials());

  useEffect(() => {
    refresh();
  }, []);

  const handleAdd = () => {
    if (!name.trim() || !quote.trim()) {
      toast({ title: "Name and quote are required", variant: "destructive" });
      return;
    }
    addTestimonial({ name: name.trim(), role: role.trim() || "Client", quote: quote.trim(), rating });
    setName("");
    setRole("");
    setQuote("");
    setRating(5);
    refresh();
    window.dispatchEvent(new Event("testimonials-updated"));
    toast({ title: "Testimonial added" });
  };

  const handleDelete = (id: string) => {
    deleteTestimonial(id);
    refresh();
    window.dispatchEvent(new Event("testimonials-updated"));
    toast({ title: "Testimonial removed" });
  };

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Testimonials
        </h2>
        <Button size="sm" onClick={() => setIsOpen(!isOpen)}>
          <Plus className="mr-1 h-4 w-4" />
          {isOpen ? "Cancel" : "Add"}
        </Button>
      </div>

      {isOpen && (
        <div className="mb-6 space-y-3 rounded-xl border bg-card p-5">
          <Input placeholder="Client name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Role (e.g. Wellness Client)" value={role} onChange={(e) => setRole(e.target.value)} />
          <Textarea placeholder="Testimonial quote" value={quote} onChange={(e) => setQuote(e.target.value)} />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rating:</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)}>
                <Star
                  className={`h-5 w-5 transition-colors ${
                    n <= rating ? "fill-primary text-primary" : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          <Button onClick={handleAdd} className="w-full">
            Add Testimonial
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {testimonials.map((t) => (
          <div key={t.id} className="flex items-start justify-between rounded-xl border bg-card p-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.role}</p>
              <p className="mt-1 text-sm text-foreground/80 italic">"{t.quote}"</p>
              <div className="mt-1 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < t.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="shrink-0 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminTestimonials;
