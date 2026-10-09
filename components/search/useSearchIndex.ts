"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  IndexRace,
  SearchIndex,
  SearchIndexData,
} from "@/lib/domain/search";

// Ported from the app's src/hooks/useSearchIndex.ts. The index comes from
// /api/search-index the first time search opens and is kept for the visit,
// like the app's staleTime: Infinity. A year in the query also loads that
// season's races.

const getJson = async <T>(url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return (await response.json()) as T;
};

let indexRequest: Promise<SearchIndexData> | undefined;

const loadIndex = () => {
  indexRequest ??= getJson<SearchIndexData>("/api/search-index").catch(
    (error) => {
      // Let Try again ask for it again
      indexRequest = undefined;
      throw error;
    },
  );
  return indexRequest;
};

// A year the API doesn't have, or a failed request, searches without races,
// like the app
const yearRequests = new Map<string, Promise<IndexRace[]>>();

const loadYearRaces = (year: string) => {
  let request = yearRequests.get(year);
  if (!request) {
    request = getJson<IndexRace[]>(`/api/seasons/${year}/races`).catch(
      () => [],
    );
    yearRequests.set(year, request);
  }
  return request;
};

const EMPTY: SearchIndexData = {
  drivers: [],
  constructors: [],
  circuits: [],
  seasons: [],
  currentTeams: {},
  currentRaces: [],
};

export const useSearchIndex = (year?: string) => {
  const [data, setData] = useState<SearchIndexData>();
  const [isError, setIsError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [yearRaces, setYearRaces] = useState<Record<string, IndexRace[]>>({});

  useEffect(() => {
    let live = true;
    loadIndex().then(
      (index) => live && setData(index),
      () => live && setIsError(true),
    );
    return () => {
      live = false;
    };
  }, [attempt]);

  useEffect(() => {
    if (!year) return;
    let live = true;
    loadYearRaces(year).then(
      (races) =>
        live && setYearRaces((loaded) => ({ ...loaded, [year]: races })),
    );
    return () => {
      live = false;
    };
  }, [year]);

  const index = useMemo<SearchIndex>(
    () => ({
      ...(data ?? EMPTY),
      yearRaces: (year && yearRaces[year]) || [],
    }),
    [data, year, yearRaces],
  );

  const isLoading = (!data && !isError) || (!!year && !yearRaces[year]);

  const refetch = () => {
    setIsError(false);
    setAttempt((n) => n + 1);
  };

  return { index, isLoading, isError, refetch };
};
