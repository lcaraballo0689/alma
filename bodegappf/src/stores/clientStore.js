import { defineStore } from "pinia";

export const useClientStore = defineStore("clientStore", {
  state: () => ({
    solicitudIdTransporte: null,
    showSolicitudTransporte: true,
  }),
  getters: {
    getSolicitudIdTransporte: (state) => state.solicitudIdTransporte,
    getShowSolicitudTransporte: (state) => state.showSolicitudTransporte,
  },
  actions: {
    setSolicitudIdTransporte(id) {
      this.solicitudIdTransporte = id;
    },
    clearSolicitudIdTransporte() {
      this.solicitudIdTransporte = null;
    },
    setShowSolicitudTransporte(value) {
      this.showSolicitudTransporte = value;
    },
    clearShowSolicitudTransporte() {
      this.showSolicitudTransporte = false;
    },
  },
});
