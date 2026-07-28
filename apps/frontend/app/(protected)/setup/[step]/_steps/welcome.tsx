import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SetupWelcomeStep() {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            What Riven does
          </h2>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Riven ties your media server, scrapers, metadata providers, and
            request services into one workflow so new media can be found,
            matched, and delivered with the defaults you choose.
          </p>
        </div>
        <Card className="rounded-3xl px-6 py-6">
          <CardHeader className="px-0 py-0">
            <CardTitle className="text-base">
              This setup will walk you through
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 px-0 pt-0 pb-0 md:grid-cols-3">
            <div className="space-y-1">
              <p className="font-medium">Media server</p>
              <p className="text-muted-foreground text-sm">
                Choose where finished media should appear.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Sources and services</p>
              <p className="text-muted-foreground text-sm">
                Connect the scrapers, metadata, and request tools you actually
                use.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Defaults</p>
              <p className="text-muted-foreground text-sm">
                Pick profiles and instance preferences for how Riven should
                behave.
              </p>
            </div>
          </CardContent>
        </Card>
        <p className="text-muted-foreground text-sm">
          Core boot variables like backend, database, and auth are still
          configured outside the app.
        </p>
      </div>
    </div>
  );
}
