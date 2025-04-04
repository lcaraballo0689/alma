// src/stores/loaderStore.js
import { defineStore } from 'pinia';

export const useLoaderStore = defineStore('loader', {
  state: () => ({
    isLoading: false,
  }),
  actions: {
    showLoader() {
      this.isLoading = true;
    },
    hideLoader() {
      this.isLoading = false;
    },
  },
});
