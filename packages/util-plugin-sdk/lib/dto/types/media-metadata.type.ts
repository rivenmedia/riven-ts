import { Field, ObjectType } from "type-graphql";

@ObjectType()
class Resolution {
  @Field(() => Number)
  public width!: number;

  @Field(() => Number)
  public height!: number;
}

@ObjectType()
class VideoMetadata {
  @Field(() => String, { nullable: true })
  public codec?: string;

  @Field(() => Number, { nullable: true })
  public bitDepth?: number;

  @Field(() => String, { nullable: true })
  public hdrType?: string;

  @Field(() => Number, { nullable: true })
  public frameRate?: number;

  @Field(() => Resolution)
  public resolution!: Resolution;
}

@ObjectType()
class AudioMetadata {
  @Field(() => String)
  public codec!: string;

  @Field(() => Number)
  public channels!: number;

  @Field(() => String, { nullable: true })
  public language?: string;
}

@ObjectType()
class SubtitleMetadata {
  @Field(() => String)
  public language!: string;
}

@ObjectType()
export class MediaMetadata {
  @Field(() => String, { nullable: true })
  public fileName?: string;

  @Field(() => Number, { nullable: true })
  public duration?: number;

  @Field(() => Number, { nullable: true })
  public bitRate?: number;

  @Field(() => [AudioMetadata], { nullable: true })
  public audioTracks?: AudioMetadata[];

  @Field(() => [SubtitleMetadata], { nullable: true })
  public subtitleTracks?: SubtitleMetadata[];

  @Field(() => VideoMetadata, { nullable: true })
  public video?: VideoMetadata;

  @Field(() => String, { nullable: true })
  public qualitySource?: string;

  @Field(() => Boolean, { nullable: true })
  public isRemux?: boolean;

  @Field(() => Boolean, { nullable: true })
  public isProper?: boolean;

  @Field(() => Boolean, { nullable: true })
  public isRepack?: boolean;

  @Field(() => [String], { nullable: true })
  public containerFormat?: string[];
}
