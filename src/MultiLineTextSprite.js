

// /**
//  * adapted from http://stemkoski.github.io/Three.js/Sprite-Text-Labels.html
//  */

import * as THREE from "../libs/three.js/build/three.module.js";
import { TextSprite } from "./TextSprite.js";

export class MultiLineTextSprite extends TextSprite{
	
	constructor(text){
		super(text);
        this.lineSpaceScale = 0.2;
	}

	

	update(){

        const lines = this.text? this.text.split("\n"):[];
        const numberOfLine = lines.length;
        // if single line, use TextSprite logic
        if(numberOfLine <= 1){
            super.update();
            return;
        }

		let canvas = document.createElement('canvas');
		let context = canvas.getContext('2d');
		context.font = 'Bold ' + this.fontsize + 'px ' + this.fontface;
        const lineSpacing = this.fontsize * this.lineSpaceScale;
        const lineHeight = this.fontsize * (this.lineSpaceScale + 1);

		// get size data (height depends only on font size)
        let textWidth = 0;
        for (let line of lines){
            let metrics = context.measureText(line);
            textWidth = Math.max(metrics.width, textWidth)
        }
		// let metrics = context.measureText(this.text);
		// let textWidth = metrics.width;
		let margin = 5;
        let sumFontsize = numberOfLine * this.fontsize + (numberOfLine - 1) * lineSpacing;
		let spriteWidth = 2 * margin + textWidth + 2 * this.borderThickness;
		let spriteHeight = sumFontsize + this.fontsize * 0.4 + 2 * this.borderThickness;
		context.canvas.width = spriteWidth;
		context.canvas.height = spriteHeight;
		context.font = 'Bold ' + this.fontsize + 'px ' + this.fontface;

		// background color
		context.fillStyle = 'rgba(' + this.backgroundColor.r + ',' + this.backgroundColor.g + ',' +
			this.backgroundColor.b + ',' + this.backgroundColor.a + ')';
		// border color
		context.strokeStyle = 'rgba(' + this.borderColor.r + ',' + this.borderColor.g + ',' +
			this.borderColor.b + ',' + this.borderColor.a + ')';

		context.lineWidth = this.borderThickness;
		this.roundRect(context, this.borderThickness / 2, this.borderThickness / 2,
			textWidth + this.borderThickness + 2 * margin, spriteHeight, 6);

		// text color
		context.strokeStyle = 'rgba(0, 0, 0, 1.0)';

        for(let i = 0 ; i < numberOfLine; i++){
            context.strokeText(lines[i], this.borderThickness + margin, this.fontsize + this.borderThickness + i * lineHeight);
        }

		context.fillStyle = 'rgba(' + this.textColor.r + ',' + this.textColor.g + ',' +
			this.textColor.b + ',' + this.textColor.a + ')';
		     
        for(let i = 0 ; i < numberOfLine; i++){
            context.fillText(lines[i], this.borderThickness + margin, this.fontsize + this.borderThickness + i * lineHeight);
        }

		let texture = new THREE.Texture(canvas);
		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;
		texture.needsUpdate = true;

		this.sprite.material.map = texture;
        this.sprite.center.set(0.5,0);
		this.texture = texture;

		this.sprite.scale.set(spriteWidth * 0.01, spriteHeight * 0.01, 1.0);
	}

	

}


