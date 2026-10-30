import type { SetupWorker } from "msw/browser";
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
  /**
   * Milliseconds the page must stay unchanged before capturing, e.g. to avoid capturing a carousel mid-transition.
   *
   * Any DOM mutation or image load restarts the wait.
   *
   * @default `250` milliseconds
   */
  holdMs?: number;
  /** Set to `false` to capture only the viewport, for pages that render long or infinite lists */
  fullPage?: boolean;
  /** Set to `false` to skip the automatic snapshot for this story */
  enabled?: boolean;
}

const isInViewport = (element: Element) => {
  const { bottom, right, top, left } = element.getBoundingClientRect();

  return (
    bottom > 0 &&
    right > 0 &&
    top < globalThis.innerHeight &&
    left < globalThis.innerWidth
  );
};

/** Matches each `url("...")` in a computed `background-image`, which Chromium always serialises with double quotes */
const BACKGROUND_IMAGE_URL_PATTERN = /url\("[^"]+"\)/gu;

/**
 * Loads the CSS background images in the viewport (e.g. `style={{ backgroundImage }}`), as they aren't in `document.images`.
 *
 * They are loaded through a separate image, which shares the browser cache, so the background can be painted once it resolves.
 */
const loadVisibleBackgroundImages = () => {
  const urls = new Set<string>();

  for (const element of document.body.querySelectorAll("*")) {
    const { backgroundImage } = getComputedStyle(element);

    if (!backgroundImage.includes("url(") || !isInViewport(element)) {
      continue;
    }

    for (const [match] of backgroundImage.matchAll(
      BACKGROUND_IMAGE_URL_PATTERN,
    )) {
      // Strips the surrounding `url("` and `")`
      urls.add(match.slice(5, -2));
    }
  }

  return [...urls].map(async (url) => {
    const image = new Image();

    image.src = url;

    await image.decode();
  });
};

/** Waits for images in the viewport to load, as remote images may not have loaded by the time the page is stable */
const waitForVisibleImages = async () => {
  const pendingImages = [...document.images].filter(
    (image) => !image.complete && isInViewport(image),
  );

  await Promise.race([
    Promise.allSettled([
      ...pendingImages.map((image) => image.decode()),
      ...loadVisibleBackgroundImages(),
    ]),
    new Promise((resolve) => {
      setTimeout(resolve, 10_000);
    }),
  ]);
};

const hasPendingVisibleImages = () =>
  [...document.images].some((image) => !image.complete && isInViewport(image));

/** Requests MSW is still handling, by request ID */
const pendingRequestIds = new Set<string>();

const trackedWorkers = new WeakSet<SetupWorker>();

/**
 * Tracks the requests MSW is handling, so snapshots wait for them.
 *
 * A story can render nothing at all while a request is pending (e.g. a suspended component without a fallback),
 * so the DOM can stay unchanged for long enough to pass for settled.
 */
export const trackPendingRequests = (worker: SetupWorker) => {
  if (trackedWorkers.has(worker)) {
    return;
  }

  trackedWorkers.add(worker);

  worker.events.on("request:start", ({ requestId }) => {
    pendingRequestIds.add(requestId);
  });

  // MSW emits `unhandledException` instead of `request:end` when a handler throws
  for (const event of ["request:end", "unhandledException"] as const) {
    worker.events.on(event, ({ requestId }) => {
      pendingRequestIds.delete(requestId);
    });
  }
};

/**
 * Waits until the DOM hasn't changed for `quietMs`, so states that settle shortly after the story renders
 * (e.g. data loading in, or a tooltip opening once focus moves) are captured consistently.
 *
 * Any mutation, image loading in, visible image still pending, or request still pending restarts the quiet period.
 *
 * @returns Whether the DOM settled before the timeout
 */
