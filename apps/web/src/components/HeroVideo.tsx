"use client";

import * as React from "react";

const VIDEO_SRC = "/video/hero-loop.mp4";
const POSTER_SRC = "/video/hero-poster.jpg";

/**
 * Decorative background video for the hero.
 *
 * Layering contract: sits *behind* the hero copy, the dashboard mock and the
 * floating chips, at low opacity under a white wash, so hero copy stays
 * legible. `aria-hidden` because it carries no information.
 *
 * Playback is driven from an effect rather than the `autoPlay` attribute on
 * purpose. `autoPlay` would fetch and play the file on phones too, even
 * though the element is hidden below `sm`. With `preload="none"` and play()
 * gated on viewport + motion preference, a phone never downloads the video at
 * all. Pausing happens when the hero scrolls out of view.
 *
 * Degradation ladder, in order:
 *   1. Viewport under `sm`, or `prefers-reduced-motion` -> poster only, hidden
 *      <video>, never fetched.
 *   2. Video 404 / decode error -> poster only.
 *   3. Otherwise -> muted, looping, playsInline background video.
 */
export function HeroVideo({ className }: { className?: string }) {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [videoOk, setVideoOk] = React.useState(true);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);

  // Both gates start pessimistic so the first paint is the poster.
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

  // Play when eligible and on-screen; pause when off-screen.
  React.useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    if (!showVideo) {
      node.pause();
      return;
    }

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

    observer.observe(wrapRef.current ?? node);
    return () => observer.disconnect();
  }, [showVideo]);

  return (
    <div ref={wrapRef} aria-hidden="true" className={className}>
      {/* Poster is the permanent base layer: it is what phones and
          reduced-motion users see, and it holds the space so there is no
          layout shift while the video loads. */}
      <img
        src={POSTER_SRC}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Hidden below `sm` and under reduced motion, so the poster is what
          shows. preload="none" keeps phones from downloading the file. */}
      {videoOk ? (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover ${reduceMotion ? "hidden" : "hidden sm:block"}`}
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          loop
          muted
          playsInline
          preload="none"
          onError={() => setVideoOk(false)}
        />
      ) : null}

      {/* White wash between video and hero copy, so text contrast holds.
          Strongest at the top where the headline sits, clearing toward the
          bottom so the video still reads behind the dashboard mock. */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-white/0" />
    </div>
  );
}
