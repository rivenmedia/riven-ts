/**
 * Renders the visual regression report from manifest.json.
 *
 * Type annotations are stripped by the build script, so only erasable TypeScript syntax can be used.
 * Snapshot paths come from the pull request, so they are only ever inserted as text or attributes.
 */
import type {
  Manifest,
  ReportImage,
  Snapshot,
  SnapshotStatus,
} from "../manifest.ts";

const MODES = ["side-by-side", "swipe", "onion", "diff"] as const;

const THEMES = ["auto", "light", "dark"] as const;

const STATUS_FILTERS = ["all", "changed", "new", "renamed", "removed"] as const;

type Mode = (typeof MODES)[number];

const STATUS_LABELS: Record<SnapshotStatus, string> = {
  changed: "Changed",
  new: "New baseline",
  renamed: "Renamed",
  removed: "Removed",
};

/** Labels renamed snapshots with their similarity, as git does */
const statusLabel = (snapshot: Snapshot) =>
  snapshot.status === "renamed" && snapshot.similarity !== null
    ? `${STATUS_LABELS.renamed} · ${String(snapshot.similarity)}% similar`
    : STATUS_LABELS[snapshot.status];

const readPreference = <T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
) => {
  try {
    const value = localStorage.getItem(`visual-regression-report:${key}`);

    return allowed.find((option) => option === value) ?? fallback;
  } catch {
    return fallback;
  }
};

const writePreference = (key: string, value: string) => {
  try {
    localStorage.setItem(`visual-regression-report:${key}`, value);
  } catch {
    // Preferences are a convenience, so they are not saved when storage is unavailable
  }
};

const state = {
  mode: readPreference("mode", MODES, "side-by-side"),
  theme: readPreference("theme", THEMES, "auto"),
  status: "all" as (typeof STATUS_FILTERS)[number],
  query: "",
  hideViewed:
    readPreference("hide-viewed", ["true", "false"], "false") === "true",
  /** The view keys of the snapshots marked as viewed */
  viewed: new Set<string>(),
  /** The IDs of the snapshots whose images are hidden */
  collapsed: new Set<string>(),
};

/**
 * Identifies a snapshot by its images as well as its paths, as the image paths are content hashes.
 * A snapshot is then no longer viewed once a later commit changes it, as on GitHub.
 */
const viewKey = (snapshot: Snapshot) =>
  [
    snapshot.renamedFrom ?? "",
    snapshot.id,
    snapshot.baseline?.src ?? "",
    snapshot.result?.src ?? "",
  ].join("\n");

/** Viewed snapshots are stored per pull request, so reports for other pull requests on the same origin are kept */
const viewedStorageKey = (manifest: Manifest) =>
  `visual-regression-report:viewed:${manifest.pullRequestUrl}`;

/** Reads the viewed snapshots, dropping any that are no longer in the report */
const readViewed = (manifest: Manifest) => {
  const keys = new Set(manifest.snapshots.map((snapshot) => viewKey(snapshot)));

  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(viewedStorageKey(manifest)) ?? "[]",
    );

    return new Set(
      Array.isArray(stored)
        ? stored.filter(
            (key): key is string => typeof key === "string" && keys.has(key),
          )
        : [],
    );
  } catch {
    return new Set<string>();
  }
};

const writeViewed = (manifest: Manifest) => {
  try {
    localStorage.setItem(
      viewedStorageKey(manifest),
      JSON.stringify([...state.viewed]),
    );
  } catch {
    // Viewed snapshots are a convenience, so they are not saved when storage is unavailable
  }
};

const isViewed = (snapshot: Snapshot) => state.viewed.has(viewKey(snapshot));

const cards = new Map<string, HTMLElement>();

const query = (selector: string) => {
  const node = document.querySelector<HTMLElement>(selector);

  if (!node) {
    throw new Error(`Missing element ${selector}`);
  }

  return node;
};

const element = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string | number> = {},
  children: (Node | string)[] = [],
) => {
  const node = document.createElement(tag);

  for (const [name, value] of Object.entries(attributes)) {
    if (name === "text") {
      node.textContent = String(value);
    } else {
      node.setAttribute(name, String(value));
    }
  }

  node.append(...children);

  return node;
};

const anchorFor = (snapshot: Snapshot) => `#${encodeURIComponent(snapshot.id)}`;

