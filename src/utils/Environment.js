import Screenfull from 'screenfull';
import { UAParser } from 'ua-parser-js';

class Environment {
    constructor() {
        this.fullScreenController = null;
        this.isIosBrowser = false;
        this.showHelperWhenAsked = true;
        this.customReactisShown = false;
        this.touchDown = false;
        this.isFullscreen = false;
        this.isiOSChrome = false;
        this.isiOSSafari = false;
        this.intervalTimeOut = null;
        this.preventDefaultHandler = null;
        this.onResizetHandler = null;
        this.onTouchStartHandler = null;
        this.onScrollHandler = null;
        this.touchendHandler = null;
        this.visibilityChangeHandler = null;
        this.iosVersion = 0;
        this.browserCompatibilityErrorCode = 0;
        
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
    }

    isMobileIos() {
        if (/(iPhone|iPod|iPad)/i.test(navigator.userAgent) || this.isIpad()) {
            const v = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
            if (v) {
                this.iosVersion = [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3], 10)][0];
            }

            return !this.isFullScreenSupported();
        }
        return false;
    }

    isIpad() {
        if (this.getOS().name === 'Mac OS' && navigator.maxTouchPoints) {
            return true;
        }
        return false;
    }

    isFullScreen() {
        return window.innerHeight === screen.height;
    }

    inIframe() {
        try {
            return window.self !== window.top;
        } catch (_e) {
            return true;
        }
    }

    getBrowser() {
        return this.env.getBrowser();
    }

    getBrowserString() {
        return `${this.getBrowser().name} ${this.getBrowser().major} ${this.getOS().name}`;
    }

    getCPU() {
        return this.env.getCPU();
    }

    getDevice() {
        return this.env.getDevice();
    }

    getEngine() {
        return this.env.getEngine();
    }

    getOS() {
        return this.env.getOS();
    }

    getUA() {
        return this.env.getUA();
    }

    getEnvironment() {
        return this.env.getResult();
    }

    isFullScreenSupported() {
        return Screenfull.isEnabled;
    }

    getDeviceType() {
        if (
            /Mobi/i.test(navigator.userAgent) ||
            /Android/i.test(navigator.userAgent) ||
            /(iPhone|iPod)/i.test(navigator.userAgent)
        ) {
            return 'mobile';
        }
        if (/(iPad)/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
            return 'tablet';
        }
        return 'desktop';
    }
    
    isMobile() {
        return this.getDeviceType() === 'mobile';
    }
    
    isTablet() {
        return this.getDeviceType() === 'tablet';
    }
    
    isDesktop() {
        return this.getDeviceType() === 'desktop';
    }

    fullScreenControl() {
        return this.fullScreenController;
    }

    addMobileFullscreen() {
        if (document.getElementById('iOSFullscreenAnimation') || (window.Core && window.Core.configuration && window.Core.configuration.hideHandCursor)) {
            return;
        }
        this.isFullscreen = false;
        if (this.isMobileIos() && !this.inIframe()) {
            this.setIOSFullscreen();
        }
        this.addMobileFullscreenHelper();
    }

    setIOSFullscreen() {
        const app = document.getElementById('app-root') || document.getElementById('game-canvas');
        const erros = document.getElementById('errors');
        if (app) {
            app.style.height = '150vh';
            app.style.position = 'absolute';
            app.style.top = '25vh';
            if (erros) erros.classList.add('IOS');
        }
        const loading = document.getElementById('loading-overlay');
        if (loading) {
            loading.style.top = '25vh';
        }
        const top = window.innerHeight * 0.25;
        window.scrollTo(0, top);
    }

    isBrowserFeaturesCompatible() {
        this.browserCompatibilityErrorCode = 9000;
        const testPassed = this.isWebglSupported() && this.isFetchSupported() && this.isCssgridSupported();
        if (testPassed) {
            return true;
        } else {
            const code = this.browserCompatibilityErrorCode;
            if (window.Core && window.Core.AnalyticsDispatcher) {
                window.Core.AnalyticsDispatcher.sendErrorEvent(
                    'BROWSER_NOT_SUPPORTED_ERROR',
                    'browser is not supported',
                    `One of Webgl: ${this.isWebglSupported()} , Fetch: ${this.isFetchSupported()}, CSSGRID: ${this.isCssgridSupported()} `
                );
            }
            return code;
        }
    }

    removeIOSFullscreen() {
        document.body.style.height = '100vh';
        const canvas = document.getElementById('app-root') || document.getElementById('game-canvas');
        if (canvas) {
            canvas.style.top = '0';
        }
        const loading = document.getElementById('loading-overlay');
        if (loading) {
            loading.style.top = '0';
        }
        window.scrollTo(0, 0);
    }

    removeMobileFullscreen() {
        const el = document.getElementById('iOSFullscreenAnimation');
        if (el) {
            if (el.parentElement) el.parentElement.removeChild(el);
            const el2 = document.getElementById('iOSFullscreen');
            if (el2 && el2.parentElement) el2.parentElement.removeChild(el2);
        }
        this.removeIOSFullscreen();
        window.removeEventListener('resize', this.onResizetHandler);
        document.removeEventListener('touchstart', this.onTouchStartHandler);
        document.removeEventListener('scroll', this.onScrollHandler);
        document.removeEventListener('gesturestart', this.preventDefaultHandler);
        document.removeEventListener('gesturechange', this.preventDefaultHandler);
        document.removeEventListener('gestureend', this.preventDefaultHandler);
        document.removeEventListener('touchend', this.touchendHandler);
        document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }
    
    testBrowserCompatibility() {
        let testPassed = false;

        const brwoserSupport = {
            Windows: {
                Chrome: 57,
                Firefox: 16,
                Edge: 91,
                Opera: 44,
            },
            Android: {
                'Samsung Browser': 14,
                Chrome: 92,
                'MIUI Browser': 12,
                Firefox: 90,
            },
            iOS: {
                'Mobile Safari': 11,
                Chrome: 91,
            },
            'Mac OS': {
                Safari: 13,
                Chrome: 91,
            },
        };
        const osName = this.env.getOS().name;
        const browserName = this.env.getBrowser().name;
        const browserVer = Number(this.env.getBrowser().major || this.env.getBrowser().version);
        const os = brwoserSupport[osName];
        if (os !== undefined) {
            const minVersion = os[browserName];
            if (minVersion !== undefined) {
                testPassed = browserVer >= minVersion;
            }
        }
        return testPassed;
    }

    requestFullscreen(e) {
        if (window.Core && window.Core.noSleep && !window.Core.noSleep.isEnabled) {
            // Mute the video to prevent the Uncaught (in promise) DOMException: play() failed because the user didn't interact with the document first
            // This happens if the first interaction of the user is the mute icon
            if (window.Core.noSleep.noSleepVideo) {
                window.Core.noSleep.noSleepVideo.muted = true;
            }
            window.Core.noSleep.enable();
        }
        if (!this.isFullScreen() && this.isFullScreenSupported()) {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                /* Firefox */
                elem.mozRequestFullScreen();
            } else if (elem.webkitRequestFullscreen) {
                /* Chrome, Safari & Opera */
                // disable fullscreen for iPad becuase
                // iPad in desktop mode is recognized as Mac OS but has maxTouchPoints
                this.touchDown = false;
                this.onScroll(e);
            } else if (elem.msRequestFullscreen) {
                /* IE/Edge */
                elem.msRequestFullscreen();
            }
        } else {
            this.touchDown = false;
            this.onScroll(e);
        }
    }

    preventDefault(a) {
        if (window.Core && window.Core.noSleep && !window.Core.noSleep.isEnabled) {
            // Mute the video to prevent the Uncaught (in promise) DOMException: play() failed because the user didn't interact with the document first
            // This happens if the first interaction of the user is the mute icon
            if (window.Core.noSleep.noSleepVideo) {
                window.Core.noSleep.noSleepVideo.muted = true;
            }
            window.Core.noSleep.enable();
        }
        a.preventDefault();
        a.stopPropagation();
    }

    isWebglSupported() {
        this.browserCompatibilityErrorCode = 9001;
        if (window.PIXI && window.PIXI.utils) {
            return window.PIXI.utils.isWebGLSupported();
        }
        return true; // Assume supported if PIXI is not available
    }

    isFetchSupported() {
        this.browserCompatibilityErrorCode = 9003;
        const testPassed = 'fetch' in window;
        return testPassed;
    }

    isCssgridSupported() {
        this.browserCompatibilityErrorCode = 9002;
        let testPassed = false;
        try {
            const div = document.createElement('div');
            testPassed = typeof div.style.grid === 'string';
        } catch (_e) {
            testPassed = false;
        }
        return testPassed;
    }
    
    checkFullscreenIOS() {
        if (this.isMobileIos() && !this.inIframe()) {
            let a;
            let d;
            let verticalOfset = 0.9;

            if (window.innerHeight > window.innerWidth) {
                // portrait
                a = Math.min(window.screen.width, window.screen.height);
                d = Math.max(window.screen.width, window.screen.height);
                verticalOfset = 0.87;

                if (this.isIpad() || /(iPad)/i.test(navigator.userAgent)) {
                    // IPAD SAFARI // IPAD CHROME
                    verticalOfset = 0.95;
                } else if (/(iPhone)/i.test(navigator.userAgent) && this.isiOSChrome) {
                    // IPHONE CHROME
                    verticalOfset = 0.91;
                }
            }

            if (window.innerWidth > window.innerHeight) {
                a = Math.max(window.screen.width, window.screen.height);
                d = Math.min(window.screen.width, window.screen.height);
            }
            // This rounds calculate value to 2-nd decimal
            const val = Math.round((window.innerHeight / d) * 100) / 100;
            if (d === window.innerHeight || val >= verticalOfset) {
                if (!this.isFullscreen) {
                    this.isFullscreen = true;
                    this.hide('iOSFullscreenAnimation');

                    const el = this.hide('iOSFullscreen');
                    if (el && this.isiOSSafari) {
                        el.style.height = '104vh';
                    }
                }
            } else {
                if (this.isFullscreen && this.showHelper()) {
                    this.isFullscreen = false;
                    this.show('iOSFullscreenAnimation');
                    const el = this.show('iOSFullscreen');
                    if (el && this.isiOSSafari) {
                        el.style.height = '102vh';
                        el.style.zIndex = '1000';
                    }
                }
            }
        }
    }
    
    addMobileFullscreenHelper() {
        const _browser = this.getBrowser();
        if (window.Core && window.Core.configuration && window.Core.configuration.hideHandCursor) {
            // DO NOT PUT DOWN IN IF BECAUSE DON'T ADD NO IOS AND NO ANDROID EVENTS
            return;
        }
        if (this.isMobileIos() && !this.inIframe()) {
            const c = `<svg class="full-screen-hand" style="display: inherit">
                    <g id="Artboard" transform="translate(-43.000000, -44.000000)" fill="#E8E8E8" fill-rule="nonzero">
                        <path d="M54.0888672,44.2789912 C56.1064453,44.7343558 56.8219819,45.5691478 58.2626363,46.7136733 C60.3227722,48.3538407 61.3000161,50.7171184 62.5605887,52.8840548 C66.5968222,59.8278291 70.5826328,66.7907586 74.6020587,73.7393216 C74.7605307,74.0170726 74.8973929,74.5007424 75.3536001,74.3546837 C75.7425768,74.232569 75.5288797,73.8015761 75.5745004,73.5118532 C75.9346704,71.0048595 77.3955873,68.7879917 79.560311,67.4635863 C83.5965445,64.877629 90.2019451,66.2663839 92.8239362,71.3185782 C93.0376332,71.7328103 93.2057096,72.1877472 93.7699659,72.5157807 C94.4710844,68.0909204 96.6128573,64.8034025 101.282979,64.2071957 C106.930344,63.4888742 110.279866,66.728504 112.582512,71.5197083 C112.844231,69.7239046 113.26202,68.0669764 114.212852,66.6255446 C116.746003,62.7944968 121.437734,62.0043431 125.322699,63.6445105 C127.742999,64.664527 129.282098,66.5177964 130.561879,68.7517762 C136.999203,80.0054793 143.506159,91.2304495 149.984302,102.467392 C151.869158,105.73336 154.078162,108.836509 155.326729,112.432905 C158.304081,121.009663 157.353249,129.102752 152.111668,136.587662 C150.241219,139.257423 147.69126,141.189708 144.874781,142.813115 C138.631945,146.404722 132.389109,150.046612 126.146273,153.61667 C120.731814,156.703058 115.053234,156.461223 109.300221,154.761195 C104.349172,153.298214 99.8615331,150.769722 95.2034171,148.631519 C83.5341162,143.275235 71.6415138,138.440931 59.7993344,133.489302 C53.6429378,130.915317 51.2010285,123.523789 54.8218733,118.356663 C57.2373706,114.911114 61.960316,113.74025 65.8020612,115.483377 C70.8323463,117.767639 75.9178564,119.929787 80.9793556,122.147006 C81.1234211,122.20926 81.2578822,122.31222 81.4595738,122.147006 C77.5457959,115.385206 73.6304173,108.618618 69.713438,101.847241 C61.4568874,87.6021279 53.198736,73.3594094 44.9389839,59.1190852 C44.305096,58.0248422 43.9521356,56.8180621 43.3758739,55.7046638 C42.8747087,53.8242578 42.8747087,51.9551878 43.3758739,50.0974538 C44.1276216,47.3108529 45.7793094,46.1130144 47.180102,45.060318 C49.3335802,43.8236266 52.0712891,43.8236266 54.0888672,44.2789912 Z"
                            id="hand">
                        </path>
                    </g>
                </svg>`;
            if (this.showHelper()) {
                this.addElementFromHTML('iOSFullscreen', '');
                this.addElementFromHTML('iOSFullscreenAnimation', c);
                const hand = document.getElementById('iOSFullscreenAnimation');
                if (hand) {
                    hand.style.zIndex = '1000';
                    this.setIOSFullscreen();
                }
            }

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

    showHelper() {
        return this.showHelperWhenAsked || (window.Core && window.Core.ORIENTATION && window.Core.ORIENTATION.value && window.Core.ORIENTATION.value.isLandscape) || this.iosVersion < 15;
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
        if (window.Core && window.Core.noSleep && !window.Core.noSleep.isEnabled) {
            if (window.Core.noSleep.noSleepVideo) {
                window.Core.noSleep.noSleepVideo.muted = true;
            }
            window.Core.noSleep.enable();
        }
        if (!this.isFullscreen) {
            this.preventDefault(a);
        }
    }

    addElementFromHTML(id, html) {
        const div = document.createElement('div');
        div.id = id;
        div.innerHTML = html.trim();
        div.classList.add('noselect');
        document.body.insertAdjacentElement('afterbegin', div);
        return div;
    }

    hide(id) {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'none';
        }
        return el;
    }

    show(id) {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'unset';
        }
        return el;
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
