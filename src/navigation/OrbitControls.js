/**
 * @author mschuetz / http://mschuetz.at
 *
 * adapted from THREE.OrbitControls by
 *
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 *
 *
 *
 */

import * as THREE from "../../libs/three.js/build/three.module.js";
import {MOUSE} from "../defines.js";
import {Utils} from "../utils.js";
import {EventDispatcher} from "../EventDispatcher.js";

 
export class OrbitControls extends EventDispatcher{
	
	constructor(viewer){
		super();
		
		this.viewer = viewer;
		this.renderer = viewer.renderer;

		this.scene = null;
		this.sceneControls = new THREE.Scene();

		this.rotationSpeed = 5;

		this.fadeFactor = 20;
		this.yawDelta = 0;
		this.pitchDelta = 0;
		this.panDelta = new THREE.Vector2(0, 0);
		this.radiusDelta = 0;

		this.doubleClockZoomEnabled = true;

		this.tweens = [];

        this.rotateNode = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshNormalMaterial());
        // this.pivotNode  = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshNormalMaterial());
        this.rotateAboutRotateNode = false;
        this.rotateNode.visible = false;
        this.viewer.scene.scene.add(this.rotateNode);
        // this.viewer.scene.scene.add(this.pivotNode);
        // this.pivotNode.scale.set(0.3,0.3, 0.3);
        this.currentMouse = {x:0, y:0};

        let mouseup = (e)=>{
            this.rotateNode.visible = false;
        }

        let mousemove = (e)=>{
            this.currentMouse.x = e.offsetX;
            this.currentMouse.y = e.offsetY;
        }

		let drag = (e) => {
			if (e.drag.object !== null) {
				return;
			}

			if (e.drag.startHandled === undefined) {
				e.drag.startHandled = true;

				this.dispatchEvent({type: 'start'});
              
                if(e.drag.mouse === MOUSE.LEFT){
                    let I = Utils.getMousePointCloudIntersection(
                    e.drag.start,
                    this.scene.getActiveCamera(),
                    this.viewer,
                    this.scene.pointclouds,
                    {pickClipped: true});
                    if (I === null) {
                        this.rotateNode.visible = false;
                        this.rotateAboutRotateNode = false;
                    } 
                    else{
                        this.rotateNode.visible = true;
                        this.rotateAboutRotateNode = true;
                        this.rotateNode.position.set(I.location.x,I.location.y,I.location.z);
                        // set node side depending on camera;
                        const camera = viewer.scene.getActiveCamera();
                        if(camera.type == "PerspectiveCamera"){
                            this.rotateNode.scale.set(I.distance / 100 ,I.distance / 100,I.distance / 100);
                        }
                        else{
                            // console.log(camera);
                            this.rotateNode.scale.set(I.distance / 100 ,I.distance / 100,I.distance / 100);
                        }
                    }
                }
                else if (e.drag.mouse === MOUSE.RIGHT){
                    let view = this.scene.view;
                    let I = Utils.getMousePointCloudIntersection(
                    e.drag.start,
                    this.scene.getActiveCamera(),
                    this.viewer,
                    this.scene.pointclouds,
                    {pickClipped: true});
                    if (I === null) {
                    } 
                    else{
			            let domElement = this.renderer.domElement;
                        let ray = Utils.mouseToRay(this.currentMouse, this.scene.getActiveCamera(), domElement.clientWidth, domElement.clientHeight);
                        let cameraToI =new THREE.Vector3().subVectors(I.location, view.position)
                        let dragPosition = new THREE.Vector3().addVectors(view.position, cameraToI.projectOnVector(view.direction)) ;
                        view.radius = dragPosition.distanceTo(view.position);
                    }
                 }
			}

			let ndrag = {
				x: e.drag.lastDrag.x / this.renderer.domElement.clientWidth,
				y: e.drag.lastDrag.y / this.renderer.domElement.clientHeight
			};

			if (e.drag.mouse === MOUSE.LEFT) {
				this.yawDelta += ndrag.x * this.rotationSpeed;
				this.pitchDelta += ndrag.y * this.rotationSpeed;

				this.stopTweens();
			} else if (e.drag.mouse === MOUSE.RIGHT) {
				this.panDelta.x += ndrag.x;
				this.panDelta.y += ndrag.y;
				this.stopTweens();
			}
		};

		let drop = e => {
			this.dispatchEvent({type: 'end'});
		};

		let scroll = (e) => {
			let resolvedRadius = this.scene.view.radius + this.radiusDelta;

			this.radiusDelta += -e.delta * resolvedRadius * 0.1;

			this.stopTweens();
		};

		let dblclick = (e) => {
			if(this.doubleClockZoomEnabled){
				this.zoomToLocation(e.mouse);
			}
		};

