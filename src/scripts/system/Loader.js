import * as PIXI from 'pixi.js';
export class Loader{
    constructor(config) {
        this.config = config;
        this.resources = {};
    }

    preload() {
        return new Promise((resolve, reject) => {
            for (const asset of this.config.loader) {
                let key = asset.key.substr(asset.key.lastIndexOf('/') + 1);
                key = key.substr(0, key.lastIndexOf('.'));
                if(asset.key.indexOf(".png") !== 1 || asset.key.indexOf(".jpg") !== 1) {
                    PIXI.Assets.load(asset.data.default).then(res => {
                        this.resources[key] = res;
                        if(Object.keys(this.resources).length >= this.config.loader.length) {
                            resolve();
                        }
                    });
                }
            }
        });
    }
}