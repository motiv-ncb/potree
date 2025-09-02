
import * as THREE from "../../libs/three.js/build/three.module.js";
import {Volume, BoxVolume} from "./Volume.js";
import {Utils} from "../utils.js";
import { EventDispatcher } from "../EventDispatcher.js";
import { AreaVolume } from "./AreaVolume.js";
import { PlaneMeasurement } from "./PlaneMeasurement.js";
export class VolumeTool extends EventDispatcher{
	constructor (viewer) {
		super();

		this.viewer = viewer;
		this.renderer = viewer.renderer;

		this.addEventListener('start_inserting_volume', e => {
			this.viewer.dispatchEvent({
				type: 'cancel_insertions'
			});
		});

		this.scene = new THREE.Scene();
		this.scene.name = 'scene_volume';

		this.viewer.inputHandler.registerInteractiveScene(this.scene);

		this.onRemove = e => {
			this.scene.remove(e.volume);
		};

		this.onAdd = e => {
			this.scene.add(e.volume);
		};

		for(let volume of viewer.scene.volumes){
			this.onAdd({volume: volume});
		}

		this.viewer.inputHandler.addEventListener('delete', e => {
			let volumes = e.selection.filter(e => (e instanceof Volume));
			volumes.forEach(e => this.viewer.scene.removeVolume(e));
		});

		viewer.addEventListener("update", this.update.bind(this));
		viewer.addEventListener("render.pass.scene", e => this.render(e));
		viewer.addEventListener("scene_changed", this.onSceneChange.bind(this));

		viewer.scene.addEventListener('volume_added', this.onAdd);
		viewer.scene.addEventListener('volume_removed', this.onRemove);
	}

	onSceneChange(e){
		if(e.oldScene){
			e.oldScene.removeEventListeners('volume_added', this.onAdd);
			e.oldScene.removeEventListeners('volume_removed', this.onRemove);
		}

		e.scene.addEventListener('volume_added', this.onAdd);
		e.scene.addEventListener('volume_removed', this.onRemove);
	}

	startInsertion (args = {}) {
		let volume;
		if(args.type){
			volume = new args.type();
		}else{
			volume = new BoxVolume();
		}
		
		volume.clip = args.clip || false;
		volume.name = this.createUniqueName(args.name || 'Volume');
        volume.volumeType = args.volumeType || 'Volume';
         // cmair args.scale
        if(args.scale){
            volume.scale.set(args.scale.x, args.scale.y, args.scale.z);
        }

		this.dispatchEvent({
			type: 'start_inserting_volume',
			volume: volume
		});

		this.viewer.scene.addVolume(volume);
		this.scene.add(volume);

		let cancel = {
			callback: null
		};

		let drag = e => {
			let camera = this.viewer.scene.getActiveCamera();
			
			let I = Utils.getMousePointCloudIntersection(
				e.drag.end, 
				this.viewer.scene.getActiveCamera(), 
				this.viewer, 
				this.viewer.scene.pointclouds, 
				{pickClipped: false});

			if (I) {
				volume.position.copy(I.location);
                if(args.disableAutoScale){
                    return;
                }
				let wp = volume.getWorldPosition(new THREE.Vector3()).applyMatrix4(camera.matrixWorldInverse);
				// let pp = new THREE.Vector4(wp.x, wp.y, wp.z).applyMatrix4(camera.projectionMatrix);
				let w = Math.abs((wp.z / 5));
				volume.scale.set(w, w, w);
			}
		};

		let drop = e => {
			volume.removeEventListener('drag', drag);
			volume.removeEventListener('drop', drop);

			cancel.callback();
		};

		cancel.callback = e => {
			volume.removeEventListener('drag', drag);
			volume.removeEventListener('drop', drop);
			this.viewer.removeEventListener('cancel_insertions', cancel.callback);
		};

		volume.addEventListener('drag', drag);
		volume.addEventListener('drop', drop);
		this.viewer.addEventListener('cancel_insertions', cancel.callback);

		this.viewer.inputHandler.startDragging(volume);

		return volume;
	}

