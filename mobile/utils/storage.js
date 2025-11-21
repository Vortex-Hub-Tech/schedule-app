// utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as Application from 'expo-application';

const KEYS = {
  // Tenant keys (seguras para AsyncStorage)
  TENANT: 'agendamento_tenant',
  TENANT_DATA: 'agendamento_tenant_data',

  SERVICES_CACHE: 'agendamento_services_cache',
  APPOINTMENTS_CACHE: 'agendamento_appointments_cache',

  // Device keys (compatíveis com SecureStore)
  DEVICE_ID: 'agendamento_device_id',
  DEVICE_ID_SECURE: 'agendamento_secure_device_id',
  CANONICAL_DEVICE_ID: 'agendamento_canonical_device_id',

  USER_SESSION: 'agendamento_user_session',
  USER_TYPE: 'agendamento_user_type',
};

/* ============================================================
    FINGERPRINT DO DISPOSITIVO
   ============================================================ */
async function getFingerprint() {
  return {
    brand: Device.brand ?? 'unknown',
    modelName: Device.modelName ?? 'unknown',
    osName: Device.osName ?? 'unknown',
    osVersion: Device.osVersion ?? 'unknown',
    manufacturer: Device.manufacturer ?? 'unknown',
    deviceType: Device.deviceType ?? 'unknown',

    appVersion: Application.nativeApplicationVersion ?? 'unknown',
    buildNumber: Application.nativeBuildVersion ?? 'unknown',
  };
}

/* ============================================================
    DEVICE STORAGE ULTIMATE (NUNCA MUDA O ID)
   ============================================================ */
function generateLocalId() {
  return `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export const DeviceStorage = {
  /* ------------------------------------------------------------
      GET LOCAL DEVICE ID (com persistência dupla)
     ------------------------------------------------------------ */
  async getLocalDeviceId() {
    let secure = await SecureStore.getItemAsync(KEYS.DEVICE_ID_SECURE);
    let asyncId = await AsyncStorage.getItem(KEYS.DEVICE_ID);

    if (secure && asyncId) {
      if (secure !== asyncId) {
        await AsyncStorage.setItem(KEYS.DEVICE_ID, secure);
      }
      return secure;
    }

    if (secure && !asyncId) {
      await AsyncStorage.setItem(KEYS.DEVICE_ID, secure);
      return secure;
    }

    if (!secure && asyncId) {
      await SecureStore.setItemAsync(KEYS.DEVICE_ID_SECURE, asyncId);
      return asyncId;
    }

    // NEITHER EXISTS → create new
    const newId = generateLocalId();
    await SecureStore.setItemAsync(KEYS.DEVICE_ID_SECURE, newId);
    await AsyncStorage.setItem(KEYS.DEVICE_ID, newId);
    return newId;
  },

  /* ------------------------------------------------------------
      SYNC COM BACKEND /devices/register-or-resolve
     ------------------------------------------------------------ */
  async ensureSyncedDeviceId(apiClient, tenantId) {
    const localDeviceId = await this.getLocalDeviceId();
    const fingerprint = await getFingerprint();

    const response = await apiClient.post('/devices/register-or-resolve', {
      localDeviceId,
      tenantId,
      fingerprint,
    });

    const canonicalId = response.data.deviceId;
    await AsyncStorage.setItem(KEYS.CANONICAL_DEVICE_ID, canonicalId);

    return canonicalId;
  },

  async getCanonicalDeviceId() {
    return await AsyncStorage.getItem(KEYS.CANONICAL_DEVICE_ID);
  },

  /* USER SESSION */
  async setUserSession(sessionData) {
    await AsyncStorage.setItem(KEYS.USER_SESSION, JSON.stringify(sessionData));
  },

  async getUserSession() {
    const session = await AsyncStorage.getItem(KEYS.USER_SESSION);
    return session ? JSON.parse(session) : null;
  },

  async setUserType(type) {
    await AsyncStorage.setItem(KEYS.USER_TYPE, type);
  },

  async getUserType() {
    return await AsyncStorage.getItem(KEYS.USER_TYPE);
  },

  async clearUserSession() {
    await AsyncStorage.removeItem(KEYS.USER_SESSION);
    await AsyncStorage.removeItem(KEYS.USER_TYPE);
  },
};

/* ============================================================
    TENANT STORAGE COMPLETO (CACHE + DADOS)
   ============================================================ */
export const TenantStorage = {
  async setTenant(tenant) {
    await AsyncStorage.setItem(KEYS.TENANT, JSON.stringify(tenant));
  },

  async getTenant() {
    const tenant = await AsyncStorage.getItem(KEYS.TENANT);
    return tenant ? JSON.parse(tenant) : null;
  },

  async setTenantData(data) {
    await AsyncStorage.setItem(KEYS.TENANT_DATA, JSON.stringify(data));
  },

  async getTenantData() {
    const data = await AsyncStorage.getItem(KEYS.TENANT_DATA);
    return data ? JSON.parse(data) : null;
  },

  /* ------------------------------------------------------------
        SERVICES CACHE
     ------------------------------------------------------------ */
  async cacheServices(services) {
    const tenant = await this.getTenant();
    if (!tenant) return false;

    await AsyncStorage.setItem(
      `${KEYS.SERVICES_CACHE}_${tenant.id}`,
      JSON.stringify({
        data: services,
        timestamp: Date.now(),
      })
    );
    return true;
  },

  async getCachedServices() {
    const tenant = await this.getTenant();
    if (!tenant) return null;

    const cached = await AsyncStorage.getItem(
      `${KEYS.SERVICES_CACHE}_${tenant.id}`
    );

    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const isStale = Date.now() - timestamp > 3600000; // 1h

    return { data, isStale };
  },

  /* ------------------------------------------------------------
        APPOINTMENTS CACHE
     ------------------------------------------------------------ */
  async cacheAppointments(appointments) {
    const tenant = await this.getTenant();
    if (!tenant) return false;

    await AsyncStorage.setItem(
      `${KEYS.APPOINTMENTS_CACHE}_${tenant.id}`,
      JSON.stringify({
        data: appointments,
        timestamp: Date.now(),
      })
    );
    return true;
  },

  async getCachedAppointments() {
    const tenant = await this.getTenant();
    if (!tenant) return null;

    const cached = await AsyncStorage.getItem(
      `${KEYS.APPOINTMENTS_CACHE}_${tenant.id}`
    );

    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const isStale = Date.now() - timestamp > 1800000; // 30 min

    return { data, isStale };
  },

  async clearCache() {
    const tenant = await this.getTenant();
    if (!tenant) return;

    await AsyncStorage.removeItem(`${KEYS.SERVICES_CACHE}_${tenant.id}`);
    await AsyncStorage.removeItem(
      `${KEYS.APPOINTMENTS_CACHE}_${tenant.id}`
    );
  },

  async clearTenant() {
    await AsyncStorage.removeItem(KEYS.TENANT);
    await AsyncStorage.removeItem(KEYS.TENANT_DATA);
    await this.clearCache();
  },
};
