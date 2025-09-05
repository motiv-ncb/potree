import {Utils} from "../utils.js";
import * as THREE from "../../libs/three.js/build/three.module.js";
// cmair class
export class GlobalAxis{
    constructor(viewer){
        let self = this
        this.axis = new THREE.Object3D();
        this.axis.visible = false;
		viewer.scene.scene.add(this.axis);
        const geometry = new THREE.CylinderGeometry( 0.02, 0.02, 1, 32 ); 

        let xAxis = new THREE.Mesh( geometry,  new THREE.MeshBasicMaterial({color:0xff0000} )); 
        xAxis.rotateZ(Math.PI /2);
        xAxis.translateY(-0.5);
        this.axis.add( xAxis );

        let yAxis = new THREE.Mesh( geometry,  new THREE.MeshBasicMaterial({color:0x00ff00} )); 
        yAxis.translateY(0.5);
        this.axis.add( yAxis );

        let zAxis = new THREE.Mesh( geometry,  new THREE.MeshBasicMaterial({color:0x0000ff} )); 
        zAxis.rotateX(Math.PI /2)
        zAxis.translateY(0.5);
        this.axis.add( zAxis );

        const arrowHeadGeometry =  new THREE.CylinderGeometry( 0,0.1, 0.3, 32 ); 

        let xHead = new THREE.Mesh( arrowHeadGeometry,  new THREE.MeshBasicMaterial({color:0xff0000} ));
        xHead.rotateZ(-Math.PI /2);
        xHead.position.set(1,0,0);
        this.axis.add( xHead ); 
        
        let yHead = new THREE.Mesh( arrowHeadGeometry,  new THREE.MeshBasicMaterial({color:0x00ff00} ));
        yHead.position.set(0,1,0);
        this.axis.add( yHead ); 

        let zHead = new THREE.Mesh( arrowHeadGeometry,  new THREE.MeshBasicMaterial({color:0x0000ff} ));
        zHead.rotateX(Math.PI /2)
        zHead.position.set(0,0,1);
        this.axis.add( zHead ); 

        // text
        function refreshText(font){
            const textSize = 0.3
            const textHeight = 0.001;
            const textPosition = 1.4;
            const xTextGeometry = new THREE.TextGeometry( 'X', {
                font: font,
                size: textSize,
                height:textHeight,
                bevelEnabled: false
            } );
            const xTextMesh = new THREE.Mesh( xTextGeometry,  new THREE.MeshBasicMaterial({color:0x000000} ));
            xTextMesh.position.set(-0.12,-textSize / 2,0);
            self.xText = new THREE.Object3D(); 
            self.xText.add( xTextMesh );
            self.xText.position.set(textPosition,0,0);
            self.axis.add( self.xText ); 

            const yTextGeometry = new THREE.TextGeometry( 'Y', {
                font: font,
                size: textSize,
                height:textHeight,
                bevelEnabled: false
            } );
            const yTextMesh = new THREE.Mesh( yTextGeometry,  new THREE.MeshBasicMaterial({color:0x000000} ));
            yTextMesh.position.set(-0.12,-textSize / 2,0);
            self.yText = new THREE.Object3D(); 
            self.yText.add( yTextMesh );
            self.yText.position.set(0,textPosition,0);
            self.axis.add( self.yText ); 

            const zTextGeometry = new THREE.TextGeometry( 'Z', {
                font: font,
                size: textSize,
                height:textHeight,
                bevelEnabled: false
            } );
            const zTextMesh = new THREE.Mesh( zTextGeometry,  new THREE.MeshBasicMaterial({color:0x000000} ));
            zTextMesh.position.set(-0.12,-textSize / 2,0);
            self.zText = new THREE.Object3D(); 
            self.zText.add( zTextMesh );
            self.zText.position.set(0,0,textPosition);
            self.axis.add( self.zText ); 
        }

        const loader = new THREE.FontLoader();
        const fontName = 'optimer';
        const fontWeight = 'bold';
        loader.load( Potree.resourcePath +  '/fonts/' + fontName + '_' + fontWeight + '.typeface.json', function ( response ) {
            refreshText(response);
        } );

        for( let child of this.axis.children){
            child.renderOrder = 999
            child.material.depthTest = false;
            child.material.transparent  = false 
        }
        const scale = 0.3;
        this.axis.renderOrder = 999
        this.axis.scale.set(scale,scale,scale);
    }

    setPerspectiveScale(){
        this.setScale(0.3)
    }
    setScale(scale){
        this.axis.scale.set(scale,scale,scale);
    }
}