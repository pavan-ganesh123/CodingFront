import React, { useState } from "react";
import {
  Eye,
  Camera,
  ShareNetwork,
  Sparkle,
  Heart,
  Star,
  Aperture,
  Stack
} from "@phosphor-icons/react";

import Login from "./Login";
import Signup from "./Signup";
import "./AuthPage.css";

/**
 * --- Diamond grid system ---
 * Diamonds sit on a diagonal grid using two axes:
 *   col-axis: each +1 moves up-right
 *   row-axis: each +1 moves down-right
 * Combining col/row builds straight runs AND zigzag "hook" turns just by
 * changing a cell's (col, row). All values are % of .diamond-field, so the
 * whole composition scales together at any screen size.
 */

const SPECTRUM = [
  ["#7DF9C5", "#22C1A6"],
  ["#5FB8F0", "#3B82F6"],
  ["#B18CF2", "#8B5CF6"],
  ["#F27CC0", "#EC4899"],
  ["#F2A65A", "#F59E0B"],
  ["#7DF9C5", "#3B82F6"],
  ["#B18CF2", "#EC4899"],
  ["#F59E0B", "#F27CC0"],
];

const ICONS = [Eye, Aperture, ShareNetwork, Sparkle, Heart, Star, Camera, Stack];

const FIELD_W = 620;
const FIELD_H = 700;
const GAP = 72;

const DIAMOND_PX = 104;
const HALF_DIAG = DIAMOND_PX / Math.SQRT2;
const STEP_X = (HALF_DIAG / FIELD_W) * 100;
const STEP_Y = (HALF_DIAG / FIELD_H) * 100;

function cell(baseTop, baseLeft, col, row) {
  return {
    top: (row - col) * GAP,
    left: (row + col) * GAP,
  };
}

const TOP_DIAMONDS = [
  cell(0, 0, 0, 0),
  cell(0, 0, 1, 0),
  cell(0, 0, 2, 0),
  cell(0, 0, 3, 0),
  cell(0, 0, 3, 1),
  cell(0, 0, 2, 1),
];

const BOTTOM_DIAMONDS = [
  cell(0, 0, 0, 0),
  cell(0, 0, 1, 0),
  cell(0, 0, 2, 0),
  cell(0, 0, 3, 0),
  cell(0, 0, 3, 1),
  cell(0, 0, 2, 1),
];

// Loose floating accent diamonds — faint, no icon reveal needed, just depth.
const FLOATERS = [
  { top: 8,  left: 10, size: 5, opacity: .85 },
  { top: 18, left: 22, size: 6, opacity: .82 },
  { top: 32, left: 14, size: 5, opacity: .86 },
  { top: 46, left: 30, size: 7, opacity: .84 },
  { top: 62, left: 18, size: 5, opacity: .85 },
  { top: 78, left: 32, size: 6, opacity: .82 },
  { top: 92, left: 14, size: 5, opacity: .85 },
];

function Diamond({ index, top, left, delay }) {
  const [a, b] = SPECTRUM[index % SPECTRUM.length];
  const Icon = ICONS[index % ICONS.length];
  return (
    <div
      className="diamond"
      style={{
          top: `${top}px`,
          left: `${left}px`,
          width: `${DIAMOND_PX}px`,
          height: `${DIAMOND_PX}px`,
          "--hue-a": a,
          "--hue-b": b,
          "--delay": `${delay}s`,
      }}
      tabIndex={0}
      aria-label="Reveal a moment"
    >
      <span className="diamond-facet" />
      <span className="diamond-glyph">
        <Icon size={18} strokeWidth={1.75} />
      </span>
    </div>
  );
}

function Floater({ top, left, size, opacity, delay , borderAlpha = 0.1}) {
  return (
    <div
      className="floater"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        width: `${size}%`,
        opacity,
        "--delay": `${delay}s`,
        "--floater-border": `1px solid rgba(255,255,255,${borderAlpha})`,
      }}
    />
  );
}

function AuthPage() {
  const [flipped, setFlipped] = useState(false);


  return (
    <div className="page">
      <div className="left-panel">
        <div className="brand">
        <h2>Code Cache</h2>
        <p>Powering Your Code Journey</p>
        </div>

        <div className="diamond-field">
          <div className="diamond-canvas">
            {FLOATERS.map((f, i) => (
                <Floater key={i} {...f} delay={i * 0.6} />
            ))}

            <div className="diamond-cluster top-cluster">
                {TOP_DIAMONDS.map((pos, i) => (
                    <Diamond
                        key={i}
                        index={i}
                        {...pos}
                        delay={i * 0.15}
                    />
                ))}
            </div>

            <div className="tagline-card">
              <h3 className="tagline-main">Code & Note..</h3>
              <p className="tagline-sub">Share and</p>
              <h3 className="tagline-main accent">Learn together</h3>
            </div>

            <div className="diamond-cluster bottom-cluster">
                {BOTTOM_DIAMONDS.map((pos, i) => (
                    <Diamond
                        key={i}
                        index={i + TOP_DIAMONDS.length}
                        {...pos}
                        delay={i * 0.15}
                    />
                ))}
            </div>

        </div>
          </div>
      </div>

      <div className="right-panel">
        <div className="card-scene">
          <div className={`card-flip ${flipped ? "is-flipped" : ""}`}>
            <div className="card-face front">
              <Login />
              <button
                type="button"
                className="login-btn-link"
                onClick={() => setFlipped(true)}
              >
                No account? <span>Sign up</span>
              </button>
            </div>
            <div className="card-face back">
              <Signup />
              <button
                type="button"
                className="login-btn-link"
                onClick={() => setFlipped(false)}
              >
                Already have an account? <span>Log in</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;