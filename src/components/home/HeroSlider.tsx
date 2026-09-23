import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Activity,
  Cpu,
  Zap,
  Bot,
  Globe2,
  Radio,
  Server,
  Snowflake,
  ShieldCheck,
  CircleDot,
} from "lucide-react";
import { HERO_SLIDES, HeroSlide } from "../../data/heroSlides";
import datacenterHeroImg from "../../assets/greennext-datacenter.jpg";

export function HeroSlider() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const slideDuration = 8000; // 8 seconds
  const intervalStep = 50;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentSlide = HERO_SLIDES[currentSlideIndex];

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlideIndex((old) => (old + 1) % HERO_SLIDES.length);
          return 0;
        }

        return prev + (intervalStep / slideDuration) * 100;
      });
    }, intervalStep);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentSlideIndex]);

  const goToSlide = (index: number) => {
    setCurrentSlideIndex(index);
    setProgress(0);
  };

  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    setProgress(0);
  };

  const prevSlide = () => {
    setCurrentSlideIndex(
      (prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length
    );
    setProgress(0);
  };

  return (
    <section
      className="relative min-h-[640px] lg:min-h-[720px] flex items-center bg-[#070A0E] border-b border-[#1E293B] overflow-hidden select-none"
      aria-label="GreenNext Thematic Showcase"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      {/* Cinematic Enterprise Infrastructure Photographic Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <img
          src={datacenterHeroImg}
          alt="Enterprise AI-ready data center corridor with high-density server racks and overhead cooling infrastructure"
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover object-center opacity-75"
        />

        {/* Left-bias gradient: keeps text readable while revealing the infrastructure photo */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070A0E]/85 via-[#070A0E]/45 to-[#070A0E]/10" />

        {/* Vertical gradient: dark base + subtle top fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070A0E]/90 via-transparent to-[#070A0E]/40" />
      </div>

      {/* Structural Schematic Canvas Background */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none z-[1]"
        style={{
          backgroundImage:
            "linear-gradient(#10B981 1px, transparent 1px), linear-gradient(90deg, #10B981 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="max-w-[1340px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Slide Content (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Slide Index & Eyebrow */}
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xs text-[#10B981] font-semibold tracking-wider">
                0{currentSlideIndex + 1} // 0{HERO_SLIDES.length}
              </span>

              <span className="text-[#334155] font-mono">|</span>

              <span className="text-xs font-mono uppercase tracking-widest text-[#94A3B8]">
                {currentSlide.eyebrow}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-bold text-white tracking-tight leading-[1.12] mb-6">
              {currentSlide.headline}
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed max-w-2xl mb-8">
              {currentSlide.description}
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <Link
                to={currentSlide.primaryCta.path}
                className="px-6 py-3 rounded-lg bg-[#10B981] text-[#070A0E] text-sm font-semibold hover:bg-[#34D399] transition-all flex items-center gap-2 shadow-lg shadow-[#10B981]/20 hover:shadow-[#10B981]/35"
              >
                <span>{currentSlide.primaryCta.label}</span>
              </Link>

              <Link
                to={currentSlide.secondaryCta.path}
                className="px-5 py-3 rounded-lg border border-[#334155] bg-[#121824]/60 text-white text-sm font-medium hover:bg-[#1A2234] hover:border-[#475569] transition-all"
              >
                {currentSlide.secondaryCta.label}
              </Link>
            </div>

            {/* Slide Progress & Navigation Controls */}
            <div className="w-full flex items-center justify-between gap-4 pt-4 border-t border-[#1E293B]/80 max-w-xl">
              {/* Progress Track */}
              <div className="flex items-center gap-2 flex-1">
                {HERO_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    onClick={() => goToSlide(idx)}
                    className="flex-1 h-1.5 rounded-full overflow-hidden bg-[#1E293B] relative hover:opacity-80 transition-opacity"
                    aria-label={`Go to slide ${idx + 1}: ${slide.theme}`}
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-[#10B981] transition-all duration-75"
                      style={{
                        width:
                          idx === currentSlideIndex
                            ? `${progress}%`
                            : idx < currentSlideIndex
                              ? "100%"
                              : "0%",
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Prev / Next & Pause Controls */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={prevSlide}
                  className="p-1.5 rounded border border-[#1E293B] text-[#94A3B8] hover:text-white hover:bg-[#121824] transition-colors"
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded border border-[#1E293B] text-[#94A3B8] hover:text-white hover:bg-[#121824] transition-colors"
                  aria-label={isPlaying ? "Pause auto-slide" : "Play auto-slide"}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>

                <button
                  onClick={nextSlide}
                  className="p-1.5 rounded border border-[#1E293B] text-[#94A3B8] hover:text-white hover:bg-[#121824] transition-colors"
                  aria-label="Next slide"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Schematic Concept (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl border border-[#334155] bg-[#121824]/90 p-6 backdrop-blur-xl shadow-2xl">
              {/* Header Badge */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1E293B]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />

                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8]">
                    {currentSlide.conceptTag}
                  </span>
                </div>

                <span className="text-[10px] font-mono text-[#64748B]">
                  TELEMETRY CONSOLE
                </span>
              </div>

              {/* Dynamic Interactive Schematic per Slide */}

              {currentSlide.schematicType === "foundation" && (
                <div className="space-y-3 py-2">
                  <div className="p-3 rounded-lg border border-[#1E293B] bg-[#0B0F17] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Cpu size={16} className="text-[#06B6D4]" />
                      <span className="text-xs text-white font-medium">
                        AI Compute Density
                      </span>
                    </div>

                    <span className="text-xs font-mono text-[#10B981]">
                      OPTIMIZED
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-[#1E293B] bg-[#0B0F17] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Zap size={16} className="text-[#F59E0B]" />
                      <span className="text-xs text-white font-medium">
                        Power Feed Monitoring
                      </span>
                    </div>

                    <span className="text-xs font-mono text-[#10B981]">
                      ACTIVE
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-[#1E293B] bg-[#0B0F17] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Bot size={16} className="text-[#38BDF8]" />

                      <span className="text-xs text-white font-medium">
                        Event-Driven Automation
                      </span>
                    </div>

                    <span className="text-xs font-mono text-[#10B981]">
                      CALIBRATED
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-[#1E293B] bg-[#0B0F17] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Globe2 size={16} className="text-[#10B981]" />

                      <span className="text-xs text-white font-medium">
                        South India Network
                      </span>
                    </div>

                    <span className="text-xs font-mono text-[#94A3B8]">
                      4 NODES
                    </span>
                  </div>
                </div>
              )}

              {currentSlide.schematicType === "ai" && (
                <div className="space-y-4 py-3">
                  <div className="text-center p-3 rounded-lg border border-[#1E293B] bg-[#0B0F17]">
                    <span className="text-[10px] font-mono text-[#06B6D4] block mb-1">
                      ACCELERATOR DENSITY
                    </span>

                    <span className="text-sm font-semibold text-white">
                      Sustained High Utilisation Engine
                    </span>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="h-8 w-0.5 bg-[#334155]" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-[#1E293B] bg-[#0B0F17] text-center">
                      <Zap
                        size={16}
                        className="mx-auto text-[#10B981] mb-1"
                      />

                      <span className="text-[11px] font-medium text-white block">
                        Power Delivery
                      </span>

                      <span className="text-[9px] text-[#94A3B8]">
                        High Amp Feeds
                      </span>
                    </div>

                    <div className="p-3 rounded-lg border border-[#1E293B] bg-[#0B0F17] text-center">
                      <Snowflake
                        size={16}
                        className="mx-auto text-[#06B6D4] mb-1"
                      />

                      <span className="text-[11px] font-medium text-white block">
                        Thermal Extraction
                      </span>

                      <span className="text-[9px] text-[#94A3B8]">
                        Direct-to-Chip Ready
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {currentSlide.schematicType === "energy" && (
                <div className="py-4 text-center">
                  <div className="p-4 rounded-xl border border-[#1E293B] bg-[#0B0F17]">
                    <div className="inline-flex p-3 rounded-full bg-[#10B981]/15 text-[#10B981] mb-2">
                      <Zap size={24} />
                    </div>

                    <h3 className="text-xs font-mono text-white mb-1">
                      Closed-Loop Energy Discipline
                    </h3>

                    <p className="text-[11px] text-[#94A3B8]">
                      Compute Load ➔ Power Measurement ➔ Thermal Dissipation ➔
                      Calibration
                    </p>
                  </div>
                </div>
              )}

              {currentSlide.schematicType === "automation" && (
                <div className="grid grid-cols-3 gap-2 py-2">
                  {[
                    "01. Monitor",
                    "02. Detect",
                    "03. Analyze",
                    "04. Decide",
                    "05. Automate",
                    "06. Report",
                  ].map((step) => (
                    <div
                      key={step}
                      className="p-2.5 rounded border border-[#1E293B] bg-[#0B0F17] text-center"
                    >
                      <span className="text-[10px] font-mono text-[#10B981] block mb-0.5">
                        {step.split(".")[0]}
                      </span>

                      <span className="text-[11px] font-medium text-white">
                        {step.split(".")[1]}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {currentSlide.schematicType === "regional" && (
                <div className="grid grid-cols-2 gap-2.5 py-2">
                  {[
                    { code: "MDU", name: "Madurai", role: "Tech Hub" },
                    {
                      code: "CJB",
                      name: "Coimbatore",
                      role: "Industrial Base",
                    },
                    {
                      code: "TRZ",
                      name: "Trichy",
                      role: "Central Routing",
                    },
                    {
                      code: "IXE",
                      name: "Mangalore",
                      role: "Coastal Gateway",
                    },
                  ].map((node) => (
                    <div
                      key={node.code}
                      className="p-3 rounded-lg border border-[#1E293B] bg-[#0B0F17] flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {node.name}
                        </span>

                        <span className="text-[9px] text-[#94A3B8]">
                          {node.role}
                        </span>
                      </div>

                      <span className="text-xs font-mono text-[#10B981] font-semibold">
                        {node.code}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Note */}
              <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between text-[10px] text-[#64748B]">
                <span>Status: Conceptual Architecture</span>
                <span className="text-[#10B981]">South India Focus</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}