This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Visual tests

Every story is also a visual test: [`storybook-addon-vis`](https://www.npmjs.com/package/storybook-addon-vis) captures a snapshot at the end of each story test and compares it with a committed baseline. A mismatch fails the test, so a visual change fails `test:component` like any other assertion.

Rendering depends on the OS (font rasterisation, fallback fonts, scrollbars, GPU compositing), so the committed baselines in `__vis__/docker/__baselines__` are rendered by a browser in the pinned [Playwright container](https://playwright.dev/docs/docker). CI uses the same container.

| Command                               | Browser              | Compares against                                          |
| ------------------------------------- | -------------------- | --------------------------------------------------------- |
| `pnpm test:component:docker [filter]` | Playwright container | The committed baselines. Reproduces CI exactly.           |
| `pnpm test:component [filter]`        | Locally installed    | Your own git-ignored snapshots in `__vis__/local`.        |
| `pnpm test:component -u`              | Locally installed    | Writes `__vis__/local` baselines for before/after checks. |

`test:component:docker` needs Docker. On Apple Silicon it runs the x64 image under emulation, so it's slower than a native run; pass a filter to run only the stories you changed.

To review a failure, run `pnpm vis:report` and open `.vis-report/visual-report.html` for a diff, reference, actual and slider view of each flagged snapshot. The **Vis** panel in Storybook shows the same images for the selected story.

### Opting out and tuning

- Add the `!snapshot` tag to a story or its meta to skip its snapshot. Story tests created with `Story.test()` aren't captured, as their parent story is.
- `parameters.snapshot` accepts `delay` (ms to wait before capturing), `fullPage: false` (capture the viewport only) and the [comparison options](https://github.com/repobuddy/visual-testing/tree/main/packages/vitest-plugin-vis#customizing-snapshot-comparison-options).

### Updating baselines

Baselines are only updated by CI, so that they're always rendered in the same environment and reviewed:

1. Push your change. If any snapshots differ, the "Visual changes" comment on the pull request shows the expected, actual and diff images, with a link to the full report.
2. A maintainer with write access comments `/approve-visuals` (or `/approve-visuals prune` to also delete baselines that are no longer captured).
3. The workflow commits the reviewed images to the branch as a signed commit from the GitHub App, and Verify re-runs against them.

Don't commit baseline images yourself - the "Check visual baseline provenance" check fails for any baseline that wasn't committed by `/approve-visuals`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
