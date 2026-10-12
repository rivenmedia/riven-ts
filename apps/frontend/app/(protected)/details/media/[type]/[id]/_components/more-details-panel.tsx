import { SectionHeading } from "#components/media/section-heading/section-heading.tsx";
import { formatCurrency } from "#lib/utils/format-currency.ts";

import type {
  SpokenLanguage,
  ProductionCompany,
} from "#app/_types/__generated__/graphql.ts";

interface MoreDetailsPanelProps {
  budget?: number | null;
  revenue?: number | null;
  originCountry: string[];
  spokenLanguages: SpokenLanguage[] | null;
  productionCompanies: ProductionCompany[] | null;
  homepage?: string | null;
  imdbId?: string | null;
  externalLinks: { key: string; label: string; url: string }[];
}

export function MoreDetailsPanel({
  budget,
  revenue,
  originCountry,
  spokenLanguages,
  productionCompanies,
  homepage,
  imdbId,
  externalLinks,
}: MoreDetailsPanelProps) {
  return (
    <div className="min-w-0 flex-1">
      <SectionHeading title="More Details" />
      <div className="flex flex-col gap-6 text-sm">
        {(budget ?? revenue) && (
          <div className="flex flex-wrap gap-12">
            {budget && (
              <div className="flex min-w-30 flex-col gap-1">
                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Budget
                </span>
                <span className="text-foreground font-mono">
                  {formatCurrency(budget, "USD")}
                </span>
              </div>
            )}
            {revenue && (
              <div className="flex min-w-30 flex-col gap-1">
                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Revenue
                </span>
                <span className="text-foreground font-mono">
                  {formatCurrency(revenue, "USD")}
                </span>
              </div>
            )}
          </div>
        )}
        {(originCountry.length > 0 || spokenLanguages?.length) && (
          <div className="flex flex-wrap gap-12">
            {originCountry.length > 0 && (
              <div className="flex min-w-30 flex-col gap-1">
                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Origin
                </span>
                <span className="text-foreground">
                  {originCountry.join(", ")}
                </span>
              </div>
            )}
            {spokenLanguages?.length && (
              <div className="flex min-w-30 flex-col gap-1">
                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Languages
                </span>
                <span className="text-foreground">
                  {spokenLanguages
                    .map(({ englishName }) => englishName)
                    .join(", ")}
                </span>
              </div>
            )}
          </div>
        )}
        {productionCompanies?.length && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Production
            </span>
            <div className="flex flex-wrap gap-2">
              {productionCompanies.map((company) => (
                <span
                  key={company.name}
                  className="text-muted-foreground rounded border border-white/10 bg-white/5 px-2 py-1 text-xs"
                >
                  {company.name}
                </span>
              ))}
            </div>
          </div>
        )}
        {(homepage ?? imdbId ?? externalLinks.length > 0) && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Links
            </span>
            <div className="flex flex-wrap gap-2">
              {homepage && (
                <a
                  href={homepage}
                  target="_blank"
                  rel="external noopener noreferrer"
                  className="text-foreground rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
                >
                  Website
                </a>
              )}
              {imdbId && (
                <a
                  href={`https://www.imdb.com/title/${imdbId}/parentalguide/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
                >
                  Parental Guide
                </a>
              )}
              {externalLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.url}
                  target="_blank"
                  rel="external noopener noreferrer"
                  className="text-foreground rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
