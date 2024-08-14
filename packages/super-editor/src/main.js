import './dev/style.css';
import { createApp } from 'vue';
import clickOutside from '@common/helpers/v-click-outside';
import DeveloperPlayground from './dev/components/DeveloperPlayground.vue';

const app = createApp(DeveloperPlayground)
app.directive('click-outside', clickOutside);
app.mount('#app');
