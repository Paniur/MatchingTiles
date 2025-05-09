import { App } from "../system/App";
import { Scene } from "../system/Scene";
import { Board } from "./Board";
import { CombinationManager } from "./CombinationManager";

export class Game extends Scene {
    create() {
        this.disabled = false;
        this.selectedTile = null;
        this.createBackground();
        this.createBoard();
        this.combinationManager = new CombinationManager(this.board);
        this.removeStartMatches();
    }

    createBoard() {
        this.board = new Board();
        this.container.addChild(this.board.container);
        this.board.container.on("tile-touch-start", this.onTileClick.bind(this));
    }

    onTileClick(tile) {
        if (this.disabled) {
            return;
        }

        if (!this.selectedTile) {
            this.selectTile(tile);
        } else {
            if (!this.selectedTile.isNeighbour(tile)) {
                this.clearSelection();
                this.selectTile(tile);
            } else {
                this.swap(this.selectedTile, tile);
            }
        }
    }

    clearSelection() {
        if (this.selectedTile) {
            this.selectedTile.field.unselect();
            this.selectedTile = null
        }
    }

    swap(selectedTile, tile) {
        this.disabled = true; 
        this.clearSelection(); 

        selectedTile.moveTo(tile.field.position, 0.2);
        tile.moveTo(selectedTile.field.position, 0.2).then(() => {
            this.board.swap(selectedTile, tile);
            const matches = this.combinationManager.getMatches();
            if (matches.length) {
                this.processMatches(matches);
            }
            this.disabled = false;
            
        });
    }

    processMatches(matches) {
        this.disabled = true;
        this.removeMatches(matches);
        this.processFallDown()
            .then(() => this.addTiles())
            .then(() => this.onFallDownOver());
    }

    onFallDownOver() {
        const matches = this.combinationManager.getMatches();
        
        if (matches.length) {
            this.processMatches(matches)
        } else {
            this.disabled = false;
        }
    }

    addTiles() {
        return new Promise(resolve => {
            const fields = this.board.fields.filter(field => field.tile === null);
            let total = fields.length;
            let completed = 0;
            fields.forEach(field => {
                const tile = this.board.createTile(field);
                tile.sprite.y = -500;

                const delay = Math.random() * 2 / 10 + 0.3 / (field.row + 1);
                tile.fallDownTo(field.position, delay).then(() => {
                    ++completed;
                    if (completed >= total) {
                        resolve();
                    }
                });
            });
        });
    }

    processFallDown() {
        return new Promise(resolve => {
            let completed = 0;
            let started = 0;
            for (let row = this.board.rows - 1; row >= 0; row--) {
                for (let col = this.board.cols - 1; col >= 0; col--) {
                    const field = this.board.getField(row, col);
                    if (!field.tile) {
                        ++started;
                        this.fallDownTo(field).then(() => {
                            ++completed;

                            if (completed >= started) {
                                resolve();
                            }
                        });
                    }
                }
            }


        });
    }

    fallDownTo(emptyField) {
        for (let row = emptyField.row - 1; row >= 0; row--) {
            let fallingField = this.board.getField(row, emptyField.col);
            if (fallingField.tile)  {
                const fallingTile = fallingField.tile;
                fallingTile.field = emptyField;
                emptyField.tile = fallingTile;
                fallingField.tile = null;
                return fallingTile.fallDownTo(emptyField.position);
           }
        }

        return Promise.resolve();
    }

    removeMatches(matches) {
        matches.forEach(match => {
            match.forEach(tile => {
                tile.remove();
            });
        });
    }

    selectTile(tile) {
        this.selectedTile = tile;
        this.selectedTile.field.select();
    }

    createBackground() {
        this.bg = App.sprite("bg");
        this.container.addChild(this.bg);
        
        // Initial sizing
        this.resizeBackground({
            detail: {
                width: App.width,
                height: App.height
            }
        });
        
        // Listen for resize events
        window.addEventListener('game-resize', this.resizeBackground.bind(this));
    }

    resizeBackground(event) {
        // Get dimensions from the event if available, otherwise use App dimensions
        const width = event?.detail?.width || App.width;
        const height = event?.detail?.height || App.height;
        
        // Scale background to match game dimensions
        this.bg.width = width;
        this.bg.height = height;
        
        // Center the background
        // this.bg.x = -width / 2;
        // this.bg.y = -height / 2;
    }
    
    removeStartMatches() {
        let matches = this.combinationManager.getMatches();

        while (matches.length) {
            this.removeMatches(matches);

            const emptyFields = this.board.fields.filter(field => field.tile === null);

            emptyFields.forEach(field => {
                this.board.createTile(field);
            });
            
            matches = this.combinationManager.getMatches();
        }
     }
}