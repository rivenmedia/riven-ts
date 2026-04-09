import { ecsFormat as baseEcsFormat } from "@elastic/ecs-winston-format";
import { format } from "winston";

export const ecsFileFormat = format.combine(
  format.uncolorize(),
  baseEcsFormat(),
);
