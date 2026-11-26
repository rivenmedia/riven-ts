interface Gate {
  promise: Promise<boolean>;
  resolve: (isReleased: boolean) => void;
}

const openGates = new Map<string, Gate>();

// Once closed, every wait is abandoned until the gates reopen, including a wait that starts after the clear
let isClosed = false;

const openGate = (key: string) => {
  const existing = openGates.get(key);

  if (existing) {
    return existing;
  }

  const { promise, resolve } = Promise.withResolvers<boolean>();
  const gate = { promise, resolve };

  openGates.set(key, gate);

  return gate;
};

/**
 * Holds mocked responses until a test releases them, so a test can see the state Riven is in while it waits.
 * Tests release a gate through the E2E control endpoint. Resetting the instance clears every gate, which leaves them
 * closed until the reset has applied the next scenario.
 */
export const gates = {
  /** Opens the gate, unless it's already open or released */
  open(key: string) {
    openGate(key);
  },

  /**
   * Waits for the gate to be released, opening it if it isn't already.
   *
   * @returns `true` once the gate is released, or `false` if the gates are cleared, or were cleared and haven't reopened,
   * so the response is abandoned
   */
  async wait(key: string) {
    if (isClosed) {
      return false;
    }

    return openGate(key).promise;
  },

  /** Releases the gate, so waits on it resolve, including waits that start after this */
  release(key: string) {
    openGate(key).resolve(true);
  },

  /**
   * Resolves every pending wait as abandoned, then forgets every gate, released or not.
   * The gates stay closed, so a wait that starts later is abandoned too, until they reopen.
   */
  clear() {
    isClosed = true;

    for (const { resolve } of openGates.values()) {
      resolve(false);
    }

    openGates.clear();
  },

  /** Opens the gates for waiting again, after a clear */
  reopen() {
    isClosed = false;
  },
};
