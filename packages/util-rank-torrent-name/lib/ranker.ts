/**
 * Ranking functions for calculating torrent ranks based on user settings.
 */
import type { BaseRankingModel, ParsedData, SettingsModel } from "./models.ts";

/**
 * Calculate the ranking of the given parsed data.
 */
export function getRank(
  data: ParsedData,
  settings: SettingsModel,
  rankModel: BaseRankingModel,
): number {
  if (!data.rawTitle) {
    throw new Error("Parsed data cannot be empty.");
  }

  let rank = 0;
  rank += calculateQualityRank(data, settings, rankModel);
  rank += calculateHdrRank(data, settings, rankModel);
  rank += calculateChannelsRank(data, settings, rankModel);
  rank += calculateAudioRank(data, settings, rankModel);
  rank += calculateCodecRank(data, settings, rankModel);
  rank += calculateExtraRanks(data, settings, rankModel);
  rank += calculatePreferred(data, settings);
  rank += calculatePreferredLangs(data, settings);
  return rank;
}

/**
 * Calculate the preferred ranking of a given parsed data.
 */
export function calculatePreferred(
  data: ParsedData,
  settings: SettingsModel,
): number {
  if (settings.preferred.length === 0) {
    return 0;
  }

  const hasMatch = settings.preferred.some((pattern) => {
    if (pattern instanceof RegExp) {
      return pattern.test(data.rawTitle);
    }
    return new RegExp(pattern, "i").test(data.rawTitle);
  });

  return hasMatch ? 10000 : 0;
}

/**
 * Calculate the preferred languages ranking of a given parsed data.
 */
export function calculatePreferredLangs(
  data: ParsedData,
  settings: SettingsModel,
): number {
  if (settings.languages.preferred.length === 0) {
    return 0;
  }

  const hasPreferred = settings.languages.preferred.some((lang) =>
    data.languages.includes(lang),
  );

  return hasPreferred ? 10000 : 0;
}

/**
 * Calculate the quality ranking of the given parsed data.
 */
export function calculateQualityRank(
  data: ParsedData,
  settings: SettingsModel,
  rankModel: BaseRankingModel,
): number {
  if (!data.quality) {
    return 0;
  }

  const quality = data.quality;
  const customRanks = settings.customRanks;

  switch (quality) {
    // Quality
    case "WEB":
      return customRanks.quality.web.useCustomRank
        ? customRanks.quality.web.rank
        : rankModel.web;
    case "WEB-DL":
      return customRanks.quality.webdl.useCustomRank
        ? customRanks.quality.webdl.rank
        : rankModel.webdl;
    case "BluRay":
      return customRanks.quality.bluray.useCustomRank
        ? customRanks.quality.bluray.rank
        : rankModel.bluray;
    case "HDTV":
      return customRanks.quality.hdtv.useCustomRank
        ? customRanks.quality.hdtv.rank
        : rankModel.hdtv;
    case "VHS":
      return customRanks.quality.vhs.useCustomRank
        ? customRanks.quality.vhs.rank
        : rankModel.vhs;
    case "WEBMux":
      return customRanks.quality.webmux.useCustomRank
        ? customRanks.quality.webmux.rank
        : rankModel.webmux;
    case "BluRay REMUX":
    case "REMUX":
      return customRanks.quality.remux.useCustomRank
        ? customRanks.quality.remux.rank
        : rankModel.remux;

    // Rips
    case "WEBRip":
      return customRanks.rips.webrip.useCustomRank
        ? customRanks.rips.webrip.rank
        : rankModel.webrip;
    case "WEB-DLRip":
      return customRanks.rips.webdlrip.useCustomRank
        ? customRanks.rips.webdlrip.rank
        : rankModel.webdlrip;
    case "UHDRip":
      return customRanks.rips.uhdrip.useCustomRank
        ? customRanks.rips.uhdrip.rank
        : rankModel.uhdrip;
    case "HDRip":
      return customRanks.rips.hdrip.useCustomRank
        ? customRanks.rips.hdrip.rank
        : rankModel.hdrip;
    case "DVDRip":
      return customRanks.rips.dvdrip.useCustomRank
        ? customRanks.rips.dvdrip.rank
        : rankModel.dvdrip;
    case "BDRip":
      return customRanks.rips.bdrip.useCustomRank
        ? customRanks.rips.bdrip.rank
        : rankModel.bdrip;
    case "BRRip":
      return customRanks.rips.brrip.useCustomRank
        ? customRanks.rips.brrip.rank
        : rankModel.brrip;
    case "VHSRip":
      return customRanks.rips.vhsrip.useCustomRank
        ? customRanks.rips.vhsrip.rank
        : rankModel.vhsrip;
    case "PPVRip":
      return customRanks.rips.ppvrip.useCustomRank
        ? customRanks.rips.ppvrip.rank
        : rankModel.ppvrip;
    case "SATRip":
      return customRanks.rips.satrip.useCustomRank
        ? customRanks.rips.satrip.rank
        : rankModel.satrip;
    case "TVRip":
      return customRanks.rips.tvrip.useCustomRank
        ? customRanks.rips.tvrip.rank
        : rankModel.tvrip;

    // Trash
    case "TeleCine":
      return customRanks.trash.telecine.useCustomRank
        ? customRanks.trash.telecine.rank
        : rankModel.telecine;
    case "TeleSync":
      return customRanks.trash.telesync.useCustomRank
        ? customRanks.trash.telesync.rank
        : rankModel.telesync;
    case "SCR":
      return customRanks.trash.screener.useCustomRank
        ? customRanks.trash.screener.rank
        : rankModel.screener;
    case "R5":
      return customRanks.trash.r5.useCustomRank
        ? customRanks.trash.r5.rank
        : rankModel.r5;
    case "CAM":
      return customRanks.trash.cam.useCustomRank
        ? customRanks.trash.cam.rank
        : rankModel.cam;
    case "PDTV":
      return customRanks.trash.pdtv.useCustomRank
        ? customRanks.trash.pdtv.rank
        : rankModel.pdtv;

    default:
      return 0;
  }
}

