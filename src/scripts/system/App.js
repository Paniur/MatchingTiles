import * as PIXI from "pixi.js";
import { Loader } from "./Loader";
import { SceneManager } from "./SceneManager";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";
class Application {
    app = new PIXI.Application({resizeTo: window});
    run(config) {
        this.config = config;
        // this.app = new PIXI.Application({resizeTo: window});
        // ;
        //const app = new PIXI.Application();

        (async () => {
            await this.app.init({
                resizeTo: window,
            });
            gsap.registerPlugin(PixiPlugin);
            PixiPlugin.registerPIXI(PIXI);
            document.body.appendChild(this.app.canvas)
            this.loader = new Loader(this.config);
            this.loader.preload().then(() => this.start());
            console.log(this.loader.resources);
            this.scenes = new SceneManager();
            this.app.stage.addChild(this.scenes.container);
        })()

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
