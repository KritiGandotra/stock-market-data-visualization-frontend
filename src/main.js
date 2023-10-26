import Vue from "vue";
import App from "./App.vue";
import Axios from "axios";
import "bootstrap/dist/js/bootstrap.js";

Axios.defaults.baseURL = "http://localhost:3000";
Vue.prototype.$axios = Axios;

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount("#app");
