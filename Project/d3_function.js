
let fileNames = getFileNames();
let dataJSON = [];
let isDragged = false;

// load the contents of all files
var promises = [];
fileNames.forEach(function(d){
      promises.push(d3.text(d));
});

// once file contents loaded - call main
Promise.all(promises).then(function(data){
      main(data);
});

function main(data){
      // build the array of JSON objects
      dataJSON = buildJSON(data);
      
      // set the file count
      d3.select('#listTitle')
            .html("Files: (" + fileNames.length.toString() + ")")

      //  initialize the view box for the list
      let vbStr = "0 0 100 " + fileNames.length.toString();
      let list = d3.select('#list');
      list
            .style('height',fileNames.length * 16)
            .attr('viewBox', vbStr)
      
      let detail = d3.select('#detail');
      detail.style('width','70vw')
            .style('height','100%')
            .attr('viewBox', vbStr)
            
      // draw the list
      drawList();
}

function drawList(){
      let list = d3.select('#list');

      // add text elements based on current file name list
      list.selectAll('text')
            .data(dataJSON)
            .join('text')
            .text(function(d){return d.name.split("/")[1];})
            .attr('x',function (d){
                  return 1;
            })
            .attr('y',function (d,i){
                  return i + 1;
            })
            .style('font-size','.8pt')
            // assign text color based on whether or not file selected
            .classed('selected', function(d){
                  if(d.selected){
                        return true;
                  }
                  else{
                        return false;
                  }
            })
            .on('mouseenter', function (mouseData, d) {
                  try {
                        if(!isDragged){
                              d3.select(this)
                                    .classed('listHover', true)
                        }

                  } catch {}
            })
            .on('mouseleave', function (mouseData, d) {
                  try {
                        if(!isDragged){
                              d3.select(this)
                                    .classed('listHover', false)
                        }
                  } catch {}
            })
            .call(d3.drag()
                  .on("start", dragstarted)
                  .on("drag", dragged)
                  .on("end", dragended)
            )
            // add the filenames to selected files array if clicked
            // remove if already present
            .on('click', function(event,d){
                  try{
                        // if filename selected then remove 
                        if(d.selected == 1){
                              d.selected=0;

                             // change appearance
                             d3.select(this)
                                    .classed('selected', false)
                        }
                        // add the the filename to the selected filename list
                        else{
                              d.selected = 1

                              // change appearance
                              d3.select(this)
                                    .classed('selected', true)
                        }
                  }
                  catch{}
            });
}

function dragstarted(d) {
      console.log("drag started" + event + ":::" + d)
      d3.select(this)
            
}

