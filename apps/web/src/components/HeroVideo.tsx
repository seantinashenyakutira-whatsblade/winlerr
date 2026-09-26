"use client";

import * as React from "react";

const VIDEO_SRC = "/video/hero-loop.mp4";
const POSTER_SRC = "/video/hero-poster.jpg";

/**
 * Decorative background video for the hero.
 *
 * Layering contract: this sits *behind* the dashboard mock and the floating
 * chips, at low opacity, under a white gradient wash, so hero copy stays
 * legible. It is `aria-hidden` because it carries no information.
 *
 * Degradation ladder, in order:
 *   1. `prefers-reduced-motion` or viewport under `sm` -> poster only, no <video>.
 *   2. Video 404 / decode error -> poster only.
 *   3. Otherwise -> muted, looping, playsInline background video, paused while
 *      off-screen so it does not burn cycles in a background tab.
 */
export function HeroVideo({ className }: { className?: string }) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [videoOk, setVideoOk] = React.useState(true);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);

  // Mount-time gates. Both start pessimistic so the poster is what renders on
  // the very first paint; the video is promoted client-side once we know the
  // viewport and motion preference allow it.
  React.useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktopQuery = window.matchMedia("(min-width: 640px)");

    const sync = () => {
      setReduceMotion(motionQuery.matches);
      setIsDesktop(desktopQuery.matches);
    };

    sync();
    motionQuery.addEventListener("change", sync);
    desktopQuery.addEventListener("change", sync);
    return () => {
      motionQuery.removeEventListener("change", sync);
      desktopQuery.removeEventListener("change", sync);
    };
  }, []);

  const showVideo = videoOk && isDesktop && !reduceMotion;

  // Pause while scrolled out of view; resume when it returns.
  React.useEffect(() => {
    if (!showVideo) return;
    const node = videoRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void node.play().catch(() => undefined);
          } else {
            node.pause();
          }
        }
      },
      { threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [showVideo]);

  return (
    <div aria-hidden="true" className={className}>
      {/* Poster always present: it is the mobile/reduced-motion/404 surface and
          the placeholder that prevents layout shift while the video loads. */}
      <img
        src={POSTER_SRC}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {showVideo ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onError={() => setVideoOk(false)}
        />
      ) : null}

      {/* White wash between video and hero copy, so text contrast holds. */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/50 to-white/30" />
    </div>
  );
}
