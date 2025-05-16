import Screenfull from 'screenfull';
import { UAParser } from 'ua-parser-js';

class Environment {
    constructor() {
        // Initialize properties
        this.fullScreenController = null;
        this.isIosBrowser = false;
        this.touchDown = false;
        this.isFullscreen = false;
        this.intervalTimeOut = null;
        this.preventDefaultHandler = null;
        this.onResizetHandler = null;
        this.onTouchStartHandler = null;
        this.onScrollHandler = null;
        this.touchendHandler = null;
        this.visibilityChangeHandler = null;
        this.env = null;
        this.isiOSChrome = false;
        this.isiOSSafari = false;
        this.iosVersion = 0;
        
        // Initialize environment
        this.env = new UAParser();
        this.fullScreenController = Screenfull;
        const browser = this.getBrowser();
        this.isiOSChrome = this.getOS().name === 'iOS' && browser.name === 'Chrome';
        this.isiOSSafari = browser.name === 'Mobile Safari' || browser.name === 'Safari';
        this.isIosBrowser = this.isiOSSafari || this.isiOSChrome;
        this.preventDefaultHandler = this.preventDefault.bind(this);
        this.onResizetHandler = this.onResize.bind(this);
        this.onTouchStartHandler = this.onTouchStart.bind(this);
        this.onScrollHandler = this.onScroll.bind(this);
        this.touchendHandler = this.requestFullscreen.bind(this);
        this.visibilityChangeHandler = this.visibilityChange.bind(this);
        document.addEventListener('contextmenu', (event) => event.preventDefault());
        
        // Add debug event listeners
        window.addEventListener('touchstart', () => {
            console.log('Touchstart detected');
        }, { passive: false });
          
        window.addEventListener('click', () => {
            console.log('Click detected');
        });
    }

    isMobileIos() {
        return /(iPhone|iPod|iPad)/i.test(navigator.userAgent) || this.isIpad();
    }

    isIpad() {
        if ((/Mac/i.test(navigator.userAgent)) && navigator.maxTouchPoints > 0) {
            return true;
        }
        return false;
    }

