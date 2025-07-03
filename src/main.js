import { createApp } from 'vue'
import { createPinia } from 'pinia'

import isMac from './util/is-mac';

import "bulma";
import "@fortawesome/fontawesome-pro/css/fontawesome.min.css";
import "@fortawesome/fontawesome-pro/css/solid.min.css";
import "@phila/phila-ui-core/dist/styles/scss/all.scss";
import './assets/style.scss'
if (isMac()) {
  import('./assets/mac-style.scss')
}

import PhilaUICore from "@phila/phila-ui-core";
import AppHeader from "@phila/phila-ui-app-header";
import AppFooter from "@phila/phila-ui-app-footer";
import MobileNav from "@phila/phila-ui-mobile-nav";
import NavLink from "@phila/phila-ui-nav-link";


import App from './App.vue'
import router from './router'

const app = createApp(App)

app.component("AppHeader", AppHeader);
app.component("AppFooter", AppFooter);
app.component("MobileNav", MobileNav);
app.component("NavLink", NavLink);
app.use(PhilaUICore);

import { library } from '@fortawesome/fontawesome-svg-core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faCaretLeft } from '@fortawesome/free-solid-svg-icons';
import { faCaretRight } from '@fortawesome/free-solid-svg-icons';

library.add(
  faTimes,
  faSearch,
  faCaretLeft,
  faCaretRight,
);

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
app.component('FontAwesomeIcon', FontAwesomeIcon)

app.use(createPinia())
app.use(router)

app.mount('#app')