const imageElement = (image: ReportImage, alt: string, maxWidth?: number) => {
  const img = element("img", {
    src: image.src,
    alt,
    width: image.width,
    height: image.height,
    loading: "lazy",
    decoding: "async",
  });

  // Images of different sizes are scaled together, so they stay aligned when stacked
  if (maxWidth) {
    img.style.width = `${String((image.width / maxWidth) * 100)}%`;
  }

  return img;
};

const dimensions = (image: ReportImage) =>
  `${String(image.width)}×${String(image.height)}`;

const pane = (label: string, image: ReportImage) =>
  element("figure", {}, [
    element("figcaption", { text: `${label} · ${dimensions(image)}` }),
    element(
      "a",
      {
        class: "well",
        href: image.src,
        target: "_blank",
        rel: "noopener",
        title: `Open the ${label.toLowerCase()} at full size`,
      },
      [imageElement(image, label)],
    ),
  ]);

const comparison = (
  baseline: ReportImage,
  result: ReportImage,
  mode: "swipe" | "onion",
) => {
  const maxWidth = Math.max(baseline.width, result.width);
  const top = imageElement(result, "Result", maxWidth);
  const stack = element("div", { class: `well stack ${mode}` }, [
    imageElement(baseline, "Baseline", maxWidth),
    top,
  ]);

  stack.style.width = `${String(maxWidth)}px`;

  const slider = element("input", {
    type: "range",
    min: 0,
    max: 100,
    value: 50,
    "aria-label": mode === "swipe" ? "Swipe position" : "Result opacity",
  });

  const update = () => {
    if (mode === "swipe") {
      top.style.clipPath = `inset(0 0 0 ${slider.value}%)`;
      stack.style.setProperty("--swipe-position", `${slider.value}%`);
    } else {
      top.style.opacity = String(slider.valueAsNumber / 100);
    }
  };

  // Dragging across the images moves the slider, so it can be used without scrolling to the controls
  const drag = (event: PointerEvent) => {
    if (event.buttons !== 1) {
      return;
    }

    const bounds = stack.getBoundingClientRect();
    const position = (event.clientX - bounds.left) / bounds.width;

    event.preventDefault();
    slider.valueAsNumber = Math.round(Math.min(Math.max(position, 0), 1) * 100);
    update();
  };

  stack.addEventListener("pointerdown", drag);
  stack.addEventListener("pointermove", drag);
  slider.addEventListener("input", update);
  update();

  return element("div", { class: "compare" }, [
    element("div", { class: "compare-controls" }, [
      element("span", { text: "Baseline" }),
      slider,
      element("span", { text: "Result" }),
    ]),
    stack,
  ]);
};

const renderImages = (snapshot: Snapshot) => {
  const body = element("div", { class: "snapshot-body" });
  const { baseline, result, diff } = snapshot;

  if (!result) {
    if (baseline) {
      body.append(
        element("div", { class: "panes" }, [pane("Baseline", baseline)]),
      );
    }

    return body;
  }

  if (!baseline) {
    body.append(element("div", { class: "panes" }, [pane("Result", result)]));

    return body;
  }

  // Identical images are only shown once, as there is nothing to compare
  if (snapshot.similarity === 100) {
    body.append(element("div", { class: "panes" }, [pane("Result", result)]));

    return body;
  }

  if (dimensions(baseline) !== dimensions(result)) {
    body.append(
      element("p", {
        class: "size-note",
        text: `Size changed from ${dimensions(baseline)} to ${dimensions(result)}`,
      }),
    );
  }

  if (state.mode === "swipe" || state.mode === "onion") {
    body.append(comparison(baseline, result, state.mode));
  } else if (state.mode === "diff" && diff) {
    body.append(element("div", { class: "panes" }, [pane("Diff", diff)]));
  } else {
    const panes = [pane("Baseline", baseline), pane("Result", result)];

    if (diff) {
      panes.push(pane("Diff", diff));
    }

    body.append(element("div", { class: "panes" }, panes));
  }

  return body;
};

const bodyId = (snapshot: Snapshot) => `${snapshot.id}:images`;

const renderBody = (snapshot: Snapshot) => {
  const body = renderImages(snapshot);

  body.id = bodyId(snapshot);
  // Hidden images are not loaded, as they are lazy
  body.hidden = state.collapsed.has(snapshot.id);

  return body;
};

