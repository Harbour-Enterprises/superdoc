<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

</script>

<template>
  <div class="alignment-buttons">

    <div class="button-icon"><font-awesome-icon icon="align-left" /></div>
    <div class="button-icon"><font-awesome-icon icon="align-center" /></div>
    <div class="button-icon"><font-awesome-icon icon="align-right" /></div>
    <div class="button-icon"><font-awesome-icon icon="align-justify" /></div>

  </div>
</template>

<style scoped>
.alignment-buttons {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 8px;
}
.button-icon {
  cursor: pointer;
  padding: 12px;
  font-size: 16px;
  width: 25px;
  height: 25px;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.button-icon:hover {
  background-color: #d8dee5;
}
</style>