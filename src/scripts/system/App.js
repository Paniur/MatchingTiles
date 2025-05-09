import * as PIXI from "pixi.js";
import { Loader } from "./Loader";
import { SceneManager } from "./SceneManager";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";

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
            
            // Initial resize
            this.resize();
        })()
    }

    // Check if running in an iframe
    inIframe() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
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
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // Toggle fullscreen
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    resize() {
        // Get current window dimensions
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Determine orientation
        const isLandscape = windowWidth > windowHeight;
        
        // Set game dimensions based on orientation
        if (isLandscape) {
            this.width = this.defaultWidth;
            this.height = this.defaultHeight;
        } else {
            this.width = this.defaultHeight;
            this.height = this.defaultWidth;
        }
        
        // Apply scaling strategy (keep aspect ratio)
        const scaleX = windowWidth / this.width;
        const scaleY = windowHeight / this.height;
        const scale = Math.min(scaleX, scaleY);
        
        // For iframe environments, ensure we don't scale too small
        if (this.inIframe()) {
            // Ensure minimum scale for visibility in iframes
            const minScale = 0.5;
            this.scale = Math.max(scale, minScale);
        } else {
            this.scale = scale;
        }
        
        // Apply the scale to the stage
        this.app.stage.scale.set(this.scale);
        
        // Center the stage (alignment strategy)
        this.app.stage.x = (windowWidth - (this.width * this.scale)) / 2;
        this.app.stage.y = (windowHeight - (this.height * this.scale)) / 2;
        
        // Special handling for iOS devices
        if (this.isIOS() && this.app.stage.y > 2) {
            this.app.stage.y = Math.round(this.app.stage.y - 0.3 * this.app.stage.y);
        }
        
        // Ensure stage is always centered in iframe
        if (this.inIframe()) {
            // Force center alignment in iframe
            this.app.stage.x = Math.max(0, (windowWidth - (this.width * this.scale)) / 2);
            this.app.stage.y = Math.max(0, (windowHeight - (this.height * this.scale)) / 2);
        }
        
        // Dispatch resize event for other components
        this.dispatchResizeEvent({
            scale: this.scale,
            width: this.width,
            height: this.height,
            isLandscape: isLandscape,
            inIframe: this.inIframe()
        });
    }
    
    // Check if device is iOS
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
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