const renderCard = (snapshot: Snapshot) => {
  const viewed = isViewed(snapshot);
  const checkbox = element("input", {
    type: "checkbox",
    "data-viewed": snapshot.id,
  });

  checkbox.checked = viewed;

  const card = element(
    "article",
    {
      class: viewed ? "snapshot viewed" : "snapshot",
      id: snapshot.id,
      tabindex: -1,
    },
    [
      element("header", { class: "snapshot-header" }, [
        element("button", {
          type: "button",
          class: "collapse-toggle",
          "data-collapse": snapshot.id,
          "aria-expanded": String(!state.collapsed.has(snapshot.id)),
          "aria-controls": bodyId(snapshot),
          "aria-label": `Show the images of ${snapshot.name}`,
        }),
        element("h2", {}, [
          element("a", { href: anchorFor(snapshot), text: snapshot.name }),
        ]),
        element("span", {
          class: `badge ${snapshot.status}`,
          text: statusLabel(snapshot),
        }),
        element("label", { class: "viewed-toggle" }, [checkbox, "Viewed"]),
        element("span", {
          class: "snapshot-path muted",
          text: snapshot.renamedFrom
            ? `${snapshot.renamedFrom} → ${snapshot.id}`
            : snapshot.id,
        }),
      ]),
      renderBody(snapshot),
    ],
  );

  cards.set(snapshot.id, card);

  return card;
};

const renderNav = (snapshots: Snapshot[]) =>
  [
    ...Map.groupBy(
      snapshots,
      (snapshot) => `${snapshot.workspace}/${snapshot.file}`,
    ),
  ].map(([file, items]) =>
    element("details", { open: "", "data-group": "" }, [
      element("summary", { title: file, text: file.split("/").at(-1) ?? "" }),
      element(
        "ul",
        {},
        items.map((snapshot) =>
          element(
            "li",
            {
              "data-id": snapshot.id,
              ...(isViewed(snapshot) && { class: "viewed" }),
            },
            [
              element(
                "a",
                {
                  href: anchorFor(snapshot),
                  title: statusLabel(snapshot),
                },
                [
                  element("span", { class: `badge-dot ${snapshot.status}` }),
                  snapshot.name,
                ],
              ),
            ],
          ),
        ),
      ),
    ]),
  );

/** The height covered by the masthead, which only sticks to the top on wide screens */
const mastheadHeight = () => {
  const masthead = query(".masthead");

  return getComputedStyle(masthead).position === "sticky"
    ? masthead.getBoundingClientRect().height
    : 0;
};

const matches = (snapshot: Snapshot) =>
  (state.status === "all" || snapshot.status === state.status) &&
  !(state.hideViewed && isViewed(snapshot)) &&
  [snapshot.id, snapshot.renamedFrom ?? ""].some((id) =>
    id.toLowerCase().includes(state.query),
  );

const emptyMessage = (snapshots: Snapshot[]) => {
  if (snapshots.length === 0) {
    return "No visual regressions or baseline changes were found.";
  }

  return state.hideViewed && state.viewed.size > 0
    ? "Every snapshot matching the filter has been viewed."
    : "No snapshots match the filter.";
};

const applyFilters = (snapshots: Snapshot[]) => {
  let visibleCount = 0;

  for (const snapshot of snapshots) {
    const visible = matches(snapshot);
    const card = cards.get(snapshot.id);

    if (card) {
      card.hidden = !visible;
    }

    query(`#nav li[data-id="${CSS.escape(snapshot.id)}"]`).hidden = !visible;

    if (visible) {
      visibleCount += 1;
    }
  }

  for (const group of document.querySelectorAll<HTMLElement>(
    "#nav [data-group]",
  )) {
    group.hidden = !group.querySelector("li:not([hidden])");
  }

  const empty = query("#empty");

  empty.hidden = visibleCount > 0;
  empty.textContent = emptyMessage(snapshots);
};

const renderProgress = (snapshots: Snapshot[]) => {
  const progress = query("#progress");
  const bar = progress.querySelector("progress");
  const label = progress.querySelector("span");

  if (bar && label) {
    bar.max = snapshots.length;
    bar.value = state.viewed.size;
    label.textContent = `${String(state.viewed.size)} / ${String(snapshots.length)} viewed`;
  }
};

