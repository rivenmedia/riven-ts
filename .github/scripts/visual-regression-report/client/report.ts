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

const BACKGROUNDS = ["checker", "light", "dark"] as const;

const STATUS_FILTERS = ["all", "changed", "new"] as const;

type Mode = (typeof MODES)[number];

const STATUS_LABELS: Record<SnapshotStatus, string> = {
  changed: "Changed",
  new: "New baseline",
};

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
  background: readPreference("background", BACKGROUNDS, "checker"),
  status: "all" as (typeof STATUS_FILTERS)[number],
  query: "",
};

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

const renderBody = (snapshot: Snapshot) => {
  const body = element("div", { class: "snapshot-body" });
  const { baseline, result, diff } = snapshot;

  if (!baseline) {
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

const renderCard = (snapshot: Snapshot) => {
  const card = element(
    "article",
    { class: "snapshot", id: snapshot.id, tabindex: -1 },
    [
      element("header", { class: "snapshot-header" }, [
        element("h2", {}, [
          element("a", { href: anchorFor(snapshot), text: snapshot.name }),
        ]),
        element("span", {
          class: `badge ${snapshot.status}`,
          text: STATUS_LABELS[snapshot.status],
        }),
        element("span", { class: "snapshot-path muted", text: snapshot.id }),
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
          element("li", { "data-id": snapshot.id }, [
            element(
              "a",
              {
                href: anchorFor(snapshot),
                title: STATUS_LABELS[snapshot.status],
              },
              [
                element("span", { class: `badge-dot ${snapshot.status}` }),
                snapshot.name,
              ],
            ),
          ]),
        ),
      ),
    ]),
  );

const matches = (snapshot: Snapshot) =>
  (state.status === "all" || snapshot.status === state.status) &&
  snapshot.id.toLowerCase().includes(state.query);

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
  empty.textContent =
    snapshots.length === 0
      ? "No visual regressions or new baselines were found."
      : "No snapshots match the filter.";
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

const setBackground = (background: (typeof BACKGROUNDS)[number]) => {
  state.background = background;
  writePreference("background", background);
  setPressed("background", background);
  document.body.dataset["background"] = background;
};

/** The height covered by the masthead, which only sticks to the top on wide screens */
const mastheadHeight = () => {
  const masthead = query(".masthead");

  return getComputedStyle(masthead).position === "sticky"
    ? masthead.getBoundingClientRect().height
    : 0;
};

const focusCard = (card: HTMLElement) => {
  card.scrollIntoView({ block: "start" });
  card.focus({ preventScroll: true });
  history.replaceState(null, "", `#${encodeURIComponent(card.id)}`);
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
  const changed = manifest.snapshots.filter(
    ({ status }) => status === "changed",
  ).length;
  const added = manifest.snapshots.length - changed;
  const pullRequestNumber =
    new URL(manifest.pullRequestUrl).pathname.split("/").findLast(Boolean) ??
    "";

  document.title = `Visual regressions · PR #${pullRequestNumber}`;
  query("#title").textContent =
    `Visual regressions in PR #${pullRequestNumber}`;

  query("#summary").append(
    `${String(changed)} changed · ${String(added)} new · `,
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

  renderSummary(manifest);
  setBackground(state.background);
  setPressed("mode", state.mode);

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
    const background = BACKGROUNDS.find(
      (option) => option === button?.dataset["background"],
    );
    const status = STATUS_FILTERS.find(
      (option) => option === button?.dataset["status"],
    );

    if (mode) {
      setMode(mode, snapshots);
    } else if (background) {
      setBackground(background);
    } else if (status) {
      state.status = status;
      setPressed("status", status);
      applyFilters(snapshots);
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
