"use client";

// Sfondo stellato animato (canvas), versione leggera a colori.
// I puntini scorrono lenti e cambiano tinta da soli (dal ciano al magenta,
// passando per blu e violetto). Niente bagliore: costo minimo, scroll fluido.
// Decorativo: aria-hidden, non blocca i click, si ferma con "reduced motion".

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
      // Poche stelle = leggerezza garantita.
      const count = Math.min(60, Math.floor((width * height) / 24000));
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.3 + 0.5, // dimensione
          alpha: Math.random() * 0.4 + 0.4,  // luminosità
          vx: (Math.random() - 0.5) * 0.16,  // movimento lento
          vy: (Math.random() - 0.5) * 0.16,
          // Colore: tinta iniziale nel range fluo (180 ciano -> 320 magenta),
          // con una direzione e velocità di scorrimento proprie.
          hue: 180 + Math.random() * 140,
          hueDir: Math.random() < 0.5 ? -1 : 1,
          hueSpeed: Math.random() * 0.25 + 0.1,
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

          // La tinta oscilla avanti e indietro nel range fluo.
          s.hue += s.hueDir * s.hueSpeed;
          if (s.hue <= 180 || s.hue >= 320) s.hueDir *= -1;
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        // hsla: tinta variabile, colori vivaci, luminosità = alpha della stella.
        ctx.fillStyle = `hsla(${s.hue}, 100%, 72%, ${s.alpha})`;
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