const setCollapsed = (snapshot: Snapshot, collapsed: boolean) => {
  const card = cards.get(snapshot.id);
  const body = card?.querySelector<HTMLElement>(".snapshot-body");

  if (collapsed) {
    state.collapsed.add(snapshot.id);
  } else {
    state.collapsed.delete(snapshot.id);
  }

  if (body) {
    body.hidden = collapsed;
  }

  card
    ?.querySelector(".collapse-toggle")
    ?.setAttribute("aria-expanded", String(!collapsed));
};

/** Marks a snapshot as viewed, which hides its images as on GitHub */
const setViewed = (snapshot: Snapshot, viewed: boolean, manifest: Manifest) => {
  const card = cards.get(snapshot.id);
  const checkbox = card?.querySelector<HTMLInputElement>("input[data-viewed]");

  if (viewed) {
    state.viewed.add(viewKey(snapshot));
  } else {
    state.viewed.delete(viewKey(snapshot));
  }

  writeViewed(manifest);
  setCollapsed(snapshot, viewed);
  card?.classList.toggle("viewed", viewed);
  query(`#nav li[data-id="${CSS.escape(snapshot.id)}"]`).classList.toggle(
    "viewed",
    viewed,
  );

  if (checkbox) {
    checkbox.checked = viewed;
  }

  renderProgress(manifest.snapshots);

  if (state.hideViewed) {
    applyFilters(manifest.snapshots);
  }

  // Hiding the images can move the snapshot above the viewport, so it is scrolled back into view
  if (
    card &&
    !card.hidden &&
    card.getBoundingClientRect().top < mastheadHeight()
  ) {
    card.scrollIntoView({ block: "start" });
  }
};

const setPressed = (attribute: string, value: string) => {
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    `button[data-${attribute}]`,
  )) {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset[attribute] === value),
    );
  }
};

const setMode = (mode: Mode, snapshots: Snapshot[]) => {
  state.mode = mode;
  writePreference("mode", mode);
  setPressed("mode", mode);

  for (const snapshot of snapshots) {
    cards
      .get(snapshot.id)
      ?.querySelector(".snapshot-body")
      ?.replaceWith(renderBody(snapshot));
  }
};

const setTheme = (theme: (typeof THEMES)[number]) => {
  state.theme = theme;
  writePreference("theme", theme);
  setPressed("theme", theme);

  if (theme === "auto") {
    delete document.documentElement.dataset["theme"];
  } else {
    document.documentElement.dataset["theme"] = theme;
  }
};

const focusCard = (card: HTMLElement) => {
  card.scrollIntoView({ block: "start" });
  card.focus({ preventScroll: true });
  history.replaceState(null, "", `#${encodeURIComponent(card.id)}`);
};

/** The focused snapshot, or else the first one in view */
const currentCard = () => {
  const focused =
    document.activeElement instanceof HTMLElement
      ? document.activeElement.closest<HTMLElement>(".snapshot")
      : null;

  if (focused && !focused.hidden) {
    return focused;
  }

  const offset = mastheadHeight();

  return [...cards.values()].find(
    (card) => !card.hidden && card.getBoundingClientRect().bottom > offset,
  );
};

/** Moves to the next or previous visible snapshot, relative to the top of the viewport */
const step = (direction: 1 | -1) => {
  const visible = [...cards.values()].filter((card) => !card.hidden);
  // Matches the scroll margin of the snapshots
  const offset = mastheadHeight() + 16;
  const tops = visible.map((card) => card.getBoundingClientRect().top - offset);

  const target =
    direction > 0
      ? visible.find((_card, i) => (tops[i] ?? 0) > 4)
      : visible.findLast((_card, i) => (tops[i] ?? 0) < -4);

  if (target) {
    focusCard(target);
  }
};

