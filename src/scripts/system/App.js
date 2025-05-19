import * as PIXI from "pixi.js";
import { Loader } from "./Loader";
import { SceneManager } from "./SceneManager";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";

// Expose PIXI to the global window for the browser extension
window.__PIXI_INSPECTOR_GLOBAL_HOOK__ = { PIXI };

class Application {
    app = new PIXI.Application();
    
    // Default dimensions
    defaultWidth = 1360;
    defaultHeight = 765;
    
    run(config) {
        this.config = config;

        (async () => {
            await this.app.init({
                resizeTo: window,
                backgroundColor: 0x000000,
            });
            
            // Make the app available to the browser extension
            window.__PIXI_APP__ = this.app;
            gsap.registerPlugin(PixiPlugin);
            PixiPlugin.registerPIXI(PIXI);
            document.body.appendChild(this.app.canvas)
            this.loader = new Loader(this.config);
            this.loader.preload().then(() => this.start());
            console.log(this.loader.resources);
            this.scenes = new SceneManager();
            this.app.stage.addChild(this.scenes.container);
            
            // Set up event listeners
            window.addEventListener('resize', this.resize.bind(this));
            // Initial resize
            this.resize();
        })()
    }

    resize() {
        const canvas = document.querySelector('canvas');
        const ration = Math.min(window.innerWidth / canvas.width, window.innerHeight / canvas.height);
        canvas.style.width = canvas.width * ration + 'px';
        canvas.style.height = canvas.height * ration + 'px';
    }

    dispatchResizeEvent(data) {
        const event = new CustomEvent('game-resize', { detail: data });
        window.dispatchEvent(event);
    }

    res(key) {
        return this.loader.resources[key];
    }

    sprite(key) {
        return new PIXI.Sprite(this.res(key));
    }

    start() {
        this.scenes.start("Game");
    }
}

export const App = new Application();
