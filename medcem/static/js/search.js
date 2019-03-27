//function to query json for types, values etc. recursively
$(".searchbutton").click(startsearch);

function startsearch() {
    initateQuery();
    $( '#mysearchform').empty();
    appendSearch(1);
    $( "#dialog" ).dialog({
         width: 500,
         height: 450
    });
};

function initateQuery () {
  //set global variables for search results
  jsonresult = {"type": "FeatureCollection", //prepare geojson
                 "features": []
                };
  finalSearchResult = [];  //array for search results
  finalSearchResultIds = [] ;

  //array for search results on respective levels
  $.each(myjson.features, function (i, feature) {
       finalSearchResult.push(parseInt(feature.id)); //pushes all current graves' ids to array
       //push all entitites into array
       finalSearchResultIds.push(parseInt(feature.id));
       $.each(feature.burials, function (b, burial) {
             finalSearchResultIds.push(parseInt(burial.id));
             $.each(burial.finds, function (f, find) {
                  finalSearchResultIds.push(parseInt(find.id));
             });
       });
  });
}

function appendSearch(iter) {
    $( '.toremovebtn').remove(); //removes former buttons to append new search
        $( '#mysearchform').append(
                   //selection for search level: grave, burial or find
                   '<div id="LevelSelect_' + iter +'_parent" class="input-group input-group-sm mb-3">' +
                       '<div class="input-group-prepend">' +
                           '<label class="input-group-text" for="LevelSelect_' + iter +'">' + iter + '. </label>' +
                       '</div>' +
                       '<select class="custom-select empty" id="LevelSelect_' + iter +'">' +
                           '<option selected disabled>Select search level...</option>' +
                           '<option value="feature">Graves</option>' +
                           '<option value="strat">Burials</option>' +
                           '<option value="find">Finds</option>' +
                       '</select>' +
                   '</div>');
        //after main level is selected:
        $( '#LevelSelect_' + iter).on('change', function() {
            var appendLevel = $( '#LevelSelect_' + iter+ ' option:selected').val(); //set level as variable
            $( '#LevelSelect_' + iter).prop('disabled', true); //disble former selection field
            if (iter == 1) $( '#LevelSelect_' + iter +'_parent').append( //add reset button on first iteration
                            '<div class="input-group-append">' +
                                '<button class="btn btn-secondary btn-sm" type="button" id="resetsearchbutton" onclick="startsearch()" title="Reset search">' +
                                    '<i class="fas fa-sync-alt"></i>' +
                                '</button>' +
                            '</div>'
                            );
            $( '#mysearchform').append(
                        //selection for property to choose: maintype, types, dimensions, material or timespan
                        '<div id="PropSelect_' + iter +'_parent" class="input-group input-group-sm mb-3">' +
                            '<select class="custom-select empty" id="PropSelect_' + iter +'">' +
                                '<option selected disabled>Select search criteria...</option>' +
                                '<option value="maintype">Maintype</option>' +
                                '<option value="type">Types</option>' +
                                '<option value="timespan">Timespan</option>' +
                                '<option value="dimension">Dimensions</option>' +
                                '<option value="material">Material</option>' +
                            '</select>' +
                        '</div>'
            );
        appendCriteria(iter, appendLevel);
        });
}

function appendCriteria(iter, appendLevel) {
  $( '#PropSelect_' + iter).on('change', function() {
    var criteria = $( '#PropSelect_' + iter+ ' option:selected').val().toLowerCase(); //set criteria variable
    $( '#PropSelect_' + iter).prop('disabled', true); //disable input
    appendCriteriaSearch(iter, criteria, appendLevel); //append further search options
  });
}

