import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryClient } from '@/core';
import {
  createDictDataApi,
  deleteDictDataApi,
  listDictDataApi,
  updateDictDataApi,
} from '@/api/rest/dict-data';
import {
  createDictTypeApi,
  deleteDictTypeApi,
  getDictTypeApi,
  listAllDictTypeApi,
  listDictTypeApi,
  updateDictTypeApi,
} from '@/api/rest/dict-type';
import type {
  CreateDictDataRequest,
  CreateDictTypeRequest,
  DictData,
  DictDataQuery,
  DictType,
  DictTypeQuery,
  UpdateDictDataRequest,
  UpdateDictTypeRequest,
} from '@/api/rest/types';

const CURRENT_PLATFORM: string =
  (import.meta.env.VITE_APP_PLATFORM as string | undefined) || 'general';

export function useListDictType(
  query: DictTypeQuery = {},
  options?: UseQueryOptions<{ items: DictType[]; total: number }, Error>,
) {
  return useQuery({
    queryKey: ['listDictType', query],
    queryFn: () => listDictTypeApi(query),
    ...options,
  });
}

export async function fetchListDictTypes(query: DictTypeQuery = {}) {
  return queryClient.fetchQuery({
    queryKey: ['listDictType', query],
    queryFn: () => listDictTypeApi(query),
    retry: 0,
  });
}

export function useListAllDictType(
  params?: { status?: 0 | 1 },
  options?: UseQueryOptions<DictType[], Error>,
) {
  return useQuery({
    queryKey: ['listAllDictType', params],
    queryFn: () => listAllDictTypeApi(params),
    ...options,
  });
}

export function useGetDictType(
  id: number | null | undefined,
  options?: UseQueryOptions<DictType, Error>,
) {
  return useQuery({
    queryKey: ['getDictType', id],
    queryFn: () => getDictTypeApi(id as number),
    enabled: typeof id === 'number',
    ...options,
  });
}

export function useCreateDictType(
  options?: UseMutationOptions<DictType, Error, CreateDictTypeRequest>,
) {
  return useMutation({
    mutationFn: (body) => createDictTypeApi(body),
    ...options,
  });
}

export function useUpdateDictType(
  options?: UseMutationOptions<DictType, Error, UpdateDictTypeRequest>,
) {
  return useMutation({
    mutationFn: (req) => updateDictTypeApi(req),
    ...options,
  });
}

export function useDeleteDictType(
  options?: UseMutationOptions<unknown, Error, number>,
) {
  return useMutation({
    mutationFn: (id) => deleteDictTypeApi(id),
    ...options,
  });
}

export function useListDictData(
  query: DictDataQuery = {},
  options?: Omit<UseQueryOptions<{ items: DictData[]; total: number }, Error>, 'queryKey' | 'queryFn'>,
) {
  const merged: DictDataQuery = { platform: CURRENT_PLATFORM, ...query };
  return useQuery({
    queryKey: ['listDictData', merged],
    queryFn: () => listDictDataApi(merged),
    ...options,
  });
}

export async function fetchListDictEntries(query: DictDataQuery = {}) {
  const merged: DictDataQuery = { platform: CURRENT_PLATFORM, ...query };
  return queryClient.fetchQuery({
    queryKey: ['listDictData', merged],
    queryFn: () => listDictDataApi(merged),
    retry: 0,
  });
}

export function useCreateDictData(
  options?: UseMutationOptions<DictData, Error, CreateDictDataRequest>,
) {
  return useMutation({
    mutationFn: (body) => createDictDataApi(body),
    ...options,
  });
}

export function useUpdateDictData(
  options?: UseMutationOptions<DictData, Error, UpdateDictDataRequest>,
) {
  return useMutation({
    mutationFn: (req) => updateDictDataApi(req),
    ...options,
  });
}

export function useDeleteDictData(
  options?: UseMutationOptions<unknown, Error, number>,
) {
  return useMutation({
    mutationFn: (id) => deleteDictDataApi(id),
    ...options,
  });
}

export interface DictLookups {
  lookupSwitchLabel: (n: 0 | 1 | number) => string;
  lookupSwitchTagType: (n: 0 | 1 | number) => string | undefined;
  lookupDefaultLabel: (n: 0 | 1 | number) => string;
  lookupDefaultTagType: (n: 0 | 1 | number) => string | undefined;
  lookupPlatformLabel: (platform: string | undefined) => string;
  lookupPlatformTagType: (platform: string | undefined) => string | undefined;
  switchValueEnum: Record<0 | 1, { text: string }>;
  platformValueEnum: Record<string, { text: string }>;
  loaded: boolean;
}

export interface UseDictLookupsOptions {
  typeCodes?: string[];
  includeGeneral?: boolean;
  platformLabels?: Record<string, string>;
}

