<script setup>
import isMobileDevice from './util/is-mobile-device';
import isMac from './util/is-mac';

import MapPanel from '@/components/MapPanel.vue';
import EagleviewPanel from '@/components/EagleviewPanel.vue';

import { useMainStore } from './stores/MainStore';
const MainStore = useMainStore();
import { useMapStore } from './stores/MapStore';
const MapStore = useMapStore();
import { useGeocodeStore } from './stores/GeocodeStore';
const GeocodeStore = useGeocodeStore();

import AddressSearchControl from '@/components/AddressSearchControl.vue';

if (!import.meta.env.VITE_PUBLICPATH) {
  MainStore.publicPath = '/';
} else {
  MainStore.publicPath = import.meta.env.VITE_PUBLICPATH;
}
if (import.meta.env.VITE_DEBUG == 'true') console.log('import.meta.env.VITE_PUBLICPATH:', import.meta.env.VITE_PUBLICPATH, 'MainStore.publicPath:', MainStore.publicPath);

import { watch, onMounted, computed } from "vue";

// ROUTER
import { useRouter, useRoute } from 'vue-router';
const route = useRoute();
const router = useRouter();

const fullScreenEagleviewEnabled = computed(() => {
  return MainStore.fullScreenEagleviewEnabled;
})

const fullScreenMapEnabled = computed(() => {
  return MainStore.fullScreenMapEnabled;
})

onMounted(async () => {
  // localStorage.clear();
  MainStore.appVersion = import.meta.env.VITE_VERSION;
  MainStore.isMobileDevice = isMobileDevice();
  MainStore.isMac = isMac();
  await router.isReady()
  if (import.meta.env.VITE_DEBUG == 'true') console.log('App onMounted, route.params.topic:', route.params.topic, 'route.params.address:', route.params.address);
  if (route.name === 'not-found') {
    router.push({ name: 'home' });
  }
  if (route.name === 'address') {
    // router.replace({ name: 'search', query: { address: MainStore.addressSearchValue }})
    router.replace({ name: 'search', query: { address: route.params.address } });
  }

  const main = document.getElementById('main');
  main.scrollTop = -main.scrollHeight;

  window.addEventListener('resize', handleWindowResize);
  handleWindowResize();
});

const handleWindowResize = () => {
  const rootElement = document.getElementById('app');
  const rootStyle = window.getComputedStyle(rootElement);
  const rootWidth = rootStyle.getPropertyValue('width');
  const rootHeight = rootStyle.getPropertyValue('height');
  const rootWidthNum = parseInt(rootWidth.replace('px', ''));
  const rootHeightNum = parseInt(rootHeight.replace('px', ''));

  const dim = {
    width: rootWidthNum,
    height: rootHeightNum,
  };
  MainStore.windowDimensions = dim;
}

const links = [
  {
    type: 'native',
    href: 'https://phila.formstack.com/forms/atlas_feedback_form',
    text: 'Feedback',
    attrs: {
      target: '_blank',
    },
  },
];

watch(
  () => GeocodeStore.aisData,
  async newAddress => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('App aisData watch, newAddress:', newAddress);
    if (newAddress.features && newAddress.features[0].geometry.coordinates.length) {
      const newCoords = newAddress.features[0].geometry.coordinates;
      MapStore.currentAddressCoords = newCoords;
    }
  }
)

</script>

<template>
  <a
    href="#main"
    class="skip-to-main-content-link"
  >Skip to main content</a>

  <app-header
    app-title="Pictometry"
    app-link="/"
    :is-sticky="true"
    :is-fluid="true"
  >
    <!-- <template #mobile-nav>
      <mobile-nav :links="links" />
    </template> -->
  </app-header>

  <!-- MAIN CONTENT -->
  <main
    id="main"
    class="main invisible-scrollbar"
    >
    <!-- :style="{ 'flex-direction': 'column-reverse' }" -->
    <AddressSearchControl :input-id="'map-search-input'" />

    <!-- MAP PANEL ON LEFT - right now only contains the address input -->
    <div
      v-if="!isMobileDevice() && MainStore.windowDimensions.width > 768 && !fullScreenEagleviewEnabled"
      class="map-panel-holder"
      :class="fullScreenMapEnabled ? 'topics-holder-full' : ''"
    >
      <map-panel />
    </div>
    <div
      v-show="!fullScreenMapEnabled || isMobileDevice() || MainStore.windowDimensions.width <= 768"
      class="eagleview-holder"
      :class="fullScreenEagleviewEnabled || MainStore.windowDimensions.width <= 768 ? 'eagleview-holder-full' : ''"
    >
      <eagleview-panel />
    </div>

    <div
      v-if="isMobileDevice() || MainStore.windowDimensions.width <= 768"
      class="map-panel-holder"
      :class="fullScreenMapEnabled ? 'topics-holder-full' : ''"
    >
      <map-panel />
    </div>

    
  </main>

  <!-- FOOTER -->
  <app-footer
    :is-sticky="true"
    :is-hidden-mobile="true"
    />
    <!-- :links="links" -->
</template>

<style scoped>

</style>
