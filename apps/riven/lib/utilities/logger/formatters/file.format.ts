import { format } from "winston";

export const fileFormat = format.combine(
  format.uncolorize(),
  format((info) => {
    info.message = String(info["stack"] ?? info.message);

    return info;
  })(),
  format.json({ space: 2 }),
);
