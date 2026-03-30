import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, Wallet, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const productPillars = [
  {
    title: "Position Intelligence",
    description: "Track quantity, average buy price, LTP, current value, and realized or unrealized P&L in one focused workspace.",
    icon: <BarChart2Icon />,
  },
  {
    title: "Action-Oriented Workflow",
    description: "Add, sell, inspect history, and clean up positions with minimal friction and clear operational guardrails.",
    icon: <ZapIcon />,
  },
  {
    title: "Secure Session Layer",
    description: "Role-aware auth flow, session hydration, and protected navigation paths designed for dependable daily usage.",
    icon: <ShieldIcon />,
  },
];

const workflow = [
  "Onboard with email or OAuth and land directly in your portfolio control center.",
  "Capture buys and sells with date and price metadata for clean historical continuity.",
  "Review active versus dormant positions and evaluate outcomes from one data surface.",
];

// Local icon wrappers to avoid unused import warnings
function BarChart2Icon() { return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function ZapIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>; }
function ShieldIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }

export default function DemoLandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-background relative overflow-hidden">
      {/* Subtle background gradient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full px-4 py-8 md:py-12 flex-1">
        <div className="bg-card border border-border rounded-2xl shadow-md p-5 sm:p-8 md:p-10">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">

            {/* Left column */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge>Portfolio OS</Badge>
                <Badge variant="outline">Real-time Ready</Badge>
                <Badge variant="outline">Auth Secured</Badge>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">
                Run Your Portfolio Like a Desk.
              </h2>

              <p className="text-base text-muted-foreground leading-relaxed mb-6 max-w-prose">
                VittNest gives you a streamlined operating layer for modern equity management:
                add and sell execution, clean historical context, and a focused dashboard for
                decision velocity.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-7">
                <Button size="lg" onClick={() => navigate("/login")} className="gap-2">
                  Launch Workspace <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/register")}>
                  Create Account
                </Button>
              </div>

              <div className="flex flex-col gap-2.5">
                {workflow.map((step) => (
                  <div key={step} className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right panel */}
            <div className="w-full md:w-[42%] shrink-0">
              <div className="rounded-xl border border-border bg-background/60 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-muted-foreground">Product Highlights</span>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-xl font-bold mb-0.5">Unified Stock Ledger</p>
                    <p className="text-sm text-muted-foreground">Single-source clarity across active and exited positions.</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xl font-bold mb-0.5">Execution History Panel</p>
                    <p className="text-sm text-muted-foreground">Inspect transactions, sold quantities, and historical P&L context.</p>
                  </div>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <LineChart className="h-4 w-4 text-primary" />
                      <p className="text-sm font-bold">Built for Daily Review</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Fast, table-driven workflow for investors who need disciplined execution loops.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pillars */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {productPillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-xl border border-border bg-background/60 p-5"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-primary">{pillar.icon}</span>
                  <p className="text-sm font-bold">{pillar.title}</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-auto py-5 bg-primary text-primary-foreground text-center text-sm">
        &copy; {new Date().getFullYear()} VittNest. All rights reserved.
      </footer>
    </div>
  );
}
