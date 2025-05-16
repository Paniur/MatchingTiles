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
            
            // Check if we're in an iframe
            if (this.inIframe()) {
                this.setupIframeHandling();
            } else {
                // Add fullscreen button for mobile devices
                this.setupFullscreenHandling();
            }
            
            // Set up environment handlers for fullscreen and touch
            environment.setupFullscreenHandlers();
            
            // Initial resize
            this.resize();
            
            // Add event listener for cleanup when component unmounts
            window.addEventListener('beforeunload', () => {
                environment.removeFullscreenHandlers();
            });
        })()
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
                        // Implement pause functionality
                        break;
                    case 'resumeGame':
                        // Implement resume functionality
                        break;
                }
            }
        });
    }
    
    // Setup fullscreen handling for mobile
    setupFullscreenHandling() {
        // Only add fullscreen handling on mobile devices
        if (this.isMobile()) {
            const fullscreenButton = document.createElement('div');
            fullscreenButton.style.position = 'absolute';
            fullscreenButton.style.width = '60px';
            fullscreenButton.style.height = '60px';
            fullscreenButton.style.top = '10px';
            fullscreenButton.style.right = '10px';
            fullscreenButton.style.background = 'rgba(0,0,0,0.5)';
            fullscreenButton.style.borderRadius = '50%';
            fullscreenButton.style.zIndex = '1000';
            fullscreenButton.style.cursor = 'pointer';
            fullscreenButton.innerHTML = '⛶'; // Fullscreen icon
            fullscreenButton.style.color = 'white';
            fullscreenButton.style.fontSize = '30px';
            fullscreenButton.style.textAlign = 'center';
            fullscreenButton.style.lineHeight = '60px';
            
            fullscreenButton.addEventListener('click', this.toggleFullscreen.bind(this));
            document.body.appendChild(fullscreenButton);
        }
    }
    
    // Check if device is mobile
    isMobile() {
        return environment.isMobile();
    }
    
    // Toggle fullscreen
    toggleFullscreen() {
        environment.requestFullscreen();
    }

    resize() {
        // Get current dimensions - use clientWidth/Height for iframe compatibility
        const containerWidth = document.documentElement.clientWidth || window.innerWidth;
        const containerHeight = document.documentElement.clientHeight || window.innerHeight;
        
        // Store dimensions for reference
        this.width = containerWidth;
        this.height = containerHeight;
        
        // Determine orientation
        const isLandscape = containerWidth > containerHeight;
        
        if (this.inIframe()) {
            // In iframe: no scaling, just fit exactly to the iframe dimensions
            // This ensures touch coordinates are correctly mapped
            this.scale = 1;
            this.app.stage.scale.set(1);
            this.app.stage.x = 0;
            this.app.stage.y = 0;
            
            // Resize the renderer to match the iframe exactly
            this.app.renderer.resize(containerWidth, containerHeight);
        } else {
            // Not in iframe: use responsive scaling approach
            // Calculate scale based on default dimensions
            const targetWidth = isLandscape ? this.defaultWidth : this.defaultHeight;
            const targetHeight = isLandscape ? this.defaultHeight : this.defaultWidth;
            
            const scaleX = containerWidth / targetWidth;
            const scaleY = containerHeight / targetHeight;
            this.scale = Math.min(scaleX, scaleY);
            
            // Apply the scale to the stage
            this.app.stage.scale.set(this.scale);
            
            // Center the stage
            this.app.stage.x = Math.round((containerWidth - (targetWidth * this.scale)) / 2);
            this.app.stage.y = Math.round((containerHeight - (targetHeight * this.scale)) / 2);
            
            // Special handling for iOS devices when not in iframe
            if (this.isIOS() && this.app.stage.y > 2) {
                this.app.stage.y = Math.round(this.app.stage.y - 0.3 * this.app.stage.y);
            }
        }
        
        // Dispatch resize event for other components
        this.dispatchResizeEvent({
            scale: this.scale,
            width: containerWidth,
            height: containerHeight,
            isLandscape: isLandscape,
            inIframe: this.inIframe()
        });
    }
    
    // Check if device is iOS
    isIOS() {
        return environment.isMobileIos();
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
