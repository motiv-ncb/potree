
import * as THREE from "../../libs/three.js/build/three.module.js";
import {Utils} from "../utils.js";

export class SitePlan extends THREE.Object3D{

    constructor () {
        super();

        this.constructor.counter = (this.constructor.counter === undefined) ? 0 : this.constructor.counter + 1;

        this.name = 'Profile_' + this.constructor.counter;
        this.points = [];
        this.spheres = [];
        this.boxes = [];
        this.width = 1;
        this._modifiable = true;

        this.sphereGeometry = new THREE.SphereGeometry(0.4, 10, 10);
        this.color = new THREE.Color(0xff0000);
        this.lineColor = new THREE.Color(0xff0000);

        this.coneGeometry = new THREE.ConeGeometry( 0.4, 1, 10 );

        this.upObject = new THREE.Mesh(this.coneGeometry, this.createSphereMaterial());
        this.downObject = new THREE.Mesh(this.coneGeometry, this.createSphereMaterial());
        this.upObject.rotation.x = Math.PI / 2;
        this.downObject.rotation.x = - Math.PI / 2;
        let shift = 1.5
        this.upObject.position.z = shift
        this.downObject.position.z = -shift;
        this.setTopBottomEvent();
    }

    createSphereMaterial () {
        let sphereMaterial = new THREE.MeshLambertMaterial({
            //shading: THREE.SmoothShading,
            color: 0xff0000,
            depthTest: false,
            depthWrite: false}
        );

        return sphereMaterial;
    };

    setTopBottomEvent(){

        let upDrag = (e) => {
            let p = this.getMouseVerticalPlaneIntersection(e.drag.end,e.viewer.scene.getActiveCamera(),e.viewer, this.points[0]);
                        this.upObject.material.emissive.setHex(0x000000);

            this.setPosition(0, new THREE.Vector3(this.points[0].x, this.points[0].y, p.z + 1.5 / this.spheres[0].scale.z))

            this.update();
        };

        let downDrag = (e) => {
            let p = this.getMouseVerticalPlaneIntersection(e.drag.end,e.viewer.scene.getActiveCamera(),e.viewer, this.points[0]);
             this.downObject.material.emissive.setHex(0x000000);
            // this.points[0].z = p.z + 1.5 / this.spheres[0].scale.z;
            this.setPosition(0, new THREE.Vector3(this.points[0].x, this.points[0].y,  p.z + 1.5 / this.spheres[0].scale.z))
           
            this.update();
        }; 

        let mouseover = (e) => e.object.material.emissive.setHex(0x888888);
        let mouseleave = (e) => e.object.material.emissive.setHex(0x000000);

        this.upObject.addEventListener('drag', upDrag);
        this.downObject.addEventListener('drag', downDrag);

        this.upObject.addEventListener('mouseover', mouseover);
        this.upObject.addEventListener('mouseleave', mouseleave);

        this.downObject.addEventListener('mouseover', mouseover);
        this.downObject.addEventListener('mouseleave', mouseleave);

    }    

    getMouseVerticalPlaneIntersection(mouse, camera, viewer, point){
        let renderer = viewer.renderer;
        
        let nmouse = {
            x: (mouse.x / renderer.domElement.clientWidth) * 2 - 1,
            y: -(mouse.y / renderer.domElement.clientHeight) * 2 + 1
        };

        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(nmouse, camera);
        let ray = raycaster.ray;
        const direction = ray.direction;
        let plane = new THREE.Plane();
        plane.setFromNormalAndCoplanarPoint(direction, point);
        let target = new THREE.Vector3();
        ray.intersectPlane(plane,target);
        return target;
    }

    addMarker (point) {
        this.points.push(point);

        let sphere = new THREE.Mesh(this.sphereGeometry, this.createSphereMaterial());

        this.add(sphere);
        this.spheres.push(sphere);

        sphere.add(this.upObject);
        sphere.add(this.downObject);
        
        let boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        let boxMaterial = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: true, opacity: 0.2});
        let box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.visible = false;

        this.add(box);
        this.boxes.push(box);
        

        { // event listeners
            let drag = (e) => {
                let I = Utils.getMousePointCloudIntersection(
                    e.drag.end, 
                    e.viewer.scene.getActiveCamera(), 
                    e.viewer, 
                    e.viewer.scene.pointclouds);

                if (I) {
                    let i = this.spheres.indexOf(e.drag.object);
                    if (i !== -1) {
                        this.setPosition(i, I.location);
                        //this.dispatchEvent({
                        //	'type': 'marker_moved',
                        //	'profile': this,
                        //	'index': i
                        //});
                    }
                }
            };

            let drop = e => {
                let i = this.spheres.indexOf(e.drag.object);
                if (i !== -1) {
                    this.dispatchEvent({
                        'type': 'marker_dropped',
                        'profile': this,
                        'index': i
                    });
                }
            };

            let mouseover = (e) => e.object.material.emissive.setHex(0x888888);
            let mouseleave = (e) => e.object.material.emissive.setHex(0x000000);

            sphere.addEventListener('drag', drag);
            sphere.addEventListener('drop', drop);
            sphere.addEventListener('mouseover', mouseover);
            sphere.addEventListener('mouseleave', mouseleave);
        }

        let event = {
            type: 'marker_added',
            profile: this,
            sphere: sphere
        };
        this.dispatchEvent(event);

        this.setPosition(this.points.length - 1, point);
    }

    removeMarker (index) {
        this.points.splice(index, 1);

        this.remove(this.spheres[index]);

        let edgeIndex = (index === 0) ? 0 : (index - 1);
      
        this.remove(this.boxes[edgeIndex]);
        this.boxes.splice(edgeIndex, 1);

        this.spheres.splice(index, 1);

        this.update();

        this.dispatchEvent({
            'type': 'marker_removed',
            'profile': this
        });
    }

    setPosition (index, position) {
        let point = this.points[index];
        point.copy(position);

        let event = {
            type: 'marker_moved',
            profile:	this,
            index:	index,
            position: point.clone()
        };
        this.dispatchEvent(event);

        this.update();
    }

    setWidth (width) {
        this.width = width;

        let event = {
            type: 'width_changed',
            profile:	this,
            width:	width
        };
        this.dispatchEvent(event);

        this.update();
    }

    getWidth () {
        return this.width;
    }

    update () {
        if (this.points.length === 0) {
            return;
        } else if (this.points.length === 1) {
            let point = this.points[0];
            this.spheres[0].position.copy(point);
            this.boxes[0].position.copy(point);
            this.boxes[0].scale.set(1000000, 1000000, this.width);
            return;
        }
    }

    raycast (raycaster, intersects) {
        for (let i = 0; i < this.points.length; i++) {
            let sphere = this.spheres[i];

            sphere.raycast(raycaster, intersects);
        }
        this.upObject.raycast(raycaster, intersects);
        this.downObject.raycast(raycaster, intersects);

        // recalculate distances because they are not necessarely correct
        // for scaled objects.
        // see https://github.com/mrdoob/three.js/issues/5827
        // TODO: remove this once the bug has been fixed
        for (let i = 0; i < intersects.length; i++) {
            let I = intersects[i];
            I.distance = raycaster.ray.origin.distanceTo(I.point);
        }
        intersects.sort(function (a, b) { return a.distance - b.distance; });
    };

    get modifiable () {
        return this._modifiable;
    }

    set modifiable (value) {
        this._modifiable = value;
        this.update();
    }

}
