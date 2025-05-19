import { App } from "./system/App";
import { Config } from "./game/Config";
document.addEventListener('DOMContentLoaded', () => {
    App.run(Config);
});