import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Zap, Shield, FileText } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background bg-grid relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.1),transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.06),transparent_70%)] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-border/50 glass">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-lg">PRD Wizard</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10">
        <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
          <div className="animate-fade-in space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary">
              <Zap className="w-4 h-4" />
              AI-Powered PRD Generation
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              From <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">idea</span> to
              <br />
              build-ready <span className="bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent">prompt</span>
            </h1>

            <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
              Transform your product ideas into structured PRDs and implementation-ready
              prompts in minutes. Powered by your own OpenAI API key.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="text-base px-8">
                  Start Building <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="text-base px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            <div className="bg-card border border-border rounded-xl p-8 hover:border-border-hover transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Enhanced Ideas</h3>
              <p className="text-muted text-sm leading-relaxed">
                Write your raw idea and let AI refine it with the precision
                of a Senior Full Stack Engineer.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-8 hover:border-border-hover transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Structured PRDs</h3>
              <p className="text-muted text-sm leading-relaxed">
                Auto-generate MVP PRDs with product overview, features,
                tech stack, and success metrics.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-8 hover:border-border-hover transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">BYOK Security</h3>
                <p className="text-muted text-sm leading-relaxed">
                Your OpenAI API key is encrypted at rest with AES-256-GCM.
                We never store it in plaintext.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            4 steps to build-ready
          </h2>
          <div className="grid md:grid-cols-4 gap-4 stagger-children">
            {[
              { step: 1, title: 'Describe', desc: 'Write your system idea' },
              { step: 2, title: 'Generate', desc: 'AI creates your MVP PRD' },
              { step: 3, title: 'Refine', desc: 'Edit and customize' },
              { step: 4, title: 'Export', desc: 'Download build-ready prompts' },
            ].map((item) => (
              <div key={item.step} className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white font-bold text-sm">
                  {item.step}
                </div>
                <h4 className="font-semibold">{item.title}</h4>
                <p className="text-sm text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 mt-16">
          <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-muted">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>PRD Wizard</span>
            </div>
            <p>Built with Next.js, Supabase & OpenAI</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
