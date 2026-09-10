import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { queryClient } from '@/core';
import {
  batchApiApi,
  createApiApi,
  deleteApiApi,
  listAllApisApi,
  listApiGroupsApi,
  listApisApi,
  syncApisApi,
  updateApiApi,
} from '@/api/rest/api';
import type {
  ApiBatchRequest,
  ApiListQuery,
  ApiSyncResult,
  CreateApiRequest,
  PageResult,
  SysApi,
  UpdateApiRequest,
} from '@/api/rest/types';

export function useListApis(
  query: ApiListQuery,
  options?: UseQueryOptions<PageResult<SysApi>, Error>,
) {
  return useQuery({
    queryKey: ['listApis', query],
    queryFn: () => listApisApi(query),
    ...options,
  });
}

export async function fetchListApis(query: ApiListQuery) {
  return queryClient.fetchQuery({
    queryKey: ['listApis', query],
    queryFn: () => listApisApi(query),
    retry: 0,
  });
}

export function useAllApis(options?: UseQueryOptions<SysApi[], Error>) {
  return useQuery({
    queryKey: ['allApis'],
    queryFn: () => listAllApisApi(),
    ...options,
  });
}

export function useApiGroups(options?: UseQueryOptions<string[], Error>) {
  return useQuery({
    queryKey: ['apiGroups'],
    queryFn: () => listApiGroupsApi(),
    ...options,
  });
}

export function useCreateApi(
  options?: UseMutationOptions<SysApi, Error, CreateApiRequest>,
) {
  return useMutation({
    mutationFn: (data) => createApiApi(data),
    ...options,
  });
}

export function useUpdateApi(
  options?: UseMutationOptions<SysApi, Error, UpdateApiRequest>,
) {
  return useMutation({
    mutationFn: (req) => updateApiApi(req),
    ...options,
  });
}

export function useDeleteApi(
  options?: UseMutationOptions<unknown, Error, number>,
) {
  return useMutation({
    mutationFn: (id) => deleteApiApi(id),
    ...options,
  });
}

export function useBatchApi(
  options?: UseMutationOptions<
    { action: string; affected: number; ids: number[] },
    Error,
    ApiBatchRequest
  >,
) {
  return useMutation({
    mutationFn: (body) => batchApiApi(body),
    ...options,
  });
}

export function useSyncApisApi(
  options?: UseMutationOptions<ApiSyncResult, Error, void>,
) {
  return useMutation({
    mutationFn: () => syncApisApi(),
    ...options,
  });
}
