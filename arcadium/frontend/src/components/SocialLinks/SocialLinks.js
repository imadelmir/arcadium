"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import styles from "./SocialLinks.module.css";

const LINKS = [
  {
    key: "discord",
    href: "https://discord.com/login?redirect_to=%2Fstore",
    rgb: "88, 101, 242",
    labelKey: "social.discord",
    path: "M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z",
  },
  {
    key: "twitch",
    href: "https://www.twitch.tv/login",
    rgb: "145, 70, 255",
    labelKey: "social.twitch",
    path: "M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z",
  },
];

export function SocialLinks() {
  const { t, i18n } = useTranslation();

  const [notifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    function onClickFuori(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", onClickFuori);
    return () => document.removeEventListener("mousedown", onClickFuori);
  }, []);

  const comingSoon = t("common.comingSoon");

  return (
    <div className={styles.group}>
      {LINKS.map((item) => {
        const label = t(item.labelKey);
        return (
          <a key={item.key} href={item.href} className={styles.button} style={{ "--brand-rgb": item.rgb }} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
            <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true" focusable="false">
              <path d={item.path} />
            </svg>
          </a>
        );
      })}

      {/* Campanello notifiche: stesso stile dei social (oro), tooltip + popup */}
      <div className={styles.bellWrap} ref={bellRef}>
        <button type="button" className={styles.button} style={{ "--brand-rgb": "245, 196, 81" }} onClick={() => setNotifOpen((v) => !v)} aria-label={t("notifications.label")} title={comingSoon}>
          <Bell className={styles.icon} size={18} />
        </button>
        {notifOpen && <div className={styles.notifPopup}>{comingSoon}</div>}
      </div>
    </div>
  );
}