const waitForStableDom = async ({ quietMs = 500, timeoutMs = 10_000 } = {}) => {
  const startedAt = performance.now();
  let lastActivityAt = startedAt;

  const markActive = () => {
    lastActivityAt = performance.now();
  };

  const observer = new MutationObserver(markActive);

  observer.observe(document.body, {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  });

  // Images repaint once loaded without mutating the DOM, and their events don't bubble, so listen during capture
  document.addEventListener("load", markActive, { capture: true });
  document.addEventListener("error", markActive, { capture: true });

  try {
    while (performance.now() - startedAt < timeoutMs) {
      if (hasPendingVisibleImages() || pendingRequestIds.size > 0) {
        markActive();
      }

      if (performance.now() - lastActivityAt >= quietMs) {
        return true;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
    }

    return false;
  } finally {
    observer.disconnect();
    document.removeEventListener("load", markActive, { capture: true });
    document.removeEventListener("error", markActive, { capture: true });
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
 * Resizes the test iframe, along with the browser page that hosts it.
 *
 * Vitest scales the iframe down when it's larger than the page, and the page keeps whatever size an earlier story left it at,
 * so snapshots of stories larger than the default page (e.g. the `desktop` viewport) would otherwise vary in size between runs.
 */
const setViewport = async (width: number, height: number) => {
  // Imported lazily, as this module is also loaded by the Storybook UI, outside of Vitest
  const { commands, page } = await import("vitest/browser");

  await commands.setBrowserViewport(width, height);
  // Vitest only recalculates the iframe's scale when its viewport is set
  await page.viewport(width, height);
};

/**
 * Grows the test iframe to fit the page's content, as the snapshot is clipped to the iframe.
 *
 * Elements sized relative to the viewport (e.g. `h-[50vh]`) grow along with it, so this repeats until the height settles.
 * Storybook resets the viewport before each story, so this doesn't need undoing.
 */
const fitViewportToContent = async ({ maxAttempts = 10 } = {}) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const width = globalThis.innerWidth;
    const height = getContentHeight();

    if (height <= globalThis.innerHeight) {
      return;
    }

    await setViewport(width, height);
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

/** The declaration Storybook uses to pause animations on their last frame once a story finishes */
const PAUSE_DECLARATION = "animation-play-state: paused !important";

/** The declaration Storybook briefly applies first, so the paused animations restart from their first frame */
const RESTART_DECLARATION = "animation: none !important";

/** Storybook's pause styles, held back until {@link releaseAnimationPause} */
const heldPauseStyles = new Set<HTMLStyleElement>();

const findAnimationPauseStyles = () =>
  [...document.head.querySelectorAll("style:not([id])")].filter((style) =>
    style.textContent.includes(PAUSE_DECLARATION),
  );

/**
 * Holds back the styles Storybook adds to pause animations once a story finishes, so they can play out before the snapshot.
 *
 * Storybook pauses them on their last frame as the story's play function ends, which doesn't render the same as finishing:
 * - An exit animation never ends, so its element stays mounted, e.g. a closed dialog never returns focus to its trigger
 * - Transitions are cut short, so e.g. an element that was moving can be rasterised at a different subpixel offset
 *
 * As the play function can end at any point in an animation, snapshots would vary between runs.
 * Storybook adds the styles synchronously and immediately applies them, so they must be disabled as they're added.
 */
export const holdAnimationPause = () => {
  const { head } = document;
  const appendChild = head.appendChild.bind(head);

  head.appendChild = <T extends Node>(node: T) => {
    const appended = appendChild(node);

    if (
      node instanceof HTMLStyleElement &&
      node.sheet &&
      [PAUSE_DECLARATION, RESTART_DECLARATION].some((declaration) =>
        node.textContent.includes(declaration),
      )
    ) {
      node.sheet.disabled = true;

      if (node.textContent.includes(PAUSE_DECLARATION)) {
        heldPauseStyles.add(node);
      }
    }

    return appended;
  };
};

/**
 * Lets the short animations still running when the story finished play out, so the snapshot doesn't depend on how far they got.
 *
 * Longer animations are left to {@link releaseAnimationPause} instead, as they often time something else,
 * e.g. a carousel's autoplay progress ends as it moves to the next slide.
 */
const finishRunningAnimations = async ({
  maxDurationMs = 2000,
  timeoutMs = 5000,
} = {}) => {
  const startedAt = performance.now();

  const getShortAnimations = () =>
    document
      .getAnimations()
      .filter(
        (animation) =>
          animation.playState === "running" &&
          Number(animation.effect?.getComputedTiming().endTime) <=
            maxDurationMs,
      );

  // Animations can start as others finish, e.g. a tooltip opening once a closed menu has returned focus to its trigger
  while (performance.now() - startedAt < timeoutMs) {
    let shortAnimations = getShortAnimations();

    if (shortAnimations.length === 0) {
      // Gives a finished exit animation time to unmount its element, and anything that follows to start
      await waitForNextFrame();

      shortAnimations = getShortAnimations();

      if (shortAnimations.length === 0) {
        return;
      }
    }

    await Promise.race([
      Promise.allSettled(
        shortAnimations.map(async (animation) => animation.finished),
      ),
      new Promise((resolve) => {
        setTimeout(resolve, timeoutMs - (performance.now() - startedAt));
      }),
    ]);
  }
};

/**
 * Applies Storybook's held back pause styles, so animations that are infinite (e.g. spinners) or too long to wait for
 * are captured on their last frame, as Storybook would have.
 */
const releaseAnimationPause = () => {
  const restartStyle = document.createElement("style");

  restartStyle.textContent = `*, *::before, *::after { ${RESTART_DECLARATION}; }`;

  // Restarts the animations, so they're paused on the same frame whatever point they had reached
  document.head.append(restartStyle);
  document.body.getBoundingClientRect();
  restartStyle.remove();

  for (const style of heldPauseStyles) {
    if (style.sheet) {
      style.sheet.disabled = false;
    }
  }

  heldPauseStyles.clear();
};

/**
 * Removes infinite animations (e.g. spinners), so their elements are captured in their unanimated pose.
 *
 * Paused on a frame, they're still composited separately, which occasionally rasterises them differently between runs.
 * Cancelled CSS animations stay removed until their element's `animation` changes.
 */
const cancelInfiniteAnimations = () => {
  for (const animation of document.getAnimations()) {
    if (!Number.isFinite(animation.effect?.getComputedTiming().endTime)) {
      animation.cancel();
    }
  }
};

/**
 * Repaints elements with a backdrop filter from scratch.
 *
 * They're rasterised separately, and Chromium keeps the raster from while they were moving (e.g. as their container's
 * padding transitioned), so their text could be captured at a slightly different subpixel offset between runs.
 */
const repaintBackdropFilters = async () => {
  const style = document.createElement("style");

  style.textContent =
    "*, *::before, *::after { backdrop-filter: none !important; }";

  document.head.append(style);
  await waitForNextFrame();
  style.remove();
  await waitForNextFrame();
};

/**
 * Runs immediately before each automatic snapshot.
 *
 * Returning `false` skips the snapshot.
 */
export const prepareAutoSnapshot: Extract<
  SetupVisOptions<SnapshotParameters>["auto"],
  // oxlint-disable-next-line typescript/no-unsafe-function-type
  Function
> = async ({ enabled, holdMs = 250, fullPage }) => {
  if (enabled === false) {
    return false;
  }

  if (fullPage === false) {
    clipBodyToViewport();
  }

  await finishRunningAnimations();
  releaseAnimationPause();
  cancelInfiniteAnimations();
  await repaintBackdropFilters();

  // Fonts use `display: swap`, so the fallback font may still be showing
  await document.fonts.ready;

  await waitForStableDom();
  await waitForVisibleImages();

  // Content that fits the iframe is still scaled down if the page is smaller than it
  await setViewport(globalThis.innerWidth, globalThis.innerHeight);

  if (fullPage !== false) {
    // Content may have grown while loading
    await fitViewportToContent();
  }

  await waitForNextFrame();

  if (holdMs) {
    // Restarts whenever the page changes, so e.g. a carousel advancing during the hold period is captured once it settles
    const isStable = await waitForStableDom({
      quietMs: holdMs,
      timeoutMs: holdMs + 10_000,
    });

    if (!isStable) {
      throw new Error(
        `The page didn't stay unchanged for the ${holdMs.toString()}ms snapshot hold period; no stable snapshot can be taken.`,
      );
    }

    await waitForNextFrame();
  }

  // Spinners may have mounted since the animations were paused
  cancelInfiniteAnimations();
  await waitForNextFrame();

  return true;
};

/**
 * Removes the style Storybook adds to pause animations while `afterEach` hooks run.
 *
 * Storybook only removes it once the hooks succeed, so a failed snapshot leaves animations paused for the test's retries.
 * Elements that unmount once their exit animation ends (e.g. a closing accordion item) then never unmount.
 */
const removeLeakedAnimationPause = () => {
  for (const style of findAnimationPauseStyles()) {
    style.remove();
  }

  heldPauseStyles.clear();
};

/** Undoes any page changes made by {@link prepareAutoSnapshot}, as stories in the same file share a document */
export const resetAutoSnapshot = () => {
  document.body.style.removeProperty("height");
  document.body.style.removeProperty("overflow");

  // Requests from the previous story may never finish, e.g. if it unmounted mid-request
  pendingRequestIds.clear();

  removeLeakedAnimationPause();
};