function appendCriteriaSearch(iter, criteria, appendLevel) {
   $( '#PropSelect_' + iter +'_parent').remove(); //remove former input
   if (criteria == 'maintype' || criteria == 'type') { //if maintype or type append form with tree select
        $( '#mysearchform').append(
            '<div id="MaintypeSelect_' + iter + '_parent" class="input-group input-group-sm mb-3">' +
                '<div class="input-group-prepend">' +
                    '<label class="input-group-text" for="MaintypeSelect_' + iter + '">Type </label>' +
                '</div>' +
                '<input id="MaintypeSelect_' + iter + '" class="form-control" onclick="this.blur()" type="text" placeholder="Select type.." readonly>' +
                '<input id="MaintypeSelect_' + iter + '_Result" class="form-control" onclick="this.blur()" type="text" readonly disabled>' +
            '</div>'
        );
        var targetField = 'MaintypeSelect_' + iter;
        iniateTree (iter, appendLevel, criteria, targetField); //open tree to select value and add variable to form after
   };
   if (criteria == 'timespan') { //if timespan append form with value fields
        //set global vars for button
        UnsetGlobalVars();
        Globalcriteria = criteria;
        GlobalappendLevel = appendLevel;
        Globaliter = iter;

        $( '#mysearchform').append(
            '<div id="TimespanSelect_' + iter + '_parent" class="input-group input-group-sm mb-3">' +
                 '<div class="input-group-prepend">' +
                 '<span class="input-group-text dim-label">Timespan min: </span>' +
                 '</div>' +
                 '<input id="valMin_' + iter + '" class="form-control value-input" type="text">' +
                 '<span class="input-group-text input-group-middle">max: </span>' +
                 '<input id="valMax_' + iter + '" class="form-control value-input" type="text">' +
                 '<div class="input-group-append">' +
                 '<button class="btn btn-secondary btn-sm" type="button" id="timespanbutton_' + iter + '" onclick="searchTime(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for timespan">' +
                      '<i class="fas fa-search"></i>' +
                 '</button>' +
                 '</div>' +
            '</div>'
        );
   };
   if (criteria == 'dimension') {//if dimension append form with select
        UnsetGlobalVars();
        Globalcriteria = criteria;
        GlobalappendLevel = appendLevel;
        Globaliter = iter;
        $( '#mysearchform').append(
            '<div id="DimensionSelect_' + iter + '_parent" class="input-group input-group-sm mb-3">' +
                '<select class="custom-select  dim-label empty" id="DimensionSelect_' + iter + '">' +
                    '<option selected disabled>Select dimension...</option>' +
                    '<option value="15679">Height/Depth (cm)</option>' +
                    '<option value="26189">Length (cm)</option>' +
                    '<option value="26188">Width (cm)</option>' +
                    '<option value="26191">Diameter (cm)</option>' +
                    '<option value="26190">Thickness (cm)</option>' +
                    '<option value="26192">Orientation (°)</option>' +
                    '<option value="15680">Weight (g)</option>' +
                '</select>' +
            '</div>'
        );
        $( '#DimensionSelect_' + iter).on('change', function() {
           $( '#DimensionSelect_' + iter).prop('disabled', true); //disable input
           $( '#DimensionSelect_' + iter + '_parent').append( //append input of values
                '<span class="input-group-text input-group-middle">min: </span>' +
                '<input id="valMin_' + iter + '" class="form-control value-input" type="text">' +
                '<span class="input-group-text input-group-middle">max: </span>' +
                '<input id="valMax_' + iter + '" class="form-control value-input" type="text">' +
                '<div class="input-group-append">' +
                   '<button class="btn btn-secondary btn-sm" type="button" id="dimMatButton_' + iter + '" onclick="searchDimMat(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for dimension">' +
                        '<i class="fas fa-search"></i>' +
                   '</button>' +
                '</div>'
           )
        });
   };


   if (criteria == 'material') { //if material append form with tree select
        $( '#mysearchform').append(
            '<div id="MaterialSelect_' + iter + '_parent" class="input-group input-group-sm mb-3">' +
                '<div class="input-group-prepend">' +
                '<span id="MaterialSelect_' + iter + '" class="input-group-text"></span>' +
                '</div>' +
             '</div>'
        );
        var targetField = 'MaterialSelect_' + iter;
        iniateTree (iter, appendLevel, criteria, targetField);
   };
}

