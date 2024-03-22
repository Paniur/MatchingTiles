import * as PIXI from 'pixi.js';
import { App } from './App';
export class SceneManager{
    constructor() {
        this.container = new PIXI.Container();
        this.scenes = {};
        this.currentScene = null;
    }
    start(scene) {
        if (this.scene)
        {
            this.scene.remove();
        }
        this.scene = new App.config.scenes[scene]();
        this.container.addChild(this.scene.container);
    }

}