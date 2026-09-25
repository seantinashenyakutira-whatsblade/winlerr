"use client";

import * as React from "react";
import { Play, Pause, RotateCcw, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

const AUDIO_SRC = "/audio/sean-voicemail.mp3";
const PHOTO_SRC = "/images/sean.jpg";
const SEEN_KEY = "voicemail_seen";
const PLAY_EVENT = "winlerr:play-voicemail";

/**
 * Fixed, out-of-flow anchor. Deliberately not in the document flow so mounting it
 * in the root layout cannot shift any existing section's layout or spacing.
 */
const WRAPPER =
  "fixed bottom-4 right-4 z-40 w-[min(24rem,calc(100vw-2rem))]";

/** Fire a request for the layout-mounted player to start playback. */
export function playVoicemail() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PLAY_EVENT));
}

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Storage unavailable (private mode): playback still works, it just re-offers.
  }
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Compact, non-autoplaying voice note from Sean.
 *
 * - Never autoplays: playback only starts from a user click or a `playVoicemail()` request.
 * - Degrades gracefully: a 404 on the audio hides the play control and shows
 *   "Voice note coming soon"; a 404 on the photo falls back to initials.
 * - `voicemail_seen` keeps the player compact on later visits so it does not nag.
 */
export function VoiceNote({ className }: { className?: string }) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = React.useState<"loading" | "ready" | "unavailable">("loading");
  const [photoOk, setPhotoOk] = React.useState(false);
  const [seen, setSeen] = React.useState(true);
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  // Probe both assets up front so the UI can degrade before anyone clicks.
  React.useEffect(() => {
    let cancelled = false;
    setSeen(readSeen());

    Promise.all([
      fetch(AUDIO_SRC, { method: "HEAD" })
        .then((res) => (res.ok ? "ready" : "unavailable"))
        .catch(() => "unavailable"),
      fetch(PHOTO_SRC, { method: "HEAD" })
        .then((res) => res.ok)
        .catch(() => false),
    ]).then(([audio, photo]) => {
      if (cancelled) return;
      setStatus(audio as "ready" | "unavailable");
      setPhotoOk(photo);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Let the footer / about page triggers start playback on the single mounted player.
  React.useEffect(() => {
    const onRequest = () => {
      const audio = audioRef.current;
      if (!audio || status !== "ready") return;
      void audio.play().catch(() => undefined);
    };
    window.addEventListener(PLAY_EVENT, onRequest);
    return () => window.removeEventListener(PLAY_EVENT, onRequest);
  }, [status]);

  React.useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  function onTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;
    setElapsed(audio.currentTime);
    setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
  }

  function onLoadedMetadata() {
    const audio = audioRef.current;
    if (audio) setDuration(audio.duration);
  }

  function onEnded() {
    setPlaying(false);
    setProgress(0);
    setElapsed(0);
  }

  function onError() {
    setStatus("unavailable");
    setPlaying(false);
  }

  function toggle() {
    const audio = audioRef.current;
    if (!audio || status !== "ready") return;
    if (audio.paused) {
      writeSeen();
      setSeen(true);
      void audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  }

  function replay() {
    const audio = audioRef.current;
    if (!audio || status !== "ready") return;
    writeSeen();
    setSeen(true);
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }

  if (status === "unavailable") {
    return (
      <aside
        aria-label="Voice note from Sean"
        className={cn(WRAPPER, className)}
      >
        <p className="rounded-card border border-border bg-surface px-4 py-3 text-sm text-ink-muted shadow-card">
          Voice note coming soon.
        </p>
      </aside>
    );
  }

  const collapsed = seen && !playing;

  return (
    <aside aria-label="Voice note from Sean" className={cn(WRAPPER, className)}>
      <audio
        ref={audioRef}
        src={AUDIO_SRC}
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={onEnded}
        onError={onError}
      />

      <div className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 shadow-card">
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink font-mono text-sm text-white">
          {photoOk ? (
            <img
              src={PHOTO_SRC}
              alt="Sean"
              className="h-full w-full object-cover"
              onError={() => setPhotoOk(false)}
            />
          ) : (
            "SN"
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Volume2 className="h-4 w-4 text-brand-600" aria-hidden="true" />
            Hear from Sean
          </p>
          {collapsed ? (
            <p className="truncate text-xs text-ink-muted">
              Why Winlerr exists, in his own words.
            </p>
          ) : (
            <>
              <div
                role="progressbar"
                aria-label="Voice note progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                className="mt-2 h-1.5 w-full overflow-hidden rounded-pill bg-surface-tint"
              >
                <div
                  className="h-full rounded-pill bg-brand-600"
                  style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
                />
              </div>
              <p className="mt-1 font-mono text-xs text-ink-muted">
                {formatTime(elapsed)} / {formatTime(duration)}
              </p>
            </>
          )}
        </div>

        {seen && !playing ? (
          <button
            type="button"
            onClick={replay}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill border border-border text-ink transition-colors hover:bg-surface-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Replay voice note from Sean"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        ) : null}

        <button
          type="button"
          onClick={toggle}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-brand-600 text-white transition-colors hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label={playing ? "Pause voice note" : "Play voice note from Sean"}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}

/**
 * Text trigger that asks the mounted player to start playback.
 * Safe to use from server components (footer, /about) because it is a client island.
 */
export function VoiceNoteReplay({ className, label = "Hear from Sean" }: { className?: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={playVoicemail}
      className={cn(
        "inline-flex items-center gap-2 rounded-pill border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        className,
      )}
    >
      <Play className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
