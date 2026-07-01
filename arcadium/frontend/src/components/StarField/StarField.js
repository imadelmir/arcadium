"use client";

// Animated starfield background (canvas).
// Stars drift slowly and twinkle in and out, behind the whole app.
// Decorative only: aria-hidden, never blocks clicks, and it freezes
// for users who prefer reduced motion.

import { useEffect, useRef } from "react";
import styles from "./StarField.module.css";

export function StarField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    let stars = [];
    let animationId = null;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    function createStars() {
      const count = Math.min(120, Math.floor((width * height) / 11000));
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.3 + 0.3,
          baseAlpha: Math.random() * 0.4 + 0.2,
          phase: Math.random() * Math.PI * 2,
          twinkle: Math.random() * 0.02 + 0.004,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
        });
      }
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createStars();
      if (reduceMotion) render(false);
    }

    function render(animate) {
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        if (animate) {
          s.x += s.vx;
          s.y += s.vy;
          if (s.x < 0) s.x = width;
          else if (s.x > width) s.x = 0;
          if (s.y < 0) s.y = height;
          else if (s.y > height) s.y = 0;
          s.phase += s.twinkle;
        }
        const alpha = Math.max(0, s.baseAlpha + Math.sin(s.phase) * 0.25);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196, 188, 255, ${alpha})`;
        ctx.fill();
      }
      if (animate) {
        animationId = requestAnimationFrame(() => render(true));
      }
    }

    resize();
    window.addEventListener("resize", resize);

    if (reduceMotion) {
      render(false);
    } else {
      render(true);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.stars} aria-hidden="true" />;
}