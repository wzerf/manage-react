import {create} from 'zustand';
import {persist} from 'zustand/middleware';

import {defaultPreferences} from '../config/default';
import type {DeepPartial, Preferences} from '../types';
import {mergeDeep} from "../utils/merge";


export interface PreferencesState {
    preferences: Preferences;
    setPreferences: (overrides: DeepPartial<Preferences>) => void;
    resetPreferences: () => void;
    getPreference: <K extends keyof Preferences>(key: K) => Preferences[K];
}

function resolveInitialPreferences(): Preferences {
    const envMode = (import.meta.env.VITE_ACCESS_MODE as string | undefined)?.trim();
    if (envMode === 'backend' || envMode === 'frontend' || envMode === 'mixed') {
        return { ...defaultPreferences, app: { ...defaultPreferences.app, accessMode: envMode } };
    }
    return defaultPreferences;
}

export const usePreferencesStore = create<PreferencesState>()(
    persist(
        (set, get) => ({
            preferences: resolveInitialPreferences(),

            setPreferences: (overrides) => {
                set((state) => ({
                    preferences: mergeDeep(state.preferences, overrides),
                }));
            },

            resetPreferences: () => {
                set({preferences: defaultPreferences});
            },

            getPreference: (key) => {
                return get().preferences[key];
            },
        }),
        {
            name: 'app-preferences',
            version: 3,
            migrate: (persistedState, version) => {
                const state = (persistedState ?? {}) as { preferences?: Preferences };
                if (version < 2) {
                    const themePref = state.preferences?.theme;
                    if (themePref && themePref.builtinType === 'default') {
                        if (
                            themePref.colorPrimary === 'hsl(212 100% 45%)' ||
                            themePref.colorPrimary === '#3B82F6'
                        ) {
                            themePref.colorPrimary = 'hsl(212 100% 45%)';
                        }
                        if (!themePref.radius || themePref.radius === '6') {
                            themePref.radius = '8';
                        }
                        console.info(
                            '[Preferences] 迁移 v<2：默认主题对齐设计语言规范（hsl(212 100% 45%) + radius 8）'
                        );
                    }
                }
                if (version < 3) {
                    const envMode = (import.meta.env.VITE_ACCESS_MODE as string | undefined)?.trim();
                    const hasEnv = envMode === 'backend' || envMode === 'frontend' || envMode === 'mixed';
                    if (hasEnv && state.preferences?.app?.accessMode !== envMode) {
                        state.preferences = {
                            ...(state.preferences as Preferences),
                            app: { ...(state.preferences as Preferences).app, accessMode: envMode as Preferences['app']['accessMode'] },
                        };
                        console.info('[Preferences] 迁移 v<3：VITE_ACCESS_MODE 覆盖本地 accessMode →', envMode);
                    }
                }
                return state as { preferences: Preferences };
            },
            partialize: (state) => ({preferences: state.preferences}),
        }
    )
);

export function resetAccessModeFromEnv() {
    const envMode = (import.meta.env.VITE_ACCESS_MODE as string | undefined)?.trim();
    if (envMode === 'backend' || envMode === 'frontend' || envMode === 'mixed') {
        usePreferencesStore.getState().setPreferences({ app: { accessMode: envMode } } as any);
    }
}
