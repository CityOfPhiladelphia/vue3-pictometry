<script setup>

import $config from '@/config';
if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue $config:', $config);

import { ref, onMounted, watch, watchEffect, computed } from 'vue';

// PACKAGE IMPORTS
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// this was recommended by a comment in https://github.com/mapbox/mapbox-gl-js/issues/9114
// the official mapbox-gl-draw was blocking map clicks
// import '@/assets/mapbox-gl-draw.min.js'
// import '@/assets/maplibre-gl-draw.css';
import destination from '@turf/destination';
import { point } from '@turf/helpers';


import { useMapStore } from '@/stores/MapStore.js';
const MapStore = useMapStore();
import { useMainStore } from '@/stores/MainStore.js'
const MainStore = useMainStore();
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
const GeocodeStore = useGeocodeStore();

import { useRouter, useRoute } from 'vue-router';
const route = useRoute();
const router = useRouter();

import FullScreenMapToggleTab from '@/components/FullScreenMapToggleTab.vue';
import ImageryToggleControl from '@/components/ImageryToggleControl.vue';
import ImageryDropdownControl from '@/components/ImageryDropdownControl.vue';

let map;

const markerSrc = computed(() => {
  return MainStore.publicPath + 'images/marker_blue_base_5.png';
})
// const buildingColumnsSrc = computed(() => {
//   return MainStore.publicPath + 'images/building-columns-solid.png';
// })
const cameraSrc = computed(() => {
  return MainStore.publicPath + 'images/camera.png';
})

const center = computed(() => {
  if (GeocodeStore.aisData.features && GeocodeStore.aisData.features[0]) {
    return GeocodeStore.aisData.features[0].geometry.coordinates;
  } else if (MapStore.currentAddressCoords.length) {
    return MapStore.currentAddressCoords;
  } else {
    return $config.cityCenterCoords;
  }
})

const zoom = computed(() => {
  if (route.params.address || MapStore.currentAddressCoords.length) {
    return 17;
  } else {
    return 12;
  }
})

onMounted(async () => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue onMounted route.params.topic:', route.params.topic, 'route.params.address:', route.params.address);
  
  // create the maplibre map
  // let currentTopicMapStyle = route.params.topic ? $config.topicStyles[route.params.topic] : 'pwdDrawnMapStyle';
  // let zoom = route.params.address || MapStore.currentAddressCoords.length ? 17 : 12;

  map = new maplibregl.Map({
    container: 'map',
    style: $config['pwdDrawnMapStyle'],
    center: center.value,
    zoom: zoom.value,
    minZoom: 6,
    maxZoom: 22,
    attributionControl: false,
  });

  map.on('load', () => {
    let canvas = document.querySelector(".maplibregl-canvas");
    canvas.setAttribute('tabindex', -1);
    map.setCenter(center.value);
    map.setZoom(zoom.value);
  })

  // add the address marker and camera icon sources
  const markerImage = await map.loadImage(markerSrc.value)
  console.log('markerImage:', markerImage);
  map.addImage('marker-blue', markerImage.data);

  const geocodeCoords = GeocodeStore.aisData.features && GeocodeStore.aisData.features[0] ? 
    GeocodeStore.aisData.features[0].geometry.coordinates : 
    MapStore.currentAddressCoords.length ? MapStore.currentAddressCoords : $config.cityCenterCoords;
  // const geocodeCoords = MapStore.currentAddressCoords;
  const address = point(geocodeCoords);
  map.getSource('addressMarker').setData(address);

  const cameraImage = await map.loadImage(cameraSrc.value)
  map.addImage('camera-icon', cameraImage.data);

  // add the unchanged maplibre controls
  map.addControl(new maplibregl.NavigationControl(), 'bottom-left');
  map.addControl(new maplibregl.GeolocateControl(), 'bottom-left');

});

watch(
  () => GeocodeStore.aisData,
  async newAddress => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('MapStore aisData watch, newAddress:', newAddress);
    if (newAddress.features && newAddress.features[0].geometry.coordinates.length) {
      const newCoords = newAddress.features[0].geometry.coordinates;
      
      // MapStore.currentAddressCoords = newCoords;
      map.setCenter(newCoords);
      map.setZoom(17);

      const address = point(newCoords);
      map.getSource('addressMarker').setData(address);
    }
  }
)

// allow the imagery to be toggled on and off, and set to different images
const imagerySelected = computed(() => {
  return MapStore.imagerySelected;
})

const toggleImagery = () => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('toggleImagery, map.getStyle:', map.getStyle());
  if (!MapStore.imageryOn) {
    MapStore.imageryOn = true;
    map.addLayer($config.mapLayers[imagerySelected.value])
    map.addLayer($config.mapLayers.imageryLabels)
  } else {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('map.getStyle().layers:', map.getStyle().layers);
    MapStore.imageryOn = false;
    map.removeLayer(imagerySelected.value);
    map.removeLayer('imageryLabels');
    if (!route.params.topic) {
      // map.setStyle($config['pwdDrawnMapStyle']);
      // if (pwdCoordinates.value.length) {
      //   map.getSource('addressMarker').setData(point(pwdCoordinates.value));
      // }
    }
  }
}

const setImagery = async (newImagery) => {
  const oldLayer = imagerySelected.value;
  if (oldLayer == newImagery) {
    return;
  }
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('setImagery, newImagery:', newImagery, 'oldLayer:', oldLayer, 'imagerySelected.value:', imagerySelected.value);
  MapStore.imagerySelected = newImagery;
  await map.addLayer($config.mapLayers[imagerySelected.value]);
  map.removeLayer(oldLayer);
}


</script>

<template>
  <full-screen-map-toggle-tab />
  <div
    id="map"
    class="map map-panel"
  >
    <ImageryToggleControl @toggle-imagery="toggleImagery" />
    <ImageryDropdownControl
      v-if="MapStore.imageryOn"
      @set-imagery="setImagery"
    />
  </div>
  
</template>