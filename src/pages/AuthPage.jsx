import React, { useEffect, useRef, useState, useCallback } from "react";
import Login from "./Login";
import Signup from "./Signup";
import "./AuthPage.css";

/* ------------------------------------------------------------------ */
/* Terminal hero — types itself out, then loops. This is the product   */
/* rather than a decoration of it: a cache tool showing a real-feeling  */
/* search → pin → sync sequence.                                       */
/* ------------------------------------------------------------------ */
const SCRIPT = [
  { kind: "cmd", text: 'cache search "debounce hook"' },
  { kind: "out", text: "→ 3 results in 12ms" },
  { kind: "cmd", text: "cache pin useDebounce.ts" },
  { kind: "ok", text: "✓ pinned to workspace" },
  { kind: "cmd", text: "cache sync" },
  { kind: "out", text: "↻ syncing 214 snippets…" },
  { kind: "ok", text: "✓ up to date" },
];

function TerminalPreview() {
  const [history, setHistory] = useState([]);
  const [typed, setTyped] = useState("");
  const [lineIndex, setLineIndex] = useState(0);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion.current) {
      setHistory(SCRIPT);
      setLineIndex(SCRIPT.length);
      return undefined;
    }

    let charTimer;
    let pauseTimer;
    let cancelled = false;

    const typeLine = (idx, charPos = 0) => {
      const line = SCRIPT[idx % SCRIPT.length];
      if (charPos <= line.text.length) {
        setTyped(line.text.slice(0, charPos));
        const speed = line.kind === "cmd" ? 34 : 14;
        charTimer = setTimeout(() => {
          if (!cancelled) typeLine(idx, charPos + 1);
        }, speed);
      } else {
        pauseTimer = setTimeout(() => {
          if (cancelled) return;
          setHistory((prev) => {
            const next = [...prev, line];
            // keep the last 6 lines visible, loop the script forever
            return next.length > 6 ? next.slice(next.length - 6) : next;
          });
          setTyped("");
          const nextIdx = idx + 1;
          if (nextIdx % SCRIPT.length === 0) {
            setHistory([]);
          }
          setLineIndex(nextIdx);
        }, line.kind === "cmd" ? 260 : 480);
      }
    };

    typeLine(lineIndex);

    return () => {
      cancelled = true;
      clearTimeout(charTimer);
      clearTimeout(pauseTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineIndex]);

  const currentLine = SCRIPT[lineIndex % SCRIPT.length];

  return (
    <div className="hero-visual">
      <div className="terminal-window">
        <div className="terminal-chrome">
          <span className="terminal-dot red" />
          <span className="terminal-dot yellow" />
          <span className="terminal-dot green" />
          <span className="terminal-title">cache — zsh</span>
        </div>
        <div className="terminal-body">
          {history.map((line, i) => (
            <div key={i} className={`terminal-row ${line.kind === "cmd" ? "" : line.kind === "ok" ? "is-success" : "is-output"}`}>
              {line.kind === "cmd" && <span className="terminal-prompt">$</span>}
              <span className="terminal-text">{line.text}</span>
            </div>
          ))}
          {!reducedMotion.current && (
            <div className={`terminal-row ${currentLine.kind === "cmd" ? "" : currentLine.kind === "ok" ? "is-success" : "is-output"}`}>
              {currentLine.kind === "cmd" && <span className="terminal-prompt">$</span>}
              <span className="terminal-text">
                {typed}
                <span className="terminal-caret" />
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="stat-chip chip-a">
        <span>⚡</span> <strong>38ms</strong>&nbsp;avg lookup
      </div>
      <div className="stat-chip chip-b">
        <span>◆</span> <strong>12,480</strong>&nbsp;snippets cached
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Magnetic dot field — replaces the flat cursor spotlight on the panel */
/* side. A canvas grid of dots eases toward the cursor within a pull     */
/* radius and brightens to the brand color as they get closer, then      */
/* settle back to their resting grid position when the cursor moves on.  */
/* Canvas (not per-dot DOM nodes) so a few hundred dots costs one draw    */
/* call per frame instead of hundreds of style recalcs.                  */
/* ------------------------------------------------------------------ */
function MagneticDotField() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const dotsRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return undefined;

    const ctx = canvas.getContext("2d");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;

    const dotColor = getComputedStyle(document.documentElement).getPropertyValue("--border-strong").trim() || "rgba(20,19,26,0.18)";
    const glowColor = getComputedStyle(document.documentElement).getPropertyValue("--primary-fg").trim() || "#5b3ce8";

    const buildGrid = () => {
      width = parent.clientWidth;
      height = parent.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const spacing = 34;
      const dots = [];
      for (let y = spacing / 2; y < height; y += spacing) {
        for (let x = spacing / 2; x < width; x += spacing) {
          dots.push({ ox: x, oy: y, x, y });
        }
      }
      dotsRef.current = dots;
    };

    buildGrid();

    const PULL_RADIUS = 130;
    const PULL_STRENGTH = 7;
    const EASE = 0.18;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const { x: mx, y: my } = mouseRef.current;

      for (const dot of dotsRef.current) {
        const dx = mx - dot.ox;
        const dy = my - dot.oy;
        const dist = Math.hypot(dx, dy);

        let targetX = dot.ox;
        let targetY = dot.oy;
        let proximity = 0;

        if (dist < PULL_RADIUS) {
          proximity = 1 - dist / PULL_RADIUS;
          const nx = dist ? dx / dist : 0;
          const ny = dist ? dy / dist : 0;
          targetX = dot.ox + nx * proximity * PULL_STRENGTH;
          targetY = dot.oy + ny * proximity * PULL_STRENGTH;
        }

        dot.x += (targetX - dot.x) * EASE;
        dot.y += (targetY - dot.y) * EASE;

        const radius = 1.3 + proximity * 2;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = proximity > 0.12 ? glowColor : dotColor;
        ctx.globalAlpha = proximity > 0.12 ? 0.35 + proximity * 0.55 : 0.5;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const tick = () => {
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };

    if (reducedMotion) {
      draw();
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }

    const handleMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (reducedMotion) draw();
    };
    const handleLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
      if (reducedMotion) draw();
    };

    parent.addEventListener("mousemove", handleMove);
    parent.addEventListener("mouseleave", handleLeave);

    const resizeObserver = new ResizeObserver(() => {
      buildGrid();
      if (reducedMotion) draw();
    });
    resizeObserver.observe(parent);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      parent.removeEventListener("mousemove", handleMove);
      parent.removeEventListener("mouseleave", handleLeave);
      resizeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="panel-dotfield" aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/* Auth card — a real 3D flip between Login and Signup. Both faces stay */
/* mounted at all times (so if you type into Login, flip to Signup, and */
/* flip back, what you typed is still there) and are stacked absolutely, */
/* which means the card's height has to come from JS: a ResizeObserver  */
/* watches whichever face is currently front-facing and drives the      */
/* container's height, so it can never clip and the flip never snaps to */
/* a mismatched size.                                                   */
/* ------------------------------------------------------------------ */
function AuthCard() {
  const [mode, setMode] = useState("login");
  const loginRef = useRef(null);
  const signupRef = useRef(null);
  const [height, setHeight] = useState(null);

  useEffect(() => {
    const node = mode === "login" ? loginRef.current : signupRef.current;
    if (!node) return undefined;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setHeight(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height);
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [mode]);

  const switchToSignup = useCallback(() => setMode("signup"), []);
  const switchToLogin = useCallback(() => setMode("login"), []);

  return (
    <div className="auth-card-scene">
      <div className="auth-card" style={height ? { height } : undefined}>
        <div className={`card-flip ${mode === "signup" ? "is-flipped" : ""}`}>
          <div className="card-face front">
            <div ref={loginRef} className="auth-card-content">
              <Login onSwitchToSignup={switchToSignup} />
            </div>
          </div>
          <div className="card-face back">
            <div ref={signupRef} className="auth-card-content">
              <Signup onSwitchToLogin={switchToLogin} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthPage() {
  const heroRef = useRef(null);

  /* Hero-side cursor glow (unchanged from before). The panel side no
     longer needs a pointer handler here — MagneticDotField tracks its
     own mouse events directly against its canvas. */
  const handleHeroPointerMove = useCallback((e) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--spot-x", `${x}%`);
    el.style.setProperty("--spot-y", `${y}%`);
    el.style.setProperty("--spot-opacity", "1");
  }, []);

  const handleHeroPointerLeave = useCallback(() => {
    heroRef.current?.style.setProperty("--spot-opacity", "0");
  }, []);

  return (
    <div className="auth-page">
      <div
        className="auth-hero"
        ref={heroRef}
        onMouseMove={handleHeroPointerMove}
        onMouseLeave={handleHeroPointerLeave}
      >
        <div className="hero-grain" aria-hidden="true" />

        <div className="brand">
          <div className="brand-mark">
            <span className="brand-chevron">&gt;_</span>
            <strong>code_cache</strong>
            <span className="brand-caret" aria-hidden="true" />
          </div>
          <p className="brand-eyebrow">Powering your code journey</p>
        </div>

        <div className="hero-center">
          <TerminalPreview />

          <div className="hero-tagline">
            <h1>Cache every insight.</h1>
            <p>Capture intuitions, organize notes, and pull up the fix you already found — the moment you need it again.</p>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="hero-grain" aria-hidden="true" />
        <div className="panel-mesh" aria-hidden="true" />
        <MagneticDotField />
        <AuthCard />
      </div>
    </div>
  );
}

export default AuthPage;
