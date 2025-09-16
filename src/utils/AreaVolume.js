
import * as THREE from "../../libs/three.js/build/three.module.js";
import {TextSprite} from "../TextSprite.js";
import {Utils} from "../utils.js";
import {Line2} from "../../libs/three.js/lines/Line2.js";
import {LineGeometry} from "../../libs/three.js/lines/LineGeometry.js";
import {LineMaterial} from "../../libs/three.js/lines/LineMaterial.js";
import { Volume } from "./Volume.js";

function createHeightLine(){
	let lineGeometry = new LineGeometry();

	lineGeometry.setPositions([
		0, 0, 0,
		0, 0, 0,
	]);

	let lineMaterial = new LineMaterial({ 
		color: 0x00ff00, 
		dashSize: 5, 
		gapSize: 2,
		linewidth: 2, 
		resolution:  new THREE.Vector2(1000, 1000),
	});

	lineMaterial.depthTest = false;
	const heightEdge = new Line2(lineGeometry, lineMaterial);
	heightEdge.visible = false;

	//this.add(this.heightEdge);
	
	return heightEdge;
}

function createHeightLabel(){
	const heightLabel = new TextSprite('');

	heightLabel.setTextColor({r: 140, g: 250, b: 140, a: 1.0});
	heightLabel.setBorderColor({r: 0, g: 0, b: 0, a: 1.0});
	heightLabel.setBackgroundColor({r: 0, g: 0, b: 0, a: 1.0});
	heightLabel.fontsize = 16;
	heightLabel.material.depthTest = false;
	heightLabel.material.opacity = 1;
	heightLabel.visible = false;

	return heightLabel;
}

function createAreaLabel(){
	const areaLabel = new TextSprite('');

	areaLabel.setTextColor({r: 140, g: 250, b: 140, a: 1.0});
	areaLabel.setBorderColor({r: 0, g: 0, b: 0, a: 1.0});
	areaLabel.setBackgroundColor({r: 0, g: 0, b: 0, a: 1.0});
	areaLabel.fontsize = 16;
	areaLabel.material.depthTest = false;
	areaLabel.material.opacity = 1;
	areaLabel.visible = false;
	
	return areaLabel;
}

function createCircleRadiusLabel(){
	const circleRadiusLabel = new TextSprite("");

	circleRadiusLabel.setTextColor({r: 140, g: 250, b: 140, a: 1.0});
	circleRadiusLabel.setBorderColor({r: 0, g: 0, b: 0, a: 1.0});
	circleRadiusLabel.setBackgroundColor({r: 0, g: 0, b: 0, a: 1.0});
	circleRadiusLabel.fontsize = 16;
	circleRadiusLabel.material.depthTest = false;
	circleRadiusLabel.material.opacity = 1;
	circleRadiusLabel.visible = false;
	
	return circleRadiusLabel;
}

function createCircleRadiusLine(){
	const lineGeometry = new LineGeometry();

	lineGeometry.setPositions([
		0, 0, 0,
		0, 0, 0,
	]);

	const lineMaterial = new LineMaterial({ 
		color: 0xff0000, 
		linewidth: 2, 
		resolution:  new THREE.Vector2(1000, 1000),
		gapSize: 1,
		dashed: true,
	});

	lineMaterial.depthTest = false;

	const circleRadiusLine = new Line2(lineGeometry, lineMaterial);
	circleRadiusLine.visible = false;

	return circleRadiusLine;
}

function createCircleLine(){
	const coordinates = [];

	let n = 128;
	for(let i = 0; i <= n; i++){
		let u0 = 2 * Math.PI * (i / n);
		let u1 = 2 * Math.PI * (i + 1) / n;

		let p0 = new THREE.Vector3(
			Math.cos(u0), 
			Math.sin(u0), 
			0
		);

		let p1 = new THREE.Vector3(
			Math.cos(u1), 
			Math.sin(u1), 
			0
		);

		coordinates.push(
			...p0.toArray(),
			...p1.toArray(),
		);
	}

	const geometry = new LineGeometry();
	geometry.setPositions(coordinates);

	const material = new LineMaterial({ 
		color: 0xff0000, 
		dashSize: 5, 
		gapSize: 2,
		linewidth: 2, 
		resolution:  new THREE.Vector2(1000, 1000),
	});

	material.depthTest = false;

	const circleLine = new Line2(geometry, material);
	circleLine.visible = false;
	circleLine.computeLineDistances();

	return circleLine;
}