    inIframe() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    }

    isMobile() {
        return /Mobi|Android|iPhone|iPod|iPad|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ((/Mac/i.test(navigator.userAgent)) && navigator.maxTouchPoints > 0);
    }

    getBrowser() {
        return this.env.getBrowser();
    }

    getOS() {
        return this.env.getOS();
    }

    getDeviceType() {
        if (
            /Mobi/i.test(navigator.userAgent) ||
            /Android/i.test(navigator.userAgent) ||
            /(iPhone|iPod|iPad)/i.test(navigator.userAgent) ||
            /BlackBerry/i.test(navigator.userAgent) ||
            /Opera Mini/i.test(navigator.userAgent) ||
            /IEMobile/i.test(navigator.userAgent) ||
            (this.getOS().name === 'Mac OS' && navigator.maxTouchPoints)
        ) {
            return 'mobile';
        }
        return 'desktop';
    }

    isFullScreenSupported() {
        return Screenfull.isEnabled;
    }

    isFullScreen() {
        return window.innerHeight === window.screen.height;
    }

    requestFullscreen(e) {
        // Hide the fullscreen gesture overlay if it exists
        if (this.fullscreenGesture) {
            this.fullscreenGesture.classList.add('hidden');
        }
        
        // Set a meta viewport tag to prevent zooming issues
        this.updateViewportMeta();
        
        if (!this.isFullScreen() && this.isFullScreenSupported()) {
            const elem = document.documentElement;
            
            // For iOS Safari, we need special handling
            if (this.isMobileIos()) {
                // Ensure the canvas is properly sized before entering fullscreen
                const canvas = document.getElementById('game-canvas');
                if (canvas) {
                    canvas.style.width = '100%';
                    canvas.style.height = '100%';
                }
                
                // Special handling for iOS fullscreen
                this.setIOSFullscreen();
                this.checkFullscreenIOS();
            }
            
            // Request fullscreen using the appropriate method
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                /* Firefox */
                elem.mozRequestFullScreen();
            } else if (elem.webkitRequestFullscreen) {
                /* Chrome, Safari & Opera */
                this.touchDown = false;
                if (e) this.onScroll(e);
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
                /* IE/Edge */
                elem.msRequestFullscreen();
            }
            
            // Add a listener to check if fullscreen was successful
            document.addEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
            
            // Force a resize event to ensure proper scaling
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 300);
        } else {
            this.touchDown = false;
            if (e) this.onScroll(e);
        }
    }
    
    updateViewportMeta() {
        // Find the viewport meta tag
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        
        // If it doesn't exist, create it
        if (!viewportMeta) {
            viewportMeta = document.createElement('meta');
            viewportMeta.name = 'viewport';
            document.head.appendChild(viewportMeta);
        }
        
        // Set the content to prevent zooming issues
        viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }

    setupFullscreenHandlers() {
        // Initialize gesture overlay elements
        this.fullscreenGesture = document.getElementById('fullscreen-gesture');
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 50; // Minimum distance for a swipe to be detected
        
        if (this.isMobileIos() && !this.inIframe()) {
            this.setIOSFullscreen();
            
            window.addEventListener('resize', this.onResizetHandler);
            document.addEventListener('touchstart', this.onTouchStartHandler);
            document.addEventListener('scroll', this.onScrollHandler);
            document.addEventListener('gesturestart', this.preventDefaultHandler);
            document.addEventListener('gesturechange', this.preventDefaultHandler);
            document.addEventListener('gestureend', this.preventDefaultHandler);
            document.addEventListener('touchend', this.touchendHandler);
            document.addEventListener('visibilitychange', this.visibilityChangeHandler);
            this.onResize({});
        } else {
            if (this.getDeviceType() === 'mobile') {
                // Show fullscreen gesture overlay for mobile devices
                this.setupFullscreenGesture();
                document.addEventListener('touchend', this.touchendHandler);
            }
        }
    }
    
    setupFullscreenGesture() {
        if (!this.fullscreenGesture) return;
        
        // Only show the gesture if we're not already in fullscreen and on mobile
        if (!this.isFullScreen() && this.isMobile()) {
            this.fullscreenGesture.classList.remove('hidden');
            
            // Add swipe detection
            this.fullscreenGesture.addEventListener('touchstart', (e) => {
                this.touchStartY = e.touches[0].clientY;
            }, { passive: true });
            
            this.fullscreenGesture.addEventListener('touchmove', (e) => {
                this.touchEndY = e.touches[0].clientY;
            }, { passive: true });
            
            this.fullscreenGesture.addEventListener('touchend', () => {
                // Check if it was a swipe up
                if (this.touchStartY - this.touchEndY > this.minSwipeDistance) {
                    // Hide the gesture overlay
                    this.fullscreenGesture.classList.add('hidden');
                    // Request fullscreen
                    this.requestFullscreen();
                }
            });
            
            // Also allow tapping the overlay to enter fullscreen
            this.fullscreenGesture.addEventListener('click', () => {
                this.fullscreenGesture.classList.add('hidden');
                this.requestFullscreen();
            });
        } else {
            // Already in fullscreen, hide the gesture
            this.fullscreenGesture.classList.add('hidden');
        }
    }

    removeFullscreenHandlers() {
        if (this.isMobileIos() && !this.inIframe()) {
            this.removeIOSFullscreen();
        }
        
        window.removeEventListener('resize', this.onResizetHandler);
        document.removeEventListener('touchstart', this.onTouchStartHandler);
        document.removeEventListener('scroll', this.onScrollHandler);
        document.removeEventListener('gesturestart', this.preventDefaultHandler);
        document.removeEventListener('gesturechange', this.preventDefaultHandler);
        document.removeEventListener('gestureend', this.preventDefaultHandler);
        document.removeEventListener('touchend', this.touchendHandler);
        document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }

    setIOSFullscreen() {
        // For iOS devices, we need to set up special handling for fullscreen
        // This is because iOS doesn't support true fullscreen API
        const app = document.body;
        if (app) {
            // Use specific height values based on device
            if (this.isiOSSafari) {
                app.style.height = '150vh';
            } else {
                // For Chrome and other browsers
                app.style.height = '135vh';
            }
            
            app.style.position = 'absolute';
            app.style.top = '25vh';
            
            // Set the canvas position
            const canvas = document.getElementById('game-canvas');
            if (canvas) {
                canvas.style.position = 'absolute';
                canvas.style.top = '0';
            }
            
            // Set the fullscreen gesture overlay if it exists
            const fullscreenGesture = document.getElementById('fullscreen-gesture');
            if (fullscreenGesture) {
                if (this.isiOSSafari) {
                    fullscreenGesture.style.height = '104vh';
                } else {
                    fullscreenGesture.style.height = '102vh';
                }
                fullscreenGesture.style.zIndex = '1000';
            }
            
            // Scroll to the right position
            const top = window.innerHeight * 0.25;
            window.scrollTo(0, top);
        }
    }
    
    removeIOSFullscreen() {
        document.body.style.height = '100vh';
        document.body.style.position = 'fixed';
        
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.style.top = '0';
        }
        
        window.scrollTo(0, 0);
    }
    

    preventDefault(a) {
        a.preventDefault();
        a.stopPropagation();
    }

    checkFullscreenIOS() {
        if (this.isMobileIos() && !this.inIframe()) {
            let verticalOffset = 0.9;
            let a, d;

            if (window.innerHeight > window.innerWidth) {
                // Portrait mode
                a = Math.min(window.screen.width, window.screen.height);
                d = Math.max(window.screen.width, window.screen.height);
                verticalOffset = 0.87;

                if (this.isIpad() || /(iPad)/i.test(navigator.userAgent)) {
                    // iPad Safari/Chrome
                    verticalOffset = 0.95;
                } else if (/(iPhone)/i.test(navigator.userAgent) && this.isiOSChrome) {
                    // iPhone Chrome
                    verticalOffset = 0.91;
                }
            } else {
                // Landscape mode
                a = Math.max(window.screen.width, window.screen.height);
                d = Math.min(window.screen.width, window.screen.height);
            }

            // Calculate if we're in fullscreen - rounds to 2 decimal places
            const val = Math.round((window.innerHeight / d) * 100) / 100;
            
            if (d === window.innerHeight || val >= verticalOffset) {
                // We're in fullscreen
                if (!this.isFullscreen) {
                    this.isFullscreen = true;
                    this.hideElement('fullscreen-gesture');
                    
                    // Adjust the fullscreen gesture overlay if it exists
                    const el = document.getElementById('fullscreen-gesture');
                    if (el && this.isiOSSafari) {
                        el.style.height = '104vh';
                    }
                }
            } else {
                // Not in fullscreen
                if (this.isFullscreen) {
                    this.isFullscreen = false;
                    this.showElement('fullscreen-gesture');
                    
                    // Adjust the fullscreen gesture overlay if it exists
                    const el = document.getElementById('fullscreen-gesture');
                    if (el && this.isiOSSafari) {
                        el.style.height = '102vh';
                        el.style.zIndex = '1000';
                    }
                }
            }
        }
    }

    onResize(_e) {
        if (this.touchDown) {
            return;
        }
        let f;
        let g = 5;
        clearInterval(f);
        f = setInterval(() => {
            this.checkFullscreenIOS();
            if (0 === --g) {
                clearInterval(f);
            }
        }, 100);
    }

    onScroll(_e) {
        if (this.touchDown) {
            return;
        }
        clearTimeout(this.intervalTimeOut);
        this.checkFullscreenIOS();
        this.intervalTimeOut = setTimeout(() => {
            const top = window.innerHeight * 0.25;
            window.scrollTo(0, top);
        }, 0);
    }

    visibilityChange() {
        if (document.hidden) {
            this.touchDown = false;
        }
    }
    
    // Helper method to hide an element by ID
    hideElement(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden');
        }
        return el;
    }
    
    // Helper method to show an element by ID
    showElement(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('hidden');
        }
        return el;
    }
    
    onFullscreenChange() {
        // Check if fullscreen was successful
        if (!document.fullscreenElement && this.isMobile()) {
            // If fullscreen failed or was exited, show the gesture overlay again
            if (this.fullscreenGesture) {
                this.fullscreenGesture.classList.remove('hidden');
            }
        } else {
            // Fullscreen successful, hide the gesture
            if (this.fullscreenGesture) {
                this.fullscreenGesture.classList.add('hidden');
            }
        }
    }

    onTouchStart(a) {
        this.touchDown = true;
        if (!this.isFullscreen) {
            this.preventDefault(a);
        }
    }
}

// Create a singleton instance
const environment = new Environment();
export default environment;
