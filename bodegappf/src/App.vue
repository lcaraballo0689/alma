<template>
  <div id="app"  class="bg-custom">
    <!-- <div id="app"  class="bg-light" :class="{ 'bg-custom': themeStore.theme === 'dark' }"> -->
    <!-- Componente global de loader -->
    <LoadingOverlay :visible="isLoading" />
    <router-view />
    <FooterComponent />
  </div>
</template>

<script>
import LoadingOverlay from "@/components/LoadingOverlay.vue";
import FooterComponent from "@/components/Footer.vue";
import { useLoaderStore } from "@/stores/loaderStore";
import { useThemeStore } from "@/stores/themeStore";

export default {
  name: "App",
  components: {
    LoadingOverlay,
    FooterComponent
  },
  data() {
    return {
      loaderStore: useLoaderStore(), // se obtiene el store
      themeStore: useThemeStore(),
    };
  },
  computed: {
    isLoading() {
      return this.loaderStore.isLoading;
    },
  },
};
</script>

<style>
.bg-custom {

  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background-color: #faf9f67e;
  height: 91vh;
}
</style>