/**
 * Calculate the codec ranking of the given parsed data.
 */
export function calculateCodecRank(
  data: ParsedData,
  settings: SettingsModel,
  rankModel: BaseRankingModel,
): number {
  if (!data.codec) {
    return 0;
  }

  const codec = data.codec.toLowerCase();
  const customRanks = settings.customRanks;

  switch (codec) {
    case "avc":
    case "h264":
    case "x264":
      return customRanks.quality.avc.useCustomRank
        ? customRanks.quality.avc.rank
        : rankModel.avc;
    case "hevc":
    case "h265":
    case "x265":
      return customRanks.quality.hevc.useCustomRank
        ? customRanks.quality.hevc.rank
        : rankModel.hevc;
    case "xvid":
      return customRanks.quality.xvid.useCustomRank
        ? customRanks.quality.xvid.rank
        : rankModel.xvid;
    case "av1":
      return customRanks.quality.av1.useCustomRank
        ? customRanks.quality.av1.rank
        : rankModel.av1;
    case "mpeg":
    case "mpeg2":
      return customRanks.quality.mpeg.useCustomRank
        ? customRanks.quality.mpeg.rank
        : rankModel.mpeg;
    default:
      return 0;
  }
}

/**
 * Calculate the HDR ranking of the given parsed data.
 */
export function calculateHdrRank(
  data: ParsedData,
  settings: SettingsModel,
  rankModel: BaseRankingModel,
): number {
  if (data.hdr.length === 0) {
    return 0;
  }

  let totalRank = 0;
  const customRanks = settings.customRanks;

  for (const hdr of data.hdr) {
    switch (hdr) {
      case "DV":
        totalRank += customRanks.hdr.dolbyVision.useCustomRank
          ? customRanks.hdr.dolbyVision.rank
          : rankModel.dolbyVision;
        break;
      case "HDR":
        totalRank += customRanks.hdr.hdr.useCustomRank
          ? customRanks.hdr.hdr.rank
          : rankModel.hdr;
        break;
      case "HDR10+":
        totalRank += customRanks.hdr.hdr10plus.useCustomRank
          ? customRanks.hdr.hdr10plus.rank
          : rankModel.hdr10plus;
        break;
      case "SDR":
        totalRank += customRanks.hdr.sdr.useCustomRank
          ? customRanks.hdr.sdr.rank
          : rankModel.sdr;
        break;
    }
  }

  // Add bit depth rank
  if (data.bitDepth) {
    totalRank += customRanks.hdr.bit10.useCustomRank
      ? customRanks.hdr.bit10.rank
      : rankModel.bit10;
  }

  return totalRank;
}

/**
 * Calculate the audio ranking of the given parsed data.
 */
export function calculateAudioRank(
  data: ParsedData,
  settings: SettingsModel,
  rankModel: BaseRankingModel,
): number {
  if (data.audio.length === 0) {
    return 0;
  }

  let totalRank = 0;
  const customRanks = settings.customRanks;

  for (const audioFormat of data.audio) {
    switch (audioFormat) {
      case "AAC":
        totalRank += customRanks.audio.aac.useCustomRank
          ? customRanks.audio.aac.rank
          : rankModel.aac;
        break;
      case "Atmos":
        totalRank += customRanks.audio.atmos.useCustomRank
          ? customRanks.audio.atmos.rank
          : rankModel.atmos;
        break;
      case "Dolby Digital":
        totalRank += customRanks.audio.dolbyDigital.useCustomRank
          ? customRanks.audio.dolbyDigital.rank
          : rankModel.dolbyDigital;
        break;
      case "Dolby Digital Plus":
        totalRank += customRanks.audio.dolbyDigitalPlus.useCustomRank
          ? customRanks.audio.dolbyDigitalPlus.rank
          : rankModel.dolbyDigitalPlus;
        break;
      case "DTS Lossy":
        totalRank += customRanks.audio.dtsLossy.useCustomRank
          ? customRanks.audio.dtsLossy.rank
          : rankModel.dtsLossy;
        break;
      case "DTS Lossless":
        totalRank += customRanks.audio.dtsLossless.useCustomRank
          ? customRanks.audio.dtsLossless.rank
          : rankModel.dtsLossless;
        break;
      case "FLAC":
        totalRank += customRanks.audio.flac.useCustomRank
          ? customRanks.audio.flac.rank
          : rankModel.flac;
        break;
      case "MP3":
        totalRank += customRanks.audio.mp3.useCustomRank
          ? customRanks.audio.mp3.rank
          : rankModel.mp3;
        break;
      case "TrueHD":
        totalRank += customRanks.audio.truehd.useCustomRank
          ? customRanks.audio.truehd.rank
          : rankModel.truehd;
        break;
      case "HQ Clean Audio":
        totalRank += customRanks.trash.cleanAudio.useCustomRank
          ? customRanks.trash.cleanAudio.rank
          : rankModel.cleanAudio;
        break;
    }
  }

  return totalRank;
}

