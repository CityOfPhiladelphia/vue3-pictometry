
<script setup>

import { ref, computed, onMounted, watch } from 'vue';

import { useMainStore } from '@/stores/MainStore';
const MainStore = useMainStore();
import { useMapStore } from '@/stores/MapStore';
const MapStore = useMapStore();

onMounted(() => {
  setYPosition(MainStore.windowDimensions.height);
  setXPosition(MainStore.windowDimensions.width);
});

const buttonY = ref(0);
const buttonX = ref(0);

watch(
  () => MainStore.windowDimensions,
  newWindowDimensions => {
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('newWindowDimensions.height:', newWindowDimensions.height);
    setYPosition(newWindowDimensions.height);
    setXPosition(newWindowDimensions.width);
  }
)

const fullScreenEagleviewEnabled = computed(() => {
  return MainStore.fullScreenEagleviewEnabled;
});

const isMobileOrTablet = computed(() =>{
  return MainStore.isMobileDevice;
});

const eagleviewActive = computed(() => {
  return MapStore.eagleviewOn;
});

const picOrCycloActive = computed(() => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('eagleviewActive:', eagleviewActive, 'eagleviewActive:', eagleviewActive);
  if (eagleviewActive.value) {
    return true;
  }
  return false;
});

watch (
  () => picOrCycloActive.value,
  () => {
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('newPicOrCycloActive:', newPicOrCycloActive);
    setYPosition(MainStore.windowDimensions.height);
    setXPosition(MainStore.windowDimensions.width);
  }
)

const currentIcon = computed(() => {
  if (fullScreenEagleviewEnabled.value) {
    return 'caret-right';
  }
  return 'caret-left';
});

const setYPosition = (dim) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('setYPosition dim:', dim, typeof dim);
  if (!picOrCycloActive.value) {
    buttonY.value = (dim-48)/2 + 'px';
  } else {
    buttonY.value = (dim-48)/4 + 'px';
  }
}

const setXPosition = async (dim) => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('setXPosition dim:', dim, typeof dim);
  if (fullScreenEagleviewEnabled.value) {
    buttonX.value = '0px';
  } else {
    buttonX.value = dim/2 + 'px';
  }
}

const handleFullScreenMapToggleButtonClick = () => {
  const prevFullScreenEagleviewEnabled = MainStore.fullScreenEagleviewEnabled;
  const nextFullScreenEagleviewEnabled = !prevFullScreenEagleviewEnabled;
  MainStore.fullScreenEagleviewEnabled = nextFullScreenEagleviewEnabled;
  if (nextFullScreenEagleviewEnabled) {
    buttonX.value = '0px';
  } else {
    buttonX.value = MainStore.windowDimensions.width/2 + 'px';
  }
  window.dispatchEvent(new Event('resize'));
}

</script>

<template>
  <button
    v-if="!isMobileOrTablet"
    id="map-toggle-tab"
    :title="fullScreenEagleviewEnabled ? 'Reduce Eagleview Panel' : 'Expand Eagleview Panel'"
    class="toggle-tab"
    tabindex="0"
    @click="handleFullScreenMapToggleButtonClick"
    :style="{ top: buttonY, left: 0 }"
  >
    <!-- <span class="align-span"> -->
    <font-awesome-icon
      :icon="currentIcon"
      class="fa-2x"
    />
    <!-- </span> -->
  </button>
</template>

<style scoped>

  .toggle-tab {
    display: none;
    padding-top: 9px;
    cursor: pointer;
  }

  .align-span {
    margin-left: 6px;
  }

  @media screen and (min-width: 761px) {
    .toggle-tab {
      position: absolute;
      left: 0px;
      border-width: 1.3px;
      border-style: solid;
      border-color: #CAC9C9;
      height: 48px;
      /* line-height: 56px; */
      width:24px;
      background-color: white;
      display: inline-block;
      z-index: 500;
      opacity: 0.7;
      padding-top: 2px;
    }
  }

</style>
