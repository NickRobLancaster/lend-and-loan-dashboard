// src/router.js
import { createRouter, createWebHistory } from "vue-router";

// Define your routes
const routes = [
  {
    path: "/",
    name: "Dash",
    component: () => import("./components/Dash.vue"), // Lazy-loaded
  },
  {
    path: "/layout",
    name: "Dashboard Layout",
    component: () => import("./components/DashboardLayout.vue"), // Lazy-loaded
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: () => import("./components/Dashboard.vue"), // Lazy-loaded
  },

  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("./components/NotFound.vue"),
  },
];

// Create the router instance
const router = createRouter({
  history: createWebHistory(), // Use HTML5 history mode
  routes,
});

export default router;
