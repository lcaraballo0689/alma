<template>
    <div class="not-found">
        <h1>404</h1>
        <p>La página que buscas no ha sido encontrada.</p>
    </div>
</template>

<script>
export default {
    name: "NotFoundView"
};
</script>

<style scoped>
.not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    font-family: Arial, sans-serif;
    color: #333;
    text-align: center;
}

.not-found h1 {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.not-found p {
    font-size: 1.25rem;
}
</style>