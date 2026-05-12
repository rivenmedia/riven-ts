import { Dialog as SheetPrimitive } from "bits-ui";

import Root from "./Sheet.svelte";
import Content from "./SheetContent.svelte";
import Description from "./SheetDescription.svelte";
import Header from "./SheetHeader.svelte";
import Title from "./SheetTitle.svelte";
import Trigger from "./SheetTrigger.svelte";

const Close = SheetPrimitive.Close;
const Portal = SheetPrimitive.Portal;

export {
  Root,
  Trigger,
  Close,
  Portal,
  Content,
  Header,
  Title,
  Description,
  //
  Root as Sheet,
  Trigger as SheetTrigger,
  Close as SheetClose,
  Portal as SheetPortal,
  Content as SheetContent,
  Header as SheetHeader,
  Title as SheetTitle,
  Description as SheetDescription,
};
