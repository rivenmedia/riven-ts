import { transforms } from "@viren070/parse-torrent-title";

import type { Handler } from "@viren070/parse-torrent-title";

export const sceneHandlers: Handler[] = [
  {
    field: "scene",
    pattern: new RegExp(
      String.raw`^(?=.*(\b\d{3,4}p\b).*([_. ]WEB[_. ])(?!DL)\b)|\b(-CAKES|-GGEZ|-GGWP|-GLHF|-GOSSIP|-NAISU|-KOGI|-PECULATE|-SLOT|-EDITH|-ETHEL|-ELEANOR|-B2B|-SPAMnEGGS|-FTP|-DiRT|-SYNCOPY|-BAE|-SuccessfulCrab|-NHTFS|-SURCODE|-B0MBARDIERS)`,
      "iu",
    ),
    transform: transforms.toBoolean(),
  },
];
