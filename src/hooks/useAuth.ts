/**
 * 认证相关 Hook
 * 统一封装登录/登出/注册/验证码/用户信息/权限码等功能
 * 对齐 Vue 版 useAuth composable
 */
import { useAuthStore } from '@/stores/auth';
import { type authenticationservicev1_LoginRequest } from '@/api/generated/admin/service/v1';
import { useUserStore } from '@/stores/user';
import { fetchUserProfile, fetchGenerateCaptcha } from '@/api/hooks';
import { getAccessCodesApi } from '@/api/rest/auth';

/**
 * 认证业务 Hook
 * 提供完整的认证操作入口，组合 store 状态 + API 调用
 */
export function useAuth() {
  const authStore = useAuthStore;

  /**
   * 获取当前用户信息
   */
  async function fetchUserInfo() {
    try {
      return (await fetchUserProfile()) as unknown as UserInfo;
    } catch (error) {
      console.error('fetchUserInfo failed:', error);
      return null;
    }
  }

  /**
   * 获取当前用户权限码（对齐 Vue GET /auth/codes，返回 string[]）
   */
  async function fetchAccessCodes() {
    return await getAccessCodesApi();
  }

  /**
   * 获取用户权限码（角色码 + 权限码分开存储）
   *
   * 登录成功后 userInfo/roles 可能已写入，但 accessCodes 仍为空。
   * 旧逻辑把「已有角色」当成全部就绪，跳过拉码，任务调度/日志审计页内 Tab
   * 会因 hasAccessByCodes 失败渲染 403。权限码为空时必须单独拉取。
   */
  async function getUserPermissionCodes(): Promise<{ roles: string[]; codes: string[] } | false> {
    const userStore = useUserStore.getState();
    let { userInfo, userRoles, accessCodes } = userStore;

    if (userInfo === null) {
      const userInfoResult = await fetchUserInfo();
      if (!userInfoResult) {
        console.warn('getUserPermissionCodes: failed to fetch user info');
        return false;
      }
      userStore.setUserInfo(userInfoResult);
      userInfo = userInfoResult;
      userRoles = userInfoResult.roles ?? [];
    } else if (userRoles.length === 0 && userInfo.roles?.length) {
      userRoles = userInfo.roles;
      userStore.setUserRoles(userRoles);
    }

    if (accessCodes.length === 0) {
      try {
        const codes = await fetchAccessCodes();
        const list = Array.isArray(codes) ? codes : [];
        userStore.setAccessCodes(list);
        accessCodes = list;
      } catch (error) {
        console.warn('getUserPermissionCodes: failed to fetch access codes', error);
        return false;
      }
    }

    return { roles: userRoles, codes: accessCodes };
  }

  /**
   * 获取验证码
   */
  async function getCaptcha() {
    return await fetchGenerateCaptcha();
  }

  return {
    /** 登录加载状态 */
    get loginLoading() {
      return authStore.getState().loginLoading;
    },
    /** 登录 */
    login: (
      params: authenticationservicev1_LoginRequest,
      onSuccess?: () => void,
      captcha?: { id: string; value: string },
    ) => authStore.getState().login(params, onSuccess, captcha),
    /** 登出（主动，调后端接口） */
    logout: (redirect?: boolean) => authStore.getState().logout(redirect),
    /** 强制登出（被动，不调后端接口，用于 token 失效场景） */
    forceLogout: () => authStore.getState().forceLogout(),
    /** 注册 */
    register: (params: { username: string; password: string }) =>
      authStore.getState().register(params),
    /** 获取验证码 */
    getCaptcha,
    /** 获取用户信息 */
    fetchUserInfo,
    /** 获取权限码 */
    fetchAccessCodes,
    /** 获取角色码和权限码（分开存储） */
    getUserPermissionCodes,
  };
}
