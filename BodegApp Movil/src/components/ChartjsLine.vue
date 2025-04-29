<template>
    <div>
      <canvas ref="canvas"></canvas>
    </div>
  </template>
  
  <script>
  import { defineComponent, ref, onMounted, watch } from 'vue'
  import { Chart, registerables } from 'chart.js'
  
  Chart.register(...registerables)
  
  export default defineComponent({
    name: 'ChartjsLine',
    props: {
      chartData: {
        type: Object,
        required: true
      },
      options: {
        type: Object,
        default: () => ({})
      }
    },
    setup(props) {
      const canvas = ref(null)
      let chartInstance = null
  
      const renderChart = () => {
        if (chartInstance) {
          chartInstance.destroy()
        }
        chartInstance = new Chart(canvas.value, {
          type: 'line',
          data: props.chartData,
          options: props.options
        })
      }
  
      onMounted(() => {
        renderChart()
      })
  
      watch(() => props.chartData, renderChart, { deep: true })
  
      return { canvas }
    }
  })
  </script>
  
  <style scoped>
  canvas {
    max-width: 100%;
    height: auto;
  }
  </style>