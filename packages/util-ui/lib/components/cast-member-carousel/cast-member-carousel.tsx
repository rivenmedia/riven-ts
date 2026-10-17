import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "#components/_ui/carousel.tsx";
import { PortraitCard } from "#components/portrait-card/portrait-card.tsx";

import type { CastMember } from "@repo/util-plugin-sdk/dto/types/cast-member.type";

interface CastMemberCarouselProps {
  cast: CastMember[];
}

export function CastMemberCarousel({ cast }: CastMemberCarouselProps) {
  return (
    <Carousel opts={{ dragFree: true, slidesToScroll: "auto" }}>
      <CarouselContent className="-ml-3">
        {cast.map((member) => (
          <CarouselItem key={member.id} className="basis-auto pl-3">
            <PortraitCard
              title={member.name}
              subtitle={member.character}
              image={member.profileUrl}
              className="w-32 md:w-36 lg:w-40"
            />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
