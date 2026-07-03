import * as THREE from "../../libs/three.js/build/three.module.js";
import { CameraMode } from "../defines.js";
import { EventDispatcher } from "../EventDispatcher.js";
import { Viewer } from "./viewer.js";

export class NavigationRecord{   
    /**
     * 
     * @param {Viewer} viewer 
     */
    constructor(viewer, name) {

        this.viewer = viewer;
        this.name = name;
        this.screenShortURL = null;
        this.cameraRecord = new CameraRecordItem(viewer)
        this.controlsRecord = new ControlsRecordItem(viewer);
       
        this.updateRecord();

        // this.viewer.scene.dispatchEvent({
        //     type: "navigation_record_added",
        //     object: this
        // });


    }

    updateRecord(){
        this.cameraRecord.updateRecord();
        this.controlsRecord.updateRecord();

         try{
            this.viewer.render();
            this.screenShortURL = this.viewer.renderer.domElement.toDataURL('image/jpeg', 0.85);
        }
        catch (e){
            this.screenShortURL = null;
            console.warn(e);
        }
        // console.log(this.screenShortURL);
       
    }

    setNavigation(){
        this.cameraRecord.setNavigation();
        this.controlsRecord.setNavigation();
    }
}


class CameraRecordItem{
     /**
     * 
     * @param {Viewer} viewer 
     */
    constructor(viewer){
        this.viewer = viewer;

        this.type = "";
        this.near = 0;
        this.far = 0;
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler(0,0,0,"ZXY");
    
        this.yaw = 0;
        this.pitch = 0;

        // perspective
        this.fov = 0;
        // orthograpics
        this.left = 0;
        this.right = 0;
        this.top = 0;
        this.bottom = 0;

    }

    updateRecord(){
        const camera = this.viewer.scene.getActiveCamera();
        this.type = camera.type;
        this.near = camera.near;
        this.far = camera.far;
        this.position = camera.position.clone();
        this.rotation = camera.rotation.clone();
        this.yaw = this.viewer.scene.view.yaw;
        this.pitch = this.viewer.scene.view.pitch;
        switch(this.type){
            case "PerspectiveCamera":
                this.fov = camera.fov;
                break;
            case "OrthographicCamera":
                this.left = camera.left;
                this.right = camera.right;
                this.top = camera.top;
                this.bottom = camera.bottom;
                break;
        }
    }

    setNavigation(){
        let camera = this.viewer.scene.getActiveCamera();
        if(this.type != camera.type){
            switch(this.type){
            case "PerspectiveCamera":
                this.viewer.setCameraMode(CameraMode.PERSPECTIVE);
                break;
            case "OrthographicCamera":
                this.viewer.setCameraMode(CameraMode.ORTHOGRAPHIC);
                break;
            }
        }


        camera = this.viewer.scene.getActiveCamera();
        camera.near = this.near;
        camera.far = this.far;

        this.viewer.scene.view.position.copy(this.position);
        this.viewer.scene.view.yaw = this.yaw;
        this.viewer.scene.view.pitch = this.pitch;

        // camera.position.set(this.position.x,this.position.y,this.position.z);
        // camera.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
        switch(this.type){
            case "PerspectiveCamera":
                this.viewer.setFOV(this.fov);
                break;
            case "OrthographicCamera":
         
                camera.left = this.left;
                camera.right = this.right;
                camera.top = this.top;
                camera.bottom = this.bottom;
                break;
        }
    }
}

class ControlsRecordItem{
    /**
     * 
     * @param {Viewer} viewer 
     */
    constructor(viewer){
        this.viewer = viewer;
        this.moveSpeed = 0;
        this.radius = 0;
    }

    updateRecord(){
        const controls = this.viewer.controls;
        const view = this.viewer.scene.view;
  
        this.moveSpeed = this.viewer.moveSpeed;
        this.radius = view.radius;
    }

    setNavigation(){
        
    }
}