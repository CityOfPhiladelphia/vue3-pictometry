import { set } from 'date-fns';
import { defineStore } from 'pinia';
import proj4 from 'proj4';

export const useMapStore = defineStore("MapStore", {
  state: () => {
    return {
      map: {},
      currentMapStyle: 'pwdDrawnMapStyle',
      currentAddressCoords: [],
      addressMarker: null,
      initialized: false,
      imageryOn: false,
      imagerySelected: '2024',
      cyclomediaOn: false,
      cyclomediaInitialized: false,
      cyclomediaRecordingsOn: false,
      cyclomediaCameraYaw: null,
      cyclomediaCameraHFov: null,
      cyclomediaCameraXyz: null,
      cyclomediaCameraLngLat: null,
      cyclomediaYear: null,
      clickedCyclomediaRecordingCoords: null,
    };
  },
  actions: {
    setCyclomediaCameraYaw(yaw) {
      this.cyclomediaCameraYaw = yaw;
    },
    setCyclomediaCameraLngLat(lngLat, xyz) {
      this.cyclomediaCameraXyz = xyz;
      this.cyclomediaCameraLngLat = lngLat;
    },
    setCyclomediaCameraHFov(hfov) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('MapStore.setCyclomediaCameraHFov is running, hfov:', hfov);
      this.cyclomediaCameraHFov = hfov;
    },
    setMap(map) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('MapStore.setMap is running, map:', map);
      this.map = map;
    },
    setMapStyle(style) {
      this.currentMapStyle = style;
    },
  },
});