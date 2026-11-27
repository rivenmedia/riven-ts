import { describe, expect, it } from "vitest";

import {
  cleanConfirmCopy,
  jobCountLabel,
  pauseConfirmCopy,
  removeConfirmCopy,
} from "./action-copy.ts";

describe(jobCountLabel, () => {
  it("pluralises", () => {
    expect(jobCountLabel(1)).toBe("1 job");
    expect(jobCountLabel(2)).toBe("2 jobs");
  });
});

describe(removeConfirmCopy, () => {
  it("names two jobs", () => {
    expect(
      removeConfirmCopy(["49012", "48702"], "Process media item"),
    ).toStrictEqual({
      title: "Remove 2 jobs?",
      description:
        "This deletes #49012 and #48702 from Process media item. Their media items stay in your library. You can't undo this.",
      confirmLabel: "Remove 2 jobs",
    });
  });

  it("lists three jobs with commas and 'and'", () => {
    expect(
      removeConfirmCopy(["1", "2", "3"], "X").description.startsWith(
        "This deletes #1, #2 and #3 from X.",
      ),
    ).toBe(true);
  });

  it("counts four or more jobs", () => {
    expect(
      removeConfirmCopy(["1", "2", "3", "4"], "X").description.startsWith(
        "This deletes 4 jobs from X.",
      ),
    ).toBe(true);
  });

  it("names a single job", () => {
    const copy = removeConfirmCopy(["9"], "X");

    expect(copy.title).toBe("Remove 1 job?");
    expect(copy.description.startsWith("This deletes #9 from X.")).toBe(true);
  });
});

describe(cleanConfirmCopy, () => {
  it("describes cleaning a state", () => {
    expect(cleanConfirmCopy("failed", 9, "Scrape item")).toStrictEqual({
      title: "Clean 9 failed jobs?",
      description:
        "This deletes every failed job in Scrape item. You can't undo this.",
      confirmLabel: "Clean 9 jobs",
    });
  });
});

describe(pauseConfirmCopy, () => {
  it("warns that flows stall", () => {
    expect(pauseConfirmCopy("Scrape item")).toStrictEqual({
      title: "Pause Scrape item?",
      description:
        "Jobs already running finish. New jobs wait here until you resume it. Flows waiting on this queue will stall until you resume it.",
      confirmLabel: "Pause queue",
    });
  });
});
