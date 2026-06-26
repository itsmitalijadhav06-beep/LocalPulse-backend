import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Megaphone, Users, Wrench, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LocalPulse — Hyperlocal civic platform for India" },
      { name: "description", content: "Report civic issues, find local events, and connect with trusted service providers in your city." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto h-16 px-4 md:px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary grid place-items-center text-primary-foreground">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg">LocalPulse</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
            <a href="#how" className="text-muted-foreground hover:text-foreground">How it works</a>
            <a href="#cities" className="text-muted-foreground hover:text-foreground">Cities</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted">
              Log in
            </Link>
            <Link to="/signup" className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[color:var(--civic-orange-soft)] via-background to-[color:var(--civic-blue-soft)]" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border text-xs font-semibold text-secondary">
              <Sparkles className="h-3.5 w-3.5" /> Built for Tier-2 & Tier-3 cities
            </span>
            <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
              Your city. <span className="text-primary">Your voice.</span><br />
              Heard locally.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Report potholes, water cuts, and safety issues in seconds. Discover what's happening in your
              neighborhood and find trusted local service providers — all in one place.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/signup" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90">
                Join your city <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/dashboard" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border bg-card font-semibold hover:bg-muted">
                Explore demo
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div><span className="font-bold text-foreground">12,400+</span> issues resolved</div>
              <div><span className="font-bold text-foreground">85+</span> cities</div>
              <div><span className="font-bold text-foreground">120k</span> citizens</div>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1200"
              alt="Indian city street"
              className="rounded-3xl shadow-2xl border aspect-[4/5] object-cover"
            />
            <div className="absolute -bottom-6 -left-6 bg-card border rounded-2xl p-4 shadow-xl flex items-center gap-3 max-w-[260px]">
              <div className="h-10 w-10 rounded-xl bg-[color:var(--status-resolved)]/15 text-[color:var(--status-resolved)] grid place-items-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-sm">Pothole resolved</div>
                <div className="text-xs text-muted-foreground">MG Road, 0.8 km away</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Everything your neighborhood needs</h2>
          <p className="mt-3 text-muted-foreground">One app for reporting issues, finding events and hiring trusted local help.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            { icon: Megaphone, title: "Report in 30 seconds", desc: "Snap a photo, drop a pin, hit submit. Anonymous or with your name — your choice." },
            { icon: Users, title: "Local events & meetups", desc: "Stay in the loop on health camps, clean-up drives and cultural events near you." },
            { icon: Wrench, title: "Verified service providers", desc: "Plumbers, electricians, tutors and more — rated by your own neighbors." },
          ].map((f) => (
            <div key={f.title} className="bg-card border rounded-2xl p-6 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-bold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="py-20 bg-muted/40 border-y">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center">How it works</h2>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Spot an issue", d: "See a pothole, broken light or water cut? Open LocalPulse." },
              { n: "02", t: "Report it instantly", d: "Photo, category, location — done. AI auto-tags severity." },
              { n: "03", t: "Track to resolution", d: "Get updates as the municipal team marks it In Progress and Resolved." },
            ].map((s) => (
              <div key={s.n} className="bg-card rounded-2xl p-6 border">
                <div className="text-primary font-extrabold text-2xl">{s.n}</div>
                <h3 className="mt-2 font-bold text-lg">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cities" className="py-20 max-w-7xl mx-auto px-4 md:px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Now live in 85+ cities</h2>
        <p className="mt-3 text-muted-foreground">Indore, Bhopal, Jaipur, Lucknow, Nagpur, Coimbatore, Patna and many more.</p>
        <Link to="/signup" className="mt-7 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold">
          Add your city <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} LocalPulse. Made with care for India's cities.
      </footer>
    </div>
  );
}