function appendMaterial(iter) {
           $( '#MaterialSelect_' + iter + '_parent').append(
                '<span class="input-group-text input-group-middle">% min: </span>' +
                '<input id="valMin_' + iter + '" class="form-control value-input" type="text">' +
                '<div class="input-group-append">' +
                    '<span class="input-group-text input-group-middle">% max: </span>' +
                '</div>' +
                '<input id="valMax_' + iter + '" class="form-control value-input" type="text">' +
                '<div class="input-group-append">' +
                '<button class="btn btn-secondary btn-sm" type="button" id="dimMatButton_' + iter + '" onclick="searchDimMat(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for dimension">' +
                     '<i class="fas fa-search"></i>' +
                '</button>' +
                '</div>'

           );
}


function searchDimMat(criteria, appendLevel, iter, val1, val2) {
    var val1 =  $('#valMin_' + iter).val();
    var val2 =  $('#valMax_' + iter).val();
    var goOn = validateNumbers(val1, val2, criteria);
    if(goOn) {
    $('#dimMatButton_' + iter).prop('disabled', true);
    $( '#mysearchform').append(
       '<div id="dimMatResult_' + iter +'_parent" class="input-group input-group-sm mb-3">' +
         '<input id="dimMatResult_' + iter + '" class="form-control" onclick="this.blur()" type="text" disabled>' +
       '</div>'
    );
    $('#valMin_' + iter).prop('disabled', true);
    $('#valMax_' + iter).prop('disabled', true);
    var dimId = $( '#DimensionSelect_' + iter+ ' option:selected').val(); //set criteria variable
    if (criteria == 'material') var dimId = nodeIds;
    if (criteria == 'dimension') var dimId =  $( '#DimensionSelect_' + iter+ ' option:selected').val().toLowerCase();
    jsonquery(dimId, appendLevel, criteria, val1, val2);
    $('#dimMatResult_' + iter).val(uniqueSearchResult.length + ' matches in ' + searchResult.length + ' graves');
    appendPlus(iter);
    };
}


function searchTime(criteria, appendLevel, iter, val1, val2) {
    var val1 =  $('#valMin_' + iter).val();
    var val2 =  $('#valMax_' + iter).val();
    var nodeIds = [];
    var goOn = validateNumbers(val1, val2, criteria);
    if(goOn) {
    $('#timespanbutton_' + iter).prop('disabled', true);
    $( '#mysearchform').append(
       '<div id="TimespanResult_' + iter +'_parent" class="input-group input-group-sm mb-3">' +
         '<input id="TimespanResult_' + iter + '" class="form-control" onclick="this.blur()" type="text" disabled>' +
       '</div>'
    );
    $('#valMin_' + iter).prop('disabled', true);
    $('#valMax_' + iter).prop('disabled', true);
    jsonquery(nodeIds, appendLevel, criteria, val1, val2);
    $('#TimespanResult_' + iter).val(uniqueSearchResult.length + ' matches in ' + searchResult.length + ' graves');
    appendPlus(iter);
    };
}

function validateNumbers(val1, val2, criteria) {
    console.log(typeof(val1) + ' ' + val1 + ' - ' + typeof(val2) + ' ' +val2);
    if (isNaN(val1) || isNaN(val2)) {
        alert('Please enter valid numbers');
        return false;
    };
    if (val1 > val2 && val2 !== '') {
        alert('First value must be lower than second value');
        return false;
    };
    if (criteria == 'material') {
       if (val1 < 0 || val2 < 0 || val1 > 100 || val2 > 100) {
          alert('Values must be between 0 and 100 (%)')
          return false;
       }
    };
    return true;
}

function UnsetGlobalVars () {
//unset global variables
    GlobaltargetField = '';
    GlobalNodeSelected = '';
    GlobalSelectedNodeName = '';
    Globalcriteria = '';
    GlobalappendLevel = '';
    Globaliter = '';
    Globalval = '';
    Globalval2 = '';
}

