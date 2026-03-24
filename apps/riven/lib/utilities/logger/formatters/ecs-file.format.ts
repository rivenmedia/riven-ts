import { ecsFormat as baseEcsFormat } from "@elastic/ecs-winston-format";
import { type Logform, format } from "winston";

export const ecsFileFormat = format.combine(
  format.uncolorize(),
  baseEcsFormat() as Logform.Format,
);
