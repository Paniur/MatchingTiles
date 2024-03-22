import * as PIXI from 'pixi.js';
import { App } from './App';
export class Scene{
    constructor() {
        this.container = new PIXI.Container();
        this.container.interactive = true;
        this.create();
        App.app.ticker.add(dt => this.update(dt),this);
    }
    create() {
    }
    update(dt) {
    }
    destroy() {
    }

    remove() {
        App.app.ticker.remove(this.update.bind(this));
        this.destroy();
        this.container.destroy();
    }
}