/**
 * Calculate the channels ranking of the given parsed data.
 */
export function calculateChannelsRank(
  data: ParsedData,
  settings: SettingsModel,
  rankModel: BaseRankingModel,
): number {
  if (data.channels.length === 0) {
    return 0;
  }

  let totalRank = 0;
  const customRanks = settings.customRanks;

  for (const channel of data.channels) {
    switch (channel) {
      case "5.1":
      case "7.1":
        totalRank += customRanks.audio.surround.useCustomRank
          ? customRanks.audio.surround.rank
          : rankModel.surround;
        break;
      case "stereo":
      case "2.0":
        totalRank += customRanks.audio.stereo.useCustomRank
          ? customRanks.audio.stereo.rank
          : rankModel.stereo;
        break;
      case "mono":
        totalRank += customRanks.audio.mono.useCustomRank
          ? customRanks.audio.mono.rank
          : rankModel.mono;
        break;
    }
  }

  return totalRank;
}

/**
 * Calculate all the other rankings of the given parsed data.
 */
export function calculateExtraRanks(
  data: ParsedData,
  settings: SettingsModel,
  rankModel: BaseRankingModel,
): number {
  // Early return check - matches Python behavior
  // Note: This means extras like site, dubbed, etc. are only calculated if
  // at least one of bitDepth, hdr, seasons, or episodes is present
  if (
    !data.bitDepth &&
    data.hdr.length === 0 &&
    data.seasons.length === 0 &&
    data.episodes.length === 0
  ) {
    return 0;
  }

  let totalRank = 0;
  const customRanks = settings.customRanks;

  if (data.is3d) {
    totalRank += customRanks.extras.three_d.useCustomRank
      ? customRanks.extras.three_d.rank
      : rankModel.three_d;
  }
  if (data.converted) {
    totalRank += customRanks.extras.converted.useCustomRank
      ? customRanks.extras.converted.rank
      : rankModel.converted;
  }
  if (data.documentary) {
    totalRank += customRanks.extras.documentary.useCustomRank
      ? customRanks.extras.documentary.rank
      : rankModel.documentary;
  }
  if (data.dubbed) {
    totalRank += customRanks.extras.dubbed.useCustomRank
      ? customRanks.extras.dubbed.rank
      : rankModel.dubbed;
  }
  if (data.edition) {
    totalRank += customRanks.extras.edition.useCustomRank
      ? customRanks.extras.edition.rank
      : rankModel.edition;
  }
  if (data.hardcoded) {
    totalRank += customRanks.extras.hardcoded.useCustomRank
      ? customRanks.extras.hardcoded.rank
      : rankModel.hardcoded;
  }
  if (data.network) {
    totalRank += customRanks.extras.network.useCustomRank
      ? customRanks.extras.network.rank
      : rankModel.network;
  }
  if (data.proper) {
    totalRank += customRanks.extras.proper.useCustomRank
      ? customRanks.extras.proper.rank
      : rankModel.proper;
  }
  if (data.repack) {
    totalRank += customRanks.extras.repack.useCustomRank
      ? customRanks.extras.repack.rank
      : rankModel.repack;
  }
  if (data.retail) {
    totalRank += customRanks.extras.retail.useCustomRank
      ? customRanks.extras.retail.rank
      : rankModel.retail;
  }
  if (data.subbed) {
    totalRank += customRanks.extras.subbed.useCustomRank
      ? customRanks.extras.subbed.rank
      : rankModel.subbed;
  }
  if (data.upscaled) {
    totalRank += customRanks.extras.upscaled.useCustomRank
      ? customRanks.extras.upscaled.rank
      : rankModel.upscaled;
  }
  if (data.site) {
    totalRank += customRanks.extras.site.useCustomRank
      ? customRanks.extras.site.rank
      : rankModel.site;
  }
  if (data.size) {
    totalRank += customRanks.trash.size.useCustomRank
      ? customRanks.trash.size.rank
      : rankModel.size;
  }
  if (data.scene) {
    totalRank += customRanks.extras.scene.useCustomRank
      ? customRanks.extras.scene.rank
      : rankModel.scene;
  }
  if (data.uncensored) {
    totalRank += customRanks.extras.uncensored.useCustomRank
      ? customRanks.extras.uncensored.rank
      : rankModel.uncensored;
  }

  return totalRank;
}
