import { ecsFormat as baseEcsFormat } from "@elastic/ecs-winston-format";
import { Logform, format } from "winston";

export const ecsFileFormat = format.combine(
  format.uncolorize(),
  baseEcsFormat() as Logform.Format,
);
