
import * as THREE from "../../../libs/three.js/build/three.module.js";
import {Utils} from "../../utils.js";
import {PointCloudTree} from "../../PointCloudTree.js";
import {Annotation} from "../../Annotation.js";
import {Measure} from "../../utils/Measure.js";
import {Profile} from "../../utils/Profile.js";
import {Volume, BoxVolume, SphereVolume} from "../../utils/Volume.js";
import {CameraAnimation} from "../../modules/CameraAnimation/CameraAnimation.js";
import {PolygonClipVolume} from "../../utils/PolygonClipVolume.js";
import {PointSizeType, PointShape, ElevationGradientRepeat} from "../../defines.js";
import {Gradients} from "../../materials/Gradients.js";

import {MeasurePanel} from "./MeasurePanel.js";
import {DistancePanel} from "./DistancePanel.js";
import {PointPanel} from "./PointPanel.js";
import {AreaPanel} from "./AreaPanel.js";
import {AnglePanel} from "./AnglePanel.js";
import {CirclePanel} from "./CirclePanel.js";
import {HeightPanel} from "./HeightPanel.js";
import {VolumePanel} from "./VolumePanel.js";
import {ProfilePanel} from "./ProfilePanel.js";
import {CameraPanel} from "./CameraPanel.js";
import {AnnotationPanel} from "./AnnotationPanel.js";
import { CameraAnimationPanel } from "./CameraAnimationPanel.js";
import { PolygonClipVolumePanel } from "./PolygonClipVolumePanel.js";
import { TransformPointcloudBoxVolume } from "../../utils/TransformVolume.js";
export class PropertiesPanel{

	constructor(container, viewer){
		this.container = container;
		this.viewer = viewer;
		this.object = null;
		this.cleanupTasks = [];
		this.scene = null;
	}

	setScene(scene){
		this.scene = scene;
	}

	set(object){
		if(this.object === object){
			return;
		}

		this.object = object;
		
		for(let task of this.cleanupTasks){
			task();
		}
		this.cleanupTasks = [];
		this.container.empty();

		if(object instanceof PointCloudTree){
			this.setPointCloud(object);
		}else if(object instanceof Measure || object instanceof Profile || object instanceof Volume){
			this.setMeasurement(object);
		}else if(object instanceof THREE.Camera){
			this.setCamera(object);
		}else if(object instanceof Annotation){
			this.setAnnotation(object);
		}else if(object instanceof CameraAnimation){
			this.setCameraAnimation(object);
		}
        else if(object instanceof PolygonClipVolume){
            this.setPolygonClipVolume(object);
        }
		
	}

	//
	// Used for events that should be removed when the property object changes.
	// This is for listening to materials, scene, point clouds, etc.
	// not required for DOM listeners, since they are automatically cleared by removing the DOM subtree.
	//
	addVolatileListener(target, type, callback){
		target.addEventListener(type, callback);
		this.cleanupTasks.push(() => {
			target.removeEventListener(type, callback);
		});
	}

    getSelectedPointclouds(){
        const results = [];
        let pointclouds = $("#jstree_scene").jstree().get_json("pointclouds", { flat: true }).filter(x => x.state.selected && x.data.type).map(x => x.data);
        results.push(...pointclouds);
        pointclouds = $("#jstree_scene").jstree().get_json("BIMs", { flat: true }).filter(x => x.state.selected && x.data.type).map(x => x.data);
        results.push(...pointclouds);
        return results;
    }

    hasNormals(pointcloud){
        try{
            const xAttribute = pointcloud.pcoGeometry.copc.eb.find(x => x.name == "NormalX");
            const yAttribute = pointcloud.pcoGeometry.copc.eb.find(x => x.name == "NormalY");
            const zAttribute = pointcloud.pcoGeometry.copc.eb.find(x => x.name == "NormalZ");
            if(xAttribute && yAttribute && zAttribute){
                return true;
            }
            return false;
        }
        catch(e){
            return false;
        }
    }