function dragged(event,d) {
      console.log("drag");

      let fff = d3.pointer(event);
      console.log(fff);
      //console.log(event.clientX)

      // console.log($("#listDiv").scrollTop());
      // console.log($("#listDiv").height());

      // get the top and bottom of div scroll position
      let scrollTopY = $("#listDiv").scrollTop();
      let scrollBotY = $("#listDiv").scrollTop() + $("#listDiv").height();

      // get the mouse y position in div - subtract margins and padding
      let currYListPos = scrollTopY  + d3.pointer(event)[1] 
      console.log(scrollTopY);
      console.log(scrollBotY);
      console.log(currYListPos);

      // if mouse position is close to top then scroll list div up
      if(currYListPos < scrollTopY + 100){
            console.log('setting new scroll')
            let newScroll = $("#listDiv").scrollTop() - 20;
            if(newScroll < 0) {newScroll = 0}
            $("#listDiv").scrollTop(newScroll);
      }

      // if mouse position is close to bottom then scroll list div down
      if(currYListPos > scrollBotY - 60){
            console.log('setting new scroll')
            let newScroll = $("#listDiv").scrollTop() + 20;
            if(newScroll > scrollBotY - $("#listDiv").height()) {scrollBotY - $("#listDiv").height()}
            $("#listDiv").scrollTop(newScroll);
      }

      // set the flag that element has been dragged - ie not a click
      isDragged = true;

      // selected the hover text by class - remove old detail hover
      let detail = d3.select('#detail');
      detail.selectAll('.detailHover').remove();

      

      // if in list box
      if(event.x < 20){
            // adjust x and y of object being dragged
            d3.select(this)
                  .attr('x', event.x)
                  .attr('y', event.y + .5)
                  .classed('listDrag', true)
                  .classed('listHover', false);
            
            // add arrow to show drop position
            // get current Y to nearest int
            let dropY = Math.round(event.y);

            // get list svg
            let list = d3.select("#list")

            // remove old arrows
            list.selectAll('.listLine').remove();
            // create d3 path generator
            let path = d3.path();
            path.moveTo(0,dropY - .5);
            path.lineTo(1,dropY);
            path.lineTo(0,dropY + .5);
            path.closePath();
            // append path (arrow) to list
            list.append('path')
                  .attr('d',path)
                  .classed('listLine',true);
            }
      // then add '+' to detail pane
      else{
            let cood = d3.pointer(event)
            console.log(cood);

            // get the number of selected files
            let selectedCount = getSelected().length;

            // get width of left pane
            let lPane = d3.select('#listDiv')
            let listbox = lPane.node().getBoundingClientRect();
            let listwidth = listbox.width

            // add the updated hover add 
            detail.append('div')
                  .text("+ " + selectedCount + " Selected Files")
                  .style('left',(cood[0] - listwidth).toString() + "px")
                  .style('top',cood[1].toString() + "px")
                  .classed('detailHover', true)
                  .style('font-size','20pt')
      }
}

function dragended(event, d) {
      // remove item drag class
      d3.select(this).classed('listDrag',false);

      // only move if item is dragged - set in dragged event
      // otherwise let click event happen
      if(isDragged){
            // remove old arrows
            let list = d3.select("#list")
            list.selectAll('.listLine').remove();

            // get the index of selected file
            let idx = dataJSON.indexOf(d);

            let selectedFile  = d;
            console.log("drag ended");

            let newY = Math.round(event.y);

            // decide if we are re-ordering list or displaying file
            // based on how far right the object is dragged
            if(event.x < 20){ 
                  //
                  // put the element back where is belongs
                  d3.select(this)
                        .attr('x', 1)
                        .attr('y', idx)
                        .classed('listDrag',false)

                  // rearrange the filesName array based on new order
                  // get the new index from the event's 'y'
                  let newY = Math.ceil(event.y);
                  if(newY < 0){newy = 0};
                  if(newY > dataJSON.length -1 ){newY = dataJSON.length -1};
                  
                  // remove i from fileNames array
                  dataJSON.splice(idx,1);

                  // splice filenames array in correct order
                  dataJSON.splice(newY,0,selectedFile);

                  // if dragged item is selected then reflect this change
                  // in detail pane
                  if(getSelected().length > 1){
                        displaySelectedFiles();
                  }
            }
            else{
                  // draw the detail pane with selected files
                  displaySelectedFiles();
            }

            // redraw the list
            drawList();

            // reset isDragged flag
            isDragged = false;
            
      }
}

// draw the detail pane with selected files
function displaySelectedFiles(){
      // reordering the list in left pane will order the 
      // detail pane as well

      let detail = d3.select('#detail');
            
      let selectedFiles = getSelected();

      // empty the pane
      detail.selectAll('div').remove();

      // add the text for each document
      var detailDivs = detail.selectAll('div')
            .data(selectedFiles)
            .enter()
            .append("div")
            .style("font", "14px 'Helvetica Neue'")
            .classed('detailDiv',true)
            // change the file 'selected value'
            // will remove from right and deselect in list
      
            
      detailDivs
            .append('div')
            .text(function(d){return 'X'})
            .style('color','red')
            .style('padding-bottom', '10px')
            .on('click', function(event,d){
                  // find the item in the data array
                  let item = dataJSON[dataJSON.indexOf(d)];
                  console.log(item);
                  d.selected = 0;

                  // update the list and detail panes
                  drawList();
                  displaySelectedFiles();
            })

      // add title andcontents to each div
      detailDivs
            .append('div')
            .text(function(d){return "File: " + d.name.split("/")[1]})
            .classed('bold',true)
      
      detailDivs
            .append('div')
            .text(function(d){return d.text})
            .style('padding-left', '10px')
            .style('padding-top', '10px')
}

