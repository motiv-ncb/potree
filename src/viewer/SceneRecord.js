import * as THREE from "../../libs/three.js/build/three.module.js";
import { EventDispatcher } from "../EventDispatcher.js";

export class SceneRecord{
    constructor(scene) {
        this.scene = scene;
        /**
         * @type {SceneRecordItem[]}
         */
        this.records = [];

        /**
         * @type {SceneRecordItem[]}
         */
        this.redoRecords = [];
        

        /**
         * store original state of objects when they are first modified
         * @type {SceneRecordObject[]}
         */
        this.originalRecords = [];

        document.removeEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));

    }

    clearRecords() {
        this.records = [];
        this.redoRecords = [];
        // this.originalRecords = [];
    }

    onKeyDown(event) {
        const isUndo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z';
        const isRedo = (event.ctrlKey || event.metaKey) && (event.key.toLowerCase()  === 'y' || (event.shiftKey && event.key.toLowerCase()  === 'Z'));
        if (isUndo) {
            event.preventDefault(); // Prevent the browser's default undo
            this.undo();
        } else if (isRedo) {
            event.preventDefault(); // Prevent the browser's default redo
            this.redo();
        }
    }

    addRecord(param) {
        const action = param.action;
        const record = new SceneRecordItem(this.scene);
        record.action = action;
        if (param.objects) {
            for (let obj of param.objects) {
                const recordObject = new SceneRecordObject( obj);
                record.objects.push(recordObject);
            }
        }
        else if (param.object) {
            const recordObject = new SceneRecordObject(param.object);
            record.objects.push(recordObject);
        }
        
        if(action === "move_object"){
            // For each object, find its previous matrix from the last record where it was modified
            for(let recordObject of record.objects){
                const previousRecordObject = this.getPreviousRecordObject(recordObject);
                if(previousRecordObject){
                    recordObject.previousState.matrix = new THREE.Matrix4().copy(previousRecordObject.state.matrix);
                }
                else{
                    let originalRecordObject = this.originalRecords.find(ro => ro.object.uuid === recordObject.object.uuid);
                    // if not found in originalRecords, create a new one
                    if(!originalRecordObject){
                        originalRecordObject = new SceneRecordObject(recordObject.object);
                        this.originalRecords.push(originalRecordObject);
                    }
                    if(originalRecordObject){
                        recordObject.previousState.matrix = new THREE.Matrix4().copy(originalRecordObject.state.matrix);
                    }
                }
            }
        }

        if(action === "move_points"){
            for(let recordObject of record.objects){
                const previousRecordObject = this.getPreviousRecordObject(recordObject);
                if(previousRecordObject){
                    recordObject.previousState.points = previousRecordObject.state.points.map(p => p.clone());
                    if(recordObject.object.constructor.name === "AreaVolume"){
                        recordObject.previousState.topPoint = previousRecordObject.state.topPoint.clone();
                        recordObject.previousState.bottomPoint = previousRecordObject.state.bottomPoint.clone();
                    }
                }
            }
        }
        this.records.push(record);

        // limit records to last 10
        if(this.records.length > 10){
            this.records.shift();
        }
        this.redoRecords = [];
        // console.log(`Record added: ${action}`, record);
    }

    getPreviousRecordObject(recordObject) {
        const objUUID = recordObject.object.uuid;
        let previousRecordObject = null;
        for (let j = this.records.length - 1; j >= 0; j--) {
            const prevRecord = this.records[j];
            const sameRecordObject = prevRecord.objects.find(ro => ro.object.uuid === objUUID);
            if (sameRecordObject) {
                previousRecordObject = sameRecordObject;
                break; // Found the previous record object, exit the loop
            }
        }

        return previousRecordObject;
    }

    undo() {
        if (this.records.length === 0) {
            console.warn("No more records to undo.");
            return;
        }
        const record = this.records.pop();
        this.redoRecords.push(record);
        record.undo();
    }
    redo() {
        if (this.redoRecords.length === 0) {
            console.warn("No more records to redo.");
            return;
        }
        const record = this.redoRecords.pop();
        this.records.push(record);
        record.redo();
    }
}


class SceneRecordItem extends EventDispatcher  {
    constructor(scene) {
        super();
        this.scene = scene;
        this.timestamp = Date.now();
        this.action = ""; 

        /**
         * @type {SceneRecordObject[]}
         */
        this.objects = []; // SceneRecordObject[]
    }

