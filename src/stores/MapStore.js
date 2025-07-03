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
      eagleviewOn: false,
      eagleviewInitialized: false,
      eagleviewRecordingsOn: false,
      eagleviewCameraYaw: null,
      eagleviewCameraHFov: null,
      eagleviewCameraXyz: null,
      eagleviewCameraLngLat: null,
      eagleviewYear: null,
      clickedEagleviewRecordingCoords: null,
    };
  },
  actions: {
    setMap(map) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('MapStore.setMap is running, map:', map);
      this.map = map;
    },
    setMapStyle(style) {
      this.currentMapStyle = style;
    },
  },
});