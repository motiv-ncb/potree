
import * as THREE from "../../../libs/three.js/build/three.module.js";
import {Utils} from "../../utils.js";
import {Volume, BoxVolume, SphereVolume} from "../../utils/Volume.js";

import {MeasurePanel} from "./MeasurePanel.js";

export class VolumePanel extends MeasurePanel{
	constructor(viewer, measurement, propertiesPanel){
		super(viewer, measurement, propertiesPanel);

		let copyIconPath = Potree.resourcePath + '/icons/copy.svg';
		let removeIconPath = Potree.resourcePath + '/icons/remove.svg';

		let lblLengthText = new Map([
			[BoxVolume, "length"],
			[SphereVolume, "rx"],
		]).get(measurement.constructor);

		let lblWidthText = new Map([
			[BoxVolume, "width"],
			[SphereVolume, "ry"],
		]).get(measurement.constructor);

		let lblHeightText = new Map([
			[BoxVolume, "height"],
			[SphereVolume, "rz"],
		]).get(measurement.constructor);

		this.elContent = $(`
			<div class="measurement_content selectable">
				<span class="coordinates_table_container"></span>
                <span class="top_botom_level_table_container"></span>
				<table class="measurement_value_table">
					<tr>
						<th>\u03b1</th>
						<th>\u03b2</th>
						<th>\u03b3</th>
						<th></th>
					</tr>
					<tr>
						<td align="center" id="angle_cell_alpha" style="width: 33%"></td>
						<td align="center" id="angle_cell_betta" style="width: 33%"></td>
						<td align="center" id="angle_cell_gamma" style="width: 33%"></td>
						<td align="right" style="width: 25%">
							<img name="copyRotation" title="copy" class="button-icon" src="${copyIconPath}" style="width: 16px; height: 16px"/>
						</td>
					</tr>
				</table>

				<table class="measurement_value_table">
					<tr>
						<th data-i18n="tt.length">${lblLengthText}</th>
						<th data-i18n="tt.width">${lblWidthText}</th>
						<th data-i18n="tt.height">${lblHeightText}</th>
						<th></th>
					</tr>
					<tr>
						<td align="center" id="cell_length" style="width: 33%"></td>
						<td align="center" id="cell_width" style="width: 33%"></td>
						<td align="center" id="cell_height" style="width: 33%"></td>
						<td align="right" style="width: 25%">
							<img name="copyScale" title="copy" class="button-icon" src="${copyIconPath}" style="width: 16px; height: 16px"/>
						</td>
					</tr>
				</table>

				<br>
				<span style="font-weight: bold">Volume: </span>
				<span id="measurement_volume"></span>
               

				<!--
				<li>
					<label style="whitespace: nowrap">
						<input id="volume_show" type="checkbox"/>
						<span>show volume</span>
					</label>
				</li>-->

				<li>
					<label style="whitespace: nowrap">
						<input id="volume_clip" type="checkbox"/>
						<span data-i18n="tt.make_clipping_volume">make clip volume</span>
					</label>
				</li>

				<li style="margin-top: 10px">
					<input name="download_volume" type="button" value="prepare download" style="width: 100%" />
					<div name="download_message"></div>
				</li>


				<!-- ACTIONS -->
				<li style="display: grid; grid-template-columns: auto auto; grid-column-gap: 5px; margin-top: 10px">
					<button id="volume_reset_orientation" type="button" data-i18n="tt.reset_orientation" value="reset orientation"/>
					<button id="volume_make_uniform" type="button" data-i18n="tt.make_cube" value="make uniform"/>
				</li>

                <div id="measurement_move_container">
                    <br>
                    <li>
                        <label style="whitespace: nowrap">
                            <input id="measurement_enable_crop_move" type="checkbox" checked/>
                            <span data-i18n="common.move_points">Move points</span>
                        </label>
                    </li>
                    <div id="measurement_move_panel">
                        <br>
                        <li>
                            <label style="whitespace: nowrap">
                                <span data-i18n="common.move_translation">Move Translation</span>
                            </label>
                        </li>
                        <table class="measurement_value_table" id="measurement_crop_translation_table">         
                            <tr>
                                <th><input id="measurement_enable_crop_translate_x" type="checkbox"/  checked><span>x</span></th>
                                <th><input id="measurement_enable_crop_translate_y" type="checkbox"/  checked><span>y</span></th>
                                <th><input id="measurement_enable_crop_translate_z" type="checkbox"/  checked><span>z</span></th>
                                <th></th>
                            </tr>
                        </table>
                        <br>
                        <li>
                            <label style="whitespace: nowrap">
                                <span data-i18n="common.move_rotation">Move Rotation</span>
                            </label>
                        </li>
                        <table class="measurement_value_table" id="measurement_crop_rotation_table">
                            <tr>
                                <th><input id="measurement_enable_crop_rotation_x" type="checkbox"/><span>x</span></th>
                                <th><input id="measurement_enable_crop_rotation_y" type="checkbox"/><span>y</span></th>
                                <th><input id="measurement_enable_crop_rotation_z" type="checkbox"/><span>z</span></th>
                                <th></th>
                            </tr>
                        </table>

                        <li style="display: grid; grid-template-columns: auto auto; grid-column-gap: 5px; margin-top: 10px">
                            <button id="volume_move_reset_rotation" type="button" data-i18n="common.reset_rotation">Reset move rotation</button>
                            <button id="volume_move_reset_all" type="button" data-i18n="common.reset_all">Reset all movement</button>
                        </li>
                     </div>
                </div>

				<div style="display: flex; margin-top: 12px">
					<span></span>
					<span style="flex-grow: 1"></span>
					<img name="remove" class="button-icon" src="${removeIconPath}" style="width: 16px; height: 16px"/>
				</div>
			</div>
		`);

		{ // download
			this.elDownloadButton = this.elContent.find("input[name=download_volume]");

			if(this.propertiesPanel.viewer.server){
				this.elDownloadButton.click(() => this.download());
			} else {
				this.elDownloadButton.hide();
			}
		}

		this.elCopyRotation = this.elContent.find("img[name=copyRotation]");
		this.elCopyRotation.click( () => {
			let rotation = this.measurement.rotation.toArray().slice(0, 3);
			let msg = rotation.map(c => c.toFixed(3)).join(", ");
			Utils.clipboardCopy(msg);

			this.viewer.postMessage(
					`Copied value to clipboard: <br>'${msg}'`,
					{duration: 3000});
		});

		this.elCopyScale = this.elContent.find("img[name=copyScale]");
		this.elCopyScale.click( () => {
			let scale = this.measurement.scale.toArray();
			let msg = scale.map(c => c.toFixed(3)).join(", ");
			Utils.clipboardCopy(msg);

			this.viewer.postMessage(
					`Copied value to clipboard: <br>'${msg}'`,
					{duration: 3000});
		});

		this.elRemove = this.elContent.find("img[name=remove]");
		this.elRemove.click( () => {
			this.viewer.scene.removeVolume(measurement);
		});

		this.elContent.find("#volume_reset_orientation").click(() => {
			measurement.rotation.set(0, 0, 0);
            if(measurement.updateTransformdVolumeByConstrains && measurement.syncingVolume){
                if(measurement.constructor.name == "TransformedBoxVolume"){
                    measurement.syncingVolume.set(0, 0, 0);
                }
                measurement.updateTransformdVolumeByConstrains();
            }
		});

        // CMAIR Move
        if(measurement.constructor.name == "TransformOriginBoxVolume" || measurement.constructor.name == "TransformedBoxVolume"){
            const isOrigin = measurement.constructor.name == "TransformOriginBoxVolume";
            this.elContent.find("#measurement_enable_crop_move").change(() => {
                let _enableMove = this.elContent.find("#measurement_enable_crop_move").is(':checked')
                if(isOrigin){
                    measurement.enableMove = _enableMove;

                }else{
                    measurement.syncingVolume.enableMove = _enableMove;
                }
                if (_enableMove){
                    this.elContent.find("#measurement_move_panel").show();
                }
                else{
                    this.elContent.find("#measurement_move_panel").hide();
                }
                measurement.updateTransformdVolumeByConstrains();
            });

            this.elContent.find("#measurement_enable_crop_translate_x").change(() => {
                if(isOrigin){
                    measurement.enableTranslationX = this.elContent.find("#measurement_enable_crop_translate_x").is(':checked');
                }
                else{
                    measurement.syncingVolume.enableTranslationX = this.elContent.find("#measurement_enable_crop_translate_x").is(':checked');
                }
                measurement.updateTransformdVolumeByConstrains();
            });

            this.elContent.find("#measurement_enable_crop_translate_y").change(() => {
                if(isOrigin){
                    measurement.enableTranslationY = this.elContent.find("#measurement_enable_crop_translate_y").is(':checked');
                }
                else{
                    measurement.syncingVolume.enableTranslationY = this.elContent.find("#measurement_enable_crop_translate_y").is(':checked');
                }
                measurement.updateTransformdVolumeByConstrains();
            });

            this.elContent.find("#measurement_enable_crop_translate_z").change(() => {
                if(isOrigin){
                    measurement.enableTranslationZ = this.elContent.find("#measurement_enable_crop_translate_z").is(':checked');
                }
                else{
                    measurement.syncingVolume.enableTranslationZ = this.elContent.find("#measurement_enable_crop_translate_z").is(':checked');
                }
                measurement.updateTransformdVolumeByConstrains();
            });

            this.elContent.find("#measurement_enable_crop_rotation_x").change(() => {
                if(isOrigin){
                    measurement.enableRotationX = this.elContent.find("#measurement_enable_crop_rotation_x").is(':checked');
                }
                else{
                    measurement.syncingVolume.enableRotationX = this.elContent.find("#measurement_enable_crop_rotation_x").is(':checked');
                }
                measurement.updateTransformdVolumeByConstrains();
            });

            this.elContent.find("#measurement_enable_crop_rotation_y").change(() => {
                if(isOrigin){
                    measurement.enableRotationY = this.elContent.find("#measurement_enable_crop_rotation_y").is(':checked');
                }
                else{
                    measurement.syncingVolume.enableRotationY = this.elContent.find("#measurement_enable_crop_rotation_y").is(':checked');
                }
                measurement.updateTransformdVolumeByConstrains();
            });

            this.elContent.find("#measurement_enable_crop_rotation_z").change(() => {
                if(isOrigin){
                    measurement.enableRotationZ = this.elContent.find("#measurement_enable_crop_rotation_z").is(':checked');
                }
                else{
                    measurement.syncingVolume.enableRotationZ = this.elContent.find("#measurement_enable_crop_rotation_z").is(':checked');
                }
                measurement.updateTransformdVolumeByConstrains();
            });

            this.elContent.find("#volume_move_reset_all").click(()=>{
                if(isOrigin){
                    measurement.syncingVolume.position.x = measurement.position.x;
                    measurement.syncingVolume.position.y = measurement.position.y;
                    measurement.syncingVolume.position.z = measurement.position.z;
                    measurement.syncingVolume.rotation.x = measurement.rotation.x;
                    measurement.syncingVolume.rotation.y = measurement.rotation.y;
                    measurement.syncingVolume.rotation.z = measurement.rotation.z;
                }
                else{
                    measurement.position.x = measurement.syncingVolume.position.x;
                    measurement.position.y = measurement.syncingVolume.position.y;
                    measurement.position.z = measurement.syncingVolume.position.z;
                    measurement.rotation.x = measurement.syncingVolume.rotation.x;
                    measurement.rotation.y = measurement.syncingVolume.rotation.y;
                    measurement.rotation.z = measurement.syncingVolume.rotation.z;
                }
            });
            this.elContent.find("#volume_move_reset_rotation").click(()=>{
                if(isOrigin){
                    measurement.syncingVolume.rotation.x = measurement.rotation.x;
                    measurement.syncingVolume.rotation.y = measurement.rotation.y;
                    measurement.syncingVolume.rotation.z = measurement.rotation.z;
                }
                else{
                    measurement.rotation.x = measurement.syncingVolume.rotation.x;
                    measurement.rotation.y = measurement.syncingVolume.rotation.y;
                    measurement.rotation.z = measurement.syncingVolume.rotation.z;
                }
            })

            const enableMove = isOrigin? measurement.enableMove:measurement.syncingVolume.enableMove;
            if(!enableMove){
                this.elContent.find("#measurement_move_panel").hide();
            }
            this.elContent.find('#measurement_enable_crop_move').prop('checked', enableMove);
            const enableTranslateX = isOrigin? measurement.enableTranslationX:measurement.syncingVolume.enableTranslationX;
            this.elContent.find('#measurement_enable_crop_translate_x').prop('checked', enableTranslateX);
            const enableTranslateY = isOrigin? measurement.enableTranslationY:measurement.syncingVolume.enableTranslationY;
            this.elContent.find('#measurement_enable_crop_translate_y').prop('checked', enableTranslateY);
            const enableTranslateZ = isOrigin? measurement.enableTranslationZ:measurement.syncingVolume.enableTranslationZ;
            this.elContent.find('#measurement_enable_crop_translate_z').prop('checked', enableTranslateZ);     
            const enableRotationX = isOrigin? measurement.enableRotationX:measurement.syncingVolume.enableRotationX;
            this.elContent.find('#measurement_enable_crop_rotation_x').prop('checked', enableRotationX);
            const enableRotationY = isOrigin? measurement.enableRotationY:measurement.syncingVolume.enableRotationY;
            this.elContent.find('#measurement_enable_crop_rotation_y').prop('checked', enableRotationY);
            const enableRotationZ = isOrigin? measurement.enableRotationZ:measurement.syncingVolume.enableRotationZ;
            this.elContent.find('#measurement_enable_crop_rotation_z').prop('checked', enableRotationZ);


            
        }
        else{
            this.elContent.find("#measurement_move_container").hide();
        }

        // CMAIR : only box volumes have uniform and reset orientation options
        if(!measurement instanceof BoxVolume){
            this.elContent.find("#volume_make_uniform").hide();
            this.elContent.find("#volume_reset_orientation").hide();
        }
        // CMAIR : hide measurement values for area volumes
        if(measurement.constructor.name == "AreaVolume"){
            this.elContent.find(".measurement_value_table").hide();
        }
        else{
            this.elContent.find(".area_volume_level").hide();
        }

		this.elContent.find("#volume_make_uniform").click(() => {
			let mean = (measurement.scale.x + measurement.scale.y + measurement.scale.z) / 3;
			measurement.scale.set(mean, mean, mean);
            if(measurement.syncingVolume){
                measurement.syncingVolume.scale.set(mean, mean, mean);
            }
		});

		this.elCheckClip = this.elContent.find('#volume_clip');
		this.elCheckClip.click(event => {
			this.measurement.clip = event.target.checked;
		});

		this.elCheckShow = this.elContent.find('#volume_show');
		this.elCheckShow.click(event => {
			this.measurement.visible = event.target.checked;
		});

		this.propertiesPanel.addVolatileListener(measurement, "position_changed", this._update);
		this.propertiesPanel.addVolatileListener(measurement, "orientation_changed", this._update);
		this.propertiesPanel.addVolatileListener(measurement, "scale_changed", this._update);
		this.propertiesPanel.addVolatileListener(measurement, "", this._update);
        this.elContent.i18n();
		this.update();
	}

