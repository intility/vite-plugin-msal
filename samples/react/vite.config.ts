import msal from "@intility/vite-plugin-msal";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), msal()],
	server: {
		port: 3000,
		open: true,
	},
	preview: {
		port: 3000,
	},
});
