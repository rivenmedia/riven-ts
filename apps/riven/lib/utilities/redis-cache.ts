import { KeyvAdapter } from "@apollo/utils.keyvadapter";
import KeyvRedis, { Keyv } from "@keyv/redis";

export const redisCache = new KeyvAdapter(
  new Keyv(new KeyvRedis(process.env["REDIS_URL"])) as never,
);
