// En el store (userStore.js)
import { defineStore } from 'pinia';

export const useUserStore = defineStore('UserStore', {
  state: () => ({
    massAction: '', // Valor por defecto
  }),
  getters: {
    getMassAction: (state) => state.massAction,
  },
  actions: {
    setMassAction(action) {
      if (this.massAction !== action) {
        this.massAction = action;
        console.log(`massAction set: ${this.massAction}`);
      }
    }
  },
});
