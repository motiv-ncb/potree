import * as THREE from "../../libs/three.js/build/three.module.js";
import { TextSprite } from "../TextSprite.js";
import { BoxVolume, Volume } from "./Volume.js";


export class TransformOriginBoxVolume extends BoxVolume {
    constructor(args = {}) {
        super(args);
        this.showVolumeLabel = false;
        this.material.opacity = 0;
        this.syncingVolume = null;
        // this.material.color = 0xffffff
        this.enableTranslationX = true;
        this.enableTranslationY = true;
        this.enableTranslationZ = true;
        this.enableRotationX = false;
        this.enableRotationY = false;
        this.enableRotationZ = false;
        this.enableMove = true;
        this.frame.material = new THREE.LineBasicMaterial({color: 0x000000});
    }

    getVolume() {
        return 0;
    }

    updateTransformdVolumeByConstrains() {
        if (this.syncingVolume) {
            if (!this.enableMove) {
                this.syncingVolume.position.x = this.position.x;
                this.syncingVolume.position.y = this.position.y;
                this.syncingVolume.position.z = this.position.z;
                this.syncingVolume.rotation.x = this.rotation.x;
                this.syncingVolume.rotation.y = this.rotation.y;
                this.syncingVolume.rotation.z = this.rotation.z;
            }
            else {
                if (!this.enableTranslationX) {
                    this.syncingVolume.position.x = this.position.x;
                }
                if (!this.enableTranslationY) {
                    this.syncingVolume.position.y = this.position.y;
                }
                if (!this.enableTranslationZ) {
                    this.syncingVolume.position.z = this.position.z;
                }
                if (!this.enableRotationX) {
                    this.syncingVolume.rotation.x = this.rotation.x;
                }
                if (!this.enableRotationY) {
                    this.syncingVolume.rotation.y = this.rotation.y;
                }
                if (!this.enableRotationZ) {
                    this.syncingVolume.rotation.z = this.rotation.z;
                }
            }
        }
    }
}

export class TransformPointcloudBoxVolume extends BoxVolume{
    constructor(args = {}) {
        super(args);
        this.showVolumeLabel = false;
        this.material.opacity = 0;
        this.syncingVolume = null;
        this.frame.material = new THREE.LineBasicMaterial({color: 0xFFFFFF}) 
        this.frame.visible = false;
        this.syncingPointcloud = args.pointcloud;
        let boundingBox = args.pointcloud.pcoGeometry.tightBoundingBox.clone();
        const bMin = boundingBox.min;
        const bMax = boundingBox.max;
        this.localPointcloudCenter = new THREE.Vector3(0.5 * (bMin.x + bMax.x),  0.5 * (bMin.y + bMax.y), 0.5 * (bMin.z + bMax.z));
        this.localPointcloudScale = new THREE.Vector3( (bMax.x - bMin.x), (bMax.y -bMin.y), (bMax.z - bMin.z));

        this.updateBoxPosition();
    
    }

    updateBoxPosition(){
        this.syncingPointcloud.updateMatrixWorld();
        let localCenterNew = this.localPointcloudCenter.clone();


        localCenterNew.applyMatrix4(this.syncingPointcloud.matrixWorld);

        this.position.set(localCenterNew.x,localCenterNew.y,localCenterNew.z)
        this.setRotationFromEuler(new THREE.Euler(this.syncingPointcloud.rotation.x,this.syncingPointcloud.rotation.y,this.syncingPointcloud.rotation.z));
         this.scale.set(this.localPointcloudScale.x,this.localPointcloudScale.y,this.localPointcloudScale.z);
    
    }

    updatePointcloudPosition(){
        this.scale.set(this.localPointcloudScale.x,this.localPointcloudScale.y,this.localPointcloudScale.z);

        this.updateMatrixWorld();

        const matrix = new THREE.Matrix4();
        matrix.makeRotationFromEuler(this.rotation); // start with rotation
        matrix.setPosition(this.position);        // then apply translation
        let localCenterNew = new THREE.Vector3(-this.localPointcloudCenter.x,-this.localPointcloudCenter.y,-this.localPointcloudCenter.z);
        localCenterNew.applyMatrix4(matrix);
        this.syncingPointcloud.position.set(localCenterNew.x,localCenterNew.y,localCenterNew.z)
        this.syncingPointcloud.setRotationFromEuler(new THREE.Euler(this.rotation.x,this.rotation.y,this.rotation.z));

    }


    getVolume() {
        return 0;
    }
}



export class TransformedBoxVolume extends BoxVolume {
    constructor(args = {}) {
        super(args);
        this.showVolumeLabel = false;
        this.material.opacity = 0;
        this.syncingVolume = null;
        this.frame.material = new THREE.LineBasicMaterial({color: 0xFFFFFF}) 
        // to make a bit bigger tha origin make it esier to pick
        const scale = 1.001;
        this.box.scale.set(scale,scale,scale);
    }


    getVolume() {
        return 0;
    }

    updateTransformdVolumeByConstrains(){
        if(this.syncingVolume){
            this.syncingVolume.updateTransformdVolumeByConstrains();
        }
        
    }
}