//build jstree after criteria and level
function iniateTree(iter, appendLevel, criteria, targetField) {
    UnsetGlobalVars(); //reset vars
    //define search criteria
    var treecriteria = criteria;
    if (criteria == 'maintype')
        var treecriteria = appendLevel;
    console.log('iter: ' + iter + ', appendLevel: ' + appendLevel + ', criteria: ' + criteria + ', treecriteria: ' + treecriteria);


    //build tree after selected criteria
    var selectedtypes = [];
    $.each(jsontypes, function (j, entry) {
        if (entry.level == treecriteria) {
            selectedtypes.push(entry);
        }
    });

    $(function () {
        $('#jstree').jstree({
            'core': {
                "data": selectedtypes,
                "themes": {"icons": false,
                    "dots": false}
            },
            "search": {
                "show_only_matches": true, //filtering
                "show_only_matches_children": true

            },
            "plugins": ["search"]
        },
                )

        //add search functionality
        var to = false;
        $('#jstree_q').keyup(function () {
            if (to) {
                clearTimeout(to);
            }
            to = setTimeout(function () {
                var v = $('#jstree_q').val();
                $('#jstree').jstree(true).search(v);
            }, 250);
        });
    });

    //retrieve values of selected node
    $('#jstree').on("changed.jstree", function (e, data) {
        var NodeSelected = parseInt(data.selected);
        var node = $('#jstree').jstree().get_node(NodeSelected);
        var SelectedNodeName = node.text;
        //make variables global
        GlobaltargetField = targetField;
        GlobalNodeSelected = NodeSelected;
        GlobalSelectedNodeName = SelectedNodeName;
        Globalcriteria = criteria;
        GlobalappendLevel = appendLevel;
        Globaliter = iter;
     });

//show tree in modal
    $('#mytreeModal').modal(
            {backdrop: 'static',
                keyboard: false}
    );


//refresh tree if new search
    if ((typeof ($('#jstree').jstree(true).settings)) !== 'undefined') {
        $('#jstree').jstree(true).settings.core.data = selectedtypes;
        $('#jstree').jstree(true).refresh();

    }
    ;
}

function transferNode(targetField, NodeSelected, SelectedNodeName, criteria, appendLevel, iter, val1, val2) {
    if (GlobalNodeSelected !== ''  && Globalcriteria !== 'material') {
    console.log('targetField: ' + targetField + ', NodeSelected: ' + NodeSelected + ', SelectedNodeName: ' + SelectedNodeName + ', criteria: ' + criteria + ', appendLevel: ' + appendLevel + ', iter: ' + iter);
    $(function () {
        $('#' + targetField).val(SelectedNodeName);
        $('#' + targetField).prop('disabled', true);
    });

    setNodes(NodeSelected);
    if (typeof (val1) == 'undefined')
        var val1 = '';
    if (typeof (val2) == 'undefined')
        var val2 = '';

    jsonquery(nodeIds, appendLevel, criteria, val1, val2);
    $('#' + targetField + '_Result').val(uniqueSearchResult.length + ' matches in ' + searchResult.length + ' graves');
    $('#mytreeModal').modal('hide');
    appendPlus(iter);
    }
    if (GlobalNodeSelected == '') alert('select property first');
    if (Globalcriteria == 'material' && GlobalNodeSelected !== '') {
      $('#' + targetField).text(SelectedNodeName);
      $('#' + targetField).prop('disabled', true);
      setNodes(NodeSelected);
      $('#mytreeModal').modal('hide');
      appendMaterial(iter);
    }
    };

function setNodes(state) {
    nodes = [];
    nodeIds = [];
    traverse(state);
    getNodeIds(nodes);
}

function traverse(state) {

    // Get the actual node
    var node = $('#jstree').jstree().get_node(state);

    // Add it to the results
    nodes.push(node);

    // Attempt to traverse if the node has children
    if ($('#jstree').jstree().is_parent(node)) {
        $.each(node.children, function (index, child) {
            traverse(child);
        });
    }
    ;
}

function getNodeIds(nodes) {
    $.each(nodes, function (i, mynode) {
        nodeIds.push(parseInt(mynode.id))
    });
}

