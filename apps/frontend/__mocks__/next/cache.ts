export function io() {
  return Promise.resolve();
}

export function cacheLife() {
  return Promise.resolve();
}

export function revalidatePath() {
  // There's no server cache to revalidate in Storybook
}
