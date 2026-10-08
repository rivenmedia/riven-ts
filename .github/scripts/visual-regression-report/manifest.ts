/** The data the report is rendered from, written to manifest.json by the build script */
export interface Manifest {
  pullRequestUrl: string;
  commitUrl: string;
  runUrl: string;
  headSha: string;
  snapshots: Snapshot[];
}

export type SnapshotStatus = "changed" | "new";

export interface Snapshot {
  /** The repository path of the baseline the snapshot is compared against */
  id: string;
  status: SnapshotStatus;
  workspace: string;
  platform: string;
  /** The story file the snapshot was taken from, relative to the workspace */
  file: string;
  name: string;
  baseline: ReportImage | null;
  result: ReportImage;
  diff: ReportImage | null;
}

export interface ReportImage {
  /** Relative to the report root */
  src: string;
  width: number;
  height: number;
}
