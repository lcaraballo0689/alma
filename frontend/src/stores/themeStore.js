import { defineStore } from 'pinia';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDarkTheme: false,
  }),
  getters: {
    theme() {
      return this.isDarkTheme ? 'dark' : 'light';
    },
  },
  actions: {
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme;
    },
    enableDark() {
      this.isDarkTheme = true;
    },
    enableLight() {
      this.isDarkTheme = false;
    },
  },
});
