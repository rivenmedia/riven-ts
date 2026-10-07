import type {
  ImageSnapshotSubjectOptions,
  SetupVisOptions,
  ToMatchImageSnapshotOptions,
} from "storybook-addon-vis";

declare module "vitest/browser" {
  interface BrowserCommands {
    setBrowserViewport: (width: number, height: number) => Promise<void>;
  }
}

/**
 * Options for the automatic snapshot taken at the end of each story test, set via `parameters.snapshot`
 */
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

/** Snapshots capture the body element, so this clips it to the viewport */
const clipBodyToViewport = () => {
  Object.assign(document.body.style, {
    height: "100vh",
    overflow: "hidden",
  });
};

/** Rounds up, as a fractional height would otherwise leave the last row of pixels outside the iframe */
const getContentHeight = () =>
  Math.ceil(
    Math.max(
      document.documentElement.scrollHeight,
      document.body.getBoundingClientRect().bottom,
    ),
  );

/**
 * Grows the test iframe to fit the page's content, as the snapshot is clipped to the iframe.
 *
 * Elements sized relative to the viewport (e.g. `h-[50vh]`) grow along with it, so this repeats until the height settles.
 * Storybook resets the viewport before each story, so this doesn't need undoing.
 */
const fitViewportToContent = async ({ maxAttempts = 10 } = {}) => {
  // Imported lazily, as this module is also loaded by the Storybook UI, outside of Vitest
  const { commands, page } = await import("vitest/browser");

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const width = globalThis.innerWidth;
    const height = getContentHeight();

    if (height <= globalThis.innerHeight) {
      return;
    }

    // Vitest scales the iframe down to fit the page, so the page must be at least as large
    await commands.setBrowserViewport(width, height);
    await page.viewport(width, height);
  }

  // Content can grow with the viewport indefinitely (e.g. `h-screen` alongside other content),
  // so cut off the overflow rather than capturing the blank space below the iframe
  if (getContentHeight() > globalThis.innerHeight) {
    clipBodyToViewport();
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
export const prepareAutoSnapshot: Extract<
  SetupVisOptions<SnapshotParameters>["auto"],
  // oxlint-disable-next-line typescript/no-unsafe-function-type
  Function
> = async ({ delay, fullPage }) => {
  if (fullPage === false) {
    clipBodyToViewport();
  }

  // Fonts use `display: swap`, so the fallback font may still be showing
  await document.fonts.ready;

  await waitForStableDom();
  await waitForVisibleImages();

  if (fullPage !== false) {
    // Content may have grown while loading
    await fitViewportToContent();
  }

  await waitForNextFrame();

  if (delay) {
    await new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  }

  return true;
};

/** Undoes any page changes made by {@link prepareAutoSnapshot}, as stories in the same file share a document */
export const resetAutoSnapshot = () => {
  document.body.style.removeProperty("height");
  document.body.style.removeProperty("overflow");
};
