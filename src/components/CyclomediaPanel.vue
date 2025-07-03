<script setup>
import { ref, onMounted, watch } from 'vue';
import { useMapStore } from '@/stores/MapStore';
const MapStore = useMapStore();
import { useGeocodeStore } from '@/stores/GeocodeStore';
const GeocodeStore = useGeocodeStore();

import { format, subYears } from 'date-fns';

import FullScreenCyclomediaToggleTab from '@/components/FullScreenCyclomediaToggleTab.vue';

const cyclomediaInitialized = ref(false);

// const $emit = defineEmits(['updateCameraYaw', 'updateCameraLngLat', 'updateCameraHFov']);

watch(
  () => MapStore.currentAddressCoords,
  newLngLat => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('CyclomediaPanel.vue watch cyclomediaLngLat, newLngLat:', newLngLat);
    setNewLocation(newLngLat);
  }
)

watch(
  () => GeocodeStore.aisData.features,
  newAisData => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('CyclomediaPanel.vue watch GeocodeStore.aisData.features, newAisData:', newAisData);
    if (newAisData && newAisData.length) {
      setNewLocation(newAisData[0].geometry.coordinates);
    }
  }
)

watch(
  () => MapStore.cyclomediaOn,
  newCyclomediaOn => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('CyclomediaPanel.vue watch cyclomediaOn, newCyclomediaOn:', newCyclomediaOn);
    if (newCyclomediaOn) {
      setNewLocation(MapStore.currentAddressCoords);
    }
  }
)

const navBarExpanded = ref(false);

const setNewLocation = async (coords) => {
  const today = new Date();
  const year = MapStore.cyclomediaYear;
  let thisYear, lastYear;
  if (year) {
    lastYear = `${year}-01-01`;
    thisYear = `${year + 1}-01-01`;
  } else {
    lastYear = format(subYears(today, 1), 'yyyy-MM-dd');
    thisYear = format(today, 'yyyy-MM-dd');
  }
  const response = await StreetSmartApi.open(
    {
      coordinate: [coords[0],coords[1]],
      dateRange: { from: lastYear, to: thisYear },
    },
    {
      viewerType: StreetSmartApi.ViewerType.PANORAMA,
      srs: 'EPSG:2272',
      panoramaViewer: {
        closable: false,
        maximizable: false,
      },
    }
  )
  let viewer = response[0];
  viewer.toggleNavbarExpanded(navBarExpanded.value);
  viewer.toggleButtonEnabled('panorama.elevation', false);
  viewer.toggleButtonEnabled('panorama.reportBlurring', false);

  for (let overlay of viewer.props.overlays) {
    if (overlay.id === 'surfaceCursorLayer') {
      if (overlay.visible === true) {
        viewer.toggleOverlay(overlay);
      }
    }
  }

  viewer.on('VIEW_CHANGE', function(e) {
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('on VIEW_CHANGE fired, type:', e.type, 'detail:', e.detail, 'viewer.props:', viewer.props, 'viewer.props.orientation.xyz:', viewer.props.orientation.xyz, 'MapStore.cyclomediaCameraXyz:', MapStore.cyclomediaCameraXyz);
    MapStore.cyclomediaCameraYaw = e.detail.yaw;
    MapStore.cyclomediaCameraHFov = e.detail.hFov;
    if (viewer.props.orientation.xyz !== MapStore.cyclomediaCameraXyz) {
      const lngLat = [ viewer.props.orientation.xyz[0], viewer.props.orientation.xyz[1] ];
      MapStore.setCyclomediaCameraLngLat(lngLat, viewer.props.orientation.xyz);
    }
  });

  viewer.on('VIEW_LOAD_END', function(e) {
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('on VIEW_LOAD_END fired, type:', e.type, 'e:', e, 'viewer.props.orientation:', viewer.props.orientation, 'viewer.props:', viewer.props);
    MapStore.cyclomediaYear = viewer.props.recording.year;
    if (viewer.props.orientation.xyz !== MapStore.cyclomediaCameraXyz) {
      const lngLat = [ viewer.props.orientation.xyz[0], viewer.props.orientation.xyz[1] ];
      MapStore.setCyclomediaCameraLngLat(lngLat, viewer.props.orientation.xyz);
    }
  });
}

watch(
  () => MapStore.clickedCyclomediaRecordingCoords,
  newClickedCyclomediaRecordingCoords => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('CyclomediaPanel.vue watch clickedCyclomediaRecordingCoords, newClickedCyclomediaRecordingCoords:', newClickedCyclomediaRecordingCoords);
    if (newClickedCyclomediaRecordingCoords) {
      setNewLocation(newClickedCyclomediaRecordingCoords);
    }
  }
)

onMounted( async() => {
  if (!cyclomediaInitialized.value) {
    await StreetSmartApi.init({
      targetElement: cycloviewer,
      username: import.meta.env.VITE_CYCLOMEDIA_USERNAME,
      password: import.meta.env.VITE_CYCLOMEDIA_PASSWORD,
      apiKey: import.meta.env.VITE_CYCLOMEDIA_API_KEY,
      srs: 'EPSG:4326',
      locale: 'en-us',
      addressSettings: {
        locale: 'en-us',
        database: 'CMDatabase',
      },
    })
    cyclomediaInitialized.value = true;
  }
  if (GeocodeStore.aisData.features) {
    setNewLocation(GeocodeStore.aisData.features[0].geometry.coordinates);
  } else if (MapStore.currentAddressCoords && MapStore.currentAddressCoords.length) {
    setNewLocation(MapStore.currentAddressCoords);
  } else {
    setNewLocation([ -75.163471, 39.953338 ]);
  }
})

</script>

<template>
  <div class="cyclomedia-panel">
    <FullScreenCyclomediaToggleTab />
    <div
      id="cycloviewer"
      ref="cycloviewer"
      class="panoramaViewerWindow"
    />
  </div>
</template>

<style scoped>

.cyclomedia-panel {
  height: 100%;
  width: 100%;
}


/* @media 
only screen and (max-width: 760px),
(min-device-width: 768px) and (max-device-width: 1024px)  {
  .cyclomedia-panel {
    height: 150px;
  }
} */

.panoramaViewerWindow {
  display: block;
  width: 100%;
  height:100%;
}

</style>