import Constants from 'expo-constants';

export const TENANT_CONFIG = {
  TENANT_ID: Constants.expoConfig?.extra?.tenantId || 1,
  TENANT_SLUG: Constants.expoConfig?.extra?.tenantSlug || 'vortex-hub',
};
