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
import CyclomediaRecordingsClient from '@/components/recordings-client.js';

watch(
  () => MapStore.cyclomediaCameraYaw,
  newYaw => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('MapPanel.vue watch cyclomediaCameraYaw, newYaw:', newYaw);
    updateCyclomediaCameraAngle(newYaw);
    updateCyclomediaCameraViewcone(MapStore.cyclomediaCameraHFov, newYaw);
  }
)

watch(
  () => MapStore.cyclomediaCameraHFov,
  newHFov => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('MapPanel.vue watch cyclomediaCameraHFov, newHFov:', newHFov);
    updateCyclomediaCameraViewcone(newHFov, MapStore.cyclomediaCameraYaw);
  }
)

watch(
  () => MapStore.cyclomediaCameraLngLat,
  newLngLat => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('MapPanel.vue watch cyclomediaCameraLngLat, newLngLat:', newLngLat);
    updateCyclomediaCameraLngLat(newLngLat);
  }
)

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
    if (map.getZoom() > 16.5) {
      updateCyclomediaRecordings();
    }
  })

  // add the address marker and camera icon sources
  const markerImage = await map.loadImage(markerSrc.value)
  console.log('markerImage:', markerImage);
  map.addImage('marker-blue', markerImage.data);
  // const buildingColumnsImage = await map.loadImage(buildingColumnsSrc.value)
  // map.addImage('building-columns-solid', buildingColumnsImage.data);
  const cameraImage = await map.loadImage(cameraSrc.value)
  map.addImage('camera-icon', cameraImage.data);

  // add the unchanged maplibre controls
  map.addControl(new maplibregl.NavigationControl(), 'bottom-left');
  map.addControl(new maplibregl.GeolocateControl(), 'bottom-left');

  map.on('moveend', () => {
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('map moveend event, e:', e, 'map.getZoom()', map.getZoom(), 'map.getStyle().layers:', map.getStyle().layers, 'map.getStyle().sources:', map.getStyle().sources);
    // if (MapStore.cyclomediaOn) {
    map.getZoom() > 16.5 ? MapStore.cyclomediaRecordingsOn = true : MapStore.cyclomediaRecordingsOn = false;
    if (MapStore.cyclomediaRecordingsOn) {
      updateCyclomediaRecordings();
    } else {
      let geojson = { type: 'FeatureCollection', features: [] };
      map.getSource('cyclomediaRecordings').setData(geojson);
      $config.dorDrawnMapStyle.sources.cyclomediaRecordings.data.features = [];
    }
    // }
  });

  map.on('zoomend', () => {
    // if (MapStore.cyclomediaOn) {
    updateCyclomediaCameraViewcone(MapStore.cyclomediaCameraHFov, MapStore.cyclomediaCameraYaw);
    // }
  });

  map.on('click', 'cyclomediaRecordings', (e) => {
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('cyclomediaRecordings click, e:', e, 'e.features[0]:', e.features[0]);
    e.clickOnLayer = true;
    MapStore.clickedCyclomediaRecordingCoords = [ e.lngLat.lng, e.lngLat.lat ];
  });

  map.on('mouseenter', 'cyclomediaRecordings', (e) => {
    if (e.features.length > 0) {
      map.getCanvas().style.cursor = 'pointer'
    }
  });

  map.on('mouseleave', 'cyclomediaRecordings', () => {
    map.getCanvas().style.cursor = ''
  });

  if (MapStore.cyclomediaCameraLngLat) {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('in toggleCyclomedia, calling updateCyclomediaCameraLngLat, MapStore.cyclomediaCameraLngLat:', MapStore.cyclomediaCameraLngLat);
    updateCyclomediaCameraLngLat(MapStore.cyclomediaCameraLngLat);
  }
  if (MapStore.cyclomediaCameraHFov && MapStore.cyclomediaCameraYaw) {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('calling updateCyclomediaCameraViewcone');
    updateCyclomediaCameraViewcone(MapStore.cyclomediaCameraHFov, MapStore.cyclomediaCameraYaw);
    updateCyclomediaCameraAngle(MapStore.cyclomediaCameraYaw);
  }

});

