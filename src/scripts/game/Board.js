import { App } from "../system/App";
import * as PIXI from "pixi.js";
import { Field } from "./Field";
import { Tile } from "./Tile";
import { TileFactory } from "./TileFactory";

export class Board {
    constructor() {
        this.container = new PIXI.Container();
        this.fields = [];
        this.rows = App.config.board.rows;
        this.cols = App.config.board.cols;
        this.create();
        this.ajustPosition();
    }

    getField(row, col) {
        return this.fields.find(field => field.row === row && field.col === col);
    }

    swap(tile1, tile2) {
        const tile1Field = tile1.field;
        const tile2Field = tile2.field;

        tile1Field.tile = tile2;
        tile2.field = tile1Field;

        tile2Field.tile = tile1;
        tile1.field = tile2Field;
    }

    ajustPosition() {
        this.fieldSize = this.fields[0].sprite.width;
        this.width = this.cols * this.fieldSize;
        this.height = this.rows * this.fieldSize;
        
        // Listen for the game-resize event to properly position the board
        window.addEventListener('game-resize', (e) => this.onResize(e.detail));
        
        // Initial positioning
        this.onResize({
            width: App.width,
            height: App.height
        });
    }
    
    onResize(data) {
        // Center the board using the App's scaled dimensions
        // Apply special positioning for iframe environments
        if (data.inIframe) {
            // Ensure proper centering in iframe
            this.container.x = Math.max(0, (data.width - this.width) / 2);
            this.container.y = Math.max(0, (data.height - this.height) / 2);
            
            // Adjust for field size to ensure tiles are centered on fields
            this.container.x += this.fieldSize / 2;
            this.container.y += this.fieldSize / 2;
        } else {
            // Standard positioning for non-iframe
            this.container.x = (data.width - this.width) / 2 + this.fieldSize / 2;
            this.container.y = (data.height - this.height) / 2 + this.fieldSize / 2;
        }
    }

    create() {
        this.createFields();
        this.createTiles();
    }

    createTiles() {
        this.fields.forEach(field => this.createTile(field));
    }

    createTile(field) {
        const tile = TileFactory.generate();
        tile.sprite.interactive = true;
        tile.sprite.on("pointerdown", () => {
            this.container.emit("tile-touch-start", tile);
        });
        field.setTile(tile);
        this.container.addChild(tile.sprite);

        return tile;
    }

    createFields() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.createField(row, col);
            }
        }
    }

    createField(row, col) {
        const field = new Field(row, col);
        this.fields.push(field);
        this.container.addChild(field.sprite);
    }
}