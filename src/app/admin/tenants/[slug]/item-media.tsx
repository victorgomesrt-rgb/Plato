"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as tus from "tus-js-client";
import { createClient } from "@/lib/supabase/client";
import {
  processItemImage,
  removeItemImage,
  createVideoUpload,
  getVideoStatus,
  removeVideo,
} from "./media-actions";

type Props = {
  tenantId: string;
  itemId: string;
  itemName: string;
  imageUrl: string | null;
  videoStatus: string;
  videoThumbUrl: string | null;
};

const TARGET_RATIO = 9 / 16; // 0.5625 — capture standard (architecture §8)

// Reads dimensions + duration from a video file in the browser.
function inspectVideo(file: File): Promise<{ duration: number; ratio: number }> {
  return new Promise((resolve, reject) => {
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      resolve({ duration: el.duration, ratio: el.videoWidth / el.videoHeight });
      URL.revokeObjectURL(el.src);
    };
    el.onerror = () => reject(new Error("Could not read the video file"));
    el.src = URL.createObjectURL(file);
  });
}

export function ItemMedia({
  tenantId,
  itemId,
  itemName,
  imageUrl,
  videoStatus,
  videoThumbUrl,
}: Props) {
  const router = useRouter();
  const imgInput = useRef<HTMLInputElement>(null);
  const vidInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  /* ----- Image ----- */
  async function onImage(file: File) {
    setMsg(null);
    setBusy("image");
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const tmpPath = `${tenantId}/_tmp/${crypto.randomUUID()}.${ext}`;
      const supabase = createClient();
      const up = await supabase.storage.from("item-images").upload(tmpPath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });
      if (up.error) throw new Error(up.error.message);
      const res = await processItemImage(tenantId, itemId, tmpPath);
      if (!res.ok) throw new Error(res.error);
      router.refresh();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(null);
      if (imgInput.current) imgInput.current.value = "";
    }
  }

  /* ----- Video ----- */
  async function onVideo(file: File) {
    setMsg(null);
    // Pre-flight checks against the capture standard (qa §4).
    const warnings: string[] = [];
    if (file.size > 200 * 1024 * 1024) {
      setMsg("That file is over 200MB. Please use a shorter clip.");
      return;
    }
    if (file.size > 60 * 1024 * 1024) warnings.push("over 60MB");
    try {
      const { duration, ratio } = await inspectVideo(file);
      if (duration > 12) warnings.push(`${Math.round(duration)}s long (aim for 4–8s)`);
      if (Math.abs(ratio - TARGET_RATIO) > 0.12) warnings.push("not 9:16 vertical");
    } catch {
      /* metadata read failed — proceed anyway */
    }
    if (warnings.length) {
      const proceed = window.confirm(
        `This clip misses the standard: ${warnings.join(", ")}.\nUpload anyway?`
      );
      if (!proceed) {
        if (vidInput.current) vidInput.current.value = "";
        return;
      }
    }

    setBusy("video");
    setPct(0);
    try {
      const created = await createVideoUpload(tenantId, itemId, itemName);
      if (!created.ok) throw new Error(created.error);
      const { videoId, libraryId, signature, expire } = created.data!;

      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: "https://video.bunnycdn.com/tusupload",
          retryDelays: [0, 3000, 5000, 10000],
          headers: {
            AuthorizationSignature: signature,
            AuthorizationExpire: String(expire),
            VideoId: videoId,
            LibraryId: libraryId,
          },
          metadata: { filetype: file.type, title: itemName },
          onError: reject,
          onProgress: (sent, total) => setPct(Math.round((sent / total) * 100)),
          onSuccess: () => resolve(),
        });
        upload.start();
      });

      // Poll transcode status until ready/failed (no public webhook in dev).
      router.refresh();
      const poll = setInterval(async () => {
        const s = await getVideoStatus(tenantId, itemId);
        if (s.ok && s.data && s.data.status !== "processing") {
          clearInterval(poll);
          setBusy(null);
          router.refresh();
        }
      }, 4000);
    } catch (e) {
      setMsg((e as Error).message);
      setBusy(null);
    } finally {
      if (vidInput.current) vidInput.current.value = "";
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      {/* Image */}
      <div className="flex items-center gap-2">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-12 w-12 rounded-md object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-line text-[10px] text-muted">
            No photo
          </div>
        )}
        <input
          ref={imgInput}
          type="file"
          accept="image/*,.heic,.heif"
          hidden
          onChange={(e) => e.target.files?.[0] && onImage(e.target.files[0])}
        />
        <button
          type="button"
          onClick={() => imgInput.current?.click()}
          disabled={busy !== null}
          className="text-xs font-medium text-accent disabled:opacity-50"
        >
          {busy === "image" ? "Processing…" : imageUrl ? "Replace photo" : "Add photo"}
        </button>
        {imageUrl && (
          <button
            type="button"
            onClick={async () => {
              await removeItemImage(tenantId, itemId);
              router.refresh();
            }}
            className="text-xs text-muted hover:text-ink"
          >
            Remove
          </button>
        )}
      </div>

      {/* Video */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">
          Video:{" "}
          <span
            className={
              videoStatus === "ready"
                ? "text-sea"
                : videoStatus === "failed"
                  ? "text-accent-deep"
                  : videoStatus === "processing"
                    ? "text-citrus"
                    : ""
            }
          >
            {videoStatus === "none" ? "none" : videoStatus}
          </span>
        </span>
        {videoThumbUrl && videoStatus === "ready" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={videoThumbUrl} alt="" className="h-12 w-7 rounded object-cover" />
        )}
        <input
          ref={vidInput}
          type="file"
          accept="video/*"
          hidden
          onChange={(e) => e.target.files?.[0] && onVideo(e.target.files[0])}
        />
        <button
          type="button"
          onClick={() => vidInput.current?.click()}
          disabled={busy !== null}
          className="text-xs font-medium text-accent disabled:opacity-50"
        >
          {busy === "video"
            ? pct < 100
              ? `Uploading ${pct}%`
              : "Processing…"
            : videoStatus !== "none"
              ? "Replace clip"
              : "Add clip"}
        </button>
        {videoStatus !== "none" && busy !== "video" && (
          <button
            type="button"
            onClick={async () => {
              await removeVideo(tenantId, itemId);
              router.refresh();
            }}
            className="text-xs text-muted hover:text-ink"
          >
            Remove
          </button>
        )}
      </div>

      {msg && <p className="w-full text-xs text-accent-deep">{msg}</p>}
    </div>
  );
}
