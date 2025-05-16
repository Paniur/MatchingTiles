import { App } from "./system/App";
import { Config } from "./game/Config";
import environment from "../utils/Environment";
// Initialize environment handlers
document.addEventListener('DOMContentLoaded', () => {
    // Ensure environment is initialized before running the app
    console.log('Device type:', environment.getDeviceType());
    console.log('In iframe:', environment.inIframe());
    
    // Run the app
    App.run(Config);
});