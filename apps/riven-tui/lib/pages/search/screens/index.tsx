import { useQuery } from "@apollo/client/react";
import { TextInput } from "@inkjs/ui";
import { Box, Text, useInput } from "ink";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { SelectList } from "../../../ui/select-list.tsx";
import { useReportTextEntryFocus } from "../../../ui/text-entry.tsx";
import { SEARCH_TMDB } from "../queries/search-tmdb.query.ts";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

export function SearchScreenIndexScreen() {
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(true);

  useReportTextEntryFocus(isSearchFocused);

  useEffect(() => {
    const trimmedQuery = inputValue.trim();

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setDebouncedQuery("");

      return;
    }

    const timeout = setTimeout(() => {
      setDebouncedQuery(trimmedQuery);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [inputValue]);

  const { data, loading, error } = useQuery(SEARCH_TMDB, {
    variables: { query: debouncedQuery },
    skip: debouncedQuery.length < MIN_QUERY_LENGTH,
    fetchPolicy: "network-only",
  });

  const results = data?.tmdbSearch ?? [];

  useInput(
    (input) => {
      if (input === "/") {
        setIsSearchFocused(true);
      }
    },
    { isActive: !isSearchFocused },
  );

  useInput(
    (_input, key) => {
      if (key.downArrow) {
        setIsSearchFocused(false);

        return;
      }

      if (key.escape) {
        if (inputValue === "") {
          void navigate(-1);

          return;
        }

        setIsSearchFocused(false);
      }
    },
    { isActive: isSearchFocused },
  );

  return (
    <Box flexDirection="column" gap={1}>
      <Box borderStyle="round" borderDimColor paddingX={1} gap={1}>
        <Text color="cyan">{"❯"}</Text>
        <TextInput
          placeholder="search"
          isDisabled={!isSearchFocused}
          onChange={setInputValue}
          onSubmit={() => {
            setIsSearchFocused(false);
          }}
        />
      </Box>
      {loading && <Text dimColor>Searching…</Text>}
      {error && <Text color="red">Search failed: {error.message}</Text>}
      <SelectList
        items={results}
        isActive={!isSearchFocused}
        getKey={(result) => `${result.mediaType}-${result.id.toString()}`}
        onSelect={(result) => {
          void navigate("/search/result", { state: { result } });
        }}
        onCancel={() => {
          void navigate(-1);
        }}
        emptyMessage={
          debouncedQuery.length < MIN_QUERY_LENGTH
            ? "Type to search for movies and shows."
            : "No results found."
        }
        renderItem={(result, isSelected) => (
          <Box width="100%" justifyContent="space-between">
            <Text color={isSelected ? "cyan" : "white"}>
              {isSelected ? "❯ " : "  "}
              {result.title ?? "Unknown title"}
              {result.releaseDate ? ` (${result.releaseDate.slice(0, 4)})` : ""}
            </Text>
            <Box>
              <Text dimColor>{result.mediaType}</Text>
              {result.voteAverage != null && (
                <>
                  <Text> · </Text>
                  <Text color="yellow">★ {result.voteAverage.toFixed(1)}</Text>
                </>
              )}
            </Box>
          </Box>
        )}
      />
    </Box>
  );
}