function appendPlus(iter) {
    Globaliter = iter+1;
    if (iter > 1) {
        var resultlength = [];
        $.each(myjson.features, function (i, feature) {
           if (finalSearchResultIds.includes(feature.id)) {
               resultlength.push(feature.properties.name);
           }
        });

        $('#mysearchform').append(
              '<div class="input-group input-group-sm mb-3">' +
                '<input id="finalresult_' + iter + '" class="form-control combiresult" onclick="this.blur()" title="' + resultlength + '" type="text" placeholder="' + resultlength.length + ' combined matches" readonly disabled>' +
              '</div>'
        );
    };

    if (finalSearchResultIds.length > 0) {
        $('#mysearchform').append(
            '<button class="btn btn-secondary btn-sm toremovebtn" type="button" id="addNewSearchCritBtn" onclick="appendSearch(Globaliter)"title="Add another search criteria">' +
            '<i class="fas fa-plus"></i>' +
            '</button>' +
            '<button class="btn btn-secondary btn-sm toremovebtn" type="button" id="mapResultBtn" onclick="finishQuery()" title="Finish search and show combined result on map">' +
            '<i class="fas fa-map-marked-alt"></i>' +
            '</button>' +
            '<button class="btn btn-secondary btn-sm toremovebtn" type="button" id="mapResultBtn" onclick="finishQuery(); exportToJsonFile(jsonresult)" title="Finish, show on map and download result as .json file">' +
            '<i class="far fa-save"></i>' +
            '</button>'
        );
    };
    $('#mysearchform').append(
            '<button class="btn btn-secondary btn-sm toremovebtn" type="button" id="resetSearchEndBtn" onclick="startsearch()"title="Reset search">' +
            '<i class="fas fa-sync-alt"></i>' +
            '</button>'
    );

}

function finishQuery() { //finish query and show results on map
    $('#dialog').dialog('close')
    $.each(myjson.features, function (i, feature) {
        if (finalSearchResultIds.includes(feature.id))
            jsonresult.features.push(feature)
    });

    resultpolys.clearLayers();
    var resultpoly = L.geoJSON(jsonresult);
    resultpolys.addLayer(resultpoly);
}

function jsonquery(id, level, prop, val1, val2) {
    //prepare searchresult array
    searchResult = [];
    searchResultIds = [];

    //convert values to valid integers
    //set values to catch whole range if undefined
    if (val1 == '' || typeof (val1) == 'undefined' || val2 == undefined)
        var val1 = "-99999999999";
    if (val2 == '' || typeof (val2) == 'undefined' || val2 == undefined)
        var val2 = "99999999999";

    //alert if second value is lower than first value
    if (typeof(val1 == 'string')) var val1 = parseFloat(val1.replace(',','.').replace(' ',''));
    if (typeof(val2 == 'string')) var val2 = parseFloat(val2.replace(',','.').replace(' ',''));
    console.log ('val1: ' + val1 + '; val2: ' + val2);
    console.log ('IDs:');
    console.log (id);
    console.log ('level: ' + level + ', prop: ' + prop);

    //loop through entities
    if (level == 'feature') {
        $.each(myjson.features, function (i, feature) {
            levelQuery(feature, feature, id, prop, val1, val2)
            if (searchResultIds.includes(feature.id)) {
               $.each(feature.burials, function (b, burial) {
                  searchResultIds.push(parseInt(burial.id));
                    $.each(burial.finds, function (f, find) {
                       searchResultIds.push(parseInt(find.id));
                    });
               });
            };
        });
    }
    ;

    if (level == 'strat') {
        $.each(myjson.features, function (i, feature) {
            feature = feature;
            $.each(feature.burials, function (b, burial) {
                levelQuery(feature, burial, id, prop, val1, val2);
                if  (searchResultIds.includes(burial.id)) {
                        searchResultIds.push(feature.id);
                        $.each(burial.finds, function (f, find) {
                            searchResultIds.push(parseInt(find.id));
                        });
                };
            });
        });
    };

    if (level == 'find') {
        $.each(myjson.features, function (i, feature) {
            feature = feature;
            $.each(feature.burials, function (b, burial) {
                $.each(burial.finds, function (f, find) {
                    levelQuery(feature, find, id, prop, val1, val2);
                    if  (searchResultIds.includes(find.id)) {
                            searchResultIds.push(burial.id);
                            searchResultIds.push(feature.id);
                    }
                });
            });
        });
    }
    ;

    //intersect Search results
    uniqueSearchResult = searchResult;
    var distinctResult = Array.from(new Set(searchResult));
    searchResult = distinctResult;
    var intermed = finalSearchResult.filter(value => searchResult.includes(value));
    finalSearchResult = intermed;

    var distinctResultIds = Array.from(new Set(searchResultIds));
    searchResultIds = distinctResultIds;
    console.log('searchResultIds');
    console.log(searchResultIds);
    var intermedIds = finalSearchResultIds.filter(value => searchResultIds.includes(value));
    finalSearchResultIds = intermedIds;
    console.log('finalSearchResuldIds2');
    console.log(finalSearchResultIds);
}

