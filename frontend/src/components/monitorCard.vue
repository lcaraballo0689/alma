<template>
  <div v-if="typeCard === 1" class="dashboard-card1 type1" :style="cardStyle">
    <div class="card-content">
      <div class="card-text">
        <h1 class="card-value1">{{ total }}</h1>
        <h6 class="card-title">{{ name }}</h6>
      </div>
      <div class="card-icon1">
        <template v-if="backgroundIcon">
          <i :class="backgroundIcon" style="color: #fff; z-index: 0;"></i>
        </template>
        <template v-else>
          <slot></slot>
        </template>
      </div>
    </div>
  </div>
  <div v-if="typeCard === 2" class="dashboard-card2 type2" :style="cardStyle">
    <div class="card-content">
      <div class="card-text">
        <h1 class="card-value2">{{ total }}</h1>
        <h6 class="card-title">{{ name }}</h6>
      </div>
      <div class="card-icon2">
        <template v-if="backgroundIcon">
          <i :class="backgroundIcon" style="color: #fff; z-index: 0;"></i>
        </template>
        <template v-else>
          <slot></slot>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "DashboardCard",
  props: {
    name: {
      type: String,
      required: true,
    },
    total: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: "linear-gradient(135deg, #235ca4, #041e40)",
    },
    ancho: {
      type: String,
      default: "250px",
    },
    backgroundIcon: {
      type: String,
      default: "",
    },
    typeCard: {
      type: Number,
      default: 1,
    },
  },
  computed: {
    cardStyle() {
      return {
        background: this.color,
        minWidth: this.ancho,
        height: this.typeCard === 1 ? "200px" : "100px", // Ajusta la altura
      };
    },
  },
};
</script>

<style scoped>
.dashboard-card1 {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  padding: 20px;
  color: #fff;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.dashboard-card2 {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  padding: 20px;
  color: #fff;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.type1 {
  height: 216px !important;
}

.type2 {
  height: 100px;
}

.card-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-value1 {
  font-size: clamp(80px, 2.5rem, 90px);
  margin: 0;
  font-weight: bold;
}
.card-value2 {
  font-size: clamp(24px, 2.5rem, 90px);
  margin: 0;
  font-weight: bold;
}

.card-title {
  font-size: 1rem;
  margin: 0;
  font-weight: 400;
}

.card-icon1 {
  font-size: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.1;
  position: absolute;
  top: -60px;
  right: 10px;
  z-index: 10;
  transition: transform 0.3s ease-in-out; /* Transición suave sin animación inicial */
}
.card-icon2 {
  font-size: 75px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.1;
  position: absolute;
  top: -20px;
  right: 0px;
  z-index: 10;
  transition: transform 0.3s ease-in-out; /* Transición suave sin animación inicial */
}

/* SOLO se animará el .card-icon2 dentro del .dashboard-card que tiene el cursor encima */
.dashboard-card2:hover .card-icon2 {
  animation: bounceRotate 2s infinite ease-in-out, zoomInOut 2s infinite ease-in-out;
}

.dashboard-card1:hover .card-icon1 {
  animation: bounceRotate 2s infinite ease-in-out, zoomInOut 2s infinite ease-in-out;
}


@keyframes bounceRotate {
  0% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-5px) rotate(5deg);
  }
  50% {
    transform: translateY(0) rotate(0deg);
  }
  75% {
    transform: translateY(-5px) rotate(-5deg);
  }
  100% {
    transform: translateY(0) rotate(0deg);
  }
}

@media screen and (max-width: 768px) {
  .dashboard-card {
    padding: 15px;
    min-width: 200px;
  }
  .card-value {
    font-size: 40px;
  }
}
</style>