const renderSummary = (manifest: Manifest) => {
  const counts = Object.groupBy(manifest.snapshots, ({ status }) => status);
  const pullRequestNumber =
    new URL(manifest.pullRequestUrl).pathname.split("/").findLast(Boolean) ??
    "";

  document.title = `Visual regressions · PR #${pullRequestNumber}`;
  query("#title").textContent =
    `Visual regressions in PR #${pullRequestNumber}`;

  query("#summary").append(
    `${String(counts.changed?.length ?? 0)} changed · ${String(counts.new?.length ?? 0)} new · ${String(counts.renamed?.length ?? 0)} renamed · ${String(counts.removed?.length ?? 0)} removed · `,
    element("a", { href: manifest.pullRequestUrl, text: "pull request" }),
    " · ",
    element("a", {
      href: manifest.commitUrl,
      text: manifest.headSha.slice(0, 7),
    }),
    " · ",
    element("a", { href: manifest.runUrl, text: "workflow run" }),
  );
};

const main = async () => {
  const response = await fetch("manifest.json");
  // Written by the build script alongside this file
  const manifest = (await response.json()) as Manifest;
  const { snapshots } = manifest;
  const snapshotsById = new Map(
    snapshots.map((snapshot) => [snapshot.id, snapshot]),
  );

  state.viewed = readViewed(manifest);

  for (const snapshot of snapshots) {
    if (isViewed(snapshot)) {
      state.collapsed.add(snapshot.id);
    }
  }

  renderSummary(manifest);
  renderProgress(snapshots);
  setTheme(state.theme);
  setPressed("mode", state.mode);
  query("#hide-viewed").setAttribute("aria-pressed", String(state.hideViewed));

  query("#nav").append(...renderNav(snapshots));
  query("#snapshots").append(
    ...snapshots.map((snapshot) => renderCard(snapshot)),
  );

  applyFilters(snapshots);

  new ResizeObserver(() => {
    document.documentElement.style.setProperty(
      "--masthead-height",
      `${String(mastheadHeight())}px`,
    );
  }).observe(query(".masthead"));

  const filter = query("#filter");

  if (!(filter instanceof HTMLInputElement)) {
    throw new TypeError("#filter is not an input");
  }

  filter.addEventListener("input", () => {
    state.query = filter.value.trim().toLowerCase();
    applyFilters(snapshots);
  });

  document.addEventListener("click", (event) => {
    const button =
      event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>("button")
        : null;

    const mode = MODES.find((option) => option === button?.dataset["mode"]);
    const theme = THEMES.find((option) => option === button?.dataset["theme"]);
    const status = STATUS_FILTERS.find(
      (option) => option === button?.dataset["status"],
    );
    const collapsible = snapshotsById.get(button?.dataset["collapse"] ?? "");

    if (collapsible) {
      setCollapsed(collapsible, !state.collapsed.has(collapsible.id));
    } else if (button?.id === "hide-viewed") {
      state.hideViewed = !state.hideViewed;
      writePreference("hide-viewed", String(state.hideViewed));
      button.setAttribute("aria-pressed", String(state.hideViewed));
      applyFilters(snapshots);
    } else if (mode) {
      setMode(mode, snapshots);
    } else if (theme) {
      setTheme(theme);
    } else if (status) {
      state.status = status;
      setPressed("status", status);
      applyFilters(snapshots);
    }
  });

  document.addEventListener("change", (event) => {
    const checkbox = event.target;

    if (checkbox instanceof HTMLInputElement) {
      const snapshot = snapshotsById.get(checkbox.dataset["viewed"] ?? "");

      if (snapshot) {
        setViewed(snapshot, checkbox.checked, manifest);
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.target instanceof HTMLInputElement
    ) {
      return;
    }

    const mode = MODES[Number(event.key) - 1];

    if (event.key === "j") {
      step(1);
    } else if (event.key === "k") {
      step(-1);
    } else if (event.key === "v") {
      const snapshot = snapshotsById.get(currentCard()?.id ?? "");

      if (snapshot) {
        const viewed = !isViewed(snapshot);

        setViewed(snapshot, viewed, manifest);

        // Moves on once a snapshot is reviewed, as its images are now hidden
        if (viewed) {
          step(1);
        }
      }
    } else if (event.key === "/") {
      event.preventDefault();
      filter.focus();
    } else if (mode) {
      setMode(mode, snapshots);
    }
  });

  const linked = cards.get(decodeURIComponent(location.hash.slice(1)));

  if (linked) {
    focusCard(linked);
  }
};

try {
  await main();
} catch (error) {
  const empty = query("#empty");

  empty.hidden = false;
  empty.textContent = `The report could not be loaded: ${error instanceof Error ? error.message : String(error)}`;
}
