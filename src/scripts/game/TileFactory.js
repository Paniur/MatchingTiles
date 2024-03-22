import { App } from "../system/App";
import { Tools } from "../system/Tools";
import { Tile } from "./Tile";

export class TileFactory {
    static generate() {
        const randomIndex = Tools.randomNumber(0, App.config.tilesColors.length - 1);
        const color = App.config.tilesColors[randomIndex];
        return new Tile(color);
    }
}