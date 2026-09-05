import Image from "next/image";

export interface Rating {
  name: string;
  image?: string;
  score: string;
  url: string;
}

export interface RatingsRowProps {
  scores: Rating[] | null | undefined;
  loading: boolean;
}

export function RatingsRow({ loading, scores }: RatingsRowProps) {
  if (loading) {
    return (
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => (
          <div className="bg-muted h-6 w-14 animate-pulse rounded" key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-5 animate-in starting:opacity-0 fade-in-0 duration-400 delay-300 slide-in-from-bottom-[20px] ease-[easeOutCubic]">
      {scores?.map((score) => (
        <a
          key={score.name}
          href={score.url}
          target="_blank"
          rel="external noopener noreferrer"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
        >
          {score.image && (
            <Image
              src={`/rating-logos/${score.image}`}
              alt={score.name}
              className="h-6 w-6 object-contain"
              width={24}
              height={24}
            />
          )}
          <span className="text-base font-semibold">{score.score}</span>
        </a>
      ))}
    </div>
  );
}
