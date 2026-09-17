
import * as THREE from "../../libs/three.js/build/three.module.js";
import { SitePlan } from "./SitePlan.js";
import {Utils} from "../utils.js";
import { EventDispatcher } from "../EventDispatcher.js";


export class SitePlanTool extends EventDispatcher {
    constructor (viewer) {
        super();

        this.viewer = viewer;
        this.renderer = viewer.renderer;

        this.addEventListener('start_inserting_sitePlan', e => {
            this.viewer.dispatchEvent({
                type: 'cancel_insertions'
            });
        });

        this.scene = new THREE.Scene();
        this.scene.name = 'scene_sitePlan';
        this.light = new THREE.PointLight(0xffffff, 1.0);
        this.scene.add(this.light);

        this.viewer.inputHandler.registerInteractiveScene(this.scene);

        this.onRemove = e => this.scene.remove(e.sitePlan);
        this.onAdd = e => this.scene.add(e.sitePlan);

        for(let sitePlan of viewer.scene.sitePlans){
            this.onAdd({sitePlan: sitePlan});
        }

        viewer.addEventListener("update", this.update.bind(this));
        viewer.addEventListener("render.pass.perspective_overlay", this.render.bind(this));
        viewer.addEventListener("scene_changed", this.onSceneChange.bind(this));

        viewer.scene.addEventListener('sitePlan_added', this.onAdd);
        viewer.scene.addEventListener('sitePlan_removed', this.onRemove);
    }

    onSceneChange(e){
        if(e.oldScene){
            e.oldScene.removeEventListeners('sitePlan_added', this.onAdd);
            e.oldScene.removeEventListeners('sitePlan_removed', this.onRemove);
        }

        e.scene.addEventListener('sitePlan_added', this.onAdd);
        e.scene.addEventListener('sitePlan_removed', this.onRemove);
    }

    startInsertion (args = {}) {
        let domElement = this.viewer.renderer.domElement;

        let sitePlan = new SitePlan();
        sitePlan.name = args.name || 'SitePlan';

        this.dispatchEvent({
            type: 'start_inserting_sitePlan',
            sitePlan: sitePlan
        });

        this.scene.add(sitePlan);

        let cancel = {
            callback: null
        };

        let insertionCallback = (e) => {
            if(e.button === THREE.MOUSE.LEFT){
                if(sitePlan.points.length <= 1){
                    let camera = this.viewer.scene.getActiveCamera();
                    let distance = camera.position.distanceTo(sitePlan.points[0]);
                    let clientSize = this.viewer.renderer.getSize(new THREE.Vector2());
                    let pr = Utils.projectedRadius(1, camera, distance, clientSize.width, clientSize.height);
                    let width = (10 / pr);

                    sitePlan.setWidth(width);
                }

                sitePlan.addMarker(sitePlan.points[sitePlan.points.length - 1].clone());

                this.viewer.inputHandler.startDragging(
                    sitePlan.spheres[sitePlan.spheres.length - 1]);
            } else if (e.button === THREE.MOUSE.RIGHT) {
                cancel.callback();
            }
        };

        cancel.callback = e => {
            sitePlan.removeMarker(sitePlan.points.length - 1);
            domElement.removeEventListener('mouseup', insertionCallback, false);
            this.viewer.removeEventListener('cancel_insertions', cancel.callback);
        };

        this.viewer.addEventListener('cancel_insertions', cancel.callback);
        domElement.addEventListener('mouseup', insertionCallback, false);

        sitePlan.addMarker(new THREE.Vector3(0, 0, 0));
        this.viewer.inputHandler.startDragging(
            sitePlan.spheres[sitePlan.spheres.length - 1]);

        this.viewer.scene.addSitePlan(sitePlan);

        return sitePlan;
    }
    
    update(){
        let camera = this.viewer.scene.getActiveCamera();
        let sitePlans = this.viewer.scene.sitePlans;
        let renderAreaSize = this.viewer.renderer.getSize(new THREE.Vector2());
        let clientWidth = renderAreaSize.width;
        let clientHeight = renderAreaSize.height;

        this.light.position.copy(camera.position);

        // make size independant of distance
        for(let sitePlan of sitePlans){
            for(let sphere of sitePlan.spheres){				
                let distance = camera.position.distanceTo(sphere.getWorldPosition(new THREE.Vector3()));
                let pr = Utils.projectedRadius(1, camera, distance, clientWidth, clientHeight);
                let scale = (15 / pr);
                sphere.scale.set(scale, scale, scale);
            }
        }
    }

    render(){
        this.viewer.renderer.render(this.scene, this.viewer.scene.getActiveCamera());
    }

}
