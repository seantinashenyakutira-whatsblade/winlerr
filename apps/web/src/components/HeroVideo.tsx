"use client";

import * as React from "react";

const VIDEO_SRC = "/video/hero-loop.mp4";
const POSTER_SRC = "/video/hero-poster.jpg";

type NetworkInformation = EventTarget & {
  effectiveType?: string;
  saveData?: boolean;
};

/**
 * Decorative hero background shared by the public Winlerr marketing and OS
 * landing pages. The poster is the first paint and stays in place until the
 * browser confirms playback, so rejected autoplay and slow media requests
 * degrade to a usable static hero.
 */
export function HeroVideo({ className }: { className?: string }) {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const [canAnimate, setCanAnimate] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [videoOk, setVideoOk] = React.useState(true);

  React.useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    const syncPreferences = () => {
      const slowConnection =
        connection?.saveData === true ||
        connection?.effectiveType === "2g" ||
        connection?.effectiveType === "slow-2g";
      setCanAnimate(!motionQuery.matches && !slowConnection);
    };

    syncPreferences();
    motionQuery.addEventListener("change", syncPreferences);
    connection?.addEventListener("change", syncPreferences);

    return () => {
      motionQuery.removeEventListener("change", syncPreferences);
      connection?.removeEventListener("change", syncPreferences);
    };
  }, []);

  React.useEffect(() => {
    const target = wrapRef.current;
    if (!target || !canAnimate || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(target);

    return () => observer.disconnect();
  }, [canAnimate]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isVisible || !canAnimate || !videoOk) {
      video.pause();
      return;
    }

    // The muted/inline attributes cover normal autoplay policy. Calling
    // play() as well handles browsers that need an explicit playback request.
    video.muted = true;
    video.playsInline = true;
    void video
      .play()
      .then(() => setIsPlaying(!video.paused))
      .catch(() => {
        // Keep the poster visible if browser policy or media support blocks play.
      });

    return () => video.pause();
  }, [canAnimate, isVisible, videoOk]);

  const showVideo = canAnimate && isVisible && videoOk;

  return (
    <div ref={wrapRef} aria-hidden="true" className={className}>
      <img
        src={POSTER_SRC}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
          showVideo && isPlaying ? "opacity-0" : "opacity-100"
        }`}
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
          onPlaying={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setIsPlaying(false)}
          onError={() => {
            setIsPlaying(false);
            setVideoOk(false);
          }}
        />
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-b from-white/75 via-white/60 to-white/45" />
    </div>
  );
}
