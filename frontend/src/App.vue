<template>
  <div id="app" class="bg-light">
    <!-- <div id="app"  class="bg-custom"> -->
    <!-- Componente global de loader -->
    <LoadingOverlay :visible="isLoading" />
    <router-view />
    <FooterComponent v-if="$route.name !== 'Login'" />
  </div>
</template>

<script>
import LoadingOverlay from "@/components/LoadingOverlay.vue";
import FooterComponent from "@/components/Footer.vue";
import { useLoaderStore } from "@/stores/loaderStore";

export default {
  name: "App",
  components: {
    LoadingOverlay,
    FooterComponent
  },
  data() {
    return {
      loaderStore: useLoaderStore(), // se obtiene el store
    };
  },
};
</script>

<style>
#app {
  min-height: 100vh;
}

.bg-custom {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background-color: #faf9f67e;
  height: 91vh;
}
</style>