		let previousTouch = null;
		let touchStart = e => {
			previousTouch = e;
		};

		let touchEnd = e => {
			previousTouch = e;
		};

		let touchMove = e => {
			if (e.touches.length === 2 && previousTouch.touches.length === 2){
				let prev = previousTouch;
				let curr = e;

				let prevDX = prev.touches[0].pageX - prev.touches[1].pageX;
				let prevDY = prev.touches[0].pageY - prev.touches[1].pageY;
				let prevDist = Math.sqrt(prevDX * prevDX + prevDY * prevDY);

				let currDX = curr.touches[0].pageX - curr.touches[1].pageX;
				let currDY = curr.touches[0].pageY - curr.touches[1].pageY;
				let currDist = Math.sqrt(currDX * currDX + currDY * currDY);

				let delta = currDist / prevDist;
				let resolvedRadius = this.scene.view.radius + this.radiusDelta;
				let newRadius = resolvedRadius / delta;
				this.radiusDelta = newRadius - resolvedRadius;

				this.stopTweens();
			}else if(e.touches.length === 3 && previousTouch.touches.length === 3){
				let prev = previousTouch;
				let curr = e;

				let prevMeanX = (prev.touches[0].pageX + prev.touches[1].pageX + prev.touches[2].pageX) / 3;
				let prevMeanY = (prev.touches[0].pageY + prev.touches[1].pageY + prev.touches[2].pageY) / 3;

				let currMeanX = (curr.touches[0].pageX + curr.touches[1].pageX + curr.touches[2].pageX) / 3;
				let currMeanY = (curr.touches[0].pageY + curr.touches[1].pageY + curr.touches[2].pageY) / 3;

				let delta = {
					x: (currMeanX - prevMeanX) / this.renderer.domElement.clientWidth,
					y: (currMeanY - prevMeanY) / this.renderer.domElement.clientHeight
				};

				this.panDelta.x += delta.x;
				this.panDelta.y += delta.y;

				this.stopTweens();
			}

			previousTouch = e;
		};

