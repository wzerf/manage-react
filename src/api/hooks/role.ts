import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { queryClient } from '@/core';
import {
  createRoleApi,
  deleteRoleApi,
  getRoleApisApi,
  getRoleMenusApi,
  listAllRolesApi,
  listRolesApi,
  setRoleApisApi,
  setRoleMenusApi,
  updateRoleApi,
} from '@/api/rest/role';
import type {
  CreateRoleRequest,
  PageResult,
  RoleApiBindItem,
  RoleListQuery,
  RoleMenuBindItem,
  RoleOption,
  SysRole,
  UpdateRoleRequest,
} from '@/api/rest/types';

export function useListRoles(
  query: RoleListQuery,
  options?: UseQueryOptions<PageResult<SysRole>, Error>,
) {
  return useQuery({
    queryKey: ['listRoles', query],
    queryFn: () => listRolesApi(query),
    ...options,
  });
}

export async function fetchListRoles(query: RoleListQuery) {
  return queryClient.fetchQuery({
    queryKey: ['listRoles', query],
    queryFn: () => listRolesApi(query),
    retry: 0,
  });
}

export function useAllRoles(
  params?: { status?: 0 | 1 },
  options?: UseQueryOptions<RoleOption[], Error>,
) {
  return useQuery({
    queryKey: ['allRoles', params],
    queryFn: () => listAllRolesApi(params),
    ...options,
  });
}

export function useCreateRole(
  options?: UseMutationOptions<SysRole, Error, CreateRoleRequest>,
) {
  return useMutation({
    mutationFn: (data) => createRoleApi(data),
    ...options,
  });
}

export function useUpdateRole(
  options?: UseMutationOptions<SysRole, Error, UpdateRoleRequest>,
) {
  return useMutation({
    mutationFn: (req) => updateRoleApi(req),
    ...options,
  });
}

export function useDeleteRole(
  options?: UseMutationOptions<unknown, Error, number>,
) {
  return useMutation({
    mutationFn: (id) => deleteRoleApi(id),
    ...options,
  });
}

export function useRoleMenus(
  id: number | null,
  options?: UseQueryOptions<RoleMenuBindItem[], Error>,
) {
  return useQuery({
    queryKey: ['roleMenus', id],
    queryFn: () => getRoleMenusApi(id as number),
    enabled: id !== null && id !== undefined,
    ...options,
  });
}

export function useSetRoleMenus(
  options?: UseMutationOptions<
    { roleId: number; menuIds: number[] },
    Error,
    { id: number; menuIds: number[] }
  >,
) {
  return useMutation({
    mutationFn: ({ id, menuIds }) => setRoleMenusApi(id, menuIds),
    ...options,
  });
}

export function useRoleApis(
  id: number | null,
  options?: UseQueryOptions<RoleApiBindItem[], Error>,
) {
  return useQuery({
    queryKey: ['roleApis', id],
    queryFn: () => getRoleApisApi(id as number),
    enabled: id !== null && id !== undefined,
    ...options,
  });
}

export function useSetRoleApis(
  options?: UseMutationOptions<
    { roleId: number; apiIds: number[] },
    Error,
    { id: number; apiIds: number[] }
  >,
) {
  return useMutation({
    mutationFn: ({ id, apiIds }) => setRoleApisApi(id, apiIds),
    ...options,
  });
}
