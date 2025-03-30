<template>
  <nav aria-label="breadcrumb">
    <ol
      class="breadcrumb custom-breadcrumb ms-3"
      :hidden="items[0] === 'Dashboard'"
    >
      <li></li>
      <li class="" v-for="(item, index) in items" :key="index"  >
        <span v-if="item?.menu !== 'Dashboard'" class="me-1">
          <i class="bi bi-house me-1"></i
        ></span>
        <span v-if="item?.menu !== 'Dashboard'" class="me-1">/</span>
        <span v-if="item?.menu !== 'Dashboard'" class="me-1"></span>
        <span v-if="item?.menu !== 'Dashboard'">
          <i
            :class="
            item?.menu === 'Reporte' ? 'bi bi-file-earmark-ruled ' : 
            item?.menu === 'Movimientos' ? 'bi bi-arrow-left-right' : ''
            "
          ></i>
          {{ item?.menu }}
        </span>

        <span v-if="item?.submenu !== ''" class="me-1"> /</span>

        <span v-if="item?.menu !== 'Dashboard'" class="me-1">
          <i
            :class="
            item?.submenu === 'Desincorporacion' ? 'bi bi-archive-fill' : 
            item?.submenu === 'Transferencia' ? 'bi bi-truck-front-fill' :
            item?.submenu === 'Confirmar Recepcion' ? 'bi bi-building-fill-check' : 
            item?.submenu === 'Prestamo' ? 'bi bi-hand-index-thumb-fill' : 
             item?.submenu === 'Devolucion' ? 'bi bi-arrow-return-left' : ''
            "
          ></i>
          {{ item?.submenu }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script>
export default {
  name: "Breadcrumb",
  props: {
    path: {
      type: Array,
      required: true,
    },
  },
  computed: {
    items() {
      return this.path || [];
    },
  },
};
</script>

<style scoped>
.custom-breadcrumb {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: none;
  margin: 0;
  list-style: none;
  min-height: 37px !important;
  padding: 8px !important;
}

.custom-breadcrumb .breadcrumb-item {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.custom-breadcrumb .breadcrumb-item + .breadcrumb-item::before {
  content: "›";
  color: #292929;
  padding: 0 8px;
}

.custom-breadcrumb .breadcrumb-item.active {
  font-weight: bold;
  color: #000;
}
.custom-py {
  padding: 10px 16px;
}
</style>
