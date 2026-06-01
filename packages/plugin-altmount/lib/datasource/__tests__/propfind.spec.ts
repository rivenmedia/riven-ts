import { describe, expect, it } from "vitest";

import {
  parsePropfindEntries,
  selectAllMediaFiles,
  selectCompletedMediaFile,
} from "../propfind.ts";

// Real AltMount PROPFIND Depth:1 response shape (captured from a live server).
const REAL_XML = `<?xml version="1.0" encoding="UTF-8"?><D:multistatus xmlns:D="DAV:"><D:response><D:href>/webdav/complete/Default/</D:href><D:propstat><D:prop><D:resourcetype><D:collection xmlns:D="DAV:"/></D:resourcetype><D:displayname>Default</D:displayname></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response><D:response><D:href>/webdav/complete/Default/Avengers.Infinity.War.2018.4K.HDR.2160p.BDRemux.Ita.Eng.x265-NAHOM.mkv</D:href><D:propstat><D:prop><D:resourcetype></D:resourcetype><D:displayname>Avengers.Infinity.War.2018.4K.HDR.2160p.BDRemux.Ita.Eng.x265-NAHOM.mkv</D:displayname><D:getcontenttype>video/x-matroska</D:getcontenttype><D:getcontentlength>54223683572</D:getcontentlength></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response><D:response><D:href>/webdav/complete/Default/Inception.2010.4K.HDR.DV.2160p.BDRemux.Ita.Eng.x265-NAHOM.mkv</D:href><D:propstat><D:prop><D:resourcetype></D:resourcetype><D:displayname>Inception.2010.4K.HDR.DV.2160p.BDRemux.Ita.Eng.x265-NAHOM.mkv</D:displayname><D:getcontenttype>video/x-matroska</D:getcontenttype><D:getcontentlength>69347000342</D:getcontentlength></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response></D:multistatus>`;

describe("parsePropfindEntries", () => {
  it("parses href, collection flag, displayname and content length", () => {
    const entries = parsePropfindEntries(REAL_XML);

    expect(entries).toHaveLength(3);

    const dir = entries[0]!;
    expect(dir.href).toBe("/webdav/complete/Default/");
    expect(dir.isCollection).toBe(true);

    const inception = entries.find((e) =>
      e.displayName?.startsWith("Inception"),
    )!;
    expect(inception.isCollection).toBe(false);
    expect(inception.contentLength).toBe(69347000342);
    expect(inception.href).toBe(
      "/webdav/complete/Default/Inception.2010.4K.HDR.DV.2160p.BDRemux.Ita.Eng.x265-NAHOM.mkv",
    );
  });

  it("returns an empty array for an empty multistatus", () => {
    expect(
      parsePropfindEntries(
        `<?xml version="1.0"?><D:multistatus xmlns:D="DAV:"></D:multistatus>`,
      ),
    ).toEqual([]);
  });
});