watch(
  () => GeocodeStore.aisData,
  async newAddress => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('MapStore aisData watch, newAddress:', newAddress);
    if (newAddress.features && newAddress.features[0].geometry.coordinates.length) {
      const newCoords = newAddress.features[0].geometry.coordinates;
      
      MapStore.currentAddressCoords = newCoords;
      map.setCenter(newCoords);
      map.setZoom(17);

      const address = point(newCoords);
      map.getSource('addressMarker').setData(address);
      MapStore.currentAddressCoords = newCoords;
  
      // const popup = document.getElementsByClassName('maplibregl-popup');
      // if (popup.length) {
      //   popup[0].remove();
      // }
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
    map.addLayer($config.mapLayers[imagerySelected.value], 'cyclomediaRecordings')
    map.addLayer($config.mapLayers.imageryLabels, 'cyclomediaRecordings')
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
  await map.addLayer($config.mapLayers[imagerySelected.value], 'cyclomediaRecordings')
  map.removeLayer(oldLayer);
}

// an object class called CyclomediaRecordingsClient is used for adding the cyclomedia recordings circles to the map 
let cyclomediaRecordingsClient = new CyclomediaRecordingsClient(
  'https://atlasapi.cyclomedia.com/api/recording/wfs',
  import.meta.env.VITE_CYCLOMEDIA_USERNAME,
  import.meta.env.VITE_CYCLOMEDIA_PASSWORD,
  4326,
);

const updateCyclomediaRecordings = async () => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('updateCyclomediaRecordings is running');
  const bounds = map.getBounds();
  cyclomediaRecordingsClient.getRecordings(
    bounds,
    recordings => {
      let geojson = {
        type: 'FeatureCollection',
        features: []
      }
      let features = [];
      for (let item of recordings) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [item.lng, item.lat]
          },
          properties: {
            id: item.imageId,
            type: 'cyclomediaRecording',
          }
        })
      }
      geojson.features = features;
      // if (import.meta.env.VITE_DEBUG == 'true') console.log("map.getSource('cyclomediaRecordings'):", 'map.getStyle().layers:', map.getStyle().layers);
      map.getSource('cyclomediaRecordings').setData(geojson);
      // I don't know why this works - maybe because the mergeDeep is still running
      $config.dorDrawnMapStyle.sources.cyclomediaRecordings.data.features = features;
    },
  );
}

// everything for adding, moving, and orienting the cyclomedia camera icon and viewcone
const updateCyclomediaCameraLngLat = (lngLat) => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('updateCyclomediaCameraLngLat is running, lngLat:', lngLat);
  // if (!MapStore.cyclomediaOn) {
  //   return;
  // } else {
  const theData = point(lngLat);
  map.getSource('cyclomediaCamera').setData(theData);
  $config.dorDrawnMapStyle.sources.cyclomediaCamera.data = theData;
  // }
}

const updateCyclomediaCameraAngle = (newOrientation) => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('updateCyclomediaCameraAngle is running, newOrientation:', newOrientation);
  if (!newOrientation) {
    newOrientation = MapStore.cyclomediaCameraYaw;
  }
  map.setLayoutProperty('cyclomediaCamera', 'icon-rotate', newOrientation);
}

const updateCyclomediaCameraViewcone = (cycloHFov, cycloYaw) => {
  if (import.meta.env.VITE_DEBUG === 'true') console.log('updateCyclomediaCameraViewcone is running cycloHFov:', cycloHFov, 'cycloYaw:', cycloYaw);
  const halfAngle = cycloHFov / 2.0;
  let angle1 = cycloYaw - halfAngle;
  let angle2 = cycloYaw + halfAngle;
  if (import.meta.env.VITE_DEBUG == 'true') console.log('updateCyclomediaCameraViewcone, cycloHFov:', cycloHFov, 'halfAngle:', halfAngle, 'angle1:', angle1, 'cycloYaw:', cycloYaw, 'angle2:', angle2);
  const watchedZoom = map.getZoom();
  let distance;
  if (watchedZoom < 9) {
    distance = 2000 * (21 - watchedZoom);
  } else if (watchedZoom < 10) {
    distance = 1000 * (21 - watchedZoom);
  } else if (watchedZoom < 11) {
    distance = 670 * (21 - watchedZoom);
  } else if (watchedZoom < 12) {
    distance = 420 * (21 - watchedZoom);
  } else if (watchedZoom < 13) {
    distance = 270 * (21 - watchedZoom);
  } else if (watchedZoom < 14) {
    distance = 150 * (21 - watchedZoom);
  } else if (watchedZoom < 15) {
    distance = 100 * (21 - watchedZoom);
  } else if (watchedZoom < 16) {
    distance = 55 * (21 - watchedZoom);
  } else if (watchedZoom < 17) {
    distance = 30 * (21 - watchedZoom);
  } else if (watchedZoom < 18) {
    distance = 25 * (21 - watchedZoom);
  } else if (watchedZoom < 20.4) {
    distance = 15 * (21 - watchedZoom);
  } else {
    distance = 10;
  }

  const cyclomediaCameraLngLat = MapStore.cyclomediaCameraLngLat;
  let options = { units: 'feet' };
  if (!cyclomediaCameraLngLat) {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('no cyclomediaCameraLngLat');
    return;
  }
  if (import.meta.env.VITE_DEBUG == 'true') console.log('cyclomediaCameraLngLat:', cyclomediaCameraLngLat);

  var destination1 = destination([ cyclomediaCameraLngLat[0], cyclomediaCameraLngLat[1] ], distance, angle1, options);
  var destination2 = destination([ cyclomediaCameraLngLat[0], cyclomediaCameraLngLat[1] ], distance, angle2, options);
  let data = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [ cyclomediaCameraLngLat[0], cyclomediaCameraLngLat[1] ],
        [ destination1.geometry.coordinates[0], destination1.geometry.coordinates[1] ],
        [ destination2.geometry.coordinates[0], destination2.geometry.coordinates[1] ],
        [ cyclomediaCameraLngLat[0], cyclomediaCameraLngLat[1] ],
      ]],
    }
  }

  map.getSource('cyclomediaViewcone').setData(data);
  $config.dorDrawnMapStyle.sources.cyclomediaViewcone.data = data;
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