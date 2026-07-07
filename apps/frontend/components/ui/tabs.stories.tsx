import { expect, userEvent, waitFor } from "storybook/test";

import { preview } from "@/.storybook/preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * A set of layered sections of content—known as tab panels—that are displayed
 * one at a time.
 */
const meta = preview.meta({
  title: "ui/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  argTypes: {},
  args: {
    defaultValue: "account",
    className: "w-96",
  },
  render: (args) => (
    <Tabs {...args}>
      <TabsList className="grid grid-cols-2">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        Make changes to your account here.
      </TabsContent>
      <TabsContent value="password">Change your password here.</TabsContent>
    </Tabs>
  ),
  parameters: {
    layout: "centered",
  },
});

/**
 * The default form of the tabs.
 */
export const Default = meta.story({});

Default.test(
  "When clicking a tab, it changes the content",
  async ({ canvas, step }) => {
    const tabs = await canvas.findAllByRole("tab");

    for (const tab of tabs) {
      await step(`click the '${tab.innerText}' tab`, async () => {
        await userEvent.click(tab);

        await waitFor(() =>
          expect(tab).toHaveAttribute("aria-selected", "true"),
        );

        await expect(
          canvas.queryByRole("tabpanel", { name: tab.innerText }),
        ).toBeVisible();
      });

      await step("check other tabs are not selected", async () => {
        for (const otherTab of tabs) {
          if (otherTab !== tab) {
            await expect(otherTab).toHaveAttribute("aria-selected", "false");
            await expect(
              canvas.queryByRole("tabpanel", { name: otherTab.innerText }),
            ).toBeNull();
          }
        }
      });
    }
  },
);
