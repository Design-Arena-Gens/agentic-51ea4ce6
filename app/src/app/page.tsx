"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";

type InputSource = "upload" | "url";
type VideoQuality = "standard" | "hd";
type VideoType = "ad" | "shorts" | "video";
type AspectRatio = "1:1" | "16:9" | "9:16";

type GenerationStatus = "queued" | "processing" | "ready" | "failed";

interface GenerationResult {
  jobId: string;
  status: GenerationStatus;
  quality: VideoQuality;
  videoUrl?: string;
  thumbnailUrl?: string;
  message?: string;
}

const aspectRatioLabels: Record<AspectRatio, string> = {
  "1:1": "Square 1:1",
  "16:9": "Horizontal 16:9",
  "9:16": "Vertical 9:16",
};

const videoTypeLabels: Record<VideoType, string> = {
  ad: "Ad",
  shorts: "Shorts Video",
  video: "Longform Video",
};

export default function Home() {
  const [inputSource, setInputSource] = useState<InputSource>("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [quality, setQuality] = useState<VideoQuality>("standard");
  const [aiMode, setAiMode] = useState("Veo3 (OpenAI)");
  const [apiKey, setApiKey] = useState("");
  const [videoType, setVideoType] = useState<VideoType>("shorts");
  const [duration, setDuration] = useState<number>(30);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [inputSource, imageFile, imageUrl]);

  const previewImage = useMemo(() => {
    if (inputSource === "upload" && imageFile) {
      return URL.createObjectURL(imageFile);
    }
    if (inputSource === "url" && imageUrl.trim().length > 0) {
      return imageUrl.trim();
    }
    return null;
  }, [imageFile, imageUrl, inputSource]);

  useEffect(() => {
    return () => {
      if (previewImage && inputSource === "upload") {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage, inputSource]);

  const durationLabel = useMemo(() => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const parts: string[] = [];
    if (minutes) {
      parts.push(`${minutes}m`);
    }
    parts.push(`${seconds}s`);
    return parts.join(" ");
  }, [duration]);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageFile(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG, WebP).");
      setImageFile(null);
      return;
    }
    setImageFile(file);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);
      setError(null);
      setResult(null);

      if (inputSource === "upload" && !imageFile) {
        setError("Upload a character reference to continue.");
        setIsSubmitting(false);
        return;
      }

      if (inputSource === "url" && imageUrl.trim().length === 0) {
        setError("Provide a character image URL to continue.");
        setIsSubmitting(false);
        return;
      }

      if (description.trim().length === 0) {
        setError("Describe the video so the generator knows what to render.");
        setIsSubmitting(false);
        return;
      }

      try {
        const formData = new FormData();
        formData.set("inputSource", inputSource);
        if (inputSource === "upload" && imageFile) {
          formData.set("characterImage", imageFile);
        }
        if (inputSource === "url") {
          formData.set("characterImageUrl", imageUrl.trim());
        }
        formData.set("description", description.trim());
        formData.set("quality", quality);
        formData.set("aiMode", aiMode);
        formData.set("apiKey", apiKey);
        formData.set("videoType", videoType);
        formData.set("duration", duration.toString());
        formData.set("aspectRatio", aspectRatio);

        const response = await fetch("/api/generate", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error ?? "Unable to generate video.");
        }

        const payload = (await response.json()) as GenerationResult;
        setResult(payload);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error.";
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [aiMode, apiKey, aspectRatio, description, duration, imageFile, imageUrl, inputSource, quality, videoType],
  );

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,_#172554,_transparent_55%)] text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-16 pt-10 md:flex-row md:gap-10 lg:px-8">
        <main className="w-full md:w-2/3">
          <header className="mb-10 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-900/70 p-3 shadow-lg shadow-blue-900/40">
                <Image src="/next.svg" alt="Creator Studio glyph" width={32} height={32} className="opacity-90" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Creator Studio</p>
                <h1 className="text-2xl font-semibold text-white md:text-3xl">AI Video Generator</h1>
              </div>
            </div>
            <p className="max-w-2xl text-sm text-slate-300 md:text-base">
              Provide a hero character image, describe the story, and tailor the output format. Our Veo3-driven pipeline produces polished media in the
              format you need—ads, shorts, or cinematic videos.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col gap-10 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-md md:p-8">
            <section className="flex flex-col gap-6">
              <h2 className="text-lg font-semibold text-white md:text-xl">1. Character Image</h2>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm transition ${inputSource === "upload" ? "border-blue-400/70 bg-blue-500/10 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.25)]" : "border-slate-700 text-slate-300 hover:border-slate-500/80"}`}
                  onClick={() => setInputSource("upload")}
                >
                  Upload file
                </button>
                <button
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm transition ${inputSource === "url" ? "border-blue-400/70 bg-blue-500/10 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.25)]" : "border-slate-700 text-slate-300 hover:border-slate-500/80"}`}
                  onClick={() => setInputSource("url")}
                >
                  Use URL
                </button>
              </div>

              {inputSource === "upload" ? (
                <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-10 text-center text-sm text-slate-400 transition hover:border-blue-400/70 hover:text-blue-200 hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]">
                  <span className="text-base font-medium text-slate-100">Drop your character artwork</span>
                  <span className="text-xs text-slate-400">PNG, JPG or WebP up to 10MB</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    name="characterImage"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-200" htmlFor="characterImageUrl">
                    Image URL
                  </label>
                  <input
                    id="characterImageUrl"
                    name="characterImageUrl"
                    type="url"
                    placeholder="https://"
                    value={imageUrl}
                    onChange={(event) => setImageUrl(event.target.value)}
                    className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              )}

              {previewImage && (
                <figure className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewImage} alt="Character preview" className="max-h-72 w-full object-cover" />
                  <figcaption className="p-3 text-xs text-slate-400">Current character reference</figcaption>
                </figure>
              )}
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-white md:text-xl">2. Narrative &amp; Context</h2>
              <div className="flex flex-col gap-2">
                <label htmlFor="description" className="text-sm font-medium text-slate-200">
                  Overall description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the storyline, tone, scenes, voice-over cues, and any product details..."
                  className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </section>

            <section className="flex flex-col gap-6">
              <h2 className="text-lg font-semibold text-white md:text-xl">3. Video Settings</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                  <span className="text-sm font-medium text-slate-200">Output quality</span>
                  <div className="flex flex-wrap gap-2">
                    {(["standard", "hd"] as VideoQuality[]).map((value) => (
                      <button
                        type="button"
                        key={value}
                        onClick={() => setQuality(value)}
                        className={`rounded-full border px-4 py-2 text-sm capitalize transition ${quality === value ? "border-blue-400/70 bg-blue-500/10 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.25)]" : "border-slate-700 text-slate-300 hover:border-slate-500/80"}`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                  <label htmlFor="videoType" className="text-sm font-medium text-slate-200">
                    Video type
                  </label>
                  <select
                    id="videoType"
                    name="videoType"
                    value={videoType}
                    onChange={(event) => setVideoType(event.target.value as VideoType)}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40"
                  >
                    {(Object.keys(videoTypeLabels) as VideoType[]).map((key) => (
                      <option key={key} value={key}>
                        {videoTypeLabels[key]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:col-span-2">
                  <span className="text-sm font-medium text-slate-200">Duration</span>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={5}
                      max={180}
                      step={5}
                      value={duration}
                      onChange={(event) => setDuration(Number(event.target.value))}
                      className="h-1 w-full accent-blue-500"
                    />
                    <span className="w-16 text-sm font-semibold text-blue-200">{durationLabel}</span>
                  </div>
                  <p className="text-xs text-slate-400">Set the time interval in seconds. Longer stories receive more shots and transitions.</p>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                  <span className="text-sm font-medium text-slate-200">Aspect ratio</span>
                  <div className="flex flex-col gap-2">
                    {(Object.keys(aspectRatioLabels) as AspectRatio[]).map((key) => (
                      <label
                        key={key}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${aspectRatio === key ? "border-blue-400/70 bg-blue-500/10 text-blue-100" : "border-slate-700 text-slate-300 hover:border-slate-500/80"}`}
                      >
                        <span>{aspectRatioLabels[key]}</span>
                        <input type="radio" name="aspectRatio" value={key} checked={aspectRatio === key} onChange={() => setAspectRatio(key)} />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                  <label htmlFor="aiMode" className="text-sm font-medium text-slate-200">
                    AI mode
                  </label>
                  <select
                    id="aiMode"
                    name="aiMode"
                    value={aiMode}
                    onChange={(event) => setAiMode(event.target.value)}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="Veo3 (OpenAI)">Veo3 (OpenAI)</option>
                    <option value="Cinematic+">Cinematic+</option>
                    <option value="Storyboard Pro">Storyboard Pro</option>
                  </select>
                  <p className="text-xs text-slate-400">Veo3 optimizes for expressive characters and rich motion. Alternative modes tweak pacing or cinematic tone.</p>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                  <label htmlFor="apiKey" className="text-sm font-medium text-slate-200">
                    API key
                  </label>
                  <input
                    id="apiKey"
                    name="apiKey"
                    type="password"
                    placeholder="••••••••••••••••"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40"
                  />
                  <p className="text-xs text-slate-400">Securely stored client-side for this session to authenticate Veo3 calls.</p>
                </div>
              </div>
            </section>

            {error && <p className="rounded-2xl border border-red-500/40 bg-red-500/20 px-4 py-3 text-sm text-red-100">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border border-blue-400/60 bg-blue-500/20 px-6 py-3 text-sm font-semibold text-blue-100 shadow-[0_0_30px_rgba(37,99,235,0.25)] transition hover:border-blue-300/90 hover:bg-blue-400/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-transparent" />
                  Generating video…
                </>
              ) : (
                "Create video"
              )}
            </button>
          </form>
        </main>

        <aside className="sticky top-10 h-max w-full md:w-1/3">
          <div className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur md:p-8">
            <h2 className="text-lg font-semibold text-white md:text-xl">Production Output</h2>
            {result ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Status</span>
                  <span
                    className={`text-base font-semibold ${result.status === "ready" ? "text-emerald-300" : result.status === "failed" ? "text-rose-300" : "text-amber-200"}`}
                  >
                    {result.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400">Job #{result.jobId}</span>
                </div>

                {result.videoUrl ? (
                  <video controls src={result.videoUrl} poster={result.thumbnailUrl} className="w-full rounded-2xl border border-slate-800 bg-black">
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 text-xs text-slate-400">
                    Video asset pending…
                  </div>
                )}

                <dl className="grid grid-cols-1 gap-4 text-xs text-slate-300">
                  <div className="flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <dt className="uppercase tracking-[0.2em] text-slate-500">Quality</dt>
                    <dd className="text-sm font-semibold capitalize text-white">{result.quality}</dd>
                  </div>
                  <div className="flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <dt className="uppercase tracking-[0.2em] text-slate-500">Aspect</dt>
                    <dd className="text-sm font-semibold text-white">{aspectRatioLabels[aspectRatio]}</dd>
                  </div>
                  <div className="flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <dt className="uppercase tracking-[0.2em] text-slate-500">Mode</dt>
                    <dd className="text-sm font-semibold text-white">{aiMode}</dd>
                  </div>
                  <div className="flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <dt className="uppercase tracking-[0.2em] text-slate-500">Type</dt>
                    <dd className="text-sm font-semibold text-white">{videoTypeLabels[videoType]}</dd>
                  </div>
                </dl>

                {result.message && <p className="text-xs text-slate-400">{result.message}</p>}
              </div>
            ) : (
              <div className="flex flex-col gap-4 text-sm text-slate-300">
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-5">
                  <p className="font-medium text-white">Awaiting briefing</p>
                  <p className="text-xs text-slate-400">
                    Provide the character, narrative, and target format to kick off rendering. Output will appear here with a playable preview.
                  </p>
                </div>
                <ul className="flex list-disc flex-col gap-2 pl-4 text-xs text-slate-400">
                  <li>Supports branded spokespeople, animated mascots, and storyboard art.</li>
                  <li>Switch between vertical, horizontal, or square delivery per channel.</li>
                  <li>Customize pacing with duration and HD options.</li>
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
