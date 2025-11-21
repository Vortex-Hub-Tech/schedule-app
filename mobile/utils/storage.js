// utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as Application from 'expo-application';

const KEYS = {
  TENANT: '@agendamento:tenant',
  TENANT_DATA: '@agendamento:tenant_data',
  SERVICES_CACHE: '@agendamento:services_cache',
  APPOINTMENTS_CACHE: '@agendamento:appointments_cache',

  DEVICE_ID: '@agendamento:device_id',
  DEVICE_ID_SECURE: '@agendamento:secure_device_id',
  CANONICAL_DEVICE_ID: '@agendamento:canonical_device_id',

  USER_SESSION: '@agendamento:user_session',
  USER_TYPE: '@agendamento:user_type',
};

function generateLocalId() {
  return `device_${Date.now()}_${Math.random().toString(36).substring(2,15)}`;
}

async function getFingerprint() {
  return {
    brand: Device.brand,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
    manufacturer: Device.manufacturer,
    deviceType: Device.deviceType,
    appVersion: Application.nativeApplicationVersion,
    buildNumber: Application.nativeBuildVersion,
  };
}

export const DeviceStorage = {
  async getLocalDeviceId() {
    let secure = await SecureStore.getItemAsync(KEYS.DEVICE_ID_SECURE);
    let asyncId = await AsyncStorage.getItem(KEYS.DEVICE_ID);

    if (secure && asyncId) {
      if (secure !== asyncId) await AsyncStorage.setItem(KEYS.DEVICE_ID, secure);
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

    const newId = generateLocalId();
    await SecureStore.setItemAsync(KEYS.DEVICE_ID_SECURE, newId);
    await AsyncStorage.setItem(KEYS.DEVICE_ID, newId);
    return newId;
  },

  async ensureSyncedDeviceId(apiClient, tenantId) {
    const localDeviceId = await this.getLocalDeviceId();
    const fingerprint = await getFingerprint();

    const response = await apiClient.post("/devices/register-or-resolve", {
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

  async clearTenant() {
    await AsyncStorage.removeItem(KEYS.TENANT);
    await AsyncStorage.removeItem(KEYS.TENANT_DATA);
  },
};