	async download(){

		let clipBox = this.measurement;

		let regions = [];
		//for(let clipBox of boxes){
		{
			let toClip = clipBox.matrixWorld;

			let px = new THREE.Vector3(+0.5, 0, 0).applyMatrix4(toClip);
			let nx = new THREE.Vector3(-0.5, 0, 0).applyMatrix4(toClip);
			let py = new THREE.Vector3(0, +0.5, 0).applyMatrix4(toClip);
			let ny = new THREE.Vector3(0, -0.5, 0).applyMatrix4(toClip);
			let pz = new THREE.Vector3(0, 0, +0.5).applyMatrix4(toClip);
			let nz = new THREE.Vector3(0, 0, -0.5).applyMatrix4(toClip);

			let pxN = new THREE.Vector3().subVectors(nx, px).normalize();
			let nxN = pxN.clone().multiplyScalar(-1);
			let pyN = new THREE.Vector3().subVectors(ny, py).normalize();
			let nyN = pyN.clone().multiplyScalar(-1);
			let pzN = new THREE.Vector3().subVectors(nz, pz).normalize();
			let nzN = pzN.clone().multiplyScalar(-1);

			let planes = [
				new THREE.Plane().setFromNormalAndCoplanarPoint(pxN, px),
				new THREE.Plane().setFromNormalAndCoplanarPoint(nxN, nx),
				new THREE.Plane().setFromNormalAndCoplanarPoint(pyN, py),
				new THREE.Plane().setFromNormalAndCoplanarPoint(nyN, ny),
				new THREE.Plane().setFromNormalAndCoplanarPoint(pzN, pz),
				new THREE.Plane().setFromNormalAndCoplanarPoint(nzN, nz),
			];

			let planeQueryParts = [];
			for(let plane of planes){
				let part = [plane.normal.toArray(), plane.constant].join(",");
				part = `[${part}]`;
				planeQueryParts.push(part);
			}
			let region = "[" + planeQueryParts.join(",") + "]";
			regions.push(region);
		}

		let regionsArg = regions.join(",");

		let pointcloudArgs = [];
		for(let pointcloud of this.viewer.scene.pointclouds){
			if(!pointcloud.visible){
				continue;
			}

			let offset = pointcloud.pcoGeometry.offset.clone();
			let negateOffset = new THREE.Matrix4().makeTranslation(...offset.multiplyScalar(-1).toArray());
			let matrixWorld = pointcloud.matrixWorld;

			let transform = new THREE.Matrix4().multiplyMatrices(matrixWorld, negateOffset);

			let path = `${window.location.pathname}/../${pointcloud.pcoGeometry.url}`;

			let arg = {
				path: path,
				transform: transform.elements,
			};
			let argString = JSON.stringify(arg);

			pointcloudArgs.push(argString);
		}
		let pointcloudsArg = pointcloudArgs.join(",");

		let elMessage = this.elContent.find("div[name=download_message]");

		let error = (message) => {
			elMessage.html(`<div style="color: #ff0000">ERROR: ${message}</div>`);
		};

		let info = (message) => {
			elMessage.html(`${message}`);
		};

		let handle = null;
		{ // START FILTER
			let url = `${viewer.server}/create_regions_filter?pointclouds=[${pointcloudsArg}]&regions=[${regionsArg}]`;
			
			//console.log(url);

			info("estimating results ...");

			let response = await fetch(url);
			let jsResponse = await response.json();
			//console.log(jsResponse);

			if(!jsResponse.handle){
				error(jsResponse.message);
				return;
			}else{
				handle = jsResponse.handle;
			}
		}

		{ // WAIT, CHECK PROGRESS, HANDLE FINISH
			let url = `${viewer.server}/check_regions_filter?handle=${handle}`;

			let sleep = (function(duration){
				return new Promise( (res, rej) => {
					setTimeout(() => {
						res();
					}, duration);
				});
			});

			let handleFiltering = (jsResponse) => {
				let {progress, estimate} = jsResponse;

				let progressFract = progress["processed points"] / estimate.points;
				let progressPercents = parseInt(progressFract * 100);

				info(`progress: ${progressPercents}%`);
			};

			let handleFinish = (jsResponse) => {
				let message = "downloads ready: <br>";
				message += "<ul>";

				for(let i = 0; i < jsResponse.pointclouds.length; i++){
					let url = `${viewer.server}/download_regions_filter_result?handle=${handle}&index=${i}`;

					message += `<li><a href="${url}">result_${i}.las</a> </li>\n`;
				}

				let reportURL = `${viewer.server}/download_regions_filter_report?handle=${handle}`;
				message += `<li> <a href="${reportURL}">report.json</a> </li>\n`;
				message += "</ul>";

				info(message);
			};

			let handleUnexpected = (jsResponse) => {
				let message = `Unexpected Response. <br>status: ${jsResponse.status} <br>message: ${jsResponse.message}`;
				info(message);
			};

			let handleError = (jsResponse) => {
				let message = `ERROR: ${jsResponse.message}`;
				error(message);

				throw new Error(message);
			};

			let start = Date.now();

			while(true){
				let response = await fetch(url);
				let jsResponse = await response.json();

				if(jsResponse.status === "ERROR"){
					handleError(jsResponse);
				}else if(jsResponse.status === "FILTERING"){
					handleFiltering(jsResponse);
				}else if(jsResponse.status === "FINISHED"){
					handleFinish(jsResponse);

					break;
				}else{
					handleUnexpected(jsResponse);
				}

				let durationS = (Date.now() - start) / 1000;
				let sleepAmountMS = durationS < 10 ? 100 : 1000;

				await sleep(sleepAmountMS);
			}
		}

	}

