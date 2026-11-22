import { get } from "es-toolkit/compat";

export interface SectionSubmission {
  values: Record<string, unknown>;
  /** Dotted paths of fields whose stored values are removed. */
  reset: string[];
}

/**
 * Splits a section form's values into what's saved and what's reset.
 *
 * An emptied field is `undefined` (a nullable one is `null`, which is saved),
 * so a clearable field that's `undefined` but had a value is reset rather than
 * left out, returning it to its default or leaving it unset.
 *
 * @param clearableFields Dotted paths of the rendered fields that can be reset
 *   by emptying them, which excludes secrets and locked fields.
 */
export function toSectionSubmission(
  formValues: Record<string, unknown>,
  defaultValues: Record<string, unknown>,
  clearableFields: string[],
): SectionSubmission {
  const values = structuredClone(formValues);
  const reset = clearableFields.filter(
    (name) =>
      get(formValues, name) === undefined &&
      get(defaultValues, name) !== undefined,
  );

  for (const name of reset) {
    const segments = name.split(".");
    const key = segments.pop() ?? name;
    const parent: unknown =
      segments.length > 0 ? get(values, segments) : values;

    if (typeof parent === "object" && parent !== null) {
      Reflect.deleteProperty(parent, key);
    }
  }

  return { values, reset };
}
