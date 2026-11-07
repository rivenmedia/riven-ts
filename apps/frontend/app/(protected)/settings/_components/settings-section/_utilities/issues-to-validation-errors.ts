interface ValidationErrorsNode {
  _errors?: string[];
  [key: string]: unknown;
}

/**
 * Converts backend settings issues (dotted paths) into next-safe-action's
 * formatted validation errors shape, so they can be mapped onto form fields.
 *
 * An empty path puts the message on the root, as a form-level error.
 */
export function issuesToValidationErrors(
  issues: { path: string; message: string }[],
): Record<string, unknown> {
  const root: ValidationErrorsNode = {};

  for (const { path, message } of issues) {
    let node = root;

    for (const segment of path.split(".").filter(Boolean)) {
      node[segment] ??= {};
      node = node[segment] as ValidationErrorsNode;
    }

    // `_errors` is next-safe-action's key for a node's own messages
    // oxlint-disable-next-line no-underscore-dangle
    node._errors = [...(node._errors ?? []), message];
  }

  return root;
}
