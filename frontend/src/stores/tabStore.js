// src/stores/tabStore.js
import { defineStore } from 'pinia';

export const useTabStore = defineStore('tabStore', {
  state: () => ({
    globalCurrentTab: 'Inventario', // Valor por defecto
    globalOldTab: null, // Aquí se almacena el tab anterior
  }),
  actions: {
    setTab(newTab) {
      if (this.globalCurrentTab !== newTab) {
        this.globalOldTab = this.globalCurrentTab;
        this.globalCurrentTab = newTab;
        console.log(`Tab changed from ${this.globalOldTab} to ${this.globalCurrentTab}`);
      }
    },
    revertTab() {
      if (this.globalOldTab) {
        this.globalCurrentTab = this.globalOldTab;
        this.globalOldTab = null; // O conservarlo según tu necesidad
      }
    },
  },
});