	setPointCloud(pointcloud){

        let self = this;

		let material = pointcloud.material;

        // for cmair, add "pc_filename" and "num_points"
		let panel = $(`
             <div class="divider">
                <span>
                 <span data-i18n="appearance.properties">Properties</span>
                    <button id="pc_properties_shrinking" class="transparent-background-btn" style="background-color: transparent;color: #FFFFFF; border: none; outline: none; cursor: pointer; width:15px;">▲</button>
                    <button id="pc_properties_show" class="transparent-background-btn" style="background-color: transparent;color: #FFFFFF; border: none; outline: none; cursor: pointer; width:15px;">▼</button>
                </span>   
             </div>
			<div id="pc_properties_panel" class="scene_content selectable">
				<ul class="pv-menu-list">
               
				<li>
				    <span data-i18n="appearance.file_name">Filename:</span>
				</li>
				<li>
				    <input id="pc_filename" value="" disabled style="width: 255px; height: 27px; margin-bottom: 10px; color: #111111 !important"/>
				</li>
				<li>
				    <span data-i18n="appearance.number_of_points">Number of Points:</span>
				</li>
				<li>
				    <input id="num_points" value="" disabled style="width: 255px; height: 27px; margin-bottom: 10px; color: #111111 !important"/>
				</li>

                <li>
				    <span id="sidebar_pc_transform_ref_span" data-i18n="transform.transform_ref">Reference Pointcloud</span>
				</li>
                <li>
				    <input id="sidebar_pc_transform_ref" value="" disabled style="width: 255px; height: 27px; margin-bottom: 10px; color: #111111 !important"/>
				</li>
                
				<li>
				<span data-i18n="appearance.point_size"></span>:&nbsp;<span id="lblPointSize"></span> <div id="sldPointSize"></div>
				</li>
				<li style="display:none;">
				<span data-i18n="appearance.min_point_size"></span>:&nbsp;<span id="lblMinPointSize"></span> <div id="sldMinPointSize"></div>
				</li>

				<!-- SIZE TYPE -->
				<li >
					<label for="optPointSizing" class="pv-select-label" data-i18n="appearance.point_size_type">Point Sizing </label>
					<select id="optPointSizing" name="optPointSizing">
						<option value="FIXED" data-i18n="appearance.FIXED">FIXED</option>
						<option value="ATTENUATED" data-i18n="appearance.ATTENUATED">ATTENUATED</option>
						<option value="ADAPTIVE" data-i18n="appearance.ADAPTIVE">ADAPTIVE</option>
					</select>
				</li>

				<!-- SHAPE -->
				<li>
					<label for="optShape" class="pv-select-label" data-i18n="appearance.point_shape"></label><br>
					<select id="optShape" name="optShape">
						<option value="SQUARE" data-i18n="appearance.SQUARE">SQUARE</option>
						<option value="CIRCLE" data-i18n="appearance.CIRCLE">CIRCLE</option>
					<!-- 	<option value="PARABOLOID" data-i18n="appearance.PARABOLOID">PARABOLOID</option>-->
					</select>
				</li>

				<li id="materials_backface_container">
				    <label><input id="set_backface_culling" type="checkbox" /><span data-i18n="appearance.backface_culling"></span></label>
				</li>

                <li id="materials_backface_hiding_container">
				    <label><input id="set_backface_hiding" type="checkbox" /><span data-i18n="appearance.backface_hiding"></span></label>
				</li>


                <li id="materials_normal_container">
				    <label><input id="set_fresnel_outline" type="checkbox" /><span data-i18n="appearance.fresnel_effect">Fresnel outline</span></label>
                    <li id="lblsldFresnelPower"><span data-i18n="appearance.fresnel_power">Fresnel power</span>:<span id="lblFresnelPower"></span><div id="sldFresnelPower"></div></li>
				</li>

                <li id="materials_deformation_container" style="display:none;">
				    <label><input id="set_deformed" type="checkbox" /><span data-i18n="appearance.deformed_shape">Deformed shape</span></label>
                    <li id="lblsldDeformationFactor"><span data-i18n="appearance.deformation_scale">Deformation scale</span>:<span id="lblDeformationFactor"></span><div id="sldDeformationFactor"></div></li>
				</li>

                
				
				<!-- OPACITY -->
				<li  style="display:none;"><span data-i18n="appearance.point_opacity"></span>:<span id="lblOpacity"></span><div id="sldOpacity"></div></li>

				<div class="divider">
					<span data-i18n="appearance.attribute">Attribute</span>
				</div>

				<li>
					<select id="optMaterial" name="optMaterial"></select>
				</li>

				<div id="materials.composite_weight_container">
					<div class="divider">
						<span data-i18n="appearance.attribute_weights">Attribute Weights</span>
					</div>

					<li>RGB: <span id="lblWeightRGB"></span> <div id="sldWeightRGB"></div>	</li>
					<li><span data-i18n="composite.intensity">Intensity:</span> <span id="lblWeightIntensity"></span> <div id="sldWeightIntensity"></div>	</li>
					<li><span data-i18n="composite.elevation">Elevation:</span> <span id="lblWeightElevation"></span> <div id="sldWeightElevation"></div>	</li>
					<li><span data-i18n="composite.classification">Classification:</span> <span id="lblWeightClassification"></span> <div id="sldWeightClassification"></div>	</li>
					<li><span data-i18n="composite.return_number">Return Number:</span> <span id="lblWeightReturnNumber"></span> <div id="sldWeightReturnNumber"></div>	</li>
					<li><span data-i18n="composite.source_id">Source ID:</span> <span id="lblWeightSourceID"></span> <div id="sldWeightSourceID"></div>	</li>
				</div>

                <div id="materials.signed_norm_container">
					<div class="divider">
						<span data-i18n="appearance.signed_norm">Signed norm</span>
					</div>
                    <li>
                        <label for="optSignedNormX" class="pv-select-label">X</label>
                        <select id="optSignedNormX" name="X">       
                        </select>
				    </li>
                    <li>
                        <label for="optSignedNormY" class="pv-select-label">Y</label>
                        <select id="optSignedNormY" name="Y">       
                        </select>
				    </li>
                    <li>
                        <label for="optSignedNormZ" class="pv-select-label">Z</label>
                        <select id="optSignedNormZ" name="Z">       
                        </select>
				    </li>
					
				</div>

				<div id="materials.rgb_container">
					<div class="divider">
						<span>RGB</span>
					</div>

					<li><span data-i18n="appearance.gamma"></span> <span id="lblRGBGamma"></span> <div id="sldRGBGamma"></div>	</li>
					<li><span data-i18n="appearance.brightness"></span> <span id="lblRGBBrightness"></span><div id="sldRGBBrightness"></div>	</li>
					<li><span data-i18n="appearance.contrast"></span> <span id="lblRGBContrast"></span><div id="sldRGBContrast"></div>	</li>
                    <li><span data-i18n="appearance.enhancement"></span> <span id="lblRGBEnhance"></span><div id="sldRGBEnhance"></div>	</li>

                    

                    <div id="color_enhance_area" class="scene_content selectable"></div>
				</div>

				<div id="materials.extra_container">
					<div class="divider">
						<span data-i18n="appearance.extra_attribute">Extra Attribute</span>
					</div>

					<li><span data-i18n="appearance.extra_range"></span>: <span id="lblExtraRange"></span> <div id="sldExtraRange"></div></li>

					<li>
						<selectgroup id="extra_gradient_repeat_option">
							<option id="extra_gradient_repeat_clamp" value="CLAMP">Clamp</option>
							<option id="extra_gradient_repeat_repeat" value="REPEAT">Repeat</option>
							<option id="extra_gradient_repeat_mirrored_repeat" value="MIRRORED_REPEAT">Mirrored Repeat</option>
						</selectgroup>
					</li>

					<li>
						<span data-i18n="appearance.gradient_scheme">Gradient Scheme:</span>
						<div id="extra_gradient_scheme_selection" class="gradient_scheme" style="display: flex; padding: 1em 0em">
						</div>
					</li>
				</div>
				
				<div id="materials.matcap_container">
					<div class="divider">
						<span data-i18n="appearance.matcap">MATCAP</span>
					</div>

					<li>
						<div id="matcap_scheme_selection" style="display: flex; flex-wrap: wrap;"> </div>
					</li>
				</div>

				<div id="materials.color_container">
					<div class="divider">
						<span data-i18n="appearance.color">Color</span>
					</div>

					<input id="materials.color.picker" />
				</div>


				<div id="materials.elevation_container">
					<div class="divider">
						<span data-i18n="appearance.elevation">Elevation</span>
					</div>

					<li><span data-i18n="appearance.elevation_range"></span>: <span id="lblHeightRange"></span> <div id="sldHeightRange"></div>	</li>

					<li>
						<selectgroup id="gradient_repeat_option">
							<option id="gradient_repeat_clamp" value="CLAMP">Clamp</option>
							<option id="gradient_repeat_repeat" value="REPEAT">Repeat</option>
							<option id="gradient_repeat_mirrored_repeat" value="MIRRORED_REPEAT">Mirrored Repeat</option>
						</selectgroup>
					</li>

					<li>
						<span data-i18n="appearance.gradient_scheme">Gradient Scheme:</span>
						<div id="elevation_gradient_scheme_selection" class="gradient_scheme" style="display: flex; padding: 1em 0em">
						</div>
					</li>
				</div>

				<div id="materials.transition_container">
					<div class="divider">
						<span>Transition</span>
					</div>

					<li>transition: <span id="lblTransition"></span> <div id="sldTransition"></div>	</li>
				</div>

				<div id="materials.intensity_container">
					<div class="divider">
						<span data-i18n="appearance.intensity">Intensity</span>
					</div>

					<li><span data-i18n="appearance.range"></span><span id="lblIntensityRange"></span> <div id="sldIntensityRange"></div>	</li>
                    <li><span data-i18n="appearance.color_curve">Color curve: </span><span id="lblIntensityCurveOrder"></span> <div id="sldIntensityCurveOrder"></div>	</li>
                    <li><span data-i18n="appearance.gamma"></span><span id="lblIntensityGamma"></span> <div id="sldIntensityGamma"></div>	</li>
					<li><span data-i18n="appearance.brightness"></span> <span id="lblIntensityBrightness"></span> <div id="sldIntensityBrightness"></div>	</li>
					<li><span data-i18n="appearance.contrast"></span><span id="lblIntensityContrast"></span> <div id="sldIntensityContrast"></div>	</li>
				
                    <li>
						<span data-i18n="appearance.gradient_scheme">Gradient Scheme:</span>
						<div id="intensity_gradient_scheme_selection" class="gradient_scheme" style="display: flex; padding: 1em 0em">
						</div>
					</li>
                
                </div>

				<div id="materials.gpstime_container">
					<div class="divider">
						<span data-i18n="appearance.gps_time">GPS Time</span>
					</div>

				</div>
				
				<div id="materials.index_container">
					<div class="divider">
						<span data-i18n="appearance.indices">Indices</span>
					</div>
				</div>

               
			</div>
		`);

		panel.i18n();
		this.container.append(panel);

        // show hide
        {
            let pc_properties_shrinking = panel.find(`#pc_properties_shrinking`);
            let pc_properties_show = panel.find(`#pc_properties_show`);
            
            pc_properties_shrinking.off("click");
            pc_properties_shrinking.on("click", ()=>{         
                const elements = panel.filter("#pc_properties_panel");
                if(elements){
                    elements.hide();
                }
                pc_properties_shrinking.hide();
                pc_properties_show.show();
            })
            
            pc_properties_show.off("click");
            pc_properties_show.on("click", ()=>{
                const elements = panel.filter("#pc_properties_panel");
                if(elements){
                    elements.show();
                }
                pc_properties_shrinking.show();
                pc_properties_show.hide();
            })     
            pc_properties_show.click();
        }

       // cmair ADDED: rcd - number of points and filename
        {
            if(pointcloud.pcoGeometry.points){
                let num_points = panel.find(`#num_points`);
                num_points.val(pointcloud.pcoGeometry.points.toLocaleString());
            }
            if(pointcloud.pcoGeometry.copc){
                let num_points = panel.find(`#num_points`);
                num_points.val(pointcloud.pcoGeometry.copc.header.pointCount.toLocaleString());
            }
           

            let pc_filename = panel.find(`#pc_filename`);
            pc_filename.val(pointcloud.name);
        }

        // cmair ADDED: Transformation info
        {
            let lang = localStorage.getItem("language");
            if(!lang){
                lang = "jp";
            }
            if(pointcloud.transformRefPointcloud){
                panel.find(`#sidebar_pc_transform_ref`).val(pointcloud.transformRefPointcloud.name);
            }
            else{
               if(lang == "jp"){
                    panel.find(`#sidebar_pc_transform_ref`).val("変換なし");
                }
                else{
                    panel.find(`#sidebar_pc_transform_ref`).val("Not transformed");
                }
            }
        }

        { // POINT SIZE
            let sldPointSize = panel.find(`#sldPointSize`);
            let lblPointSize = panel.find(`#lblPointSize`);

            sldPointSize.slider({
                value: material.size,
                min: 0,
                max: 3,
                step: 0.01,
                slide: function (event, ui) {
                    material.size = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.size = ui.value;
                    }

                }
            });

            let update = (e) => {
                lblPointSize.html(material.size.toFixed(2));
				sldPointSize.slider({value: material.size});
            };
            this.addVolatileListener(material, "point_size_changed", update);

            update();
        }

