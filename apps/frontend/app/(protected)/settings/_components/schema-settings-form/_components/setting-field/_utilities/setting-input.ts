const isEmptyInput = (value: unknown) => value === "" || value == null;

/**
 * An emptied input is saved as `null` for a nullable setting. Otherwise it's
 * `undefined`, which resets the setting when the form is submitted.
 */
const toEmptyValue = (nullable: boolean) => (nullable ? null : undefined);

/** Parses a text input's value into a setting's value. */
export const parseTextInput = (value: unknown, nullable = false) =>
  isEmptyInput(value) ? toEmptyValue(nullable) : value;

/** Parses a number input's value, so an emptied input is never saved as `NaN`. */
export const parseNumberInput = (value: unknown, nullable = false) =>
  isEmptyInput(value) ? toEmptyValue(nullable) : Number(value);
