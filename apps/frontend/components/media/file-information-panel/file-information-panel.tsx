import { Badge } from "@/components/_ui/badge";

import { useState } from "react";

import { SectionHeading } from "../section-heading/section-heading";

import type {
  MediaEntry,
  MediaMetadata,
} from "@/app/_types/__generated__/graphql";
import type { UUID } from "node:crypto";
import type { PartialDeep } from "type-fest";

export interface FileInformationPanelProps {
  entries: Omit<PartialDeep<MediaEntry>, "mediaItem">[];
  fallbackMediaMetadata: MediaMetadata | undefined;
  onDeleteEntry: (id: UUID, label: string) => void | Promise<void>;
}

export function FileInformationPanel({
  entries,
  fallbackMediaMetadata,
  // onDeleteEntry,
}: FileInformationPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const mediaEntry =
    entries[selectedIndex < entries.length ? selectedIndex : 0] ?? entries[0];
  const meta = mediaEntry?.mediaMetadata ?? fallbackMediaMetadata;
  const video = meta?.video;

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-4 flex items-center justify-between gap-3">
        <SectionHeading title="File Information" />
        {entries.length > 1 && (
          <select
            onChange={(event) => {
              setSelectedIndex(Number(event.currentTarget.value));
            }}
            className="bg-background border-border text-foreground rounded-md border px-2 py-1 font-mono text-xs"
            defaultValue={selectedIndex}
          >
            {entries.map((entry, i) => (
              <option key={entry.id} value={i}>
                {/* {getFilesystemEntryLabel(
                  entry,
                  `Version ${(i + 1).toString()}`,
                )} */}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex flex-col gap-6 text-sm">
        {(meta?.fileName ?? mediaEntry?.originalFilename) && (
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Filename
            </p>
            <p className="text-foreground font-mono text-xs break-all">
              {meta?.fileName ?? mediaEntry?.originalFilename}
            </p>
          </div>
        )}

        {video && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Video
            </span>
            <div className="flex flex-wrap gap-2">
              {video.resolution?.width && video.resolution.height && (
                <Badge
                  variant="secondary"
                  className="text-muted-foreground border border-white/10 bg-white/5 font-mono text-xs backdrop-blur-sm"
                >
                  {video.resolution.width}x{video.resolution.height}
                </Badge>
              )}
              {video.codec && (
                <Badge
                  variant="secondary"
                  className="text-muted-foreground border border-white/10 bg-white/5 font-mono text-xs backdrop-blur-sm"
                >
                  {video.codec}
                </Badge>
              )}
              {video.bitDepth && (
                <Badge
                  variant="secondary"
                  className="text-muted-foreground border border-white/10 bg-white/5 font-mono text-xs backdrop-blur-sm"
                >
                  {video.bitDepth}-bit
                </Badge>
              )}
              {video.hdrType && (
                <Badge
                  variant="secondary"
                  className="border border-purple-500/20 bg-purple-500/10 font-mono text-xs text-purple-200 backdrop-blur-sm"
                >
                  {video.hdrType}
                </Badge>
              )}
              {video.frameRate && (
                <Badge
                  variant="secondary"
                  className="text-muted-foreground border border-white/10 bg-white/5 font-mono text-xs backdrop-blur-sm"
                >
                  {video.frameRate} FPS
                </Badge>
              )}
            </div>
          </div>
        )}

        {meta?.audioTracks?.length && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Audio
            </span>
            <div className="flex flex-wrap gap-2">
              {meta.audioTracks.map((track) => (
                <Badge
                  key={track.codec}
                  variant="secondary"
                  className="text-muted-foreground border border-white/10 bg-white/5 font-mono text-xs backdrop-blur-sm"
                >
                  {track.codec}
                  {track.channels
                    ? track.channels === 8
                      ? " 7.1"
                      : track.channels === 6
                        ? " 5.1"
                        : ` ${track.channels.toString()}ch`
                    : ""}
                  {track.language ? ` (${track.language.toUpperCase()})` : ""}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {meta?.subtitleTracks?.length && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Subtitles
            </span>
            <div className="flex flex-wrap gap-2">
              {meta.subtitleTracks.map((track) => (
                <Badge
                  key={track.language}
                  variant="secondary"
                  className="text-muted-foreground border border-white/10 bg-white/5 text-[10px] backdrop-blur-sm"
                >
                  {track.language ? track.language.toUpperCase() : "Unknown"}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {(meta?.qualitySource ??
          meta?.isRemux ??
          meta?.isProper ??
          meta?.isRepack) && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Source
            </span>
            <div className="flex flex-wrap gap-2">
              {meta.qualitySource && (
                <Badge
                  variant="secondary"
                  className="border border-blue-500/20 bg-blue-500/10 text-xs font-bold text-blue-200 backdrop-blur-sm"
                >
                  {meta.qualitySource}
                </Badge>
              )}
              {meta.isRemux && (
                <Badge
                  variant="secondary"
                  className="border border-amber-500/20 bg-amber-500/10 text-xs font-bold text-amber-200 backdrop-blur-sm uppercase"
                >
                  Remux
                </Badge>
              )}
              {meta.isProper && (
                <Badge
                  variant="secondary"
                  className="border border-green-500/20 bg-green-500/10 text-xs font-bold text-green-200 backdrop-blur-sm uppercase"
                >
                  Proper
                </Badge>
              )}
              {meta.isRepack && (
                <Badge
                  variant="secondary"
                  className="border border-green-500/20 bg-green-500/10 text-xs font-bold text-green-200 backdrop-blur-sm uppercase"
                >
                  Repack
                </Badge>
              )}
            </div>
          </div>
        )}

        {(mediaEntry?.fileSize ?? meta?.bitRate ?? meta?.duration) && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Metrics
            </span>
            <div className="flex flex-wrap gap-4">
              {mediaEntry?.fileSize && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">Size</span>
                  <span className="text-foreground font-mono">
                    {mediaEntry.fileSize.size} {mediaEntry.fileSize.units}
                  </span>
                </div>
              )}
              {meta?.bitRate && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">Bitrate</span>
                  <span className="text-foreground font-mono">
                    {Math.round(meta.bitRate / 1_000_000)} Mbps
                  </span>
                </div>
              )}
              {meta?.duration && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    Duration
                  </span>
                  <span className="text-foreground font-mono">
                    {Math.floor(meta.duration / 60)}m {meta.duration % 60}s
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {meta?.containerFormat?.length && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Container
            </span>
            <div className="flex flex-wrap gap-2">
              {meta.containerFormat.map((fmt) => (
                <Badge
                  key={fmt}
                  variant="secondary"
                  className="text-muted-foreground border border-white/10 bg-white/5 font-mono text-xs backdrop-blur-sm"
                >
                  {fmt}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {(mediaEntry?.provider ?? mediaEntry?.plugin) && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Provider
            </span>
            <div className="flex flex-wrap gap-2">
              {mediaEntry.provider && (
                <Badge
                  variant="secondary"
                  className="text-muted-foreground border border-white/10 bg-white/5 font-mono text-xs backdrop-blur-sm"
                >
                  {mediaEntry.provider}
                </Badge>
              )}
              {mediaEntry.plugin && (
                <Badge
                  variant="secondary"
                  className="text-muted-foreground border border-white/10 bg-white/5 font-mono text-xs backdrop-blur-sm"
                >
                  {mediaEntry.plugin}
                </Badge>
              )}
            </div>
          </div>
        )}

        {mediaEntry?.id && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Download
            </span>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/media/${mediaEntry.id}`}
                download={mediaEntry.originalFilename}
                rel="external"
                className="text-foreground rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
              >
                Download
              </a>
            </div>
          </div>
        )}

        {entries.length > 1 && mediaEntry?.id && (
          <button
            type="button"
            className="text-destructive/70 hover:text-destructive border-destructive/30 hover:border-destructive/70 mt-2 rounded-md border px-3 py-1.5 text-xs transition-colors"
            onClick={() => {
              // void onDeleteEntry(
              //   mediaEntry.id,
              //   getFilesystemEntryLabel(
              //     mediaEntry,
              //     `Version ${(selectedIndex + 1).toString()}`,
              //   ),
              // );
            }}
          >
            Remove this version
          </button>
        )}
      </div>
    </div>
  );
}