	update(){
		let elCoordiantesContainer = this.elContent.find('.coordinates_table_container');
		elCoordiantesContainer.empty();

        let elTopBottomContainer = this.elContent.find('.top_botom_level_table_container');
		elTopBottomContainer.empty();
        if(this.measurement.constructor.name != "AreaVolume") {
            elCoordiantesContainer.append(this.createCoordinatesTable([this.measurement.position]));
        }
        else{
            let points = [];
            for(let i = 0; i < this.measurement.points.length; i++){
                points.push(this.measurement.points[i].position);
            }
            elCoordiantesContainer.append(this.createCoordinatesTable2D(points));
            if (this.measurement.topSphere && this.measurement.bottomSphere){
                let topLevel = this.measurement.topSphere.position.z.toFixed(3);
                let bottomLevel = this.measurement.bottomSphere.position.z.toFixed(3);
                elTopBottomContainer.append(this.createTopBottomLevelTable(topLevel,bottomLevel));
            }
            elTopBottomContainer.i18n();

        }

		{
			let angles = this.measurement.rotation.toVector3();
			angles = angles.toArray();
			//angles = [angles.z, angles.x, angles.y];
			angles = angles.map(v => 180 * v / Math.PI);
			angles = angles.map(a => a.toFixed(1) + '\u00B0');

			let elAlpha = this.elContent.find(`#angle_cell_alpha`);
			let elBetta = this.elContent.find(`#angle_cell_betta`);
			let elGamma = this.elContent.find(`#angle_cell_gamma`);

			elAlpha.html(angles[0]);
			elBetta.html(angles[1]);
			elGamma.html(angles[2]);
		}

		{
			let dimensions = this.measurement.scale.toArray();
			dimensions = dimensions.map(v => Utils.addCommas(v.toFixed(2)));

			let elLength = this.elContent.find(`#cell_length`);
			let elWidth = this.elContent.find(`#cell_width`);
			let elHeight = this.elContent.find(`#cell_height`);

			elLength.html(dimensions[0]);
			elWidth.html(dimensions[1]);
			elHeight.html(dimensions[2]);
		}

		{
			let elVolume = this.elContent.find(`#measurement_volume`);
			let volume = this.measurement.getVolume();
			elVolume.html(Utils.addCommas(volume.toFixed(2)));
		}

		this.elCheckClip.prop("checked", this.measurement.clip);
		this.elCheckShow.prop("checked", this.measurement.visible);

        if(this.measurement.syncingVolume){
            this.measurement.syncingVolume.scale.x = this.measurement.scale.x;
            this.measurement.syncingVolume.scale.y = this.measurement.scale.y;
            this.measurement.syncingVolume.scale.z = this.measurement.scale.z;
            if(this.measurement.constructor.name == "TransformOriginBoxVolume"){
                this.measurement.updateTransformdVolumeByConstrains();
            }
            else if(this.measurement.constructor.name == "TransformedBoxVolume"){
                this.measurement.syncingVolume.updateTransformdVolumeByConstrains(); 
            }
        }
	}
};