import { gsap } from "gsap";
import { App } from "../system/App";

export class Tile {
    constructor(color) {
        this.field = null;
        
        this.color = color;
        this.sprite = App.sprite(this.color);
        this.sprite.anchor.set(0.5);
    }

    fallDownTo(position, delay) {
        return this.moveTo(position, 0.5, delay, "bounce.out")
    }

    isNeighbour(tile) {
        return Math.abs(this.field.row - tile.field.row) + Math.abs(this.field.col - tile.field.col) === 1;
    }

    moveTo(position, duration, delay, ease) {
        return new Promise(resolve => {
            gsap.to(this.sprite, {
                duration,
                delay,
                pixi: {
                    x: position.x,
                    y: position.y
                },
                ease,
                onComplete: () => {
                    resolve();
                }
            });
        });
    }

    setPosition(position) {
        this.sprite.x = position.x;
        this.sprite.y = position.y;
    }

    remove() {
        if (!this.sprite) {
            return;
        }

        this.sprite.destroy();
        this.sprite = null;

        if (this.field) {
            this.field.tile = null;
            this.field = null;
        }
    }
}