import { queryClient } from '@/core';
import { getUserInfoApi } from '@/api/rest/auth';

export async function fetchUserProfile() {
  return queryClient.fetchQuery({
    queryKey: ['userInfo'],
    queryFn: () => getUserInfoApi(),
    retry: 0,
  });
}