function createCircleCenter(){
	const sg = new THREE.SphereGeometry(1, 32, 32);
	const sm = new THREE.MeshNormalMaterial();
	
	const circleCenter = new THREE.Mesh(sg, sm);
	circleCenter.visible = false;

	return circleCenter;
}



export class AreaVolume extends Volume {
	constructor () {
		super();

		this.constructor.counter = (this.constructor.counter === undefined) ? 0 : this.constructor.counter + 1;

		this.name = 'Measure_' + this.constructor.counter;
		this.points = [];
		this._showDistances = true;
		this._showCoordinates = false;
		this._showArea = false;
		this._closed = true;
		this._showAngles = false;
		this._showCircle = false;
		this._showHeight = false;
		this._showEdges = true;
        // for cmair
        this._showVolume = false;
		this.maxMarkers = Number.MAX_SAFE_INTEGER;

		this.sphereGeometry = new THREE.SphereGeometry(0.4, 10, 10);
		this.color = new THREE.Color(0xff0000);
        this.topBottomColor  = new THREE.Color(0xff00ff);
		this.spheres = [];
		this.edges = [];
		this.sphereLabels = [];
		this.edgeLabels = [];
		this.angleLabels = [];
		this.coordinateLabels = [];

		this.heightEdge = createHeightLine();
		this.heightLabel = createHeightLabel();
		this.areaLabel = createAreaLabel();
		this.circleRadiusLabel = createCircleRadiusLabel();
		this.circleRadiusLine = createCircleRadiusLine();
		this.circleLine = createCircleLine();
		this.circleCenter = createCircleCenter();


		this.add(this.heightEdge);
		this.add(this.heightLabel);
		this.add(this.areaLabel);
		this.add(this.circleRadiusLabel);
		this.add(this.circleRadiusLine);
		this.add(this.circleLine);
		this.add(this.circleCenter);


        this.extrude = new THREE.Mesh();
        this.material =this.createVolumeMaterial();
	    this.extrude.material = this.material;
        this.extrude.geometry.computeBoundingBox();
		this.boundingBox = this.extrude.geometry.boundingBox;

        this.extrude.addEventListener('select', e=>{this.makeSelection();});
        const frameMaterial = new THREE.LineBasicMaterial({color: 0x000000});
        const selectedFrameMaterial = new THREE.LineBasicMaterial({color: 0xffff00});
		this.add(this.extrude);

        this.frame = new THREE.LineSegments();
        this.frame.material = frameMaterial;
        this.add(this.frame);

        // override from base
        this.label.updateMatrixWorld = () => {

            if(this.topSphere){
                this.label.position.x = this.topSphere.position.x;
                this.label.position.y = this.topSphere.position.y;
                if(this.bottomSphere){
                    this.label.position.z = (this.topSphere.position.z + this.bottomSphere.position.z) / 2;
                }
            }
            this.label.updateMatrix();
            this.label.matrixWorld.copy(this.label.matrix);
            this.label.matrixWorldNeedsUpdate = false;

            for (let i = 0, l = this.label.children.length; i < l; i++) {
                this.label.children[ i ].updateMatrixWorld(true);
            }
        };

        { // event listeners
			this.addEventListener('select', e => {  
                this.frame.material = selectedFrameMaterial;
            });
			this.addEventListener('deselect', e => {
                this.frame.material = frameMaterial;
            });
		}
    }

	createSphereMaterial () {
		let sphereMaterial = new THREE.MeshBasicMaterial({
			//shading: THREE.SmoothShading,
			color: this.color,
			depthTest: false,
			depthWrite: false}
		);

		return sphereMaterial;
	};

    createTopBottomSphereMaterial () {
		let sphereMaterial = new THREE.MeshBasicMaterial({
			//shading: THREE.SmoothShading,
			color: this.topBottomColor,
			depthTest: false,
			depthWrite: false}
		);

		return sphereMaterial;
	};
    

