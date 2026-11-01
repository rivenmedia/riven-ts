/** The data the report is rendered from, written to manifest.json by the build script */
export interface Manifest {
  pullRequestUrl: string;
  commitUrl: string;
  runUrl: string;
  headSha: string;
  snapshots: Snapshot[];
}

export type SnapshotStatus = "changed" | "new" | "renamed" | "removed";

export interface Snapshot {
  /** The repository path of the baseline the snapshot is compared against */
  id: string;
  status: SnapshotStatus;
  workspace: string;
  platform: string;
  /** The story file the snapshot was taken from, relative to the workspace */
  file: string;
  name: string;
  /** The repository path of the unused baseline a renamed snapshot was matched to */
  renamedFrom: string | null;
  /** The percentage of pixels a renamed snapshot has in common with that baseline, rounded down as in git */
  similarity: number | null;
  baseline: ReportImage | null;
  /** Removed snapshots have no result, as they were not taken */
  result: ReportImage | null;
  diff: ReportImage | null;
}

export interface ReportImage {
  /** Relative to the report root */
  src: string;
  width: number;
  height: number;
}
