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
        this.uuid = THREE.MathUtils.generateUUID();
        this.updateRecord();

    }

    updateRecord(){
        this.cameraRecord.updateRecord();
        this.controlsRecord.updateRecord();
    }

    captureScreen(){
        const yaw = this.cameraRecord.yaw;
        const pitch =this.cameraRecord.pitch;
        const position = this.cameraRecord.position;
        let dir = new THREE.Vector3(0, 1, 0);   
        dir.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
        dir.applyAxisAngle(new THREE.Vector3(0, 0, 1), yaw); 
        const target = this.cameraRecord.position.clone().add(
            dir.multiplyScalar(this.controlsRecord.radius)
        );

      
        const viewer   = this.viewer;
        const renderer = viewer.renderer;
        const scene    = viewer.scene.scene;
        
        const originalCamera = viewer.scene.cameraP;

        // clone camera
        const captureCamera = originalCamera.clone();

        captureCamera.position.copy(position);
        captureCamera.lookAt(target);
        captureCamera.fov = this.cameraRecord.fov;
        captureCamera.updateProjectionMatrix();
        captureCamera.updateMatrixWorld(true);

        // update octree visibility
        Potree.updatePointClouds(
            viewer.scene.pointclouds,
            captureCamera,
            viewer.renderer
        );

        // temporarily swap camera
        viewer.scene.cameraP = captureCamera;

        // render using Potree pipeline
        viewer.render();

        // restore immediately
        viewer.scene.cameraP = originalCamera;

       this.screenShortURL =  this.viewer.renderer.domElement.toDataURL('image/jpeg', 0.85);
    }

    setNavigation(){
        this.cameraRecord.setNavigation();
        this.controlsRecord.setNavigation();
    }

    getExportModel(){
        return{
            'name':this.name,
            'camera': this.cameraRecord.getExportModel(),
            'controls':this.controlsRecord.getExportModel()
        };
    }

    importData(ioModel){
        this.name = ioModel.name;
        this.cameraRecord.importData(ioModel.camera);
        this.controlsRecord.importData(ioModel.controls); 
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

    getExportModel(){
        return{
            'type':this.type,
            'near':this.near,
            'far':this.far,
            'position':this.position,
            'yaw':this.yaw,
            'pitch':this.pitch,
            'fov':this.fov,
            'left':this.left,
            'right':this.right,
            'top':this.top,
            'bottom':this.bottom
        };
    }

    importData(ioModel){
        this.type = ioModel.type;
        this.near = ioModel.near;
        this.far = ioModel.far;
        this.position = ioModel.position;
        this.yaw = ioModel.yaw;
        this.pitch = ioModel.pitch;
        this.fov = ioModel.fov;
        this.left = ioModel.left;
        this.right = ioModel.right;
        this.top = ioModel.top;
        this.bottom =ioModel.bottom;
   
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

    getExportModel(){
        return {
            'moveSpeed':this.moveSpeed,
            'radius':this.radius
        }
    }

    importData(ioModel){
        this.moveSpeed = ioModel.moveSpeed;
        this.radius =ioModel.radius;
    }
}