    createVolumeMaterial () {
        let volumeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3,
            depthTest: true,
            depthWrite: false});
        return volumeMaterial;
    }

    updatePointElevations(){
        // update points elevation
        const topLevel = this.topSphere ? this.topSphere.position.z : this.getMaxZ();
        const bottomLevel = this.bottomSphere ? this.bottomSphere.position.z : this.getMinZ();
        const shiftZ = (topLevel + bottomLevel) / 2;
        const nPoint = this.points.length 

        for(let i = 0; i < nPoint; i++){
            const x = this.points[i].position.x;
            const y = this.points[i].position.y;
            this.points[i].position.set(x,y,shiftZ);
        }
    }

    updateVolumeGeometry (){
        const nPoint = this.points.length 
        if(nPoint > 2){
            let shape = new THREE.Shape();
            if(nPoint > 0){
                shape.moveTo( -this.points[0].position.y,this.points[0].position.x );
                for(let i = 1; i < nPoint ;i++){
                    shape.lineTo( -this.points[i].position.y,this.points[i].position.x );
                }
                shape.lineTo( -this.points[0].position.y,this.points[0].position.x );
            }
    
            let minZ = this.getMinZ();
            let maxZ = this.getMaxZ();
            if(this.topSphere){
                maxZ = this.topSphere.position.z;
            }
            if(this.bottomSphere){
                minZ = this.bottomSphere.position.z;
            }
            const shiftZ = (maxZ + minZ) / 2;
            const depth = (maxZ - minZ) / 2
            const path = new THREE.CurvePath();
            
            path.add(new THREE.LineCurve3(
                new THREE.Vector3(0, 0, shiftZ-depth),  // Start
                new THREE.Vector3(0, 0, shiftZ+depth)   // End
              ));
    
            this.label.position.z = shiftZ;

            const extrudeSettings = {
                steps: 1,
                extrudePath: path,
                bevelEnabled: false
            };

            // Remove old geometry
            this.extrude.geometry.dispose();
            // Create new geometry
            const newGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            this.extrude.geometry = newGeometry;
            //this.extrude.position.set(0, 0, -depth);
            this.extrude.geometry.computeBoundingBox();
        
       //     this.boundingBox = this.extrude.geometry.boundingBox;
    
            let frameGeometry = new THREE.Geometry();
            {
                let Vector3 = THREE.Vector3;     
                for(let i = 0; i < nPoint; i++){
                    let j = i < (nPoint - 1)? (i + 1):0;
                    frameGeometry.vertices.push(
                        new Vector3(this.points[i].position.x,this.points[i].position.y, shiftZ-depth),
                        new Vector3(this.points[i].position.x,this.points[i].position.y, shiftZ+depth),
                        new Vector3(this.points[i].position.x,this.points[i].position.y, shiftZ-depth),
                        new Vector3(this.points[j].position.x,this.points[j].position.y, shiftZ-depth),
                        new Vector3(this.points[i].position.x,this.points[i].position.y, shiftZ+depth),
                        new Vector3(this.points[j].position.x,this.points[j].position.y, shiftZ+depth)
                    );
                }
            }
            if(this.frame.geometry){
                this.frame.geometry.dispose();
            }
            this.frame.geometry = frameGeometry;
        }
    }

    getMinX(){
        if(this.points.length == 0){
            return 0;
        }
        let val = this.points[0].position.x;
        for(let point of this.points){
            val = Math.min(val,point.position.x);
        }
        return val;
    }
    getMinY(){
        if(this.points.length == 0){
            return 0;
        }
        let val = this.points[0].position.y;
        for(let point of this.points){
            val = Math.min(val,point.position.y);
        }
        return val;
    }
    getMinZ(){
        if(this.points.length == 0){
            return 0;
        }
        let val = this.points[0].position.z;
        for(let point of this.points){
            val = Math.min(val,point.position.z);
        }
        return val;
    }

    getMaxX(){
        if(this.points.length == 0){
            return 0;
        }
        let val = this.points[0].position.x;
        for(let point of this.points){
            val = Math.max(val,point.position.x);
        }
        return val;
    }
    getMaxY(){
        if(this.points.length == 0){
            return 0;
        }
        let val = this.points[0].position.y;
        for(let point of this.points){
            val = Math.max(val,point.position.y);
        }
        return val;
    }

    getMaxZ(){
        if(this.points.length == 0){
            return 0;
        }
        let val = this.points[0].position.z;
        for(let point of this.points){
            val = Math.max(val,point.position.z);
        }
        return val;
    }

    updateTopBottomMarkerPosition(){
        const x = (this.getMinX() + this.getMaxX()) / 2;
        const y = (this.getMinY() + this.getMaxY()) / 2;
        if(this.topSphere){
            const maxZ = this.topSphere.position.z;
            this.topSphere.position.set(x,y,maxZ);
        }
        if(this.bottomSphere){
            const minZ = this.bottomSphere.position.z;
            this.bottomSphere.position.set(x,y,minZ);
        }
        this.label.position.x = x;
        this.label.position.y = y;
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

    getMousePlaneIntersection(mouse, camera, viewer, point){
        let renderer = viewer.renderer;
        
        let nmouse = {
            x: (mouse.x / renderer.domElement.clientWidth) * 2 - 1,
            y: -(mouse.y / renderer.domElement.clientHeight) * 2 + 1
        };

        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(nmouse, camera);
        let ray = raycaster.ray;
        let plane = new THREE.Plane();
        plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0,0,1), point);
        let target = new THREE.Vector3();
        ray.intersectPlane(plane,target);
        return target;
    }
   
    addTopBottomMarker(){
        const x = (this.getMinX() + this.getMaxX()) / 2;
        const y = (this.getMinY() + this.getMaxY()) / 2;
        
        const maxZ = this.getMaxZ();    
        if(!this.topSphere){
            this.topSphere = new THREE.Mesh(this.sphereGeometry, this.createTopBottomSphereMaterial());
            this.add(this.topSphere);
            this.spheres.push(this.topSphere);
        }
		this.topSphere.position.set(x, y, maxZ);

        const minZ = this.getMinZ();
        if(!this.bottomSphere){
            this.bottomSphere = new THREE.Mesh(this.sphereGeometry, this.createTopBottomSphereMaterial());
            this.add(this.bottomSphere);
            this.spheres.push(this.bottomSphere);
        }
		this.bottomSphere.position.set(x, y, minZ);

       

        // sphere.addEventListener('drag', drag);
        // sphere.addEventListener('drop', drop);



		{ // Event Listeners
			let drag = (e) => {
              //  console.log(e);
                let p = this.getMouseVerticalPlaneIntersection(e.drag.end,e.viewer.scene.getActiveCamera(),e.viewer, e.target.position);
				e.target.position.z = p.z;

                const tol = 0.01;
                if(this.topSphere.position.z < this.bottomSphere.position.z + tol)
                    {
                        if(e.target === this.topSphere){
                            this.bottomSphere.position.z = this.topSphere.position.z - tol;
                        }
                        else{
                            this.topSphere.position.z = this.bottomSphere.position.z + tol;

                        }
                    }
                this.makeSelection();
                this.updateVolumeGeometry();
                this.updatePointElevations();
                this.update();
                if(this.updateLabel){
                    this.pointCloudVolume = 0;
	                this.updateLabel();
	            }
                this.dispatchEvent({
                    type: 'position_changed',
                    object: this
                });
			};

			let drop = e => {
				// let i = this.spheres.indexOf(e.drag.object);
				// if (i !== -1) {
				// 	this.dispatchEvent({
				// 		'type': 'marker_dropped',
				// 		'measurement': this,
				// 		'index': i
				// 	});
                //     this.updateVolumeGeometry();
                //     this.updateTopBottomMarkerPosition();
				// }
                // console.log("drop");
			};

            // let mouseover = (e) => e.object.material.emissive.setHex(0x888888);
            // let mouseleave = (e) => e.object.material.emissive.setHex(0x000000);

            // this.topSphere.addEventListener('mouseover', mouseover);
            // this.topSphere.addEventListener('mouseleave', mouseleave);

            // this.bottomSphere.addEventListener('mouseover', mouseover);
            // this.bottomSphere.addEventListener('mouseleave', mouseleave);

            this.topSphere.addEventListener('drag', drag);
			this.topSphere.addEventListener('drop', drop);

            this.bottomSphere.addEventListener('drag', drag);
			this.bottomSphere.addEventListener('drop', drop);
        }

        
    }

	addMarker (point) {
		if (point.x != null) {
			point = {position: point};
		}else if(point instanceof Array){
			point = {position: new THREE.Vector3(...point)};
		}
		this.points.push(point);

		// sphere
		let sphere = new THREE.Mesh(this.sphereGeometry, this.createSphereMaterial());

		this.add(sphere);
		this.spheres.push(sphere);

		{ // edges
			let lineGeometry = new LineGeometry();
			lineGeometry.setPositions( [
					0, 0, 0,
					0, 0, 0,
			]);

			let lineMaterial = new LineMaterial({
				color: 0xff0000, 
				linewidth: 2, 
				resolution:  new THREE.Vector2(1000, 1000),
			});

			lineMaterial.depthTest = false;

			let edge = new Line2(lineGeometry, lineMaterial);
			edge.visible = true;

			this.add(edge);
			this.edges.push(edge);
		}

		{ // edge labels
			let edgeLabel = new TextSprite();
			edgeLabel.setBorderColor({r: 0, g: 0, b: 0, a: 1.0});
			edgeLabel.setBackgroundColor({r: 0, g: 0, b: 0, a: 1.0});
			edgeLabel.material.depthTest = false;
			edgeLabel.visible = false;
			edgeLabel.fontsize = 16;
			this.edgeLabels.push(edgeLabel);
			this.add(edgeLabel);
		}

		{ // angle labels
			let angleLabel = new TextSprite();
			angleLabel.setBorderColor({r: 0, g: 0, b: 0, a: 1.0});
			angleLabel.setBackgroundColor({r: 0, g: 0, b: 0, a: 1.0});
			angleLabel.fontsize = 16;
			angleLabel.material.depthTest = false;
			angleLabel.material.opacity = 1;
			angleLabel.visible = false;
			this.angleLabels.push(angleLabel);
			this.add(angleLabel);
		}

		{ // coordinate labels
			let coordinateLabel = new TextSprite();
			coordinateLabel.setBorderColor({r: 0, g: 0, b: 0, a: 1.0});
			coordinateLabel.setBackgroundColor({r: 0, g: 0, b: 0, a: 1.0});
			coordinateLabel.fontsize = 16;
			coordinateLabel.material.depthTest = false;
			coordinateLabel.material.opacity = 1;
			coordinateLabel.visible = false;
			this.coordinateLabels.push(coordinateLabel);
			this.add(coordinateLabel);
		}

		{ // Event Listeners
			let drag = (e) => {

                if(this.topSphere && this.bottomSphere)
                {
                    let p = this.getMousePlaneIntersection(e.drag.end,e.viewer.scene.getActiveCamera(),e.viewer, e.target.position);
              
                    e.target.position.x = p.x;
                    e.target.position.y = p.y;


                    let i = this.spheres.indexOf(e.drag.object);
                    if (i !== -1) {
                        let point = this.points[i];
                        
                        // loop through current keys and cleanup ones that will be orphaned
                        // for (let key of Object.keys(point)) {
                        //     if (!I.point[key]) {
                        //         delete point[key];
                        //     }
                        // }

                        // for (let key of Object.keys(I.point).filter(e => e !== 'position')) {
                        //     point[key] = I.point[key];
                        // }
                        this.setPosition(i, p);
                    }
                    this.makeSelection();
                    this.updateVolumeGeometry();
                    this.updatePointElevations();
                    this.updateTopBottomMarkerPosition();
                    this.update();
                    if(this.updateLabel){
                        this.pointCloudVolume = 0;
                        this.updateLabel();
                    }
                }
                else{
                    let I = Utils.getMousePointCloudIntersection(
                        e.drag.end, 
                        e.viewer.scene.getActiveCamera(), 
                        e.viewer, 
                        e.viewer.scene.pointclouds,
                        {pickClipped: true});

                    if (I) {
                        let i = this.spheres.indexOf(e.drag.object);
                        if (i !== -1) {
                            let point = this.points[i];
                            
                            // loop through current keys and cleanup ones that will be orphaned
                            for (let key of Object.keys(point)) {
                                if (!I.point[key]) {
                                    delete point[key];
                                }
                            }

                            for (let key of Object.keys(I.point).filter(e => e !== 'position')) {
                                point[key] = I.point[key];
                            }
                            this.setPosition(i, I.location);
                        }
                    }
                }
                this.dispatchEvent({
                    type: 'position_changed',
                    object: this}
                );
                
			};

			let drop = e => {
				let i = this.spheres.indexOf(e.drag.object);
				if (i !== -1) {
					this.dispatchEvent({
						'type': 'marker_dropped',
						'measurement': this,
						'index': i
					});
                    this.updateVolumeGeometry();
                    this.updateTopBottomMarkerPosition();
                    
				}
			};

			// let mouseover = (e) => e.object.material.emissive.setHex(0x888888);
			// let mouseleave = (e) => e.object.material.emissive.setHex(0x000000);

			sphere.addEventListener('drag', drag);
			sphere.addEventListener('drop', drop);
			// sphere.addEventListener('mouseover', mouseover);
			// sphere.addEventListener('mouseleave', mouseleave);
		}

		let event = {
			type: 'marker_added',
			measurement: this,
			sphere: sphere
		};
		this.dispatchEvent(event);

		this.setMarker(this.points.length - 1, point);
	};

	removeMarker (index) {
		this.points.splice(index, 1);

		this.remove(this.spheres[index]);

		let edgeIndex = (index === 0) ? 0 : (index - 1);
		this.remove(this.edges[edgeIndex]);
		this.edges.splice(edgeIndex, 1);

		this.remove(this.edgeLabels[edgeIndex]);
		this.edgeLabels.splice(edgeIndex, 1);
		this.coordinateLabels.splice(index, 1);

		this.remove(this.angleLabels[index]);
		this.angleLabels.splice(index, 1);

		this.spheres.splice(index, 1);

		this.update();

		this.dispatchEvent({type: 'marker_removed', measurement: this});
	};

	setMarker (index, point) {
		this.points[index] = point;

		let event = {
			type: 'marker_moved',
			measure:	this,
			index:	index,
			position: point.position.clone()
		};
		this.dispatchEvent(event);

		this.update();
	}

	setPosition (index, position) {
		let point = this.points[index];
		point.position.copy(position);

		let event = {
			type: 'marker_moved',
			measure:	this,
			index:	index,
			position: position.clone()
		};
		this.dispatchEvent(event);

		this.update();
	};

	getArea () {
		let area = 0;
		let j = this.points.length - 1;

		for (let i = 0; i < this.points.length; i++) {
			let p1 = this.points[i].position;
			let p2 = this.points[j].position;
			area += (p2.x + p1.x) * (p1.y - p2.y);
			j = i;
		}

		return Math.abs(area / 2);
	};

	getTotalDistance () {
		if (this.points.length === 0) {
			return 0;
		}

		let distance = 0;

		for (let i = 1; i < this.points.length; i++) {
			let prev = this.points[i - 1].position;
			let curr = this.points[i].position;
			let d = prev.distanceTo(curr);

			distance += d;
		}

		if (this.closed && this.points.length > 1) {
			let first = this.points[0].position;
			let last = this.points[this.points.length - 1].position;
			let d = last.distanceTo(first);

			distance += d;
		}

		return distance;
	}

	getAngleBetweenLines (cornerPoint, point1, point2) {
		let v1 = new THREE.Vector3().subVectors(point1.position, cornerPoint.position);
		let v2 = new THREE.Vector3().subVectors(point2.position, cornerPoint.position);

		// avoid the error printed by threejs if denominator is 0
		const denominator = Math.sqrt( v1.lengthSq() * v2.lengthSq() );
		if(denominator === 0){
			return 0;
		}else{
			return v1.angleTo(v2);
		}
	};

	getAngle (index) {
		if (this.points.length < 3 || index >= this.points.length) {
			return 0;
		}

		let previous = (index === 0) ? this.points[this.points.length - 1] : this.points[index - 1];
		let point = this.points[index];
		let next = this.points[(index + 1) % (this.points.length)];

		return this.getAngleBetweenLines(point, previous, next);
	}



	update () {
		if (this.points.length === 0) {
			return;
		} else if (this.points.length === 1) {
			let point = this.points[0];
			let position = point.position;
			this.spheres[0].position.copy(position);

			{ // coordinate labels
				let coordinateLabel = this.coordinateLabels[0];
				
				let msg = position.toArray().map(p => Utils.addCommas(p.toFixed(2))).join(" / ");

                coordinateLabel.setText(msg);

				coordinateLabel.visible = this.showCoordinates;
			}

			return;
		}

		let lastIndex = this.points.length - 1;

		let centroid = new THREE.Vector3();
		for (let i = 0; i <= lastIndex; i++) {
			let point = this.points[i];
			centroid.add(point.position);
		}
		centroid.divideScalar(this.points.length);

		for (let i = 0; i <= lastIndex; i++) {
			let index = i;
			let nextIndex = (i + 1 > lastIndex) ? 0 : i + 1;
			let previousIndex = (i === 0) ? lastIndex : i - 1;

			let point = this.points[index];
			let nextPoint = this.points[nextIndex];
			let previousPoint = this.points[previousIndex];

			let sphere = this.spheres[index];

			// spheres
			sphere.position.copy(point.position);
			sphere.material.color = this.color;

			{ // edges
				let edge = this.edges[index];

				edge.material.color = this.color;

				edge.position.copy(point.position);

				edge.geometry.setPositions([
					0, 0, 0,
					...nextPoint.position.clone().sub(point.position).toArray(),
				]);

				edge.geometry.verticesNeedUpdate = true;
				edge.geometry.computeBoundingSphere();
				edge.computeLineDistances();
				edge.visible = index < lastIndex || this.closed;
				
				if(!this.showEdges){
					edge.visible = false;
				}
			}

			{ // edge labels
				let edgeLabel = this.edgeLabels[i];

				let center = new THREE.Vector3().add(point.position);
				center.add(nextPoint.position);
				center = center.multiplyScalar(0.5);
				let distance = point.position.distanceTo(nextPoint.position);

				edgeLabel.position.copy(center);

				let suffix = "";
				if(this.lengthUnit != null && this.lengthUnitDisplay != null){
					distance = distance / this.lengthUnit.unitspermeter * this.lengthUnitDisplay.unitspermeter;  //convert to meters then to the display unit
					suffix = this.lengthUnitDisplay.code;
				}
                // change digit for cmair
				let txtLength = Utils.addCommas(distance.toFixed(4));
				edgeLabel.setText(`${txtLength} ${suffix}`);
				edgeLabel.visible = this.showDistances && (index < lastIndex || this.closed) && this.points.length >= 2 && distance > 0;
			}

			{ // angle labels
				let angleLabel = this.angleLabels[i];
				let angle = this.getAngleBetweenLines(point, previousPoint, nextPoint);

				let dir = nextPoint.position.clone().sub(previousPoint.position);
				dir.multiplyScalar(0.5);
				dir = previousPoint.position.clone().add(dir).sub(point.position).normalize();

				let dist = Math.min(point.position.distanceTo(previousPoint.position), point.position.distanceTo(nextPoint.position));
				dist = dist / 9;

				let labelPos = point.position.clone().add(dir.multiplyScalar(dist));
				angleLabel.position.copy(labelPos);

				let msg = Utils.addCommas((angle * (180.0 / Math.PI)).toFixed(1)) + '\u00B0';
				angleLabel.setText(msg);

				angleLabel.visible = this.showAngles && (index < lastIndex || this.closed) && this.points.length >= 3 && angle > 0;
			}
		}

		{ // update height stuff
			let heightEdge = this.heightEdge;
			heightEdge.visible = this.showHeight;
			this.heightLabel.visible = this.showHeight;

			if (this.showHeight) {
				let sorted = this.points.slice().sort((a, b) => a.position.z - b.position.z);
				let lowPoint = sorted[0].position.clone();
				let highPoint = sorted[sorted.length - 1].position.clone();
				let min = lowPoint.z;
				let max = highPoint.z;
				let height = max - min;

				let start = new THREE.Vector3(highPoint.x, highPoint.y, min);
				let end = new THREE.Vector3(highPoint.x, highPoint.y, max);

				heightEdge.position.copy(lowPoint);

				heightEdge.geometry.setPositions([
					0, 0, 0,
					...start.clone().sub(lowPoint).toArray(),
					...start.clone().sub(lowPoint).toArray(),
					...end.clone().sub(lowPoint).toArray(),
				]);

				heightEdge.geometry.verticesNeedUpdate = true;
				// heightEdge.geometry.computeLineDistances();
				// heightEdge.geometry.lineDistancesNeedUpdate = true;
				heightEdge.geometry.computeBoundingSphere();
				heightEdge.computeLineDistances();

				// heightEdge.material.dashSize = height / 40;
				// heightEdge.material.gapSize = height / 40;

				let heightLabelPosition = start.clone().add(end).multiplyScalar(0.5);
				this.heightLabel.position.copy(heightLabelPosition);

				let suffix = "";
				if(this.lengthUnit != null && this.lengthUnitDisplay != null){
					height = height / this.lengthUnit.unitspermeter * this.lengthUnitDisplay.unitspermeter;  //convert to meters then to the display unit
					suffix = this.lengthUnitDisplay.code;
				}

				let txtHeight = Utils.addCommas(height.toFixed(2));
				let msg = `${txtHeight} ${suffix}`;
				this.heightLabel.setText(msg);
			}
		}

		{ // update circle stuff
			const circleRadiusLabel = this.circleRadiusLabel;
			const circleRadiusLine = this.circleRadiusLine;
			const circleLine = this.circleLine;
			const circleCenter = this.circleCenter;

			const circleOkay = this.points.length === 3;

			circleRadiusLabel.visible = this.showCircle && circleOkay;
			circleRadiusLine.visible = this.showCircle && circleOkay;
			circleLine.visible = this.showCircle && circleOkay;
			circleCenter.visible = this.showCircle && circleOkay;

			if(this.showCircle && circleOkay){

				const A = this.points[0].position;
				const B = this.points[1].position;
				const C = this.points[2].position;
				const AB = B.clone().sub(A);
				const AC = C.clone().sub(A);
				const N = AC.clone().cross(AB).normalize();

				const center = Potree.Utils.computeCircleCenter(A, B, C);
				const radius = center.distanceTo(A);


				const scale = radius / 20;
				circleCenter.position.copy(center);
				circleCenter.scale.set(scale, scale, scale);

				//circleRadiusLine.geometry.vertices[0].set(0, 0, 0);
				//circleRadiusLine.geometry.vertices[1].copy(B.clone().sub(center));

				circleRadiusLine.geometry.setPositions( [
					0, 0, 0,
					...B.clone().sub(center).toArray()
				] );

				circleRadiusLine.geometry.verticesNeedUpdate = true;
				circleRadiusLine.geometry.computeBoundingSphere();
				circleRadiusLine.position.copy(center);
				circleRadiusLine.computeLineDistances();

				const target = center.clone().add(N);
				circleLine.position.copy(center);
				circleLine.scale.set(radius, radius, radius);
				circleLine.lookAt(target);
				
				circleRadiusLabel.visible = true;
				circleRadiusLabel.position.copy(center.clone().add(B).multiplyScalar(0.5));
				circleRadiusLabel.setText(`${radius.toFixed(3)}`);

			}
		}

		{ // update area label
			this.areaLabel.position.copy(centroid);
			this.areaLabel.visible = this.showArea && this.points.length >= 3;
			let area = this.getArea();

			let suffix = "";
			if(this.lengthUnit != null && this.lengthUnitDisplay != null){
				area = area / Math.pow(this.lengthUnit.unitspermeter, 2) * Math.pow(this.lengthUnitDisplay.unitspermeter, 2);  //convert to square meters then to the square display unit
				suffix = this.lengthUnitDisplay.code;
			}

			let txtArea = Utils.addCommas(area.toFixed(1));
			let msg =  `${txtArea} ${suffix}\u00B2`;
			this.areaLabel.setText(msg);
		}

        if (this._clip) {
			this.extrude.visible = false;
			this.label.visible = false;
		} else {
			this.extrude.visible = true;
			this.label.visible = this.showVolumeLabel;
		}

	};

    makeSelection () {
          let measurementsRoot = $("#jstree_scene").jstree().get_json("measurements");
        let jsonNode = measurementsRoot.children.find(child => child.data.uuid === this.uuid);
        if(jsonNode){
            $.jstree.reference(jsonNode.id).deselect_all();
            $.jstree.reference(jsonNode.id).select_node(jsonNode.id);
            if(this.updateLabel){
                this.updateLabel();
            }
        }
    }

	raycast (raycaster, intersects) {
		// for (let i = 0; i < this.spheres.length; i++) {
		// 	let sphere = this.spheres[i];

		// 	sphere.raycast(raycaster, intersects);
		// }

        let is = [];
        this.extrude.raycast(raycaster, is);
        // if (is.length > 0) {
        //     let I = is[0];
        //     intersects.push({
        //         distance: I.distance,
        //         object: this.extrude,
        //         point: I.point.clone()
        //     });
        // }

   
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

	get showCoordinates () {
		return this._showCoordinates;
	}

	set showCoordinates (value) {
		this._showCoordinates = value;
		this.update();
	}

	get showAngles () {
		return this._showAngles;
	}

	set showAngles (value) {
		this._showAngles = value;
		this.update();
	}

	get showCircle () {
		return this._showCircle;
	}

	set showCircle (value) {
		this._showCircle = value;
		this.update();
	}



	get showEdges () {
		return this._showEdges;
	}

	set showEdges (value) {
		this._showEdges = value;
		this.update();
	}

	get showHeight () {
		return this._showHeight;
	}

	set showHeight (value) {
		this._showHeight = value;
		this.update();
	}

	get showArea () {
		return this._showArea;
	}

	set showArea (value) {
		this._showArea = value;
		this.update();
	}
    // for cmair
    get showVolume () {
		return this._showVolume;
	}
    // for cmair
	set showVolume (value) {
		this._showVolume = value;
		this.update();
	}

	get closed () {
		return this._closed;
	}

	set closed (value) {
		this._closed = value;
		this.update();
	}

	get showDistances () {
		return this._showDistances;
	}

	set showDistances (value) {
		this._showDistances = value;
		this.update();
	}



    getVolume(){
        const area = this.getArea();
        if(this.topSphere && this.bottomSphere){
            return Math.abs(area * (this.topSphere.position.z - this.bottomSphere.position.z))
        }
        return 0;
    }
}
