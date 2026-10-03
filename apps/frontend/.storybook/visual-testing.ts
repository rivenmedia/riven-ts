import type {
  ImageSnapshotSubjectOptions,
  ToMatchImageSnapshotOptions,
} from "storybook-addon-vis";

/** Options for the automatic snapshot taken at the end of each story test, set via `parameters.snapshot` */
export interface SnapshotParameters
  extends ToMatchImageSnapshotOptions, ImageSnapshotSubjectOptions {
  /** Milliseconds to wait before capturing, e.g. to avoid capturing a carousel mid-transition */
  delay?: number;
  /** Set to `false` to capture only the viewport, for pages that render long or infinite lists */
  fullPage?: boolean;
}

/** Waits for images in the viewport to load, as remote images may not have loaded by the time the page is stable */
const waitForVisibleImages = async () => {
  const pendingImages = [...document.images].filter((image) => {
    const { bottom, right, top, left } = image.getBoundingClientRect();

    return (
      !image.complete &&
      bottom > 0 &&
      right > 0 &&
      top < globalThis.innerHeight &&
      left < globalThis.innerWidth
    );
  });

  await Promise.race([
    Promise.allSettled(pendingImages.map((image) => image.decode())),
    new Promise((resolve) => {
      setTimeout(resolve, 10_000);
    }),
  ]);
};

/**
 * Waits until the DOM hasn't changed for a while, so states that settle shortly after the story renders
 * (e.g. data loading in, or a tooltip opening once focus moves) are captured consistently
 */
const waitForStableDom = async ({ quietMs = 500, timeoutMs = 10_000 } = {}) => {
  const startedAt = performance.now();
  let lastMutationAt = startedAt;

  const observer = new MutationObserver(() => {
    lastMutationAt = performance.now();
  });

  observer.observe(document.body, {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  });

  try {
    while (
      performance.now() - lastMutationAt < quietMs &&
      performance.now() - startedAt < timeoutMs
    ) {
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
    }
  } finally {
    observer.disconnect();
  }
};

const waitForNextFrame = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });

/**
 * Runs immediately before each automatic snapshot.
 *
 * Returning `false` skips the snapshot.
 */
export const prepareAutoSnapshot = async ({
  tags,
  delay,
  fullPage,
}: {
  tags: string[];
  // Typed as `unknown` as the addon merges these with its own snapshot options
  delay?: unknown;
  fullPage?: unknown;
}) => {
  // Story tests created with `Story.test()` render the same story as their parent, so only the parent is captured.
  // Interaction tests are covered by the component test assertions.
  if (tags.includes("test-fn")) {
    return false;
  }

  if (fullPage === false) {
    // Snapshots capture the body element, so clip it to the viewport
    Object.assign(document.body.style, { height: "100vh", overflow: "hidden" });
  }

  if (typeof delay === "number") {
    await new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  }

  // Fonts use `display: swap`, so the fallback font may still be showing
  await document.fonts.ready;
  await waitForStableDom();
  await waitForVisibleImages();
  await waitForNextFrame();

  return true;
};

/** Undoes any page changes made by {@link prepareAutoSnapshot}, as stories in the same file share a document */
export const resetAutoSnapshot = () => {
  document.body.style.removeProperty("height");
  document.body.style.removeProperty("overflow");
};