function getSelected(){
      let sel = dataJSON.filter(function(item){
            return item.selected === 1;
      })
      return sel;
}

function getFileContents(fName){
      let r=null;
      d3.text('dataset/CIA_19',function(error,data)
      {
            if(error){
                  return console.error(error);
            }
            r= data;
      });
      return r;
}

function buildJSON(fileContents){
      var filenamesJSON = [];

      fileNames.map(function(item, index){
            let fileTxt = fileContents[index];

            filenamesJSON.push({
                  'name': item,
                  'order': index,
                  'text' : fileTxt,
                  'selected' : 0
            })
      })
      return filenamesJSON;
}

function getFileNames(){
      var filenames = [
            'dataset/CIA_01','dataset/CIA_02','dataset/CIA_03','dataset/CIA_04','dataset/CIA_05','dataset/CIA_06',
            'dataset/CIA_07','dataset/CIA_08','dataset/CIA_09','dataset/CIA_10','dataset/CIA_11','dataset/CIA_12',
            'dataset/CIA_13','dataset/CIA_14','dataset/CIA_15','dataset/CIA_16','dataset/CIA_17','dataset/CIA_18',
            'dataset/CIA_19','dataset/CIA_20','dataset/CIA_21','dataset/CIA_22','dataset/CIA_23','dataset/CIA_24',
            'dataset/CIA_25','dataset/CIA_26','dataset/CIA_27','dataset/CIA_28','dataset/CIA_29','dataset/CIA_30',
            'dataset/CIA_31','dataset/CIA_32','dataset/CIA_33','dataset/CIA_34','dataset/CIA_35','dataset/CIA_36',
            'dataset/CIA_37','dataset/CIA_38','dataset/CIA_39','dataset/CIA_40','dataset/CIA_41','dataset/CIA_42',
            'dataset/CIA_43','dataset/DIA_01','dataset/DIA_02',
            'dataset/DIA_03','dataset/CIA_docs.txt','dataset/DIA_01','dataset/FBI_01','dataset/FBI_02','dataset/FBI_03',
            'dataset/FBI_04','dataset/FBI_05','dataset/FBI_06','dataset/FBI_07','dataset/FBI_08','dataset/FBI_09',
            'dataset/FBI_10','dataset/FBI_11','dataset/FBI_12','dataset/FBI_13','dataset/FBI_14','dataset/FBI_15',
            'dataset/FBI_16','dataset/FBI_17','dataset/FBI_18','dataset/FBI_19','dataset/FBI_20','dataset/FBI_21',
            'dataset/FBI_22','dataset/FBI_23','dataset/FBI_24','dataset/FBI_25','dataset/FBI_26','dataset/FBI_27',
            'dataset/FBI_28','dataset/FBI_29','dataset/FBI_30','dataset/FBI_31','dataset/FBI_32','dataset/FBI_33',
            'dataset/FBI_34','dataset/FBI_35','dataset/FBI_36','dataset/FBI_37','dataset/FBI_38','dataset/FBI_39',
            'dataset/FBI_40','dataset/FBI_41','dataset/FBI_docs.txt','dataset/NSA_01','dataset/NSA_02','dataset/NSA_03',
            'dataset/NSA_04','dataset/NSA_05','dataset/NSA_06','dataset/NSA_07','dataset/NSA_08','dataset/NSA_09',
            'dataset/NSA_10','dataset/NSA_11','dataset/NSA_12','dataset/NSA_13','dataset/NSA_14','dataset/NSA_15',
            'dataset/NSA_16','dataset/NSA_17','dataset/NSA_18','dataset/NSA_19','dataset/NSA_20','dataset/NSA_21',
            'dataset/NSA_22','dataset/NSA_docs.txt','dataset/USCBP_01','dataset/USCBP_02','dataset/USCBP_docs.txt'
            ];
      return filenames;
}


