import { Check } from "lucide-react";

import { Button } from "#components/_ui/button.tsx";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#components/_ui/card.tsx";

interface RankingProfileCardProps {
  title: string;
  description: string;
  isSelected: boolean;
}

export function RankingProfileCard({
  title,
  description,
  isSelected,
}: RankingProfileCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        {isSelected ? (
          <Button disabled type="button">
            <Check /> Selected
          </Button>
        ) : (
          <Button type="button">Select</Button>
        )}
      </CardFooter>
    </Card>
  );
}
