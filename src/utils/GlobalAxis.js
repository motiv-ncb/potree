import {Utils} from "../utils.js";
import * as THREE from "../../libs/three.js/build/three.module.js";
// cmair class
export class GlobalAxis{
    constructor(viewer){

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

        for( let child of this.axis.children){
            child.renderOrder = 999
            child.material.depthTest = false;
            child.material.transparent  = false 
        }
        const scale = 0.3;
        this.axis.renderOrder = 999
        this.axis.scale.set(scale,scale,scale)
    }
}