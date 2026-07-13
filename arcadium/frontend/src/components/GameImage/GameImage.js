"use client";

import { useState } from "react";
import { Gamepad2 } from "lucide-react";

import styles from "./GameImage.module.css";

// GameImage
// -----------------------------------------------------------------------------
// Game cover with a loading skeleton and a fallback for missing/broken images.
// Used in the store catalog and the library. Pass the header_image url as `src`
// and the game title as `alt`.
//
//   <GameImage src={game.headerImage} alt={game.name} />
//   <GameImage src={url} alt={title} ratio="3 / 4" />
//
// ratio: any CSS aspect-ratio string. Default = Steam header (460 / 215).

export function GameImage({
  src,
  alt = "",
  ratio = "460 / 215",
  className = "",
  ...rest
}) {
  // If there is no src at all, go straight to the error (fallback) state.
  const [status, setStatus] = useState(src ? "loading" : "error");

  const classes = [styles.frame, className].filter(Boolean).join(" ");
  

  return (
    <div className={classes} style={{ aspectRatio: ratio }} {...rest}>
      {status === "loading" && <div className={styles.skeleton} aria-hidden="true" />}

      {status !== "error" && (
        // Copertine remote dalla CDN Steam: next/image richiederebbe
        // images.remotePatterns e un ottimizzatore server-side per centinaia di
        // immagini a pagina. Restiamo su <img>: scelta consapevole (M6-T4).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={styles.image}
          src={src}
          alt={alt}
          loading="lazy"
          data-loaded={status === "loaded"}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      )}

      {status === "error" && (
        <div className={styles.fallback}>
          <Gamepad2 className={styles.fallbackIcon} aria-hidden="true" />
          {alt && <span className={styles.fallbackTitle}>{alt}</span>}
        </div>
      )}
    </div>
  );
}