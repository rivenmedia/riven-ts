<script lang="ts">
  import { Dialog as SheetPrimitive } from "bits-ui";

  let { ...restProps }: SheetPrimitive.RootProps = $props();
</script>

<SheetPrimitive.Root {...restProps} />