const DEFAULT_TYPE_CODES = [
  'sys_switch_status',
  'sys_default_status',
  'sys_platform',
];
const SWITCH_LABEL_FALLBACK: Record<0 | 1, string> = { 1: '启用', 0: '禁用' };
const SWITCH_TAG_TYPE_FALLBACK: Record<0 | 1, string> = { 1: 'success', 0: 'default' };
const DEFAULT_LABEL_FALLBACK: Record<0 | 1, string> = { 1: '默认', 0: '-' };
const DEFAULT_TAG_TYPE_FALLBACK: Record<0 | 1, string> = { 1: 'processing', 0: 'default' };
const IS_ENABLED_KEY: Record<0 | 1, 'enabled' | 'disabled'> = {
  1: 'enabled',
  0: 'disabled',
};
const IS_DEFAULT_KEY: Record<0 | 1, 'default' | 'not-default'> = {
  1: 'default',
  0: 'not-default',
};

function isEnabledKey(n: number): 'enabled' | 'disabled' {
  return IS_ENABLED_KEY[n === 1 ? 1 : 0];
}

function isDefaultKey(n: number): 'default' | 'not-default' {
  return IS_DEFAULT_KEY[n === 1 ? 1 : 0];
}

function pickPreferred(
  candidates: DictData[],
  currentPlatform: string,
): DictData | undefined {
  return (
    candidates.find((d) => d.platform === currentPlatform) ??
    candidates.find((d) => d.tagType) ??
    candidates[0]
  );
}

export function useDictLookups(
  options: UseDictLookupsOptions = {},
): DictLookups {
  const {
    typeCodes = DEFAULT_TYPE_CODES,
    includeGeneral = true,
    platformLabels,
  } = options;

  const query = useListDictData({
    typeCode: typeCodes,
    includeGeneral,
  });
  const items = useMemo(() => query.data?.items ?? [], [query.data]);

  const { switchHits, defaultHits, platformHits } = useMemo(() => {
    const switchByValue = new Map<string, DictData[]>();
    const defaultByValue = new Map<string, DictData[]>();
    const platformByValue = new Map<string, DictData[]>();
    for (const d of items) {
      const bucket =
        d.typeCode === 'sys_switch_status'
          ? switchByValue
          : d.typeCode === 'sys_default_status'
            ? defaultByValue
            : d.typeCode === 'sys_platform'
              ? platformByValue
              : null;
      if (!bucket) continue;
      const arr = bucket.get(d.value) ?? [];
      arr.push(d);
      bucket.set(d.value, arr);
    }
    const pick = (m: Map<string, DictData[]>) => {
      const out = new Map<string, DictData>();
      for (const [v, candidates] of m.entries()) {
        const hit = pickPreferred(candidates, CURRENT_PLATFORM);
        if (hit) out.set(v, hit);
      }
      return out;
    };
    return {
      switchHits: pick(switchByValue),
      defaultHits: pick(defaultByValue),
      platformHits: pick(platformByValue),
    };
  }, [items]);

  const lookupSwitchLabel = (n: 0 | 1 | number): string => {
    const hit = switchHits.get(isEnabledKey(n));
    return hit?.label ?? SWITCH_LABEL_FALLBACK[n === 1 ? 1 : 0];
  };
  const lookupSwitchTagType = (n: 0 | 1 | number): string | undefined => {
    const hit = switchHits.get(isEnabledKey(n));
    return hit?.tagType ?? SWITCH_TAG_TYPE_FALLBACK[n === 1 ? 1 : 0];
  };
  const lookupDefaultLabel = (n: 0 | 1 | number): string => {
    const hit = defaultHits.get(isDefaultKey(n));
    return hit?.label ?? DEFAULT_LABEL_FALLBACK[n === 1 ? 1 : 0];
  };
  const lookupDefaultTagType = (n: 0 | 1 | number): string | undefined => {
    const hit = defaultHits.get(isDefaultKey(n));
    return hit?.tagType ?? DEFAULT_TAG_TYPE_FALLBACK[n === 1 ? 1 : 0];
  };
  const lookupPlatformLabel = (p: string | undefined): string => {
    if (!p) return '-';
    const hit = platformHits.get(p);
    return hit?.label ?? p;
  };
  const lookupPlatformTagType = (p: string | undefined): string | undefined => {
    if (!p) return undefined;
    return platformHits.get(p)?.tagType;
  };

  const switchValueEnum: Record<0 | 1, { text: string }> = {
    1: { text: lookupSwitchLabel(1) },
    0: { text: lookupSwitchLabel(0) },
  };

  const platformValueEnum: Record<string, { text: string }> = (() => {
    const out: Record<string, { text: string }> = {};
    if (items.length === 0) {
      for (const [v, label] of Object.entries(platformLabels ?? {})) {
        out[v] = { text: label };
      }
      return out;
    }
    for (const [v, hit] of platformHits.entries()) {
      out[v] = { text: hit.label };
    }
    for (const [v, label] of Object.entries(platformLabels ?? {})) {
      if (!out[v]) out[v] = { text: label };
    }
    return out;
  })();

  return {
    lookupSwitchLabel,
    lookupSwitchTagType,
    lookupDefaultLabel,
    lookupDefaultTagType,
    lookupPlatformLabel,
    lookupPlatformTagType,
    switchValueEnum,
    platformValueEnum,
    loaded: items.length > 0,
  };
}
