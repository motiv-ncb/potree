

import {Utils} from "../../utils.js";

export class MeasurePanel{

	constructor(viewer, measurement, propertiesPanel){
		this.viewer = viewer;
		this.measurement = measurement;
		this.propertiesPanel = propertiesPanel;

		this._update = () => { this.update(); };
	}

	createCoordinatesTable(points){
		let table = $(`
			<table class="measurement_value_table">
				<tr>
					<th>x</th>
					<th>y</th>
					<th>z</th>
					<th></th>
				</tr>
			</table>
		`);

		let copyIconPath = Potree.resourcePath + '/icons/copy.svg';

		for (let i = 0; i < points.length;i++) {
			let point = points[i];
			let x = Utils.addCommas(point.x.toFixed(3));
			let y = Utils.addCommas(point.y.toFixed(3));
			let z = Utils.addCommas(point.z.toFixed(3));

			let row = $(`
				<tr>
					<td><input type="number" value="${Number(x).toFixed(3)}" style="width : 70px" data-index="${i}" data-direction="x"></td>
					<td><input type="number" value="${Number(y).toFixed(3)}" style="width : 70px" data-index="${i}" data-direction="y"></td>
					<td><input type="number" value="${Number(z).toFixed(3)}" style="width : 70px" data-index="${i}" data-direction="z"></td>
					<td align="right" style="width: 25%">
						<img name="copy" title="copy" class="button-icon" src="${copyIconPath}" style="width: 16px; height: 16px"/>
					</td>
				</tr>
			`);

			this.elCopy = row.find("img[name=copy]");
			this.elCopy.click( () => {
				let msg = point.toArray().map(c => c.toFixed(3)).join(", ");
				Utils.clipboardCopy(msg);

				this.viewer.postMessage(
					`Copied value to clipboard: <br>'${msg}'`,
					{duration: 3000});
			});

			table.append(row);
		}
		
		//set event on table for points moving according to the input values
		table.on('change', 'input', function() {
   
    	const inputValue = $(this).val(); 
		const index = $(this).data('index'); 
		const direction = $(this).data('direction');
    	console.log("Input changed to: " + inputValue + index + direction);
    
    	// Example: Find the table row containing this input
    	switch(direction){
			case "x": points[index].x = Number(inputValue); break;			
			case "y": points[index].y = Number(inputValue); break;			
			case "z": points[index].z = Number(inputValue); break;
		}
	});


		return table;
	};

    // CMAIR
    createCoordinatesTable2D(points){
		let table = $(`
			<table class="measurement_value_table">
				<tr>
					<th>x</th>
					<th>y</th>
					<th></th>
				</tr>
			</table>
		`);

		let copyIconPath = Potree.resourcePath + '/icons/copy.svg';

		for (let point of points) {
			let x = Utils.addCommas(point.x.toFixed(3));
			let y = Utils.addCommas(point.y.toFixed(3));

			let row = $(`
				<tr>
					<td><span>${x}</span></td>
					<td><span>${y}</span></td>
					<td align="right" style="width: 25%">
						<img name="copy" title="copy" class="button-icon" src="${copyIconPath}" style="width: 16px; height: 16px"/>
					</td>
				</tr>
			`);

			this.elCopy = row.find("img[name=copy]");
			this.elCopy.click( () => {
				let msg = point.toArray().map(c => c.toFixed(3)).join(", ");
				Utils.clipboardCopy(msg);

				this.viewer.postMessage(
					`Copied value to clipboard: <br>'${msg}'`,
					{duration: 3000});
			});

			table.append(row);
		}

		return table;
	};

    // CMAIR
    createTopBottomLevelTable(topLevel, bottomLevel){
       let table = $(`
			<table class="measurement_value_table">
			    <tr>
					<td><span data-i18n="tt.top_level"></span></td>
					<td><span>${topLevel}</span></td>
					
				</tr>
                <tr>
					<td><span data-i18n="tt.bottom_level"></span></td>
					<td><span>${bottomLevel}</span></td>
					
				</tr>
			</table>
		`);
        return table;
    }


	createAttributesTable(){
		let elTable = $('<table class="measurement_value_table"></table>');

		let point = this.measurement.points[0];
		
		for(let attributeName of Object.keys(point)){
			if(attributeName === "position"){
			
			}else if(attributeName === "rgba"){
				let color = point.rgba;
				let text = color.join(', ');

				elTable.append($(`
					<tr>
						<td>rgb</td>
						<td>${text}</td>
					</tr>
				`));
			}else{
				let value = point[attributeName];
                if(attributeName =="normal" || attributeName == "deformation"){
                    continue;
                }
				let text = value.join(', ');
                if (!isNaN(text)) {
                    if( Number.isInteger(Number(text))){
                        text = Number(text);
                    } 
                    else{
                        text = Number(text).toFixed(3);
                    }
                }
				elTable.append($(`
					<tr>
						<td>${attributeName}</td>
						<td>${text}</td>
					</tr>
				`));
			}
		}

		return elTable;
	}

	update(){

	}
};