//query entitites based on level
function levelQuery(feature, entity, id, prop, val1, val2) {
// if search is for maintype push result to layer
    if (prop == 'maintype' && id.includes(entity.properties.maintype.id)) {
        searchResult.push(feature.id);
        if (finalSearchResultIds.includes(entity.id)) searchResultIds.push(entity.id);
    }
    ;

    // if search is for timespan
    //first check if timespan is available
    if (prop == 'timespan' && (typeof (entity.properties.timespan)) !== 'undefined') {

        //set begin and end if available as integers from timestamp
        if (typeof (entity.properties.timespan.begin_from) !== 'undefined')
            var begin = (parseInt(((entity.properties.timespan.begin_from).substring(0, 4)), 10));
        if (typeof (entity.properties.timespan.end_to) !== 'undefined')
            var end = (parseInt(((entity.properties.timespan.end_to).substring(0, 4)), 10));
        //if begin and end are availale set a between timespan as result
        if (typeof (begin) !== 'undefined' && typeof (end) !== 'undefined' && begin >= val1 && end <= val2) {
            searchResult.push(feature.id);
            if (finalSearchResultIds.includes(entity.id)) searchResultIds.push(entity.id);
        }

        //if only begin is available get all entities that start with or after begin
        if (typeof (begin) !== 'undefined' && end == '' && begin >= val1) {
            searchResult.push(feature.id);
            if (finalSearchResultIds.includes(entity.id)) searchResultIds.push(entity.id);
        }

        //if only end is available get all entities that end with or before begin
        if (typeof (end) !== 'undefined' && begin == '' && end <= val2) {
            searchResult.push(feature.id);
            if (finalSearchResultIds.includes(entity.id)) searchResultIds.push(entity.id);
        }
    }

    // get results of matching types
    if (prop == 'type' && (typeof (entity.properties.types)) !== 'undefined') {
        $.each(entity.properties.types, function (t, type) {
            if (id.includes(type.id)) {
            searchResult.push(feature.id);
            if (finalSearchResultIds.includes(entity.id)) searchResultIds.push(entity.id);
        }
        });
    }

    //get results of matching dimensions with values and operators
    if (prop == 'dimension' && (typeof (entity.properties.dimensions)) !== 'undefined') {
        $.each(entity.properties.dimensions, function (d, dim) {
            if (typeof (dim.value) !== 'undefined' && id.includes(dim.id) && dim.value >= val1 && dim.value <= val2) {
            searchResult.push(feature.id);
            if (finalSearchResultIds.includes(entity.id)) searchResultIds.push(entity.id);
        }
        });
    }

    //get results of matching material with values and operators
    if (prop == 'material' && (typeof (entity.properties.material)) !== 'undefined') {
        $.each(entity.properties.material, function (m, mat) {
            var tempMatValue = mat.value;
            if (mat.value == '0' || mat.value == '')
                var tempMatValue = 100;
            if (id.includes(mat.id) && tempMatValue >= val1 && tempMatValue <= val2) {
                searchResult.push(feature.id);
                if (finalSearchResultIds.includes(entity.id)) searchResultIds.push(entity.id);
            }
        });
    }
}


function exportToJsonFile(jsonData) {
    let dataStr = JSON.stringify(jsonData);
    let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    let exportFileDefaultName = 'data.json';

    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}