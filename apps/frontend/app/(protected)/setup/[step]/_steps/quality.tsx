import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SetupQualityStepProps {
  profiles: unknown[];
  toggleProfileEnabled: (id: string, enabled: boolean) => void;
  generalSections: unknown[];
  general: Record<string, unknown>;
  saveGeneralSettings: () => void;
}

export function SetupQualityStep({
  profiles,
  toggleProfileEnabled,
  generalSections,
  saveGeneralSettings,
}: SetupQualityStepProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Pre-configured presets</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Start with the built-in defaults.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => (
            <Card
              key={profile.id}
              className={cn(
                "gap-4 rounded-3xl py-0 text-left transition-colors",
                profile.enabled
                  ? "border-white/14 bg-white/4"
                  : "hover:bg-muted/40",
              )}
            >
              <CardHeader className="px-6 pt-6 pb-0">
                <CardTitle className="text-base">{profile.label}</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pt-0 pb-0">
                <p className="text-muted-foreground text-sm">
                  {profile.description}
                </p>
              </CardContent>
              <CardFooter className="px-6 pt-0 pb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    toggleProfileEnabled(profile.id, !profile.enabled)
                  }
                >
                  {profile.enabled ? "Selected" : "Enable"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <Accordion type="multiple" className="space-y-4">
        {generalSections.map((section) => (
          <AccordionItem
            key={section.title}
            value={section.title}
            className="rounded-2xl border px-5"
          >
            <AccordionTrigger className="py-5 text-left no-underline hover:no-underline">
              <span>
                <span className="block text-lg font-semibold">
                  {section.title}
                </span>
                <span className="text-muted-foreground mt-1 block text-sm">
                  {section.description}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-5">
              <div className="grid gap-4 lg:grid-cols-2">
                {section.fields.map((field) => (
                  <></>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="flex justify-end">
        <Button type="button" onClick={saveGeneralSettings}>
          Save preferences
        </Button>
      </div>
    </div>
  );
}
