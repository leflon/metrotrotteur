import HomeView from '@/views/HomeView.vue'
import MultiplayerHubView from '@/views/MultiplayerHubView.vue'
import MultiplayerRoomView from '@/views/MultiplayerRoomView.vue'
import SoloView from '@/views/SoloView.vue'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

const routes = [
  { path: '/solo', component: SoloView },
  { path: '/multi', component: MultiplayerHubView },
  { path: '/multi/:id', component: MultiplayerRoomView,  },
  { path: '/', component: HomeView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

createApp(App)
  .use(router)
  .mount('#app');
