import { createRouter, createWebHistory } from 'vue-router'
import App from '@/App.vue'

import { useMainStore } from '@/stores/MainStore';
import { useMapStore } from '@/stores/MapStore';
import { useGeocodeStore } from '@/stores/GeocodeStore';

import useRouting from '@/composables/useRouting';
// import Condos from '@/components/topics/Condos.vue';
const { routeApp } = useRouting();

const getGeocodeAndPutInStore = async(address) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('getGeocodeAndPutInStore is running, address:', address);
  const MainStore = useMainStore();

  const GeocodeStore = useGeocodeStore();
  await GeocodeStore.fillaisData(address);
  if (MainStore.lastSearchMethod == 'address' && !GeocodeStore.aisData.features) {
    MainStore.currentAddress = null;
    if (import.meta.env.VITE_DEBUG == 'true') console.log('getGeocodeAndPutInStore, calling not-found');
    router.push({ name: 'not-found' });
    return;
  } else if (!GeocodeStore.aisData.features) {
    return;
  }
  // if there is a value, add the value for the street_address in the MainStore
  const currentAddress = GeocodeStore.aisData.features[0].properties.street_address;
  MainStore.setCurrentAddress(currentAddress);
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: App,
      beforeEnter: async (to, from) => {
        const { lng, lat } = to.query;
        if (import.meta.env.VITE_DEBUG == 'true') console.log('home route beforeEnter, to.query:', to.query, 'lng:', lng, 'lat:', lat);
        const MapStore = useMapStore();
        if (lat && lng) {
          MapStore.currentAddressCoords = [lng, lat];
        }
        // if (import.meta.env.VITE_DEBUG == 'true') console.log('home route beforeEnter, to:', to, 'from:', from);
        // const MainStore = useMainStore();
        // MainStore.setCurrentAddress(null);
        // MainStore.initialDatafetchComplete = false;
        // routeApp(router);
      },
    },
    {
      path: '/search',
      name: 'search',
      component: App,
      beforeEnter: async (to, from) => {
        const { address } = to.query;
        if (import.meta.env.VITE_DEBUG == 'true') console.log('search route beforeEnter, to.query:', to.query, 'from:', from, 'address:', address);
        // const MainStore = useMainStore();
        if (address && address !== '') {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('search route beforeEnter, address:', address);
          // MainStore.setLastSearchMethod('address');
          await getGeocodeAndPutInStore(address);
          routeApp(router);
        } //else if (lat && lng) {
        //   MainStore.setLastSearchMethod('mapClick');
        //   await getParcelsAndPutInStore(lng, lat);
        //   routeApp(router);
        // } else {
        //   return false;
        // }
      },
    },
    {
      path: '/:address',
      name: 'address',
      component: App,
    },
  ]
})

// router.afterEach(async (to, from) => {
//   if (import.meta.env.VITE_DEBUG == 'true') console.log('router afterEach to:', to, 'from:', from);
//   const MainStore = useMainStore();
//   // if (to.query.lang !== from.query.lang) {
//   //   MainStore.currentLang = to.query.lang;
//   // }
//   if (to.name === 'address-or-topic') {
//     return;
//   } else if (to.name !== 'not-found' && to.name !== 'search') {
//     await getGeocodeAndPutInStore(to.params.address);
//     MainStore.addressSearchRunning = false;
//     // await dataFetch(to, from);
//     // let pageTitle = MainStore.appVersion + '.phila.gov';
//     // let pageTitle = MainStore.appVersion.charAt(0).toUpperCase() + MainStore.appVersion.slice(1);
//     // for (let param of Object.keys(to.params)) {
//     //   pageTitle += ' | ' + to.params[param];
//     // }
//     // MainStore.pageTitle = pageTitle;
//   } // else if (to.name == 'not-found') {
//   //   MainStore.currentTopic = "property"
//   //   MainStore.currentAddress = null;
//   //   MainStore.currentParcelGeocodeParameter = null;
//   //   MainStore.currentParcelAddress = null;
//   //   MainStore.otherParcelAddress = null;
//   //   MainStore.otherParcelGeocodeParameter = null;
//   // }
// });

export default router
