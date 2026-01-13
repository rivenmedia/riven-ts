/**
 * Custom exceptions for the RTN package.
 */

/**
 * Exception raised when a torrent is identified as garbage/trash.
 */
export class GarbageTorrent extends Error {}

/**
 * Exception raised when settings are disabled.
 */
export class SettingsDisabled extends Error {}
