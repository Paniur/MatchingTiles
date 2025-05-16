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
        if (!this.isFullScreen() && this.isFullScreenSupported()) {
            const elem = document.documentElement;
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
        } else {
            this.touchDown = false;
            this.onScroll(null);
        }
    }

    setupFullscreenHandlers() {
        debugger;
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
                document.addEventListener('touchend', this.touchendHandler);
            }
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
        const app = document.getElementById('app-root') || document.getElementById('root');
        if (app) {
            app.style.height = '150vh';
            app.style.position = 'absolute';
            app.style.top = '25vh';
        }
        
        const top = window.innerHeight * 0.25;
        window.scrollTo(0, top);
    }

    removeIOSFullscreen() {
        document.body.style.height = '100vh';
        const app = document.getElementById('app-root') || document.getElementById('root');
        if (app) {
            app.style.top = '0';
        }
        window.scrollTo(0, 0);
    }

    preventDefault(a) {
        a.preventDefault();
        a.stopPropagation();
    }

    checkFullscreenIOS() {
        if (this.isMobileIos() && !this.inIframe()) {
            let verticalOfset = 0.9;

            if (window.innerHeight > window.innerWidth) {
                // portrait
                verticalOfset = 0.87;

                if (this.isIpad() || /(iPad)/i.test(navigator.userAgent)) {
                    // IPAD SAFARI // IPAD CHROME
                    verticalOfset = 0.95;
                } else if (/(iPhone)/i.test(navigator.userAgent) && this.isiOSChrome) {
                    // IPHONE CHROME
                    verticalOfset = 0.91;
                }
            }

            const d = Math.max(window.screen.width, window.screen.height);
            // This rounds calculate value to 2-nd decimal
            const val = Math.round((window.innerHeight / d) * 100) / 100;
            if (d === window.innerHeight || val >= verticalOfset) {
                if (!this.isFullscreen) {
                    this.isFullscreen = true;
                }
            } else {
                if (this.isFullscreen) {
                    this.isFullscreen = false;
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