        { // MINIMUM POINT SIZE
            let sldMinPointSize = panel.find(`#sldMinPointSize`);
            let lblMinPointSize = panel.find(`#lblMinPointSize`);

            sldMinPointSize.slider({
                value: material.size,
                min: 0,
                max: 3,
                step: 0.01,
                slide: function (event, ui) {
                    material.minSize = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.minSize = ui.value;
                    }
                }
            });

            let update = (e) => {
                lblMinPointSize.html(material.minSize.toFixed(2));
				sldMinPointSize.slider({value: material.minSize});
            };
            this.addVolatileListener(material, "point_size_changed", update);

            update();
        }

        { // POINT SIZING
			let strSizeType = Object.keys(PointSizeType)[material.pointSizeType];

            let opt = panel.find(`#optPointSizing`);
            opt.selectmenu();
            opt.val(strSizeType).selectmenu('refresh');

            opt.selectmenu({
                change: (event, ui) => {
                    material.pointSizeType = PointSizeType[ui.item.value];
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.pointSizeType = PointSizeType[ui.item.value];
                    }
                }
            });
        }

        { // SHAPE
            let opt = panel.find(`#optShape`);

            opt.selectmenu({
                change: (event, ui) => {
                    let value = ui.item.value;
                    material.shape = PointShape[value];
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.shape = PointShape[value];
                    }

                }
            });

            let update = () => {
                let typename = Object.keys(PointShape)[material.shape];

                opt.selectmenu().val(typename).selectmenu('refresh');
            };
            this.addVolatileListener(material, "point_shape_changed", update);

            update();
        }

        { // BACKFACE CULLING

            let opt = panel.find(`#set_backface_culling`);
            opt.click(() => {
                material.backfaceCulling = opt.prop("checked");
                let pointClouds = self.getSelectedPointclouds();
                for (let point of pointClouds) {    
                    if(this.hasNormals(point)){
                        point.material.backfaceCulling = opt.prop("checked");
                    }
                    else{
                        point.material.backfaceCulling = false;
                    }
                }   
            });
            let update = () => {
                let value = material.backfaceCulling;
                opt.prop("checked", value);
            };
            this.addVolatileListener(material, "backface_changed", update);
            update();

            // let blockBackface = $('#materials_backface_container');
            // blockBackface.css('display', 'none');

            // const pointAttributes = pointcloud.pcoGeometry.pointAttributes;
            // const hasNormals = pointAttributes.hasNormals ? pointAttributes.hasNormals() : false;
            // if (hasNormals) {
            //     blockBackface.css('display', 'block');
            // }
            /*
            opt.checkboxradio({
                clicked: (event, ui) => {
                    // let value = ui.item.value;
                    let value = ui.item.checked;
                    console.log(value);
                    material.backfaceCulling = value; // $('#set_freeze').prop("checked");
                }
            });
            */
        }

        { // BACKFACE HIDING

            let opt = panel.find(`#set_backface_hiding`);
            opt.click(() => {
                material.backfaceHiding = opt.prop("checked");
                let pointClouds = self.getSelectedPointclouds();
                for (let point of pointClouds) {    
                    if(this.hasNormals(point)){
                        point.material.backfaceHiding = opt.prop("checked");
                    }
                    else{
                        point.material.backfaceHiding = false;
                    }
                }   
            });
            let update = () => {
                let value = material.backfaceHiding;
                opt.prop("checked", value);
            };
            this.addVolatileListener(material, "backface_changed", update);
            update();

        
        }

        { // normal
            let opt = panel.find(`#set_fresnel_outline`);
            opt.click(() => {
                material.fresnelOutline = opt.prop("checked");
                let pointClouds = self.getSelectedPointclouds();
                for (let point of pointClouds) {
                    if(this.hasNormals(point)){
                        point.material.fresnelOutline = opt.prop("checked");
                    }
                    else{
                        point.material.fresnelOutline = false;
                    }
                }   
            });
          
            let sldFresnelPower = panel.find(`#sldFresnelPower`);
            let lblFresnelPower = panel.find(`#lblFresnelPower`);
            let lblsldFresnelPower = panel.find(`#lblsldFresnelPower`)
            sldFresnelPower.slider({
                value: material.opacity,
                min: 0,
                max: 10,
                step: 0.01,
                slide: function (event, ui) {
                    material.fresnelPower = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.fresnelPower = ui.value;
                    }   
                }
            });

            let update = (e) => {
                let value = material.fresnelOutline;
                opt.prop("checked", value);
                lblFresnelPower.html(material.fresnelPower.toFixed(2));
                sldFresnelPower.slider({ value: material.fresnelPower });
                if(value){
                    lblsldFresnelPower.show();
                }
                else{
                    lblsldFresnelPower.hide();
                }
            };
            this.addVolatileListener(material, "fresnel_outline_changed", update);

            update();
        }

        {// ui display for normal
            if(this.hasNormals(pointcloud)){
                let blockBackface = $('#materials_backface_container');
                blockBackface.css('display', 'block');
                let blockBackfaceHiding = $('#materials_backface_hiding_container');
                blockBackfaceHiding.css('display', 'block');
                let blockNormal = $('#materials_normal_container');
                blockNormal.css('display', 'block');
            }
            else{
                 let blockBackface = $('#materials_backface_container');
                blockBackface.css('display', 'none');
                let blockBackfaceHiding = $('#materials_backface_hiding_container');
                blockBackfaceHiding.css('display', 'none');
                let blockNormal = $('#materials_normal_container');
                blockNormal.css('display', 'none');
            }

        }

        { // Deformation

            let opt = panel.find(`#set_deformed`);
            opt.click(() => {
                material.deformed = opt.prop("checked");
                let pointClouds = self.getSelectedPointclouds();
                for (let point of pointClouds) {
                    point.material.deformed = opt.prop("checked");
                }   
            });
          
            let sldDeformation = panel.find(`#sldDeformationFactor`);
            let lblDeformation = panel.find(`#lblDeformationFactor`);
            let lblsldDeformation = panel.find(`#lblsldDeformationFactor`)

            sldDeformation.slider({
                value: material.opacity,
                min: 0,
                max: 1,
                step: 0.01,
                slide: function (event, ui) {
                    material.deformationFactor = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.deformationFactor = ui.value;
                    }   
                }
                
            });

            let update = (e) => {
                let value = material.deformed;
                opt.prop("checked", value);
                lblDeformation.html(material.deformationFactor.toFixed(2));
                sldDeformation.slider({ value: material.deformationFactor });
                if(value){
                    lblsldDeformation.show();
                }
                else{
                    lblsldDeformation.hide();
                }
            };
            this.addVolatileListener(material, "deformation_factor_changed", update);

            update();
        }
        

        { // OPACITY
            let sldOpacity = panel.find(`#sldOpacity`);
            let lblOpacity = panel.find(`#lblOpacity`);

            sldOpacity.slider({
                value: material.opacity,
                min: 0,
                max: 1,
                step: 0.001,
                slide: function (event, ui) {
                    material.opacity = ui.value;
                }
            });

            let update = (e) => {
                lblOpacity.html(material.opacity.toFixed(2));
                sldOpacity.slider({ value: material.opacity });
            };
            this.addVolatileListener(material, "opacity_changed", update);

            update();
        }

        {

            const attributes = pointcloud.pcoGeometry.pointAttributes.attributes;

            let options = [];

            options.push(...attributes.map(a => a.name));

            const intensityIndex = options.indexOf("intensity");
			if(intensityIndex >= 0){
                options.splice(intensityIndex + 1, 0, "intensity gradient");
            }

            options.push(
                "elevation",
                "color",
                'matcap',
                'indices',
                'level of detail',
                'composite',
            );

            const blacklist = [
                "POSITION_CARTESIAN",
                "position",
                "intensity"
            ];

            const translationOptions = {
                "intensity":"attribute.intensity",
                "intensity gradient": "attribute.intensity_gradient",
                "classification":"attribute.classification",
                "gps-time":"attribute.gps_time",
                "returnNumber":"attribute.returnNumber",
                "number of returns":"attribute.number_of_returns",
                "return number":"attribute.return_number",
                "source id":"attribute.source_id",
                "elevation":"attribute.elevation",
                "color":"attribute.color",
                "matcap":"attribute.matcap",
                "indices":"attribute.indices",
                "level of detail":"attribute.level_of_detail",
                "composite":"attribute.composite",
                'signed norm':"attribute.signed_norm"
            };

            options = options.filter(o => !blacklist.includes(o));
            let attributeSelection = panel.find('#optMaterial');
			for(let option of options){
                if(translationOptions[option]){
                    let elOption = $(`<option value="${option}" data-i18n="${translationOptions[option]}">${option}</option>`);
                    attributeSelection.append(elOption);
                }
                else{
                    let elOption = $(`<option>${option}</option>`);
                    attributeSelection.append(elOption);
                }

            }
            attributeSelection.i18n();

            const extarBlacklist = [
                "POSITION_CARTESIAN",
                'intensity',
                "position",
                "rgba",
                "classification",
                "gps-time",
                "returnNumber",
                "number of returns",
                "return number",
                "source id"
            ];
            let extraoptions = [];
            extraoptions.push(...attributes.map(a => a.name));
            extraoptions = extraoptions.filter(o => !extarBlacklist.includes(o));

            let signedNormSelectionX = panel.find('#optSignedNormX');
            let signedNormSelectionY = panel.find('#optSignedNormY');
            let signedNormSelectionZ = panel.find('#optSignedNormZ');
            for(let option of extraoptions){
                signedNormSelectionX.append( $(`<option>${option}</option>`));
                signedNormSelectionY.append( $(`<option>${option}</option>`));
                signedNormSelectionZ.append( $(`<option>${option}</option>`));
            }

            let updateMaterialPanel = (event, ui) => {
                let selectedValue = attributeSelection.selectmenu().val();
                material.activeAttributeName = selectedValue;
                material.xActiveAttributeName = signedNormSelectionX.val();
                material.yActiveAttributeName = signedNormSelectionY.val();
                material.zActiveAttributeName = signedNormSelectionZ.val();

                let pointclouds = this.getSelectedPointclouds();
                for (let point of pointclouds) {
                    point.material.activeAttributeName = selectedValue;
                    point.material.xActiveAttributeName = signedNormSelectionX.val();
                    point.material.yActiveAttributeName = signedNormSelectionY.val();
                    point.material.zActiveAttributeName = signedNormSelectionZ.val();
                }

                let attribute = pointcloud.getAttribute(selectedValue);

				if(selectedValue === "intensity gradient"){
                    attribute = pointcloud.getAttribute("intensity");
                }

                const isIntensity = attribute ? ["intensity", "intensity gradient"].includes(attribute.name) : false;
                const isSignedNorm = selectedValue == "signed norm";
				if(isIntensity){
					if(pointcloud.material.intensityRange[0] === Infinity){
                        pointcloud.material.intensityRange = attribute.range;
                    }
                    // for (let point of pointclouds) {
                    //     point.material.intensityRange = attribute.range;
                    // }

                    let range = material.intensityRange;

                    let step = 1;
                    let maxRange = range[1];
                    if (range[1] <= 5) {
                        step = 0.01;
                    }
                    const [min, max] = attribute.range;

                    panel.find('#sldIntensityRange').slider({
                        range: true,
                        min: 0,
                        max: 65535,
                        step: step,
                        // min: min, max: max, step: 0.01,
                        values: [range[0], range[1]],
                        slide: (event, ui) => {
                            let min = ui.values[0];
                            let max = ui.values[1];
                            material.intensityRange = [min, max];
                            let pointClouds = self.getSelectedPointclouds();
                            for (let point of pointClouds) {
                                point.material.intensityRange = [min, max];
                            }
                        }
                    });
                  

                     panel.find('#sldIntensityCurveOrder').slider({
							min: -1.5, max: 1.5, step: 0.01,
							values: material.intensityCurveOrder,
							slide: (event, ui) => {
								material.intensityCurveOrder = ui.value;
                                let pointClouds = self.getSelectedPointclouds();
                                for (let point of pointClouds) {
                                    point.material.intensityCurveOrder = ui.value;
                                }
                            }
						});
                }
                else if(isSignedNorm){
                    let [xmin, xmax] = [0,1];
                    let [ymin, ymax] = [0,1];
                    let [zmin, zmax] =[0,1];
                    let xAttribute = pointcloud.getAttribute(material.xActiveAttributeName);
                    if(xAttribute){
                         [xmin, xmax] =  xAttribute.range;
                    }
                    let yAttribute = pointcloud.getAttribute(material.yActiveAttributeName);
                    if(yAttribute){
                         [ymin, ymax] =  yAttribute.range;
                    }
                    let zAttribute = pointcloud.getAttribute(material.zActiveAttributeName);
                    if(zAttribute){
                         [zmin, zmax] =  zAttribute.range;
                    }

                    let min = Math.min(Math.min(xmin, ymin), zmin);
                    let max = Math.min(Math.min(xmax, ymax), zmax);

                    let selectedRange = material.getRange("signed norm");
					if(!selectedRange){
                         selectedRange = [min,max];
                    }
                    panel.find('#sldExtraRange').slider({
                        range: true,
                        min: min,
                        max: max,
                        step: 0.01,
                        values: selectedRange,
                        slide: (event, ui) => {
                            let [a, b] = ui.values;
                            material.setRange("signed norm", [a, b]);
                        }
                    });
                }else if(attribute){
                    const [min, max] = attribute.range;

                    let selectedRange = material.getRange(attribute.name);

					if(!selectedRange){
                        selectedRange = [...attribute.range];
                    }

                    let minMaxAreNumbers = typeof min === "number" && typeof max === "number";

					if(minMaxAreNumbers){
                        panel.find('#sldExtraRange').slider({
                            range: true,
                            min: min,
                            max: max,
                            step: 0.01,
                            values: selectedRange,
                            slide: (event, ui) => {
                                let [a, b] = ui.values;

                                material.setRange(attribute.name, [a, b]);
                            }
                        });
                    }

                }

                let blockWeights = $('#materials\\.composite_weight_container');
                let blockElevation = $('#materials\\.elevation_container');
                let blockRGB = $('#materials\\.rgb_container');
                let blockExtra = $('#materials\\.extra_container');
                let blockColor = $('#materials\\.color_container');
                let blockIntensity = $('#materials\\.intensity_container');
                let blockIndex = $('#materials\\.index_container');
                let blockTransition = $('#materials\\.transition_container');
                let blockGps = $('#materials\\.gpstime_container');
                let blockMatcap = $('#materials\\.matcap_container');
                let blockSignedNorm = $('#materials\\.signed_norm_container');

                blockIndex.css('display', 'none');
                blockIntensity.css('display', 'none');
                blockElevation.css('display', 'none');
                blockRGB.css('display', 'none');
                blockExtra.css('display', 'none');
                blockColor.css('display', 'none');
                blockWeights.css('display', 'none');
                blockTransition.css('display', 'none');
                blockMatcap.css('display', 'none');
                blockGps.css('display', 'none');
                blockSignedNorm.css('display', 'none');

                if (selectedValue === 'composite') {
                    blockWeights.css('display', 'block');
                    blockElevation.css('display', 'block');
                    blockRGB.css('display', 'block');
                    blockIntensity.css('display', 'block');
                } else if (selectedValue === 'elevation') {
                    blockElevation.css('display', 'block');
                } else if (selectedValue === 'RGB and Elevation') {
                    blockRGB.css('display', 'block');
                    blockElevation.css('display', 'block');
                } else if (selectedValue === 'rgba') {
                    blockRGB.css('display', 'block');
                } else if (selectedValue === 'color') {
                    blockColor.css('display', 'block');
                } else if (selectedValue === 'intensity') {
                    blockIntensity.css('display', 'block');
                } else if (selectedValue === 'intensity gradient') {
                    blockIntensity.css('display', 'block');
				} else if (selectedValue === "indices" ){
                    blockIndex.css('display', 'block');
				} else if (selectedValue === "matcap" ){
                    blockMatcap.css('display', 'block');
				} else if (selectedValue === "classification" ){
                    // add classification color selctor?
				} else if (selectedValue === "gps-time" ){
                    blockGps.css('display', 'block');
				} else if(selectedValue === "number of returns"){

				} else if(selectedValue === "return number"){

				} else if(["source id", "point source id"].includes(selectedValue)){

				} else if(selectedValue === "signed norm"){
                    blockSignedNorm.css('display', 'block');
                    blockExtra.css('display', 'block');
				} else{
                    blockExtra.css('display', 'block');
                }
            };

			// attributeSelection.selectmenu({change: updateMaterialPanel});
            // signedNormSelectionX.selectmenu({change: updateMaterialPanel});
            // signedNormSelectionY.selectmenu({change: updateMaterialPanel});
            // signedNormSelectionZ.selectmenu({change: updateMaterialPanel});

            attributeSelection.selectmenu({appendTo: panel, change: updateMaterialPanel});
            signedNormSelectionX.selectmenu({appendTo: panel, change: updateMaterialPanel});
            signedNormSelectionY.selectmenu({appendTo: panel, change: updateMaterialPanel});
            signedNormSelectionZ.selectmenu({appendTo: panel, change: updateMaterialPanel});
            let update = () => {
                attributeSelection.val(material.activeAttributeName).selectmenu('refresh');
                signedNormSelectionX.val(material.xActiveAttributeName).selectmenu('refresh');
                signedNormSelectionY.val(material.yActiveAttributeName).selectmenu('refresh');
                signedNormSelectionZ.val(material.zActiveAttributeName).selectmenu('refresh');
            };
            this.addVolatileListener(material, "point_color_type_changed", update);
            this.addVolatileListener(material, "active_attribute_changed", update);

            update();
            updateMaterialPanel();
        }

        {
			const schemes = Object.keys(Potree.Gradients).map(name => ({name: name, values: Gradients[name]}));

            let elSchemeContainer = panel.find("#elevation_gradient_scheme_selection");

            for (let scheme of schemes) {
                let elScheme = $(`
                            <span style="flex-grow: 1;">
                            </span>
                        `);

                const svg = Potree.Utils.createSvgGradient(scheme.values);
                svg.setAttributeNS(null, "class", `button-icon`);

                elScheme.append($(svg));

                elScheme.click(() => {
                    material.gradient = Potree.Gradients[scheme.name];
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.gradient = Potree.Gradients[scheme.name]
                    }
                });

                elSchemeContainer.append(elScheme);
            }
        }

        {
            const schemes = Object.keys(Potree.Gradients).map(name => ({ name: name, values: Potree.Gradients[name] }));

            let elSchemeContainer = panel.find("#extra_gradient_scheme_selection");

            for (let scheme of schemes) {
                let elScheme = $(`
                <span style="flex-grow: 1;">
                </span>
            `);

                const svg = Utils.createSvgGradient(scheme.values);
                svg.setAttributeNS(null, "class", `button-icon`);

                elScheme.append($(svg));

                elScheme.click(() => {
                    material.gradient = Potree.Gradients[scheme.name];
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.gradient = Potree.Gradients[scheme.name]
                    }
                });

                elSchemeContainer.append(elScheme);
            }
        }

        {
            const schemes = Object.keys(Potree.Gradients).map(name => ({ name: name, values: Potree.Gradients[name] }));

            let elSchemeContainer = panel.find("#intensity_gradient_scheme_selection");

            for (let scheme of schemes) {
                let elScheme = $(`
                <span style="flex-grow: 1;">
                </span>
            `);

                const svg = Utils.createSvgGradient(scheme.values);
                svg.setAttributeNS(null, "class", `button-icon`);

                elScheme.append($(svg));

                elScheme.click(() => {
                    material.gradient = Potree.Gradients[scheme.name];
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.gradient = Potree.Gradients[scheme.name]
                    }
                });

                elSchemeContainer.append(elScheme);
            }
        }

        {
            let matcaps = [
				{name: "Normals", icon: `${Potree.resourcePath}/icons/matcap/check_normal+y.jpg`}, 
				{name: "Basic 1", icon: `${Potree.resourcePath}/icons/matcap/basic_1.jpg`}, 
				{name: "Basic 2", icon: `${Potree.resourcePath}/icons/matcap/basic_2.jpg`}, 
				{name: "Basic Dark", icon: `${Potree.resourcePath}/icons/matcap/basic_dark.jpg`}, 
				{name: "Basic Side", icon: `${Potree.resourcePath}/icons/matcap/basic_side.jpg`}, 
				{name: "Ceramic Dark", icon: `${Potree.resourcePath}/icons/matcap/ceramic_dark.jpg`}, 
				{name: "Ceramic Lightbulb", icon: `${Potree.resourcePath}/icons/matcap/ceramic_lightbulb.jpg`}, 
				{name: "Clay Brown", icon: `${Potree.resourcePath}/icons/matcap/clay_brown.jpg`}, 
				{name: "Clay Muddy", icon: `${Potree.resourcePath}/icons/matcap/clay_muddy.jpg`}, 
				{name: "Clay Studio", icon: `${Potree.resourcePath}/icons/matcap/clay_studio.jpg`}, 
				{name: "Resin", icon: `${Potree.resourcePath}/icons/matcap/resin.jpg`}, 
				{name: "Skin", icon: `${Potree.resourcePath}/icons/matcap/skin.jpg`}, 
				{name: "Jade", icon: `${Potree.resourcePath}/icons/matcap/jade.jpg`}, 
				{name: "Metal_ Anisotropic", icon: `${Potree.resourcePath}/icons/matcap/metal_anisotropic.jpg`}, 
				{name: "Metal Carpaint", icon: `${Potree.resourcePath}/icons/matcap/metal_carpaint.jpg`}, 
				{name: "Metal Lead", icon: `${Potree.resourcePath}/icons/matcap/metal_lead.jpg`}, 
				{name: "Metal Shiny", icon: `${Potree.resourcePath}/icons/matcap/metal_shiny.jpg`}, 
				{name: "Pearl", icon: `${Potree.resourcePath}/icons/matcap/pearl.jpg`}, 
				{name: "Toon", icon: `${Potree.resourcePath}/icons/matcap/toon.jpg`},
				{name: "Check Rim Light", icon: `${Potree.resourcePath}/icons/matcap/check_rim_light.jpg`}, 
				{name: "Check Rim Dark", icon: `${Potree.resourcePath}/icons/matcap/check_rim_dark.jpg`}, 
				{name: "Contours 1", icon: `${Potree.resourcePath}/icons/matcap/contours_1.jpg`}, 
				{name: "Contours 2", icon: `${Potree.resourcePath}/icons/matcap/contours_2.jpg`}, 
				{name: "Contours 3", icon: `${Potree.resourcePath}/icons/matcap/contours_3.jpg`}, 
				{name: "Reflection Check Horizontal", icon: `${Potree.resourcePath}/icons/matcap/reflection_check_horizontal.jpg`}, 
				{name: "Reflection Check Vertical", icon: `${Potree.resourcePath}/icons/matcap/reflection_check_vertical.jpg`}, 
            ];

            let elMatcapContainer = panel.find("#matcap_scheme_selection");

			for(let matcap of matcaps){
                let elMatcap = $(`
                            <img src="${matcap.icon}" class="button-icon" style="width: 25%;" />
                    `);

				elMatcap.click( () => {
                    material.matcap = matcap.icon.substring(matcap.icon.lastIndexOf('/'));
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.matcap = matcap.icon.substring(matcap.icon.lastIndexOf('/'));
                    }
                });

                elMatcapContainer.append(elMatcap);
            }
        }

        {
            panel.find('#sldRGBGamma').slider({
                value: material.rgbGamma,
                min: 0, max: 4, step: 0.01,
                slide: (event, ui) => {
                    material.rgbGamma = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.rgbGamma = ui.value;
                    }
                }
            });

            panel.find('#sldRGBContrast').slider({
                value: material.rgbContrast,
                min: -1, max: 1, step: 0.01,
                slide: (event, ui) => {
                    material.rgbContrast = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.rgbContrast = ui.value;
                    }
                }
            });

            panel.find('#sldRGBEnhance').slider({
                value: material.rgbContrast,
                min: 1, max: 3, step: 0.01, value: 1,
                slide: (event, ui) => {
                    material.rgbEnhance = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.rgbEnhance = ui.value;
                    }
                }
            });

            panel.find('#sldRGBBrightness').slider({
                value: material.rgbBrightness,
                min: -1, max: 1, step: 0.01,
                slide: (event, ui) => {
                    material.rgbBrightness = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.rgbBrightness = ui.value;
                    }
                }
            });

            panel.find('#sldExtraGamma').slider({
                value: material.extraGamma,
                min: 0, max: 4, step: 0.01,
                slide: (event, ui) => {
                    material.extraGamma = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.extraGamma = ui.value;
                    }
                }
            });

            panel.find('#sldExtraBrightness').slider({
                value: material.extraBrightness,
                min: -1, max: 1, step: 0.01,
                slide: (event, ui) => {
                    material.extraBrightness = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.extraBrightness = ui.value;
                    }
                }
            });

            panel.find('#sldExtraContrast').slider({
                value: material.extraContrast,
                min: -1, max: 1, step: 0.01,
                slide: (event, ui) => {
                    material.extraContrast = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.extraContrast = ui.value;
                    }
                }
            });

            panel.find('#sldHeightRange').slider({
                range: true,
                min: 0, max: 1000, step: 0.01,
                values: [0, 1000],
                slide: (event, ui) => {
                    material.heightMin = ui.values[0];
                    material.heightMax = ui.values[1];
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.heightMin = ui.values[0];
                        point.material.heightMax = ui.values[1];
                    }
                }
            });

            panel.find('#sldIntensityGamma').slider({
                value: material.intensityGamma,
                min: 0, max: 4, step: 0.01,
                slide: (event, ui) => {
                    material.intensityGamma = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.intensityGamma = ui.value;
                    }
                }
            });

            panel.find('#sldIntensityContrast').slider({
                value: material.intensityContrast,
                min: -1, max: 1, step: 0.01,
                slide: (event, ui) => {
                    material.intensityContrast = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.intensityContrast = ui.value;
                    }
                }
            });

            panel.find('#sldIntensityBrightness').slider({
                value: material.intensityBrightness,
                min: -1, max: 1, step: 0.01,
                slide: (event, ui) => {
                    material.intensityBrightness = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.intensityBrightness = ui.value;
                    }
                }
            });

            panel.find('#sldWeightRGB').slider({
                value: material.weightRGB,
                min: 0, max: 1, step: 0.01,
                slide: (event, ui) => {
                    material.weightRGB = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.weightRGB = ui.value;
                    }
                }
            });

            panel.find('#sldWeightIntensity').slider({
                value: material.weightIntensity,
                min: 0, max: 1, step: 0.01,
                slide: (event, ui) => {
                    material.weightIntensity = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.weightIntensity = ui.value;
                    }
                }
            });

            panel.find('#sldWeightElevation').slider({
                value: material.weightElevation,
                min: 0, max: 1, step: 0.01,
                slide: (event, ui) => {
                    material.weightElevation = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.weightElevation = ui.value;
                    }
                }
            });

            panel.find('#sldWeightClassification').slider({
                value: material.weightClassification,
                min: 0, max: 1, step: 0.01,
                slide: (event, ui) => {
                    material.weightClassification = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.weightClassification = ui.value;
                    }
                }
            });

            panel.find('#sldWeightReturnNumber').slider({
                value: material.weightReturnNumber,
                min: 0, max: 1, step: 0.01,
                slide: (event, ui) => {
                    material.weightReturnNumber = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.weightReturnNumber = ui.value;
                    }
                }
            });

            panel.find('#sldWeightSourceID').slider({
                value: material.weightSourceID,
                min: 0, max: 1, step: 0.01,
                slide: (event, ui) => {
                    material.weightSourceID = ui.value;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.weightSourceID = ui.value;
                    }
                }
            });

            panel.find(`#materials\\.color\\.picker`).spectrum({
                flat: true,
                showInput: true,
                preferredFormat: 'rgb',
                cancelText: '',
                chooseText: 'Apply',
                color: `#${material.color.getHexString()}`,
                move: color => {
                    let cRGB = color.toRgb();
                    let tc = new THREE.Color().setRGB(cRGB.r / 255, cRGB.g / 255, cRGB.b / 255);
                    material.color = tc;
                    let pointClouds = self.getSelectedPointclouds();
                    for (let point of pointClouds) {
                        point.material.color = tc;
                    }
                },
                change: color => {
                    let cRGB = color.toRgb();
                    let tc = new THREE.Color().setRGB(cRGB.r / 255, cRGB.g / 255, cRGB.b / 255);
                    	material.color = tc;
                    let pointClouds = self.getSelectedPointclouds();
                    for(let point of pointClouds){
                    	point.material.color = tc;
                    }
                }
            });

            this.addVolatileListener(material, "color_changed", () => {
                // panel.find(`#materials\\.color\\.picker`)
                // 	.spectrum('set', `#${material.color.getHexString()}`);
            });

            let updateHeightRange = function () {


                let aPosition = pointcloud.getAttribute("position");

                let bMin, bMax;

				if(aPosition){
                    // for new format 2.0 and loader that contain precomputed min/max of attributes
                    let min = aPosition.range[0][2];
                    let max = aPosition.range[1][2];
                    let width = max - min;

                    bMin = min - 0.2 * width;
                    bMax = max + 0.2 * width;
				}else{
                    // for format up until exlusive 2.0
                    let box = [pointcloud.pcoGeometry.tightBoundingBox, pointcloud.getBoundingBoxWorld()]
                        .find(v => v !== undefined);

                    pointcloud.updateMatrixWorld(true);
					box = Utils.computeTransformedBoundingBox(box, pointcloud.matrixWorld);

                    let bWidth = box.max.z - box.min.z;
                    bMin = box.min.z - 0.2 * bWidth;
                    bMax = box.max.z + 0.2 * bWidth;
                }

                let range = material.elevationRange;

                panel.find('#lblHeightRange').html(`${range[0].toFixed(2)} to ${range[1].toFixed(2)}`);
				panel.find('#sldHeightRange').slider({min: bMin, max: bMax, values: range});
            };

            let updateExtraRange = function () {

                let attributeName = material.activeAttributeName;
                let attribute = pointcloud.getAttribute(attributeName);


                let range = material.getRange(attributeName);
				if(range == null && attribute){
                    range = attribute.range;
                }

                // currently only supporting scalar ranges.
                // rgba, normals, positions, etc have vector ranges, however
                if(range){
                    let isValidRange = (typeof range[0] === "number") && (typeof range[1] === "number");
                    if(!isValidRange){
                        return;
                    }
                }

				if(range){
                    let msg = `${range[0].toFixed(2)} to ${range[1].toFixed(2)}`;
                    panel.find('#lblExtraRange').html(msg);
				}else{
                    panel.find("could not deduce range");
                }
            };

            let updateIntensityRange = function () {
                let range = material.intensityRange;

              

                let val1 = range[0].toFixed(2);
                let val2 = range[1].toFixed(2);

                // if (range[1] <= 2.5) {
                //     val1 = ((range[0] * 65535) / 2.5).toFixed(2);
                //     val2 = ((range[1] * 65535) / 2.5).toFixed(2);
                // }


                panel.find('#lblIntensityRange').html(`${val1} to ${val2}`);
            };

            {
                updateHeightRange();
                panel.find(`#sldHeightRange`).slider('option', 'min');
                panel.find(`#sldHeightRange`).slider('option', 'max');
            }

            {
                let elGradientRepeat = panel.find("#gradient_repeat_option");
				elGradientRepeat.selectgroup({title: "Gradient"});

                Utils.set_data_i18n_ForSelectionGroup("#gradient_repeat_option", "appearance.gradient", ["appearance.clamp", "appearance.repeat", "appearance.mirrored_repeat"])

                elGradientRepeat.find("input").click((e) => {
                    this.viewer.setElevationGradientRepeat(Potree.ElevationGradientRepeat[e.target.value]);
                });

				let current = Object.keys(ElevationGradientRepeat)
					.filter(key => ElevationGradientRepeat[key] === this.viewer.elevationGradientRepeat);
                elGradientRepeat.find(`input[value=${current}]`).trigger("click");
                panel.i18n();
            }

            {
                let elGradientRepeat = panel.find("#extra_gradient_repeat_option");
				elGradientRepeat.selectgroup({title: "Gradient"});

                Utils.set_data_i18n_ForSelectionGroup("#extra_gradient_repeat_option", "appearance.gradient", ["appearance.clamp", "appearance.repeat", "appearance.mirrored_repeat"])


                elGradientRepeat.find("input").click((e) => {
                    this.viewer.setElevationGradientRepeat(ElevationGradientRepeat[e.target.value]);
                });

				let current = Object.keys(ElevationGradientRepeat)
					.filter(key => ElevationGradientRepeat[key] === this.viewer.elevationGradientRepeat);
                elGradientRepeat.find(`input[value=${current}]`).trigger("click");
            }

            let onIntensityChange = () => {
                let gamma = material.intensityGamma;
                let contrast = material.intensityContrast;
                let brightness = material.intensityBrightness;
                let intensityCurveOrder = material.intensityCurveOrder;

                updateIntensityRange();

                panel.find('#lblIntensityGamma').html(gamma.toFixed(2));
                panel.find('#lblIntensityContrast').html(contrast.toFixed(2));
                panel.find('#lblIntensityBrightness').html(brightness.toFixed(2));
                panel.find('#lblIntensityCurveOrder').html(intensityCurveOrder.toFixed(2));


				panel.find('#sldIntensityGamma').slider({value: gamma});
				panel.find('#sldIntensityContrast').slider({value: contrast});
				panel.find('#sldIntensityBrightness').slider({value: brightness});
                panel.find('#sldIntensityCurveOrder').slider({value: intensityCurveOrder});

            };

            let onRGBChange = () => {
                let gamma = material.rgbGamma;
                let contrast = material.rgbContrast;
                let brightness = material.rgbBrightness;
                let enhance = material.rgbEnhance;

                panel.find('#lblRGBGamma').html(gamma.toFixed(2));
                panel.find('#lblRGBContrast').html(contrast.toFixed(2));
                panel.find('#lblRGBBrightness').html(brightness.toFixed(2));
                panel.find('#lblRGBEnhance').html(enhance.toFixed(2));

				panel.find('#sldRGBGamma').slider({value: gamma});
				panel.find('#sldRGBContrast').slider({value: contrast});
				panel.find('#sldRGBBrightness').slider({value: brightness});
                panel.find('#sldRGBEnhance').slider({value: enhance});
            };

           

            this.addVolatileListener(material, "material_property_changed", updateExtraRange);
            this.addVolatileListener(material, "material_property_changed", updateHeightRange);
            this.addVolatileListener(material, "material_property_changed", onIntensityChange);
            this.addVolatileListener(material, "material_property_changed", onRGBChange);

            updateExtraRange();
            updateHeightRange();
            onIntensityChange();
            onRGBChange();
		}

	}

	

	setMeasurement(object){
        
		let TYPE = {
			DISTANCE: {panel: DistancePanel},
			AREA: {panel: AreaPanel},
			POINT: {panel: PointPanel},
			ANGLE: {panel: AnglePanel},
			HEIGHT: {panel: HeightPanel},
			PROFILE: {panel: ProfilePanel},
			VOLUME: {panel: VolumePanel},
			CIRCLE: {panel: CirclePanel},
			OTHER: {panel: PointPanel},
		};

		let getType = (measurement) => {
			if (measurement instanceof Measure) {
				if (measurement.showDistances && !measurement.showArea && !measurement.showAngles) {
					return TYPE.DISTANCE;
				} else if (measurement.showDistances && measurement.showArea && !measurement.showAngles) {
					return TYPE.AREA;
				} else if (measurement.maxMarkers === 1) {
					return TYPE.POINT;
				} else if (!measurement.showDistances && !measurement.showArea && measurement.showAngles) {
					return TYPE.ANGLE;
				} else if (measurement.showHeight) {
					return TYPE.HEIGHT;
				} else if (measurement.showCircle) {
					return TYPE.CIRCLE;
				} else {
					return TYPE.OTHER;
				}
			} else if (measurement instanceof Profile) {
				return TYPE.PROFILE;
			} else if (measurement instanceof Volume) {
				return TYPE.VOLUME;
            }
		};

		//this.container.html("measurement");

		let type = getType(object);
		let Panel = type.panel;

		let panel = new Panel(this.viewer, object, this);
		this.container.append(panel.elContent);
	}

	setCamera(camera){
		let panel = new CameraPanel(this.viewer, this);
		this.container.append(panel.elContent);
	}

	setAnnotation(annotation){
		let panel = new AnnotationPanel(this.viewer, this, annotation);
		this.container.append(panel.elContent);
	}

	setCameraAnimation(animation){
		let panel = new CameraAnimationPanel(this.viewer, this, animation)
		this.container.append(panel.elContent);
	}

    setPolygonClipVolume(polygonVolume){
        let panel = new PolygonClipVolumePanel(this.viewer,polygonVolume, this);
        this.container.append(panel.elContent);
    }

}
