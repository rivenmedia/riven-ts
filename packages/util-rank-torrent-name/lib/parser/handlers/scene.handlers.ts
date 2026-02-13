import { type Handler, transforms } from "@viren070/parse-torrent-title";

export const sceneHandlers: Handler[] = [
  {
    field: "scene",
    pattern: new RegExp(
      "^(?=.*(\\b\\d{3,4}p\\b).*([_. ]WEB[_. ])(?!DL)\\b)|\\b(-CAKES|-GGEZ|-GGWP|-GLHF|-GOSSIP|-NAISU|-KOGI|-PECULATE|-SLOT|-EDITH|-ETHEL|-ELEANOR|-B2B|-SPAMnEGGS|-FTP|-DiRT|-SYNCOPY|-BAE|-SuccessfulCrab|-NHTFS|-SURCODE|-B0MBARDIERS)",
      "i",
    ),
    transform: transforms.toBoolean(),
  },
];