		this.addEventListener('touchstart', touchStart);
		this.addEventListener('touchend', touchEnd);
		this.addEventListener('touchmove', touchMove);
		this.addEventListener('drag', drag);
		this.addEventListener('drop', drop);
		this.addEventListener('mousewheel', scroll);
		this.addEventListener('dblclick', dblclick);
        window.addEventListener('mousemove', mousemove);
        window.addEventListener('mouseup', mouseup); // use windows for mouseup ouside of scene
	}

	setScene (scene) {
		this.scene = scene;
	}

	stop(){
		this.yawDelta = 0;
		this.pitchDelta = 0;
		this.radiusDelta = 0;
		this.panDelta.set(0, 0);
	}
	
	zoomToLocation(mouse){
		let camera = this.scene.getActiveCamera();
		
		let I = Utils.getMousePointCloudIntersection(
			mouse,
			camera,
			this.viewer,
			this.scene.pointclouds,
			{pickClipped: true});

		if (I === null) {
			return;
		}

		let targetRadius = 0;
		{
			let minimumJumpDistance = 0.2;

			let domElement = this.renderer.domElement;
			let ray = Utils.mouseToRay(mouse, camera, domElement.clientWidth, domElement.clientHeight);

			let nodes = I.pointcloud.nodesOnRay(I.pointcloud.visibleNodes, ray);
			let lastNode = nodes[nodes.length - 1];
			let radius = lastNode.getBoundingSphere(new THREE.Sphere()).radius;
			targetRadius = Math.min(this.scene.view.radius, radius);
			targetRadius = Math.max(minimumJumpDistance, targetRadius);
		}

		let d = this.scene.view.direction.multiplyScalar(-1);
		let cameraTargetPosition = new THREE.Vector3().addVectors(I.location, d.multiplyScalar(targetRadius));
		// TODO Unused: let controlsTargetPosition = I.location;

		let animationDuration = 600;
		let easing = TWEEN.Easing.Quartic.Out;

		{ // animate
			let value = {x: 0};
			let tween = new TWEEN.Tween(value).to({x: 1}, animationDuration);
			tween.easing(easing);
			this.tweens.push(tween);

			let startPos = this.scene.view.position.clone();
			let targetPos = cameraTargetPosition.clone();
			let startRadius = this.scene.view.radius;
			let targetRadius = cameraTargetPosition.distanceTo(I.location);

			tween.onUpdate(() => {
				let t = value.x;
				this.scene.view.position.x = (1 - t) * startPos.x + t * targetPos.x;
				this.scene.view.position.y = (1 - t) * startPos.y + t * targetPos.y;
				this.scene.view.position.z = (1 - t) * startPos.z + t * targetPos.z;

				this.scene.view.radius = (1 - t) * startRadius + t * targetRadius;
				this.viewer.setMoveSpeed(this.scene.view.radius);
			});

			tween.onComplete(() => {
				this.tweens = this.tweens.filter(e => e !== tween);
			});

			tween.start();
		}
	}

	stopTweens () {
		this.tweens.forEach(e => e.stop());
		this.tweens = [];
	}

	update (delta) {
		let view = this.scene.view;

		{ // apply rotation
			let progression = Math.min(1, this.fadeFactor * delta);

			let yaw = view.yaw;
			let pitch = view.pitch;
			let pivot = view.getPivot();
            const invPreviousMatrix =this.getMatrixFromPositionPitchYaw(view, view.position, pitch, yaw).invert();     

			yaw -= progression * this.yawDelta;
			pitch -= progression * this.pitchDelta;

			view.yaw = yaw;
			view.pitch = pitch;

			let V = this.scene.view.direction.multiplyScalar(-view.radius);
			let position = new THREE.Vector3().addVectors(pivot, V);

			view.position.copy(position);
            if(this.rotateAboutRotateNode){
                const currentMatrix = this.getMatrixFromPositionPitchYaw(view, view.position, pitch, yaw);
                const nodePosition = this.rotateNode.position.clone();
                nodePosition.applyMatrix4(invPreviousMatrix); // relative position to previous camara matrix
                nodePosition.applyMatrix4(currentMatrix); // global position if the node was attacned  
                const RotateNodeDelta = new THREE.Vector3().subVectors(nodePosition, this.rotateNode.position);
                view.position.copy( new THREE.Vector3().subVectors(view.position, RotateNodeDelta));
            }
		}

		if(Math.abs(this.panDelta.x) > 0.0001 || Math.abs(this.panDelta.y) > 0.0001) { // apply pan
			let progression = Math.min(1, this.fadeFactor * delta);
			let panDistance = progression * view.radius * 3;

			let px = -this.panDelta.x * panDistance;
			let py = this.panDelta.y * panDistance;

			view.pan(px, py);
		}

		 if(Math.abs(this.radiusDelta) > 0.0001) { // apply zoom
           
            let progression = Math.min(1, this.fadeFactor * delta);

            // let radius = view.radius + progression * this.radiusDelta * view.radius * 0.1;
            let radius = view.radius + progression * this.radiusDelta;
            let ratio = radius / view.radius;

            let V = view.direction.multiplyScalar(-radius);

            let targetPosition;
            let I = Utils.getMousePointCloudIntersection(
            this.currentMouse,
            this.scene.getActiveCamera(),
            this.viewer,
            this.scene.pointclouds,
            {pickClipped: true});
            if (I === null) {
                let domElement = this.renderer.domElement;
                let ray = Utils.mouseToRay(this.currentMouse, this.scene.getActiveCamera(), domElement.clientWidth, domElement.clientHeight);
                targetPosition = new THREE.Vector3().addVectors(view.position, ray.direction.multiplyScalar( view.radius / Math.cos(ray.direction.dot(view.direction))));
            } 
            else{
                targetPosition = new THREE.Vector3(I.location.x,I.location.y,I.location.z);
            }

            let zoomNodeToPivot = new THREE.Vector3().subVectors(view.getPivot(),targetPosition);
            let pivotPosition = new THREE.Vector3().addVectors(zoomNodeToPivot.multiplyScalar(ratio),targetPosition);
            let position = new THREE.Vector3().addVectors(pivotPosition, V);
            radius = pivotPosition.distanceTo(position);
			view.radius = radius;

			view.position.copy(position);
		}

        // {
        //     const pivot = view.getPivot();
        //     this.pivotNode.position.set(pivot.x,pivot.y,pivot.z);
        // }

		{
			let speed = view.radius;
			this.viewer.setMoveSpeed(speed);
		}

		{ // decelerate over time
			let progression = Math.min(1, this.fadeFactor * delta);
			let attenuation = Math.max(0, 1 - this.fadeFactor * delta);

			this.yawDelta *= attenuation;
			this.pitchDelta *= attenuation;
			this.panDelta.multiplyScalar(attenuation);
			// this.radiusDelta *= attenuation;
			this.radiusDelta -= progression * this.radiusDelta;
		}
	}

    getMatrixFromPositionPitchYaw(view, position, pitch, yaw){
        const p = this._pitch = Math.max(Math.min(pitch, view.maxPitch), view.minPitch);
        const scale = new THREE.Vector3(1, 1, 1);
        const matrix = new THREE.Matrix4();
        const quaternion = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(Math.PI / 2 + p, 0 ,yaw,"ZXY")
        );
        matrix.compose(position, quaternion, scale);
        return matrix;
    }
};
