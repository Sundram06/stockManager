import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Box, Button, Typography, useMediaQuery } from "@mui/material";
import PublicNav from "../component/PublicNav";
import BoltIcon from "@mui/icons-material/Bolt";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import RemoveOutlinedIcon from "@mui/icons-material/RemoveOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import AddBusinessOutlinedIcon from "@mui/icons-material/AddBusinessOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";

// ─── Scroll animation hook ───────────────────────────────────────────────────
function useRevealOnScroll() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, visible];
}

// ─── Section wrapper with fade-up reveal ─────────────────────────────────────
function RevealSection({ children, style, ...props }) {
  const [ref, visible] = useRevealOnScroll();
  return (
    <Box
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
        ...style,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

export default function DemoLandingPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDark = theme.palette.mode === "dark";
  const teal = theme.palette.primary.main;
  const paper = theme.palette.background.paper;
  const elevated = theme.palette.background.elevated ?? (isDark ? "#1a1a1a" : "#F0F0F5");
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const border = theme.palette.divider;

  const glassPanel = {
    background: isDark ? "rgba(26,26,26,0.5)" : "rgba(255,255,255,0.65)",
    backdropFilter: "blur(20px)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : `rgba(10,123,123,0.12)`}`,
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @keyframes floatA {
          0%,100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-22px) rotate(-2deg); }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(0px) rotate(1deg); }
          50% { transform: translateY(-14px) rotate(1deg); }
        }
        @keyframes floatC {
          0%,100% { transform: translateY(0px) rotate(3deg); }
          50% { transform: translateY(-18px) rotate(3deg); }
        }
        @keyframes floatD {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes heroLine {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-line-1 { animation: heroLine 0.75s ease-out 0.1s both; }
        .hero-line-2 { animation: heroLine 0.75s ease-out 0.28s both; }
        .hero-sub   { animation: heroLine 0.75s ease-out 0.46s both; }
        .hero-ctas  { animation: heroLine 0.75s ease-out 0.62s both; }
        .feature-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .feature-card:hover {
          transform: translateY(-5px);
        }
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <PublicNav />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <Box
        component="header"
        sx={{
          minHeight: "100vh",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
          pt: "80px",
        }}
      >
        {/* Radial glow */}
        <Box sx={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          background: isDark
            ? `radial-gradient(ellipse 70% 60% at 50% 40%, rgba(15,179,175,0.10) 0%, transparent 70%)`
            : `radial-gradient(ellipse 70% 60% at 50% 40%, rgba(10,123,123,0.06) 0%, transparent 70%)`,
        }} />

        {/* Floating ghost numbers */}
        {[
          { text: "+12.4%", style: { top: "18%", left: "8%", fontSize: "clamp(2rem,5vw,3.5rem)", animation: "floatA 9s ease-in-out infinite", color: teal } },
          { text: "₹1.2M", style: { top: "42%", right: "8%", fontSize: "clamp(2.5rem,7vw,5rem)", animation: "floatB 11s ease-in-out infinite 1s", color: textSecondary } },
          { text: "−2.1%", style: { bottom: "22%", left: "18%", fontSize: "clamp(1.5rem,4vw,2.8rem)", animation: "floatC 7s ease-in-out infinite 2s", color: isDark ? "#ef4444" : "#dc2626" } },
          { text: "420.69", style: { top: "22%", right: "26%", fontSize: "clamp(1.2rem,3vw,2.2rem)", animation: "floatD 13s ease-in-out infinite 0.5s", color: textSecondary } },
        ].map(({ text, style }) => (
          <Box key={text} sx={{
            position: "absolute", zIndex: 0, pointerEvents: "none", userSelect: "none",
            opacity: 0.09, fontFamily: '"Newsreader", serif', fontStyle: "italic",
            ...style,
          }}>
            {text}
          </Box>
        ))}

        {/* Hero content */}
        <Box sx={{ position: "relative", zIndex: 1, textAlign: "center", px: { xs: 3, md: 6 }, maxWidth: "900px", mx: "auto" }}>
          <Typography
            component="h1"
            className="hero-line-1"
            sx={{
              fontFamily: '"Newsreader", serif',
              fontSize: "clamp(2.8rem, 8vw, 6.5rem)",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: textPrimary,
              mb: 0,
            }}
          >
            Track every{" "}
            <Box component="span" sx={{ color: teal, fontStyle: "italic" }}>rupee</Box>.
          </Typography>
          <Typography
            component="h1"
            className="hero-line-2"
            sx={{
              fontFamily: '"Newsreader", serif',
              fontSize: "clamp(2.8rem, 8vw, 6.5rem)",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: textPrimary,
              mb: 4,
            }}
          >
            Know every position.
          </Typography>

          <Typography
            className="hero-sub"
            sx={{
              fontFamily: '"Manrope", sans-serif',
              fontSize: { xs: "1rem", md: "1.2rem" },
              color: textSecondary,
              maxWidth: "580px",
              mx: "auto",
              lineHeight: 1.7,
              mb: 5,
            }}
          >
            Precision FIFO average pricing, real-time P&L from Upstox, and an immutable trade history.
            Stop tracking your wealth in broken spreadsheets.
          </Typography>

          <Box
            className="hero-ctas"
            sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}
          >
            <Button
              variant="contained"
              onClick={() => navigate("/register")}
              sx={{
                bgcolor: teal, color: "#fff",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: "0.8rem", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                px: 5, py: 1.8, borderRadius: "0.5rem", boxShadow: "none",
                "&:hover": { bgcolor: teal, filter: "brightness(0.88)", boxShadow: "none" },
              }}
            >
              Get Started
            </Button>
            <Button
              onClick={() => navigate("/login")}
              sx={{
                ...glassPanel,
                color: textPrimary,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: "0.8rem", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                px: 5, py: 1.8, borderRadius: "0.5rem",
                "&:hover": { filter: "brightness(0.94)", background: glassPanel.background },
              }}
            >
              Sign In
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ── PROBLEM SECTION ──────────────────────────────────────────────── */}
      <Box
        component="section"
        sx={{
          py: { xs: 10, md: 18 },
          px: { xs: 3, md: 8 },
          bgcolor: isDark ? paper : "#FFFFFF",
        }}
      >
        <Box sx={{
          maxWidth: "1400px", mx: "auto",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: { xs: 8, md: 14 },
          alignItems: "start",
        }}>
          {/* Sticky left */}
          <RevealSection sx={{ position: { md: "sticky" }, top: { md: "120px" } }}>
            <Typography sx={{
              fontFamily: '"Newsreader", serif',
              fontSize: { xs: "2.2rem", md: "3rem", lg: "3.6rem" },
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              color: textPrimary,
            }}>
              Most investors track in{" "}
              <Box component="span" sx={{ fontStyle: "italic", color: textSecondary }}>Excel</Box>.
              <br />
              That breaks the moment you add a second buy.
            </Typography>
            <Box sx={{ mt: 5, height: "3px", width: "80px", bgcolor: teal, borderRadius: "2px" }} />
          </RevealSection>

          {/* Pain points */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 6, md: 10 } }}>
            {[
              {
                label: "01 / The FIFO Gap",
                title: "Stale calculation models",
                body: "Excel doesn't understand First-In-First-Out. Your tax liabilities and real cost-basis are hidden behind simple averages that lie about your true performance.",
              },
              {
                label: "02 / Delayed Reality",
                title: "Manual data entry fatigue",
                body: "By the time you update your sheet, the market has moved. Decisions made on old data aren't decisions — they're guesses.",
              },
              {
                label: "03 / Position Fragmentation",
                title: "Disconnected ecosystem",
                body: "Your broker knows your current holdings, but not your history. Your bank knows your cash, but not your exposure. VittNest bridges the divide.",
              },
            ].map(({ label, title, body }, i) => (
              <RevealSection key={label} style={{ transitionDelay: `${i * 0.1}s` }}>
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: "0.7rem", fontWeight: 700,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  color: teal, mb: 1.5,
                }}>
                  {label}
                </Typography>
                <Typography sx={{
                  fontFamily: '"Newsreader", serif',
                  fontSize: { xs: "1.5rem", md: "1.8rem" },
                  fontWeight: 600, color: textPrimary, mb: 1.5,
                }}>
                  {title}
                </Typography>
                <Typography sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontSize: "1rem", color: textSecondary, lineHeight: 1.75,
                }}>
                  {body}
                </Typography>
              </RevealSection>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <Box
        component="section"
        sx={{ py: { xs: 10, md: 18 }, px: { xs: 3, md: 8 } }}
      >
        <Box sx={{ maxWidth: "1400px", mx: "auto" }}>
          {/* Section header */}
          <RevealSection>
            <Box sx={{
              display: "flex", flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between", alignItems: { md: "flex-end" },
              mb: { xs: 6, md: 10 }, gap: 3,
            }}>
              <Typography sx={{
                fontFamily: '"Newsreader", serif',
                fontSize: { xs: "2.8rem", md: "4rem", lg: "5rem" },
                fontWeight: 700, letterSpacing: "-0.03em", color: textPrimary,
                lineHeight: 1,
              }}>
                Sovereign Intel.
              </Typography>
              <Typography sx={{
                fontFamily: '"Manrope", sans-serif',
                fontSize: "1rem", color: textSecondary,
                maxWidth: "340px", lineHeight: 1.7,
              }}>
                Every tool designed for high-conviction portfolios where every basis point matters.
              </Typography>
            </Box>
          </RevealSection>

          {/* Feature grid */}
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(12, 1fr)" },
            gap: 3,
          }}>
            {/* LTP Card — 8 cols */}
            <RevealSection style={{ gridColumn: isMobile ? "span 1" : "span 8" }}>
              <Box
                className="feature-card"
                sx={{
                  bgcolor: paper,
                  border: `1px solid ${border}`,
                  borderRadius: "1rem",
                  p: { xs: 4, md: 6 },
                  position: "relative", overflow: "hidden", height: "100%",
                }}
              >
                <BoltIcon sx={{ color: teal, fontSize: "2rem", mb: 2 }} />
                <Typography sx={{
                  fontFamily: '"Newsreader", serif', fontStyle: "italic",
                  fontSize: { xs: "1.6rem", md: "2.2rem" }, fontWeight: 600,
                  color: textPrimary, mb: 1.5,
                }}>
                  Live LTP Integration
                </Typography>
                <Typography sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontSize: "0.95rem", color: textSecondary,
                  maxWidth: "320px", lineHeight: 1.7, mb: 5,
                }}>
                  Stream direct market prices via Upstox API. No refreshes. No delays. Pure velocity.
                </Typography>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, flexWrap: "wrap" }}>
                  <Typography sx={{
                    fontFamily: '"Newsreader", serif',
                    fontSize: { xs: "1.8rem", md: "2.6rem" }, fontWeight: 700,
                    color: textPrimary,
                  }}>
                    HDFCBANK
                  </Typography>
                  <Typography sx={{
                    fontFamily: '"Newsreader", serif',
                    fontSize: { xs: "1.4rem", md: "1.8rem" },
                    color: isDark ? "#22c55e" : "#16a34a", fontWeight: 600,
                  }}>
                    ₹1,642.45
                  </Typography>
                  <Box sx={{
                    bgcolor: isDark ? "rgba(34,197,94,0.12)" : "rgba(22,163,74,0.10)",
                    color: isDark ? "#22c55e" : "#16a34a",
                    px: 1.2, py: 0.4, borderRadius: "0.4rem",
                    fontFamily: '"DM Sans", sans-serif', fontSize: "0.75rem", fontWeight: 700,
                  }}>
                    +1.2%
                  </Box>
                </Box>
                {/* Ghost icon */}
                <TrendingUpOutlinedIcon sx={{
                  position: "absolute", top: 16, right: 16,
                  fontSize: "12rem", color: textPrimary, opacity: 0.025,
                  pointerEvents: "none",
                }} />
              </Box>
            </RevealSection>

            {/* FIFO Card — 4 cols */}
            <RevealSection style={{ gridColumn: isMobile ? "span 1" : "span 4" }}>
              <Box
                className="feature-card"
                sx={{
                  bgcolor: elevated,
                  border: `1px solid ${border}`,
                  borderRadius: "1rem",
                  p: { xs: 4, md: 6 },
                  display: "flex", flexDirection: "column",
                  justifyContent: "space-between", height: "100%",
                }}
              >
                <Box>
                  <CalculateOutlinedIcon sx={{ color: teal, fontSize: "2rem", mb: 2 }} />
                  <Typography sx={{
                    fontFamily: '"Newsreader", serif', fontStyle: "italic",
                    fontSize: { xs: "1.4rem", md: "1.7rem" }, fontWeight: 600,
                    color: textPrimary, mb: 1.5,
                  }}>
                    FIFO Engine
                  </Typography>
                  <Typography sx={{
                    fontFamily: '"Manrope", sans-serif',
                    fontSize: "0.9rem", color: textSecondary, lineHeight: 1.7,
                  }}>
                    Automatic allocation of sell orders against your earliest buys.
                    Precise tax planning on autopilot.
                  </Typography>
                </Box>
                {/* Mock FIFO table */}
                <Box sx={{
                  mt: 4,
                  bgcolor: isDark ? "rgba(17,17,17,0.6)" : "rgba(255,255,255,0.7)",
                  border: `1px solid ${border}`,
                  borderRadius: "0.6rem",
                  p: 2,
                  fontFamily: '"DM Sans", sans-serif', fontSize: "0.75rem",
                }}>
                  {[
                    { label: "BUY 01/01", value: "100 @ ₹150", color: textSecondary },
                    { label: "SELL 05/01", value: "50 @ ₹180", color: isDark ? "#ef4444" : "#dc2626" },
                    { label: "REMAINING", value: "50 @ ₹150", color: teal, divider: true },
                  ].map(({ label, value, color, divider }) => (
                    <Box key={label} sx={{
                      display: "flex", justifyContent: "space-between",
                      pt: divider ? 1.2 : 0, pb: 1,
                      borderTop: divider ? `1px solid ${border}` : "none",
                    }}>
                      <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: "0.72rem", color: textSecondary }}>{label}</Typography>
                      <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: "0.72rem", fontWeight: 700, color }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </RevealSection>

            {/* Ledger Card — 12 cols */}
            <RevealSection style={{ gridColumn: "span 12" }}>
              <Box
                className="feature-card"
                sx={{
                  bgcolor: paper,
                  border: `1px solid ${border}`,
                  borderRadius: "1rem",
                  p: { xs: 4, md: 6 },
                }}
              >
                <Box sx={{
                  display: "flex", flexDirection: { xs: "column", md: "row" },
                  gap: { xs: 4, md: 8 }, alignItems: { md: "center" },
                }}>
                  <Box sx={{ minWidth: { md: "280px" } }}>
                    <Typography sx={{
                      fontFamily: '"Newsreader", serif',
                      fontSize: { xs: "1.8rem", md: "2.4rem" }, fontWeight: 700,
                      color: textPrimary, mb: 1.5,
                    }}>
                      The Ledger
                    </Typography>
                    <Typography sx={{
                      fontFamily: '"Manrope", sans-serif',
                      fontSize: "0.95rem", color: textSecondary, lineHeight: 1.7,
                    }}>
                      An immutable record of every trade. Complete transparency — every buy lot,
                      every sell, every P&L entry, all in one place.
                    </Typography>
                  </Box>

                  {/* Mock ledger rows */}
                  <Box sx={{
                    flex: 1, ...glassPanel, borderRadius: "0.75rem", p: { xs: 3, md: 4 },
                  }}>
                    {[
                      {
                        icon: <AddOutlinedIcon sx={{ fontSize: "1.1rem" }} />,
                        iconBg: isDark ? "rgba(34,197,94,0.12)" : "rgba(22,163,74,0.10)",
                        iconColor: isDark ? "#22c55e" : "#16a34a",
                        name: "RELIANCE", sub: "Equity · NSE",
                        price: "₹2,945.00", time: "12:45 PM",
                        opacity: 1,
                      },
                      {
                        icon: <RemoveOutlinedIcon sx={{ fontSize: "1.1rem" }} />,
                        iconBg: isDark ? "rgba(239,68,68,0.12)" : "rgba(220,38,38,0.10)",
                        iconColor: isDark ? "#ef4444" : "#dc2626",
                        name: "TCS", sub: "Equity · NSE",
                        price: "₹3,821.10", time: "Yesterday",
                        opacity: 0.45,
                      },
                    ].map(({ icon, iconBg, iconColor, name, sub, price, time, opacity }) => (
                      <Box
                        key={name}
                        sx={{
                          display: "flex", alignItems: "center",
                          justifyContent: "space-between",
                          py: 2, opacity,
                          "&:not(:last-child)": { borderBottom: `1px solid ${border}` },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Box sx={{
                            width: 38, height: 38, borderRadius: "0.5rem",
                            bgcolor: iconBg, color: iconColor,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {icon}
                          </Box>
                          <Box>
                            <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700, fontSize: "0.9rem", color: textPrimary }}>{name}</Typography>
                            <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: "0.75rem", color: textSecondary }}>{sub}</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700, fontSize: "0.9rem", color: textPrimary }}>{price}</Typography>
                          <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: "0.75rem", color: textSecondary }}>{time}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </RevealSection>
          </Box>
        </Box>
      </Box>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <Box
        component="section"
        sx={{
          py: { xs: 10, md: 18 },
          px: { xs: 3, md: 8 },
          bgcolor: isDark ? paper : "#FFFFFF",
        }}
      >
        <Box sx={{ maxWidth: "1400px", mx: "auto" }}>
          <RevealSection>
            <Box sx={{ textAlign: "center", mb: { xs: 8, md: 12 } }}>
              <Typography sx={{
                fontFamily: '"Newsreader", serif',
                fontSize: { xs: "2.8rem", md: "4.5rem" },
                fontWeight: 700, letterSpacing: "-0.03em",
                color: textPrimary, mb: 2,
              }}>
                Simple. Sovereign.
              </Typography>
              <Typography sx={{
                fontFamily: '"Manrope", sans-serif',
                fontSize: "1.05rem", color: textSecondary,
              }}>
                Three steps to start tracking with precision.
              </Typography>
            </Box>
          </RevealSection>

          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: { xs: 6, md: 6 },
          }}>
            {[
              {
                num: "1",
                icon: <AddBusinessOutlinedIcon sx={{ fontSize: "1.8rem" }} />,
                title: "Add stocks",
                body: "Add your stocks manually with the buy date and price. Build your complete position history with precision.",
              },
              {
                num: "2",
                icon: <ShowChartOutlinedIcon sx={{ fontSize: "1.8rem" }} />,
                title: "See prices",
                body: "Your portfolio connects to Upstox for low-latency live price tracking and automated LTP updates.",
              },
              {
                num: "3",
                icon: <InsightsOutlinedIcon sx={{ fontSize: "1.8rem" }} />,
                title: "Track gains",
                body: "Monitor your real-time P&L, FIFO-adjusted performance, and a complete history of every trade.",
              },
            ].map(({ num, icon, title, body }, i) => (
              <RevealSection key={num} style={{ transitionDelay: `${i * 0.12}s` }}>
                <Box sx={{ textAlign: "center", position: "relative", pt: 4 }}>
                  {/* Ghost number */}
                  <Typography sx={{
                    fontFamily: '"Newsreader", serif',
                    fontSize: "8rem", fontWeight: 700,
                    color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                    position: "absolute", top: "-2rem",
                    left: "50%", transform: "translateX(-50%)",
                    userSelect: "none", lineHeight: 1,
                    pointerEvents: "none",
                  }}>
                    {num}
                  </Typography>
                  <Box sx={{ position: "relative", zIndex: 1 }}>
                    <Box sx={{
                      width: 72, height: 72, borderRadius: "50%", mx: "auto", mb: 3,
                      bgcolor: elevated, border: `1px solid ${border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: teal,
                    }}>
                      {icon}
                    </Box>
                    <Typography sx={{
                      fontFamily: '"Newsreader", serif', fontStyle: "italic",
                      fontSize: "1.5rem", fontWeight: 600, color: textPrimary, mb: 1.5,
                    }}>
                      {title}
                    </Typography>
                    <Typography sx={{
                      fontFamily: '"Manrope", sans-serif',
                      fontSize: "0.95rem", color: textSecondary, lineHeight: 1.75,
                      maxWidth: "280px", mx: "auto",
                    }}>
                      {body}
                    </Typography>
                  </Box>
                </Box>
              </RevealSection>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── CTA SECTION ──────────────────────────────────────────────────── */}
      <Box
        component="section"
        sx={{ py: { xs: 10, md: 18 }, px: { xs: 3, md: 8 } }}
      >
        <RevealSection>
          <Box sx={{
            maxWidth: "800px", mx: "auto",
            ...glassPanel, borderRadius: "1.5rem",
            p: { xs: 6, md: 10 }, textAlign: "center",
          }}>
            <Typography sx={{
              fontFamily: '"Newsreader", serif',
              fontSize: { xs: "2.2rem", md: "3.2rem", lg: "3.8rem" },
              fontWeight: 700, lineHeight: 1.2,
              letterSpacing: "-0.02em", color: textPrimary, mb: 3,
            }}>
              Ready to take control of{" "}
              <Box component="span" sx={{ color: teal, fontStyle: "italic" }}>
                your portfolio
              </Box>?
            </Typography>
            <Typography sx={{
              fontFamily: '"Manrope", sans-serif',
              fontSize: "1.05rem", color: textSecondary,
              mb: 5, lineHeight: 1.7, maxWidth: "480px", mx: "auto",
            }}>
              Start tracking your portfolio for free. No spreadsheets. No guesswork.
              Just your positions, your prices, your P&L.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/register")}
              sx={{
                bgcolor: teal, color: "#fff",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: "0.82rem", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                px: 6, py: 2, borderRadius: "0.6rem",
                boxShadow: isDark
                  ? "0 8px 32px rgba(15,179,175,0.25)"
                  : "0 8px 32px rgba(10,123,123,0.20)",
                "&:hover": {
                  bgcolor: teal, filter: "brightness(0.88)",
                  transform: "translateY(-2px)",
                  boxShadow: isDark
                    ? "0 12px 40px rgba(15,179,175,0.35)"
                    : "0 12px 40px rgba(10,123,123,0.28)",
                },
                transition: "all 0.2s ease",
              }}
            >
              Create Your Ledger
            </Button>
          </Box>
        </RevealSection>
      </Box>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <Box
        component="footer"
        sx={{
          py: 5, px: { xs: 3, md: 8 },
          borderTop: `1px solid ${border}`,
          bgcolor: isDark ? paper : "#FFFFFF",
        }}
      >
        <Box sx={{
          maxWidth: "1400px", mx: "auto",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: 3,
        }}>
          <Typography sx={{
            fontFamily: '"Newsreader", serif', fontStyle: "italic",
            fontWeight: 700, fontSize: "1.2rem", color: isDark ? textPrimary : teal,
          }}>
            VittNest
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: { xs: 3, md: 5 } }}>
            {["Privacy Policy", "Terms of Service", "Contact"].map((link) => (
              <Typography
                key={link}
                component="a"
                href="#"
                sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: "0.7rem", fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  color: textSecondary, textDecoration: "none",
                  "&:hover": { color: textPrimary },
                  transition: "color 0.2s",
                }}
              >
                {link}
              </Typography>
            ))}
          </Box>

          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: "0.7rem", fontWeight: 600,
            letterSpacing: "0.06em", textTransform: "uppercase",
            color: textSecondary,
          }}>
            © {new Date().getFullYear()} VittNest
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