    startPlaneInsertion (args = {}) {
		let volume;
		volume = new PlaneMeasurement();
		
		volume.clip = args.clip || false;
		volume.name = this.createUniqueName(args.name || 'Volume');
        volume.volumeType = args.volumeType || 'Volume'

		this.dispatchEvent({
			type: 'start_inserting_volume',
			volume: volume
		});

		this.viewer.scene.addVolume(volume);
		this.scene.add(volume);

		let cancel = {
			callback: null
		};

		let drag = e => {
			let camera = this.viewer.scene.getActiveCamera();
			
			let I = Utils.getMousePointCloudIntersection(
				e.drag.end, 
				this.viewer.scene.getActiveCamera(), 
				this.viewer, 
				this.viewer.scene.pointclouds, 
				{pickClipped: false});

			if (I) {
				volume.position.copy(I.location);

				let wp = volume.getWorldPosition(new THREE.Vector3()).applyMatrix4(camera.matrixWorldInverse);
				// let pp = new THREE.Vector4(wp.x, wp.y, wp.z).applyMatrix4(camera.projectionMatrix);
				let w = Math.abs((wp.z / 5));
				volume.scale.set(w, w, w);
			}
		};

		let drop = e => {
			volume.removeEventListener('drag', drag);
			volume.removeEventListener('drop', drop);

			cancel.callback();
		};

		cancel.callback = e => {
			volume.removeEventListener('drag', drag);
			volume.removeEventListener('drop', drop);
			this.viewer.removeEventListener('cancel_insertions', cancel.callback);
		};

		volume.addEventListener('drag', drag);
		volume.addEventListener('drop', drop);
		this.viewer.addEventListener('cancel_insertions', cancel.callback);

		this.viewer.inputHandler.startDragging(volume);

		return volume;
	}

    startAreaInsertion(args = {}){
        let domElement = this.viewer.renderer.domElement;

        let measure = new AreaVolume();

        this.dispatchEvent({
            type: 'start_inserting_measurement',
            measure: measure
        });

        const pick = (defaul, alternative) => {
            if(defaul != null){
                return defaul;
            }else{
                return alternative;
            }
        };

        measure.showDistances = (args.showDistances === null) ? true : args.showDistances;

        measure.showArea = pick(args.showArea, false);
        measure.showAngles = pick(args.showAngles, false);
        measure.showCoordinates = pick(args.showCoordinates, false);
        measure.showHeight = pick(args.showHeight, false);
        measure.showCircle = pick(args.showCircle, false);
        measure.showAzimuth = pick(args.showAzimuth, false);
        measure.showEdges = pick(args.showEdges, true);
        measure.closed = pick(args.closed, false);
        measure.maxMarkers = pick(args.maxMarkers, Infinity);
        // for cmair
        measure.showVolume = pick(args.showVolume, false);
        measure.name = this.createUniqueName(args.name || 'Volume');
        measure.volumeType = args.volumeType || 'Volume'


		this.viewer.scene.addVolume(measure);
        this.scene.add(measure);

        let cancel = {
            removeLastMarker: measure.maxMarkers > 3,
            callback: null
        };

        let insertionCallback = (e) => {
            if (e.button === THREE.MOUSE.LEFT) {
                measure.addMarker(measure.points[measure.points.length - 1].position.clone());

                if (measure.points.length >= measure.maxMarkers) {
                    cancel.callback();
                }

                this.viewer.inputHandler.startDragging(
                    measure.spheres[measure.spheres.length - 1]);
            } else if (e.button === THREE.MOUSE.RIGHT) {
                cancel.callback();
            }
        };

        cancel.callback = e => {
            if (cancel.removeLastMarker) {
                measure.removeMarker(measure.points.length - 1);
            }
            domElement.removeEventListener('mouseup', insertionCallback, false);
            this.viewer.removeEventListener('cancel_insertions', cancel.callback);
            // cmair
            if(measure.showVolume){
                // set all point into the bottom
                const nPoint = measure.points.length;
                if(nPoint > 0){
                    let xMin = measure.points[0].position.x;
                    let yMin = measure.points[0].position.y;
                    let zMin = measure.points[0].position.z;
                    let xMax = measure.points[0].position.x;
                    let yMax = measure.points[0].position.y;
                    let zMax = measure.points[0].position.z;
                    for(let point of measure.points){
                        xMin = Math.min(xMin, point.position.x);
                        yMin = Math.min(yMin, point.position.y);
                        zMin = Math.min(zMin, point.position.z);
                        xMax = Math.max(xMax, point.position.x);
                        yMax = Math.max(yMax, point.position.y);
                        zMax = Math.max(zMax, point.position.z);
                    }
                }
                measure.addTopBottomMarker();
                measure.updatePointElevations();
                measure.updateVolumeGeometry();
                measure.update();
                measure.makeSelection();
            }
        };

        if (measure.maxMarkers > 1) {
            this.viewer.addEventListener('cancel_insertions', cancel.callback);
            domElement.addEventListener('mouseup', insertionCallback, false);
        }

        measure.addMarker(new THREE.Vector3(0, 0, 0));
        this.viewer.inputHandler.startDragging(
            measure.spheres[measure.spheres.length - 1]);

      //  this.viewer.scene.addMeasurement(measure);
        return measure;
    }

