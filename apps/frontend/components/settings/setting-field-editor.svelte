<script lang="ts">
    import Eye from "@lucide/svelte/icons/eye";
    import EyeOff from "@lucide/svelte/icons/eye-off";
    import * as ButtonGroup from "@/components/ui/button-group";
    import { Button } from "@/components/ui/button";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import * as Select from "@/components/ui/select";
    import { Switch } from "@/components/ui/switch";
    import { settingsSwitchClass } from "./helpers";
    import SettingFieldEditor from "./setting-field-editor.svelte";
    import type { SettingFieldDef } from "./types";

    /** Per-instance state for masking password inputs. Sub-fields each
     *  get their own SettingFieldEditor instance, so this is naturally
     *  scoped to one input. */
    let passwordRevealed = $state(false);

    let {
        field,
        value = $bindable(),
        path = field.key,
        nested = false
    }: {
        field: SettingFieldDef;
        value: unknown;
        path?: string;
        nested?: boolean;
    } = $props();

    let arrayDraft = $state("");
    let activeTab = $state<string | null>(null);

    function isRecord(input: unknown): input is Record<string, unknown> {
        return input !== null && typeof input === "object" && !Array.isArray(input);
    }

    /** For a `tabs` object whose children are `custom_rank` rows, "N/M fetch". */
    function fetchSummary(tabValue: unknown, tab: SettingFieldDef): string | null {
        const rankFields = (tab.fields ?? []).filter((f) => f.type === "custom_rank");
        if (rankFields.length === 0) return null;
        const obj = isRecord(tabValue) ? tabValue : {};
        const fetched = rankFields.filter((f) => {
            const entry = obj[f.key];
            return isRecord(entry) && entry.fetch === true;
        }).length;
        return `${fetched}/${rankFields.length} fetch`;
    }

    function idFor(pathValue: string): string {
        return `setting-${pathValue.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
    }

    function parseDefaultValue(fieldDef: SettingFieldDef): unknown {
        if (fieldDef.default_value == null) {
            if (fieldDef.type === "string_array") return [];
            if (fieldDef.type === "object") return createDefaultObject(fieldDef.fields ?? []);
            if (fieldDef.type === "dictionary") return {};
            if (fieldDef.type === "nullable_boolean") return null;
            return undefined;
        }

        if (fieldDef.type === "boolean" || fieldDef.type === "nullable_boolean") {
            return fieldDef.default_value === "true";
        }

        if (fieldDef.type === "number") {
            const parsed = Number(fieldDef.default_value);
            return Number.isNaN(parsed) ? null : parsed;
        }

        return fieldDef.default_value;
    }

    function createDefaultObject(fields: SettingFieldDef[]): Record<string, unknown> {
        const entries = fields
            .map((subfield) => [subfield.key, parseDefaultValue(subfield)] as const)
            .filter(([, fieldValue]) => fieldValue !== undefined);

        return Object.fromEntries(entries);
    }

    function ensurePlainObject(
        input: unknown,
        fields: SettingFieldDef[] = []
    ): Record<string, unknown> {
        return isRecord(input) ? (input as Record<string, unknown>) : createDefaultObject(fields);
    }

    function ensureObject(fields: SettingFieldDef[] = []): Record<string, unknown> {
        return isRecord(value) ? (value as Record<string, unknown>) : createDefaultObject(fields);
    }

    function ensureDictionary(): Record<string, unknown> {
        return isRecord(value) ? (value as Record<string, unknown>) : {};
    }

    function ensureStringArray(): string[] {
        return Array.isArray(value) && value.every((entry) => typeof entry === "string")
            ? (value as string[])
            : [];
    }

    function ensureDictionaryEntry(
        dictionary: Record<string, unknown>,
        entryKey: string,
        fields: SettingFieldDef[]
    ): Record<string, unknown> {
        return ensurePlainObject(dictionary[entryKey], fields);
    }

    function addArrayValue() {
        const nextValue = arrayDraft.trim();
        if (!nextValue) return;

        const items = ensureStringArray();
        if (!items.includes(nextValue)) {
            items.push(nextValue);
            value = [...items];
        }

        arrayDraft = "";
    }

    function removeArrayValue(index: number) {
        const items = ensureStringArray();
        items.splice(index, 1);
        value = [...items];
    }

    function toggleOption(option: string) {
        const items = ensureStringArray();
        if (items.includes(option)) {
            value = items.filter((item) => item !== option);
            return;
        }

        value = [...items, option];
    }

    function addDictionaryEntry() {
        const dictionary = ensureDictionary();
        const baseKey = field.key_placeholder ?? "entry";
        let index = Object.keys(dictionary).length + 1;
        let entryKey = `${baseKey}_${index}`;

        while (entryKey in dictionary) {
            index += 1;
            entryKey = `${baseKey}_${index}`;
        }

        dictionary[entryKey] = createDefaultObject(field.item_fields ?? []);
        value = { ...dictionary };
    }

    function removeDictionaryEntry(entryKey: string) {
        const dictionary = ensureDictionary();
        delete dictionary[entryKey];
        value = { ...dictionary };
    }

    function renameDictionaryEntry(previousKey: string, nextKeyRaw: string) {
        const nextKey = nextKeyRaw.trim();
        if (!nextKey || nextKey === previousKey) return;

        const dictionary = ensureDictionary();
        if (nextKey in dictionary) return;

        const entries = Object.entries(dictionary).map(([currentKey, currentValue]) =>
            currentKey === previousKey ? [nextKey, currentValue] : [currentKey, currentValue]
        );
        value = Object.fromEntries(entries);
    }

    function updateObjectField(fields: SettingFieldDef[], key: string, nextValue: unknown) {
        const objectValue = ensurePlainObject(value, fields);
        value = {
            ...objectValue,
            [key]: nextValue
        };
    }

    function updateDictionaryField(entryKey: string, itemKey: string, nextValue: unknown) {
        const dictionary = ensureDictionary();
        const entry = ensureDictionaryEntry(dictionary, entryKey, field.item_fields ?? []);
        value = {
            ...dictionary,
            [entryKey]: {
                ...entry,
                [itemKey]: nextValue
            }
        };
    }
</script>

<div class:rounded-lg={!nested} class:border={!nested} class:p-4={!nested} class="space-y-3">
    {#if field.type === "object" && field.display === "tabs"}
        {@const objectValue = ensureObject(field.fields ?? [])}
        {@const tabs = field.fields ?? []}
        {@const current = tabs.find((t) => t.key === activeTab)?.key ?? tabs[0]?.key ?? ""}
        <div class="space-y-1">
            <Label class="text-base">{field.label}</Label>
            {#if field.description}
                <p class="text-muted-foreground text-sm">{field.description}</p>
            {/if}
        </div>

        <div class="rounded-lg border">
            <div class="flex gap-1 overflow-x-auto border-b p-1">
                {#each tabs as tab (tab.key)}
                    {@const summary = fetchSummary(objectValue[tab.key], tab)}
                    <button
                        type="button"
                        class="shrink-0 rounded-md px-3 py-2 text-left text-xs transition-colors {current ===
                        tab.key
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
                        onclick={() => (activeTab = tab.key)}>
                        <span class="block font-medium">{tab.label}</span>
                        {#if summary}
                            <span class="block opacity-75">{summary}</span>
                        {/if}
                    </button>
                {/each}
            </div>

            {#each tabs as tab (tab.key)}
                {#if tab.key === current}
                    {@const tabValue = ensurePlainObject(objectValue[tab.key], tab.fields ?? [])}
                    <div class="grid gap-3 p-3 sm:grid-cols-2">
                        {#each tab.fields ?? [] as subfield (subfield.key)}
                            <SettingFieldEditor
                                field={subfield}
                                bind:value={
                                    () => tabValue[subfield.key],
                                    (nextValue) =>
                                        updateObjectField(field.fields ?? [], tab.key, {
                                            ...tabValue,
                                            [subfield.key]: nextValue
                                        })
                                }
                                path={`${path}.${tab.key}.${subfield.key}`}
                                nested={true} />
                        {/each}
                    </div>
                {/if}
            {/each}
        </div>
    {:else if field.type === "object"}
        {@const objectValue = ensureObject(field.fields ?? [])}
        {@const grid = field.display === "grid"}
        <div class="space-y-1">
            <Label class="text-base">{field.label}</Label>
            {#if field.description}
                <p class="text-muted-foreground text-sm">{field.description}</p>
            {/if}
        </div>

        <div
            class={grid
                ? "grid gap-3 rounded-lg border p-3 sm:grid-cols-2"
                : "space-y-3 rounded-lg border p-3"}>
            {#each field.fields ?? [] as subfield (subfield.key)}
                <SettingFieldEditor
                    field={subfield}
                    bind:value={
                        () => objectValue[subfield.key],
                        (nextValue) =>
                            updateObjectField(field.fields ?? [], subfield.key, nextValue)
                    }
                    path={`${path}.${subfield.key}`}
                    nested={true} />
            {/each}
        </div>
    {:else if field.type === "dictionary"}
        {@const dictionaryValue = ensureDictionary()}
        <div class="space-y-1">
            <Label class="text-base">{field.label}</Label>
            {#if field.description}
                <p class="text-muted-foreground text-sm">{field.description}</p>
            {/if}
        </div>

        <div class="space-y-3">
            {#each Object.entries(dictionaryValue) as [entryKey] (entryKey)}
                {@const entryValue = ensureDictionaryEntry(
                    dictionaryValue,
                    entryKey,
                    field.item_fields ?? []
                )}
                <div class="space-y-3 rounded-lg border p-3">
                    <div class="flex items-end gap-3">
                        <div class="min-w-0 flex-1 space-y-2">
                            <Label for={idFor(`${path}.${entryKey}.__key`)}>Profile key</Label>
                            <Input
                                id={idFor(`${path}.${entryKey}.__key`)}
                                value={entryKey}
                                placeholder={field.key_placeholder ?? "entry_key"}
                                onchange={(event) =>
                                    renameDictionaryEntry(
                                        entryKey,
                                        (event.currentTarget as HTMLInputElement).value
                                    )} />
                        </div>
                        <button
                            type="button"
                            class="text-destructive text-sm"
                            onclick={() => removeDictionaryEntry(entryKey)}>
                            Remove
                        </button>
                    </div>

                    <div class="space-y-3">
                        {#each field.item_fields ?? [] as itemField (itemField.key)}
                            <SettingFieldEditor
                                field={itemField}
                                bind:value={
                                    () => entryValue[itemField.key],
                                    (nextValue) =>
                                        updateDictionaryField(entryKey, itemField.key, nextValue)
                                }
                                path={`${path}.${entryKey}.${itemField.key}`}
                                nested={true} />
                        {/each}
                    </div>
                </div>
            {/each}

            <button
                type="button"
                class="rounded-md border px-3 py-2 text-sm"
                onclick={addDictionaryEntry}>
                {field.add_label ?? "Add entry"}
            </button>
        </div>
    {:else if field.type === "string_array"}
        {@const items = ensureStringArray()}
        <div class="space-y-2">
            <Label for={idFor(path)}>{field.label}</Label>
            {#if field.description}
                <p class="text-muted-foreground text-sm">{field.description}</p>
            {/if}

            {#if field.options?.length}
                <div class="flex flex-wrap gap-2">
                    {#each field.options as option (option)}
                        <button
                            type="button"
                            class={`rounded-full border px-3 py-1 text-xs ${items.includes(option) ? "bg-accent text-accent-foreground" : ""}`}
                            onclick={() => toggleOption(option)}>
                            {option}
                        </button>
                    {/each}
                </div>
            {/if}

            {#if !field.options?.length}
                {#if items.length > 0}
                    <div class="flex flex-wrap gap-2">
                        {#each items as item, index (`${item}-${index}`)}
                            <span
                                class="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
                                {item}
                                <button
                                    type="button"
                                    class="leading-none"
                                    onclick={() => removeArrayValue(index)}>
                                    ×
                                </button>
                            </span>
                        {/each}
                    </div>
                {/if}

                <div class="flex max-w-xl gap-2">
                    <Input
                        id={idFor(path)}
                        bind:value={arrayDraft}
                        placeholder={field.placeholder ?? "Add value"}
                        onkeydown={(event) => {
                            if (event.key === "Enter" || event.key === ",") {
                                event.preventDefault();
                                addArrayValue();
                            }
                        }} />
                    <button
                        type="button"
                        class="rounded-md border px-3 py-2 text-sm"
                        onclick={addArrayValue}>
                        Add
                    </button>
                </div>
            {/if}
        </div>
    {:else if field.type === "boolean"}
        <div class="flex items-center justify-between gap-4">
            <div class="space-y-0.5">
                <Label class="text-base">{field.label}</Label>
                {#if field.description}
                    <p class="text-muted-foreground text-sm">{field.description}</p>
                {/if}
            </div>
            <Switch
                class={settingsSwitchClass}
                checked={!!value}
                onCheckedChange={(next) => (value = next)} />
        </div>
    {:else if field.type === "nullable_boolean"}
        <div class="space-y-2">
            <Label for={idFor(path)}>{field.label}</Label>
            {#if field.description}
                <p class="text-muted-foreground text-sm">{field.description}</p>
            {/if}
            <Select.Root
                type="single"
                value={value == null ? "any" : value === true ? "true" : "false"}
                onValueChange={(next: string) => {
                    value = next === "any" ? null : next === "true";
                }}>
                <Select.Trigger class="max-w-xs">
                    {value == null
                        ? "Any"
                        : value === true
                          ? (field.true_label ?? "Yes")
                          : (field.false_label ?? "No")}
                </Select.Trigger>
                <Select.Content>
                    <Select.Item value="any" label="Any" />
                    <Select.Item value="true" label={field.true_label ?? "Yes"} />
                    <Select.Item value="false" label={field.false_label ?? "No"} />
                </Select.Content>
            </Select.Root>
        </div>
    {:else if field.type === "custom_rank"}
        {@const cr = isRecord(value) ? value : {}}
        <div class="bg-muted/30 flex items-center justify-between gap-3 rounded-lg px-3 py-2">
            <Label class="min-w-0 truncate">{field.label}</Label>
            <div class="flex items-center gap-3">
                <Switch
                    class={settingsSwitchClass}
                    checked={!!cr.fetch}
                    onCheckedChange={(next) => (value = { ...cr, fetch: next })} />
                <Input
                    type="number"
                    value={(cr.rank ?? cr.default ?? 0) as number}
                    oninput={(event) => {
                        const raw = (event.currentTarget as HTMLInputElement).value;
                        value = { ...cr, rank: raw === "" ? null : Number(raw) };
                    }}
                    class="h-8 w-24 text-sm" />
            </div>
        </div>
    {:else if field.options?.length}
        <div class="space-y-2">
            <Label for={idFor(path)}>{field.label}</Label>
            {#if field.description}
                <p class="text-muted-foreground text-sm">{field.description}</p>
            {/if}
            <Select.Root
                type="single"
                value={value != null ? String(value) : (field.default_value ?? "")}
                onValueChange={(next: string) => (value = next)}>
                <Select.Trigger class="max-w-xs">
                    {value != null ? String(value) : (field.default_value ?? field.label)}
                </Select.Trigger>
                <Select.Content>
                    {#each field.options as option (option)}
                        <Select.Item value={option} label={option} />
                    {/each}
                </Select.Content>
            </Select.Root>
        </div>
    {:else if field.type === "password"}
        <div class="space-y-2">
            <Label for={idFor(path)}>{field.label}</Label>
            {#if field.description}
                <p class="text-muted-foreground text-sm">{field.description}</p>
            {/if}
            <div class="flex max-w-xl items-center gap-2">
                <Input
                    id={idFor(path)}
                    type={passwordRevealed ? "text" : "password"}
                    placeholder={field.placeholder ?? ""}
                    value={value != null ? String(value) : ""}
                    autocomplete="new-password"
                    oninput={(event) => (value = (event.currentTarget as HTMLInputElement).value)}
                    class="flex-1" />
                <ButtonGroup.Root class="shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={passwordRevealed ? "Hide password" : "Show password"}
                        onclick={() => (passwordRevealed = !passwordRevealed)}>
                        {#if passwordRevealed}
                            <EyeOff />
                        {:else}
                            <Eye />
                        {/if}
                    </Button>
                </ButtonGroup.Root>
            </div>
        </div>
    {:else}
        <div class="space-y-2">
            <Label for={idFor(path)}>{field.label}</Label>
            {#if field.description}
                <p class="text-muted-foreground text-sm">{field.description}</p>
            {/if}
            <Input
                id={idFor(path)}
                type={field.type === "number" ? "number" : "text"}
                min={field.type === "number" ? "0" : undefined}
                placeholder={field.placeholder ?? field.default_value ?? ""}
                value={value != null ? String(value) : ""}
                oninput={(event) => {
                    const raw = (event.currentTarget as HTMLInputElement).value;
                    value = field.type === "number" ? (raw === "" ? null : Number(raw)) : raw;
                }}
                class="max-w-xl" />
        </div>
    {/if}
</div>
