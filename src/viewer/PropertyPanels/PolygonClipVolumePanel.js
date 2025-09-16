import { MeasurePanel } from "./MeasurePanel";

export class PolygonClipVolumePanel extends MeasurePanel {
  constructor(viewer, measurement, propertiesPanel) {
    super(viewer, measurement, propertiesPanel);
    let removeIconPath = Potree.resourcePath + '/icons/remove.svg';

    this.elContent = $(`
			<div class="measurement_content selectable scene-hidden">
				
				<!-- ACTIONS -->
				<div style="display: flex; margin-top: 12px">
					<span></span>
					<span style="flex-grow: 1"></span>
					<img name="remove" class="button-icon" src="${removeIconPath}" style="width: 16px; height: 16px"/>
				</div>
			</div>
		`);

		this.elRemove = this.elContent.find("img[name=remove]");
		this.elRemove.click( () => {
			this.viewer.scene.removePolygonClipVolume(measurement);
		});

		this.update();

    }
    update(){

    }
}