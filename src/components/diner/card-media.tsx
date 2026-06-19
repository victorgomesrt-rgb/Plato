"use client";

import type { Item } from "@/lib/menu";
import { VideoTile } from "./video-tile";

// Shared card media: looping video when ready, else photo, else accent placeholder.
export function CardMedia({
  it,
  className,
  cdnHost,
  accent,
  onPlay,
}: {
  it: Item;
  className: string;
  cdnHost: string;
  accent: string;
  onPlay?: () => void;
}) {
  const poster = it.video_thumb_url ?? it.image_url ?? null;
  const mp4 =
    it.video_status === "ready" && it.video_id
      ? `https://${cdnHost}/${it.video_id}/play_480p.mp4`
      : null;
  if (mp4) return <VideoTile poster={poster} mp4Url={mp4} className={className} onPlay={onPlay} />;
  if (it.image_url)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={it.image_url} alt="" className={className} />;
  return <div className={className} style={{ background: `${accent}14` }} />;
}
