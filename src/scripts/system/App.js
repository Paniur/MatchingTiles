import * as PIXI from "pixi.js";
import { Loader } from "./Loader";
import { SceneManager } from "./SceneManager";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";
import environment from "../../utils/Environment";    
// Expose PIXI to the global window for the browser extension
window.__PIXI_INSPECTOR_GLOBAL_HOOK__ = { PIXI };

class Application {
    app = new PIXI.Application({width: 1360, height: 765});
    
    // Default dimensions
    width = 1360;
    height = 765;
    
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
            document.body.appendChild(this.app.canvas);
            this.loader = new Loader(this.config);
            this.loader.preload().then(() => this.start());
            this.scenes = new SceneManager();
            this.app.stage.addChild(this.scenes.container);
            
            // Set up event listeners
            window.addEventListener('resize', this.resize.bind(this));
            
            // Check if we're in an iframe
            if (this.inIframe()) {
                this.setupIframeHandling();
            } else if (environment.isMobile()) {
                // Add fullscreen handling for mobile devices
                environment.addMobileFullscreen();
            }
            
            // Initial resize
            this.resize();
            
            // Add event listener for cleanup when component unmounts
            window.addEventListener('beforeunload', () => {
                if (!this.inIframe() && environment.isMobile()) {
                    environment.removeFullscreenHandlers();
                }
            });
        })();
    }

    // Check if running in an iframe
    inIframe() {
        return environment.inIframe();
    }
    
    // Set up iframe message handling
    setupIframeHandling() {
        window.addEventListener('message', (event) => {
            const message = event.data;
            
            // Handle messages from parent frame
            if (message && message.command) {
                switch(message.command) {
                    case 'pauseGame':
                        this.onGamePause();
                        break;
                    case 'resumeGame':
                        this.onGameResume();
                        break;
                }
            }
        });
    }
    
    // Check if device is mobile
    isMobile() {
        return environment.isMobile();
    }
    
    // Check if device is iOS
    isIOS() {
        return environment.isMobileIos();
    }
    
    resize() {
        // Get current dimensions
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Set renderer size to match the window exactly
        this.app.renderer.resize(width, height);
        
        // No scaling, use 1:1 mapping
        this.scale = 1;
        
        // Center the stage
        this.app.stage.scale.set(this.scale);
        this.app.stage.x = Math.round((width - this.width) / 2);
        this.app.stage.y = Math.round((height - this.height) / 2);
        
        // Determine orientation
        const isLandscape = width > height;
        
        // Dispatch resize event for other components
        this.dispatchResizeEvent({
            scale: this.scale,
            width: width,
            height: height,
            isLandscape: isLandscape,
            inIframe: this.inIframe()
        });
        
        // Update game state if needed
        if (this.currentScene && typeof this.currentScene.onResize === 'function') {
            this.currentScene.onResize(width, height, this.scale);
        }
    }
    
    // Game pause handler
    onGamePause() {
        // Pause game logic, sounds, etc.
        if (this.currentScene && typeof this.currentScene.pause === 'function') {
            this.currentScene.pause();
        }
        
        // Dispatch pause event
        window.dispatchEvent(new Event('game-pause'));
    }
    
    // Game resume handler
    onGameResume() {
        // Resume game logic, sounds, etc.
        if (this.currentScene && typeof this.currentScene.resume === 'function') {
            this.currentScene.resume();
        }
        
        // Dispatch resume event
        window.dispatchEvent(new Event('game-resume'));
    }
    
    // Dispatch custom resize event
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
