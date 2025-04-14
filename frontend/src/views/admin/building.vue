<template>
  <div class="under-construction">
    <div class="content-card">
      <img :src="Logo" alt="Logo" class="logo" style="width: 90%; margin-bottom: 1rem;" />
      <h1 class="title">¡Aplicación Móvil en Construcción!</h1>
      <p class="subtitle">
        Estamos preparando una experiencia innovadora y de alto impacto.
        Por favor, regresa pronto para descubrir lo que estamos cocinando.
      </p>
      <div class="spinner"></div>
      <p class="message">¡La transformación digital está en marcha!</p>
    </div>
  </div>
</template>

<script>
import Logo from "@/assets/img/siglo.png";

export default {
  name: "UnderConstruction",
  data() {
    return {
      Logo,
    };
  },
};
</script>

<style scoped>
.under-construction {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #f3f3f3, #414141);
  color: #474747;
  text-align: center;
  padding: 2rem;
  box-sizing: border-box;
}

.content-card {
  background-color: rgba(245, 245, 245, 0.5);
  padding: 2rem 3rem;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.title {
  font-size: 2rem;
  margin-bottom: 1rem;
  letter-spacing: 1px;
}

.subtitle {
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 1rem;
  border: 6px solid rgba(206, 150, 150, 0.3);
  border-top-color: #ff0000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.message {
  font-size: 1rem;
  font-style: italic;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
