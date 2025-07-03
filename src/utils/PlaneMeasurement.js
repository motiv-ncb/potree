
import * as THREE from "../../libs/three.js/build/three.module.js";
import {TextSprite} from "../TextSprite.js";
import {Utils} from "../utils.js";
import {Line2} from "../../libs/three.js/lines/Line2.js";
import {LineGeometry} from "../../libs/three.js/lines/LineGeometry.js";
import {LineMaterial} from "../../libs/three.js/lines/LineMaterial.js";
import { BoxVolume, Volume } from "./Volume.js";

export class PlaneMesurement extends Volume {

    constructor(args = {}){
        super(args);

        this.constructor.counter = (this.constructor.counter === undefined) ? 0 : this.constructor.counter + 1;
        this.name = 'box_' + this.constructor.counter;
        const thickness = 0.001;
        let boxGeometry = new THREE.BoxGeometry(thickness, 1, 1);
        boxGeometry.computeBoundingBox();

        let boxFrameGeometry = new THREE.Geometry();
        {
            let Vector3 = THREE.Vector3;
           
            boxFrameGeometry.vertices.push(

                // bottom
                new Vector3(-thickness / 2, -0.5, 0.5),
                new Vector3(thickness / 2, -0.5, 0.5),
                new Vector3(thickness / 2, -0.5, 0.5),
                new Vector3(thickness / 2, -0.5, -0.5),
                new Vector3(thickness / 2, -0.5, -0.5),
                new Vector3(-thickness / 2, -0.5, -0.5),
                new Vector3(-thickness / 2, -0.5, -0.5),
                new Vector3(-thickness / 2, -0.5, 0.5),
                // top
                new Vector3(-thickness / 2, 0.5, 0.5),
                new Vector3(thickness / 2, 0.5, 0.5),
                new Vector3(thickness / 2, 0.5, 0.5),
                new Vector3(thickness / 2, 0.5, -0.5),
                new Vector3(thickness / 2, 0.5, -0.5),
                new Vector3(-thickness / 2, 0.5, -0.5),
                new Vector3(-thickness / 2, 0.5, -0.5),
                new Vector3(-thickness / 2, 0.5, 0.5),
                // sides
                new Vector3(-thickness / 2, -0.5, 0.5),
                new Vector3(-thickness / 2, 0.5, 0.5),
                new Vector3(thickness / 2, -0.5, 0.5),
                new Vector3(thickness / 2, 0.5, 0.5),
                new Vector3(thickness / 2, -0.5, -0.5),
                new Vector3(thickness / 2, 0.5, -0.5),
                new Vector3(-thickness / 2, -0.5, -0.5),
                new Vector3(-thickness / 2, 0.5, -0.5),

            );

        }

        this.material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3,
            depthTest: true,
            depthWrite: false});
        this.box = new THREE.Mesh(boxGeometry, this.material);
        this.box.geometry.computeBoundingBox();
        this.boundingBox = this.box.geometry.boundingBox;
        this.add(this.box);

        this.frame = new THREE.LineSegments(boxFrameGeometry, new THREE.LineBasicMaterial({color: 0x000000}));
        // this.frame.mode = THREE.Lines;
        this.add(this.frame);

        this.update();
    }

    update(){
            this.boundingBox = this.box.geometry.boundingBox;
            this.boundingSphere = this.boundingBox.getBoundingSphere(new THREE.Sphere());
    
            if (this._clip) {
                this.box.visible = false;
                this.label.visible = false;
            } else {
                this.box.visible = true;
                this.label.visible = this.showVolumeLabel;
            }
        }
    
        raycast (raycaster, intersects) {
            let is = [];
            this.box.raycast(raycaster, is);
    
            if (is.length > 0) {
                let I = is[0];
                intersects.push({
                    distance: I.distance,
                    object: this,
                    point: I.point.clone()
                });
            }
        }
    


    getVolume(){
        return 0;
    }
    
}