import { expect, it } from "vitest";

import { maskFormat } from "./mask.format.ts";

import type { TransformableInfo } from "logform";

it("masks api keys in log messages", () => {
  expect.assertions(6);

  const messages = [
    "api_key=1234g0qoij",
    "apikey=1234g0qoij",
    "apitoken=1234g0qoij",
    "accesstoken=1234g0qoij",
    "token=1234g0qoij",
    "key=1234g0qoij",
  ];

  for (const message of messages) {
    const maskedMessage = maskFormat().transform({
      message,
    } as TransformableInfo);

    expect.assert(typeof maskedMessage === "object");

    expect(maskedMessage.message).toMatch(
      /(api_key|apikey|apitoken|accesstoken|token|key)=\[REDACTED\]/u,
    );
  }
});

it("masks usernames in directories", () => {
  expect.assertions(2);

  const messages = [
    "/home/johndoe/somefile.txt",
    "/Users/johndoe/somefile.txt",
  ];

  for (const message of messages) {
    const maskedMessage = maskFormat().transform({
      message,
    } as TransformableInfo);

    expect.assert(typeof maskedMessage === "object");

    expect(maskedMessage.message).toMatch(/\/(home|Users)\/\[REDACTED\]/u);
  }
});

it("only masks the sensitive parts of a message", () => {
  const message =
    "User's API key is apikey=1234g0qoij and their home directory is /home/johndoe/";

  const maskedMessage = maskFormat().transform({
    message,
  } as TransformableInfo);

  expect.assert(typeof maskedMessage === "object");

  expect(maskedMessage.message).toBe(
    "User's API key is apikey=[REDACTED] and their home directory is /home/[REDACTED]/",
  );
});

it("does not modify messages without sensitive data", () => {
  const message = "This is a safe log message.";

  const maskedMessage = maskFormat().transform({
    message,
  } as TransformableInfo);

  expect.assert(typeof maskedMessage === "object");

  expect(maskedMessage.message).toBe(message);
});