    undo() {
        switch (this.action) {
            case "add_volume":
                for (let recordObject of this.objects) {
                    this.scene.removeVolume(recordObject.object);
                }
                break;
            case "remove_volume":
                for (let recordObject of this.objects) {
                    this.scene.addVolume(recordObject.object);
                }
                break;
            case "move_object":
                for (let recordObject of this.objects) {
                    const object = recordObject.object;
                    const state = recordObject.previousState;
                    const matrix = state.matrix;
                    if(!matrix){
                        // console.warn("Undo move_object: no previous matrix found.");
                        continue;
                    }
                    object.matrix.copy(matrix);
                    object.matrix.decompose(object.position, object.quaternion, object.scale);
                    object.dispatchEvent({
                        type: "position_changed",
                        object: object
                    });
                }
                break;
            case "move_points":
                for (let recordObject of this.objects) {
                    const object = recordObject.object;
                    const points = recordObject.previousState.points;
                    if(object.points.length !== points.length){
                        console.warn("Undo move_points: point count mismatch.");
                        continue;
                    }
                    for(let i = 0; i < points.length; i++){
                        object.points[i].position.copy(points[i]);
                    }               
                    if(object.constructor.name === "AreaVolume"){
                        object.topSphere.position.copy(recordObject.previousState.topPoint);
                        object.bottomSphere.position.copy(recordObject.previousState.bottomPoint);
                        object.updateVolumeGeometry();
                        object.updateTopBottomMarkerPosition();
                        object.update();
                    }
                }
                break;
            // default:
            //     console.warn(`Undo for action ${this.action} not implemented yet.`);
        }

        this.scene.dispatchEvent({type: "action_undo", action: this.action, object:this, objects: this.objects});
    }

    redo() {
        switch (this.action) {
            case "add_volume":
                for (let recordObject of this.objects) {
                    this.scene.addVolume(recordObject.object);
                }
                break;
            case "remove_volume":
                for (let recordObject of this.objects) {
                    this.scene.removeVolume(recordObject.object);
                }
                break;
            case "move_object":
                for (let recordObject of this.objects) {
                    const object = recordObject.object;
                    const matrix = recordObject.state.matrix;
                    object.matrix.copy(matrix);
                    object.matrix.decompose(object.position, object.quaternion, object.scale);
                    object.dispatchEvent({
                        type: "position_changed",
                        object: object
                    });
                }
                break;
            case "move_points":
                for (let recordObject of this.objects) {
                    const object = recordObject.object;
                    const points = recordObject.state.points;
                    if(object.points.length !== points.length){
                        console.warn("Undo move_points: point count mismatch.");
                        continue;
                    }
                    for(let i = 0; i < points.length; i++){
                        object.points[i].position.copy(points[i]);
                    }               
                    if(object.constructor.name === "AreaVolume"){
                        object.topSphere.position.copy(recordObject.state.topPoint);
                        object.bottomSphere.position.copy(recordObject.state.bottomPoint);
                        object.updateVolumeGeometry();
                        object.updateTopBottomMarkerPosition();
                        object.update();
                    }
                }
                break;
            // default:
            //     console.warn(`Redo for action ${this.action} not implemented yet.`);
        }

        this.scene.dispatchEvent({type: "action_redo", action: this.action, object:this, objects: this.objects});

    }
}

class SceneRecordObject {
    constructor(object) {
        object.updateMatrixWorld(true);
        this.object = object;
        // this.matrix = new THREE.Matrix4().copy(object.matrix);
        this.state = new SceneRecordState();
        this.state.matrix = new THREE.Matrix4().copy(object.matrix);

        if (object.constructor.name === "AreaVolume") {
            for(let points of object.points){
                this.state.points.push(points.position.clone());
            }
            this.state.topPoint = object.topSphere.position.clone();
            this.state.bottomPoint = object.bottomSphere.position.clone();
        }

        this.previousState = new SceneRecordState();
    }
}

class SceneRecordState {
    constructor() {
         /**
         * @type {THREE.Matrix4|null}
         */
        this.matrix = null;
        this.topPoint =null;
        this.bottomPoint = null;
        /**
         * @type {THREE.Vector3[]}
         */
        this.points = [];
    }

}

