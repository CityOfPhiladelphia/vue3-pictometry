<script setup>

import $config from '@/config';
import { onMounted, computed, watch } from 'vue';
import { point } from '@turf/helpers';
import axios from 'axios';

import { useMapStore } from '@/stores/MapStore';
const MapStore = useMapStore();

import FullScreenEagleviewToggleTab from '@/components/FullScreenEagleviewToggleTab.vue';
import ParcelsControl from '@/components/ParcelsControl.vue';
import LabelsControl from '@/components/LabelsControl.vue';

const clientId = import.meta.env.VITE_EAGLEVIEW_CLIENT_ID;
const clientSecret = import.meta.env.VITE_EAGLEVIEW_CLIENT_SECRET;
const options = {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret),
    'Accept': 'application/json',
    'content-type': 'application/x-www-form-urlencoded'
  },
  data: 'grant_type=client_credentials',
  url: 'https://api.eagleview.com/auth-service/v1/token',
};

const currentAddressCoords = computed(() => {
  if (MapStore.currentAddressCoords.length) {
    return { lat: MapStore.currentAddressCoords[1], lon: MapStore.currentAddressCoords[0] }
  } else {
    return { lat: $config.cityCenterCoords[1], lon: $config.cityCenterCoords[0] };
  }
});

let map;

const eagleviewProperties = {
  "eagleview": {
    "subType": "Marker",
    "icon": "FaMapMarkerAlt",
    "style": {
      "color": "#2c63c7",
      "size": 34,
    }
  }
};

watch(
  () => currentAddressCoords.value,
  newValue => {
    if (map && newValue) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('currentAddressCoords changed:', newValue);
      map.setView({ lonLat: newValue, zoom: 18});
      map.removeFeatures();
      map.addFeatures({
        geoJson: [
          point(
            [newValue.lon, newValue.lat],
            eagleviewProperties
          )
        ]
      });
    }
  }
);

watch(
  () => MapStore.eagleviewParcelsOn,
  newEagleviewParcelsOn => {
    if (map) {
      map.updateLayers(
        {
          filter: (layer) => {
            if (layer.name == 'US Parcels') {
              layer.visible = newEagleviewParcelsOn;
            }
          }
        }
      );
    }
  }
)

watch(
  () => MapStore.eagleviewLabelsOn,
  newEagleviewLabelsOn => {
    if (map) {
      map.updateLayers(
        {
          filter: (layer) => {
            if (layer.name == 'Streets') {
              layer.visible = newEagleviewLabelsOn;
            }
          }
        }
      );
    }
  }
)

onMounted( async() => {
  // localStorage.clear();
  const response = await axios(options);
  if (import.meta.env.VITE_DEBUG == 'true') console.log('EagleviewPanel onMounted response:', response, 'currentAddressCoords.value.lat:', currentAddressCoords.value.lat);
  map = new window.ev.EmbeddedExplorer().mount('eagleview', { authToken: response.data.access_token });
  map.enableMeasurementPanel(false);
  map.enableSearchBar(false);
  // map.setView({ lonLat: {lon: -75.163471, lat: 39.953338}, zoom: 17, pitch: 0, rotation: 0 });
  // map.setView({ lonLat: {lon: -75.163471, lat: 39.953338}, zoom: 17, pitch: 0, rotation: 0 }, (value) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('eagleview view has been set, currentAddressCoords.value:', currentAddressCoords.value);
  map.setView({ lonLat: currentAddressCoords.value, zoom: 18, pitch: 0, rotation: 180 }, (value) => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('eagleview view has been set, value:', value)
  });
  if (MapStore.currentAddressCoords.length) {
    map.addFeatures({
      geoJson: [
        point(
          [currentAddressCoords.value.lon, currentAddressCoords.value.lat],
          // [-75.163471, 39.953338],
          eagleviewProperties
        )
      ]
    });
  }

  map.getLayers();
  map.on('onLayersDataLoad', (layerData) => {
    map.updateLayers(
      {
        filter: (layer) => {
          console.log('layer:', layer);
          layer.visible = false;
          console.log('layer', layer);
        }
      }
    );
  });

});

</script>

<template>
  <div class="eagleview-panel">
    <FullScreenEagleviewToggleTab />

    <ParcelsControl />
    <LabelsControl />

    <div
      id="eagleview"
      class="eagleview-div"
    />

  </div>
</template>

<style>

.eagleview-panel {
  position: relative;
  height: 100%;
  width: 100%;
}

.eagleview-div {
  position: relative;
  height: 100%;
  width: 100%;
}

.eagleview-pop-out {
  position: absolute;
  right: 0;
  z-index: 2;
  background-color: white;
  padding-left: 6px;
  padding-right: 6px;
  padding-top: 1px;
  padding-bottom: 1px;
  cursor: pointer;
  border-radius: 2px;
}

@media 
only screen and (max-width: 768px),
(min-device-width: 768px) and (max-device-width: 1024px)  {
  .eagleview-div {
    height: 250px;
  }
}


.ev-embedded-explorer_container {
  height: 100%;
  width: 100%;
}

</style>