	update(){
		if (!this.viewer.scene) {
			return;
		}
		
		let camera = this.viewer.scene.getActiveCamera();
		let renderAreaSize = this.viewer.renderer.getSize(new THREE.Vector2());
		let clientWidth = renderAreaSize.width;
		let clientHeight = renderAreaSize.height;

		let volumes = this.viewer.scene.volumes;
		for (let volume of volumes) {
			let label = volume.label;
			
			{

				let distance = label.position.distanceTo(camera.position);
				let pr = Utils.projectedRadius(1, camera, distance, clientWidth, clientHeight);

				let scale = (70 / pr);
				label.scale.set(scale, scale, scale);
			}

            // spheres
            if(volume.spheres){
                for(let sphere of volume.spheres){
                    let distance = camera.position.distanceTo(sphere.getWorldPosition(new THREE.Vector3()));
                    let pr = Utils.projectedRadius(1, camera, distance, clientWidth, clientHeight);
                    let scale = (15 / pr);
                    sphere.scale.set(scale, scale, scale);
                }
            }
                        
            // cmair show volime only when greater than 0
			let calculatedVolume = volume.getVolume();
            if(calculatedVolume > 0.0001){
                calculatedVolume = calculatedVolume / Math.pow(this.viewer.lengthUnit.unitspermeter, 3) * Math.pow(this.viewer.lengthUnitDisplay.unitspermeter, 3);  //convert to cubic meters then to the cubic display unit
			    let text = Utils.addCommas(calculatedVolume.toFixed(3)) + ' ' + this.viewer.lengthUnitDisplay.code + '\u00B3';
            	label.setText(text);
            }
            else{
                label.setText("");
            }
			
		}
	}

	render(params){
		const renderer = this.viewer.renderer;

		const oldTarget = renderer.getRenderTarget();
		
		if(params.renderTarget){
			renderer.setRenderTarget(params.renderTarget);
		}
		renderer.render(this.scene, this.viewer.scene.getActiveCamera());
		renderer.setRenderTarget(oldTarget);
	}


    createUniqueName(prefix){
        let volumes = this.viewer.scene.volumes;
        let suffix = 1;
        let name = prefix
        let found = true;
        while(found){      
            name = prefix +"_"+ suffix;
            found = false;
            for(let vol of volumes){
                if(name == vol.name){
                    found = true;
                }
            }
            suffix++;
        }
        return name;
    }
}
