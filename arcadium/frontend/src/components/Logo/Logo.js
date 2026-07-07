"use client";

// Brand logo for the top of the sidebar.
// The mark is the real Arcadium icon; the wordmark sits next to it.
// Clicking it goes back to the overview page.

import Link from "next/link";
import Image from "next/image";
import styles from "./Logo.module.css";

export function Logo() {
  return (
    <Link href="/negozio" className={styles.logo} aria-label="Arcadium">
    <Image
  src="/arcadium-icon-clean.png"
  alt=""
  width={46}
height={46}
  className={styles.mark}
  priority
/>
      <span className={styles.word}>ARCADIUM</span>
    </Link>
  );
}