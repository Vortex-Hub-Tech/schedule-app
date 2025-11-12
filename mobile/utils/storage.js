import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TENANT: '@agendamento:tenant',
  TENANT_DATA: '@agendamento:tenant_data',
  SERVICES_CACHE: '@agendamento:services_cache',
  APPOINTMENTS_CACHE: '@agendamento:appointments_cache',
};

export const TenantStorage = {
  async setTenant(tenant) {
    try {
      await AsyncStorage.setItem(KEYS.TENANT, JSON.stringify(tenant));
      return true;
    } catch (error) {
      console.error('Erro ao salvar tenant:', error);
      return false;
    }
  },

  async getTenant() {
    try {
      const tenant = await AsyncStorage.getItem(KEYS.TENANT);
      return tenant ? JSON.parse(tenant) : null;
    } catch (error) {
      console.error('Erro ao carregar tenant:', error);
      return null;
    }
  },

  async clearTenant() {
    try {
      await AsyncStorage.removeItem(KEYS.TENANT);
      await AsyncStorage.removeItem(KEYS.TENANT_DATA);
      await this.clearCache();
      return true;
    } catch (error) {
      console.error('Erro ao limpar tenant:', error);
      return false;
    }
  },

  async setTenantData(data) {
    try {
      await AsyncStorage.setItem(KEYS.TENANT_DATA, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Erro ao salvar dados do tenant:', error);
      return false;
    }
  },

  async getTenantData() {
    try {
      const data = await AsyncStorage.getItem(KEYS.TENANT_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao carregar dados do tenant:', error);
      return null;
    }
  },

  async cacheServices(services) {
    try {
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
    } catch (error) {
      console.error('Erro ao cachear serviços:', error);
      return false;
    }
  },

  async getCachedServices() {
    try {
      const tenant = await this.getTenant();
      if (!tenant) return null;
      
      const cached = await AsyncStorage.getItem(`${KEYS.SERVICES_CACHE}_${tenant.id}`);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const isStale = Date.now() - timestamp > 3600000;
      
      return { data, isStale };
    } catch (error) {
      console.error('Erro ao carregar serviços cacheados:', error);
      return null;
    }
  },

  async cacheAppointments(appointments) {
    try {
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
    } catch (error) {
      console.error('Erro ao cachear agendamentos:', error);
      return false;
    }
  },

  async getCachedAppointments() {
    try {
      const tenant = await this.getTenant();
      if (!tenant) return null;
      
      const cached = await AsyncStorage.getItem(`${KEYS.APPOINTMENTS_CACHE}_${tenant.id}`);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const isStale = Date.now() - timestamp > 1800000;
      
      return { data, isStale };
    } catch (error) {
      console.error('Erro ao carregar agendamentos cacheados:', error);
      return null;
    }
  },

  async clearCache() {
    try {
      const tenant = await this.getTenant();
      if (!tenant) return true;
      
      await AsyncStorage.removeItem(`${KEYS.SERVICES_CACHE}_${tenant.id}`);
      await AsyncStorage.removeItem(`${KEYS.APPOINTMENTS_CACHE}_${tenant.id}`);
      return true;
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      return false;
    }
  },
};