describe("selectCompletedMediaFile", () => {
  it("selects the file matching the release name", () => {
    const entries = parsePropfindEntries(REAL_XML);

    const chosen = selectCompletedMediaFile(
      entries,
      "Inception.2010.4K.HDR.DV.2160p.BDRemux.Ita.Eng.x265-NAHOM",
    );

    expect(chosen).not.toBeNull();
    expect(chosen!.href).toBe(
      "/webdav/complete/Default/Inception.2010.4K.HDR.DV.2160p.BDRemux.Ita.Eng.x265-NAHOM.mkv",
    );
    expect(chosen!.fileSize).toBe(69347000342);
  });

  it("ignores the collection entry and non-matching files", () => {
    const entries = parsePropfindEntries(REAL_XML);
    const chosen = selectCompletedMediaFile(entries, "Avengers.Infinity.War");
    expect(chosen!.href).toContain("Avengers.Infinity.War");
  });

  it("returns null when nothing matches the release name", () => {
    const entries = parsePropfindEntries(REAL_XML);
    expect(
      selectCompletedMediaFile(entries, "No.Such.Release.2099"),
    ).toBeNull();
  });

  it("prefers the largest matching video file on duplicates", () => {
    const xml = `<D:multistatus xmlns:D="DAV:"><D:response><D:href>/webdav/complete/Default/Mortal.Kombat.II.2026.1080p.DCPRIP.Multi.x264-DKS.mkv</D:href><D:propstat><D:prop><D:resourcetype></D:resourcetype><D:displayname>Mortal.Kombat.II.2026.1080p.DCPRIP.Multi.x264-DKS.mkv</D:displayname><D:getcontentlength>16553826612</D:getcontentlength></D:prop></D:propstat></D:response><D:response><D:href>/webdav/complete/Default/Mortal.Kombat.II.2026.1080p.DCPRIP.Multi.x264-DKS_1.mkv</D:href><D:propstat><D:prop><D:resourcetype></D:resourcetype><D:displayname>Mortal.Kombat.II.2026.1080p.DCPRIP.Multi.x264-DKS_1.mkv</D:displayname><D:getcontentlength>1024</D:getcontentlength></D:prop></D:propstat></D:response></D:multistatus>`;
    const chosen = selectCompletedMediaFile(
      parsePropfindEntries(xml),
      "Mortal.Kombat.II.2026.1080p.DCPRIP.Multi.x264-DKS",
    );
    expect(chosen!.fileSize).toBe(16553826612);
  });

  it("ignores non-video files even if the name matches", () => {
    const xml = `<D:multistatus xmlns:D="DAV:"><D:response><D:href>/webdav/complete/Default/Inception.nfo</D:href><D:propstat><D:prop><D:resourcetype></D:resourcetype><D:displayname>Inception.nfo</D:displayname><D:getcontentlength>900</D:getcontentlength></D:prop></D:propstat></D:response></D:multistatus>`;
    expect(
      selectCompletedMediaFile(parsePropfindEntries(xml), "Inception"),
    ).toBeNull();
  });
});

describe("selectAllMediaFiles", () => {
  // A season pack lands in its own subdir; every video file in it belongs to
  // the pack, so we return them all (no release-name filter).
  const PACK_XML = `<D:multistatus xmlns:D="DAV:"><D:response><D:href>/webdav/complete/Default/The.Office.S01.1080p-GRP/</D:href><D:propstat><D:prop><D:resourcetype><D:collection/></D:resourcetype><D:displayname>The.Office.S01.1080p-GRP</D:displayname></D:prop></D:propstat></D:response><D:response><D:href>/webdav/complete/Default/The.Office.S01.1080p-GRP/The.Office.S01E01.1080p-GRP.mkv</D:href><D:propstat><D:prop><D:resourcetype></D:resourcetype><D:displayname>The.Office.S01E01.1080p-GRP.mkv</D:displayname><D:getcontenttype>video/x-matroska</D:getcontenttype><D:getcontentlength>1500000000</D:getcontentlength></D:prop></D:propstat></D:response><D:response><D:href>/webdav/complete/Default/The.Office.S01.1080p-GRP/The.Office.S01E02.1080p-GRP.mkv</D:href><D:propstat><D:prop><D:resourcetype></D:resourcetype><D:displayname>The.Office.S01E02.1080p-GRP.mkv</D:displayname><D:getcontentlength>1480000000</D:getcontentlength></D:prop></D:propstat></D:response><D:response><D:href>/webdav/complete/Default/The.Office.S01.1080p-GRP/poster.jpg</D:href><D:propstat><D:prop><D:resourcetype></D:resourcetype><D:displayname>poster.jpg</D:displayname><D:getcontentlength>50000</D:getcontentlength></D:prop></D:propstat></D:response></D:multistatus>`;

  it("returns every video file (skipping the dir + non-video) for a pack", () => {
    const files = selectAllMediaFiles(parsePropfindEntries(PACK_XML));
    expect(files).toHaveLength(2);
    expect(files.map((f) => f.href)).toEqual([
      "/webdav/complete/Default/The.Office.S01.1080p-GRP/The.Office.S01E01.1080p-GRP.mkv",
      "/webdav/complete/Default/The.Office.S01.1080p-GRP/The.Office.S01E02.1080p-GRP.mkv",
    ]);
    expect(files[0]!.fileSize).toBe(1500000000);
  });

  it("returns an empty array when there are no video files", () => {
    const xml = `<D:multistatus xmlns:D="DAV:"><D:response><D:href>/webdav/complete/Default/x/</D:href><D:propstat><D:prop><D:resourcetype><D:collection/></D:resourcetype></D:prop></D:propstat></D:response></D:multistatus>`;
    expect(selectAllMediaFiles(parsePropfindEntries(xml))).toEqual([]);
  });
});
