//function to query json for types, values etc. recursively
$(".searchbutton").click(startsearch);

$(document).ready(function () {
local = true;
})


function startsearch() {
    initateQuery();
    $('#mysearchform').empty();
    appendSearch(1);
    $("#dialog").dialog({
        width: mymodalwith,
        height: 450
    });
}
;

function initateQuery() {
    //set global variables for search results
    finalSearchResult = [];  //array for search results
    finalSearchResultIds = [];

    //array for all entities on respective levels to be intersected by search results
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

//todo: Add titles with instructions
function appendSearch(Iter) {//append search form to dialog
    $('.toremovebtn').remove(); //removes former buttons to append new search
    $('.mysearchoptions').remove(); //removes former buttons to append new search
    $('#mysearchform').append(
        //selection for search level: grave, burial or find
        '<div id="LevelSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">' +
        '<div class="input-group-prepend">' +
        '<label class="input-group-text" for="LevelSelect_' + Iter + '">' + Iter + '. </label>' +
        '</div>' +
        '<select class="custom-select empty" id="LevelSelect_' + Iter + '">' +
        '<option selected disabled>Select search level...</option>' +
        '<option value="feature">Graves</option>' +
        '<option value="strat">Burials</option>' +
        '<option value="find">Finds</option>' +
        '</select>' +
        '</div>');
    //after main level is selected:
    $('#LevelSelect_' + Iter).on('change', function () {
        appendLevel = $('#LevelSelect_' + Iter + ' option:selected').val(); //set level as variable
        $('#LevelSelect_' + Iter).prop('disabled', true); //disble former selection field
        if (Iter == 1)
            $('#LevelSelect_' + Iter + '_parent').append(//add reset button on first iteration
                '<div class="input-group-append">' +
                '<button class="btn btn-secondary btn-sm" type="button" id="resetsearchbutton" onclick="startsearch()" title="Reset search">' +
                '<i class="fas fa-sync-alt"></i>' +
                '</button>' +
                '</div>'
            );
        $('#mysearchform').append(
            //selection for property to choose: maintype, types, dimensions, material or timespan
            '<div id="PropSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">' +
            '<select class="custom-select empty" id="PropSelect_' + Iter + '">' +
            '<option selected disabled>Select search criteria...</option>' +
            '<option value="maintype">Maintype</option>' +
            '<option value="type">Properties</option>' +
            '<option value="timespan">Timespan</option>' +
            '<option value="dimension">Dimensions</option>' +
            '<option value="material">Material</option>' +
            '</select>' +
            '</div>'
        );
        appendCriteria(Iter, appendLevel);
    });
}

function appendCriteria(Iter, appendLevel) { //select search criteria after level is chosen
    $('#PropSelect_' + Iter).on('change', function () {
        criteria = $('#PropSelect_' + Iter + ' option:selected').val().toLowerCase(); //set criteria variable
        $('#PropSelect_' + Iter).prop('disabled', true); //disable input
        appendCriteriaSearch(Iter, criteria, appendLevel); //append further search options
    });
}

function appendCriteriaSearch(Iter, criteria, appendLevel) { //append respective forms depending on search criteria e.g. with values for timespan etc.
    $('#PropSelect_' + Iter + '_parent').remove(); //remove former input
    if (criteria == 'maintype' || criteria == 'type') { //if maintype or type append form with tree select
        $('#mysearchform').append(
            '<div id="MaintypeSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">' +
            '<div class="input-group-prepend">' +
            '<label class="input-group-text" for="MaintypeSelect_' + Iter + '">Type </label>' +
            '</div>' +
            '<input id="MaintypeSelect_' + Iter + '" class="form-control" onclick="this.blur()" type="text" placeholder="Select type.." readonly>' +
            '<input id="MaintypeSelect_' + Iter + '_Result" class="form-control" onclick="this.blur()" type="text" readonly disabled>' +
            '</div>'
        );
        targetField = 'MaintypeSelect_' + Iter;
        iniateTree(Iter, appendLevel, criteria, targetField); //open tree to select value and add variable to form after
    }
    ;
    if (criteria == 'timespan') { //if timespan append form with value fields
        //set global vars for button
        UnsetGlobalVars();
        Globalcriteria = criteria;
        GlobalappendLevel = appendLevel;
        Globaliter = Iter;

        $('#mysearchform').append(
            '<div id="TimespanSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">' +
            '<div class="input-group-prepend">' +
            '<span class="input-group-text dim-label">Timespan min: </span>' +
            '</div>' +
            '<input id="valMin_' + Iter + '" class="form-control value-input" type="text">' +
            '<span class="input-group-text input-group-middle">max: </span>' +
            '<input id="valMax_' + Iter + '" class="form-control value-input" type="text">' +
            '<div class="input-group-append">' +
            '<button class="btn btn-secondary btn-sm" type="button" id="timespanbutton_' + Iter + '" onclick="searchTime(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for timespan">' +
            '<i class="fas fa-search"></i>' +
            '</button>' +
            '</div>' +
            '</div>'
        );
    }
    ;
    if (criteria == 'dimension') {//if dimension append form with select
        UnsetGlobalVars();
        Globalcriteria = criteria;
        GlobalappendLevel = appendLevel;
        Globaliter = Iter;
        $('#mysearchform').append(
            '<div id="DimensionSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">' +
            '<select class="custom-select  dim-label empty" id="DimensionSelect_' + Iter + '">' +
            '<option selected disabled>Select dimension...</option>' +
            '<option value="15679">Height/Depth (cm)</option>' +
            '<option value="26189">Length (cm)</option>' +
            '<option value="26188">Width (cm)</option>' +
            '<option value="26191">Diameter (cm)</option>' +
            '<option value="26190">Thickness (cm)</option>' +
            '<option value="26192">Orientation (°)</option>' +
            '<option value="118730">Azimuth (°)</option>' +
            '<option value="15680">Weight (g)</option>' +
            '</select>' +
            '</div>'
        );
        $('#DimensionSelect_' + Iter).on('change', function () {
            $('#DimensionSelect_' + Iter).prop('disabled', true); //disable input
            $('#DimensionSelect_' + Iter + '_parent').append(//append input of values
                '<span class="input-group-text input-group-middle">min: </span>' +
                '<input id="valMin_' + Iter + '" class="form-control value-input" type="text">' +
                '<span class="input-group-text input-group-middle">max: </span>' +
                '<input id="valMax_' + Iter + '" class="form-control value-input" type="text">' +
                '<div class="input-group-append">' +
                '<button class="btn btn-secondary btn-sm" type="button" id="dimMatButton_' + Iter + '" onclick="searchDimMat(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for dimension">' +
                '<i class="fas fa-search"></i>' +
                '</button>' +
                '</div>'
            )
        });
    }
    ;

    if (criteria == 'material') { //if material append form with tree select
        $('#mysearchform').append(
            '<div id="MaterialSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">' +
            '<div class="input-group-prepend">' +
            '<span id="MaterialSelect_' + Iter + '" class="input-group-text"></span>' +
            '</div>' +
            '</div>'
        );
        targetField = 'MaterialSelect_' + Iter;
        iniateTree(Iter, appendLevel, criteria, targetField);
    }
    ;
}

function appendMaterial(Iter) { //append value input after material is chosen
    $('#MaterialSelect_' + Iter + '_parent').append(
        '<span class="input-group-text input-group-middle">% min: </span>' +
        '<input id="valMin_' + Iter + '" class="form-control value-input" type="text">' +
        '<div class="input-group-append">' +
        '<span class="input-group-text input-group-middle">% max: </span>' +
        '</div>' +
        '<input id="valMax_' + Iter + '" class="form-control value-input" type="text">' +
        '<div class="input-group-append">' +
        '<button class="btn btn-secondary btn-sm" type="button" id="dimMatButton_' + Iter + '" onclick="searchDimMat(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for dimension">' +
        '<i class="fas fa-search"></i>' +
        '</button>' +
        '</div>'
    );
}

//search functions depending on criteria
function searchDimMat(criteria, appendLevel, Iter, val1, val2) {
    val1 = $('#valMin_' + Iter).val();
    val2 = $('#valMax_' + Iter).val();
    goOn = validateNumbers(val1, val2, criteria);
    if (goOn) {
        $('#dimMatButton_' + Iter).prop('disabled', true);
        $('#mysearchform').append(
            '<div id="dimMatResult_' + Iter + '_parent" class="input-group input-group-sm mb-3">' +
            '<input id="dimMatResult_' + Iter + '" class="form-control" onclick="this.blur()" type="text" disabled>' +
            '</div>'
        );
        $('#valMin_' + Iter).prop('disabled', true);
        $('#valMax_' + Iter).prop('disabled', true);
        dimId = $('#DimensionSelect_' + Iter + ' option:selected').val(); //set criteria variable
        if (criteria == 'material')
            dimId = nodeIds;
        if (criteria == 'dimension')
            dimId = $('#DimensionSelect_' + Iter + ' option:selected').val().toLowerCase();
        jsonquery(dimId, appendLevel, criteria, val1, val2);
        $('#dimMatResult_' + Iter).val(uniqueSearchResult.length + ' matches in ' + searchResult.length + ' graves');
        appendPlus(Iter);
    }
    ;
}

function searchTime(criteria, appendLevel, Iter, val1, val2) {
    val1 = $('#valMin_' + Iter).val();
    val2 = $('#valMax_' + Iter).val();
    nodeIds = [];
    goOn = validateNumbers(val1, val2, criteria);
    if (goOn) {
        $('#timespanbutton_' + Iter).prop('disabled', true);
        $('#mysearchform').append(
            '<div id="TimespanResult_' + Iter + '_parent" class="input-group input-group-sm mb-3">' +
            '<input id="TimespanResult_' + Iter + '" class="form-control" onclick="this.blur()" type="text" disabled>' +
            '</div>'
        );
        $('#valMin_' + Iter).prop('disabled', true);
        $('#valMax_' + Iter).prop('disabled', true);
        jsonquery(nodeIds, appendLevel, criteria, val1, val2);
        $('#TimespanResult_' + Iter).val(uniqueSearchResult.length + ' matches in ' + searchResult.length + ' graves');
        appendPlus(Iter);
    }
    ;
}

function appendPlus(Iter) {
    Globaliter = Iter + 1;
    if (Iter > 1) {
        resultlength = [];
        $.each(myjson.features, function (i, feature) {
            if (finalSearchResultIds.includes(feature.id)) {
                resultlength.push(feature.properties.name);
            }
        });

        $('#mysearchform').append(
            '<div class="input-group input-group-sm mb-3">' +
            '<input id="finalresult_' + Iter + '" class="form-control combiresult" onclick="this.blur()" title="' + resultlength + '" type="text" placeholder="' + resultlength.length + ' combined matches" readonly disabled>' +
            '</div>'
        );
    }
    ;

    if (finalSearchResultIds.length > 0) {
        $('#mysearchform').append(
            '<div class="mysearchoptions input-group input-group-sm mb-3">' +
            '<div class="input-group-prepend">' +
            '<label class="input-group-text" for="fillcolor">Fill color: </label>' +
            '</div>' +
            '<input class="form-control" id="fillcolor" style="max-width: 70px" type="color" value="#000dff">' +
            '<span class="input-group-text input-group-middle">Opacity (%): </span>' +
            '<input class="form-control" id="mysearchopacity" type="range" value="10" min="0" max="100">' +
            '<input class="form-control" id="mysearchopacityvalue" type="number" value="10" min="0" max="100" style="max-width: 60px">' +
            '</div>' +
            '<div class="mysearchoptions input-group input-group-sm mb-3">' +
            '<div class="input-group-prepend">' +
            '<label class="input-group-text" for="searchbordercolor">Border color: </label>' +
            '</div>' +
            '<input class="form-control" id="colorborder" style="max-width: 70px" type="color" value="#000000">' +
            '<span class="input-group-text input-group-middle">Border width: </span>' +
            '<input class="form-control input-group-middle" id="searchborderwidth" type="number" value="0" min="0">' +
            '<span title="Radius for point result" class="input-group-text input-group-middle">Radius: </span>' +
            '<input title="Radius for point result" class="form-control" id="searchpointradius" type="number" value="8" min="1">' +
            '</div>' +
            '<button class="btn btn-secondary btn-sm toremovebtn" type="button" id="addNewSearchCritBtn" onclick="appendSearch(Globaliter)" title="Add another search criteria">' +
            '<i class="fas fa-plus"></i>' +
            '</button>' +
            '<div class="dropdown">' +
            '<button class="btn btn-secondary btn-sm dropdown-toggle toremovebtn" type="button" id="mapResultBtn" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
            '<i class="fas fa-map-marked-alt"></i>' +
            '</button>' +
            '<div class="dropdown-menu" aria-labelledby="dropdownMenuButton">' +
            '<a class="dropdown-item" onclick="finishQuery(true)" title="Show combined result on map" href="#">Polygons</a>' +
            '<a class="dropdown-item" onclick="finishQuery(false)" title="Show combined result on map" href="#">Points</a>' +
            '</div>' +
            '</div>' +
            '<div class="dropdown">' +
            '<button class="btn btn-secondary btn-sm dropdown-toggle toremovebtn" type="button" id="dropdownMenuButtonDL" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
            '<i class="far fa-save"></i>' +
            '</button>' +
            '<div class="dropdown-menu" aria-labelledby="dropdownMenuButtonDL">' +
            '<a class="dropdown-item" onclick="finishQuery(true); exportToJsonFile(jsonresult)" title="Show combined result on map and download as GEOJSON" href="#">Polygons</a>' +
            '<a class="dropdown-item" onclick="finishQuery(false); exportToJsonFile(jsonresultPoints)" title="Show combined result on map and download as GEOJSON" href="#">Points</a>' +
            '</div>' +
            '</div>' +
            '<button class="btn btn-secondary btn-sm toremovebtn" type="button" id="AdvSearchOptBtn" onclick="toggleSearchOpt()" title="Advanced Options">' +
            '<i class="fas fa-ellipsis-h"></i>' +
            '</button>'
        );
        toggleSearchOpt();

        fillInput = document.getElementById("fillcolor");
        fillcolor = fillInput.value;
        fillInput.addEventListener("input", function () {
            fillcolor = fillInput.value;
        }, false);

        mysearchopacity = 10;
        $('#mysearchopacity').on('input change', function () {
            mysearchopacity = $('#mysearchopacity').val();
            $('#mysearchopacityvalue').val(mysearchopacity);
        });
        $('#mysearchopacityvalue').on('input change', function () {
            mysearchopacity = $('#mysearchopacityvalue').val();
            if (mysearchopacity > 100)
                $('#mysearchopacityvalue').val(100);
            if (mysearchopacity < 0)
                $('#mysearchopacityvalue').val(0);
            $('#mysearchopacity').val(mysearchopacity);
        });
        mysearchbordercolor = "#000000";
        searchbordercolorInput = document.getElementById("colorborder");
        searchbordercolor = searchbordercolorInput.value;
        searchbordercolorInput.addEventListener("input", function () {
            mysearchbordercolor = searchbordercolorInput.value;
        }, false);

        mysearchborderwidth = 0;
        $('#searchborderwidth').on('input change', function () {
            mysearchborderwidth = $('#searchborderwidth').val();
            if (mysearchborderwidth < 0)
                $('#searchborderwidth').val(0);
        });

        mysearchpointradius = 8;
        $('#searchpointradius').on('input change', function () {
            mysearchpointradius = $('#searchpointradius').val();
            if (mysearchpointradius < 0)
                $('#searchpointradius').val(0);
        });
    }
    ;
    $('#mysearchform').append(
        '<button class="btn btn-secondary btn-sm toremovebtn" type="button" id="resetSearchEndBtn" onclick="startsearch()" title="Reset search">' +
        '<i class="fas fa-sync-alt"></i>' +
        '</button>'
    );
}

function finishQuery(mygeometry) { //finish query and show results on map

    jsonresult = {
        "type": "FeatureCollection", //prepare geojson
        "features": []
    };
    jsonresultPoints = {
        "type": "FeatureCollection", //prepare geojson
        "features": []
    };

    $.each(mypolyjson.features, function (i, feature) {
        if (finalSearchResultIds.includes(feature.id)) {
            jsonresult.features.push(feature);
            pointfeature = Object.assign({}, feature);
            pointfeature.geometry = {};
            arr = JSON.parse(JSON.stringify(feature.geometry.coordinates).slice(1, -1));
            mycenter = getCenter(arr);
            mypoint = {"type": "Point", "coordinates": mycenter};
            pointfeature.geometry = mypoint;
            jsonresultPoints.features.push(pointfeature);
        }
    });

    mysearchresultstyle = {
        "fillColor": fillcolor,
        "weight": mysearchborderwidth,
        "fillOpacity": 1 - mysearchopacity / 100,
        "color": mysearchbordercolor,
    };

    geojsonMarkerOptions = {
        radius: mysearchpointradius,
        fillColor: fillcolor,
        color: mysearchbordercolor,
        weight: mysearchborderwidth,
        opacity: 1,
        fillOpacity: 1 - mysearchopacity / 100
    };

    if (mygeometry) {
        resultpolys.clearLayers();
        resultpoly = L.geoJSON(jsonresult, {style: mysearchresultstyle});
        resultpolys.addLayer(resultpoly);
    } else {
        resultpoints.clearLayers();
        resultpoint = L.geoJSON(jsonresultPoints, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, geojsonMarkerOptions);
            }
        });
        resultpoints.addLayer(resultpoint);
    }
    ;
}

function getCenter(arr) {
    var minX, maxX, minY, maxY;
    for (var i = 0; i < arr.length; i++) {
        var x = arr[i][0], y = arr[i][1];
        minX = (x < minX || minX == null) ? x : minX;
        maxX = (x > maxX || maxX == null) ? x : maxX;
        minY = (y < minY || minY == null) ? y : minY;
        maxY = (y > maxY || maxY == null) ? y : maxY;
    }
    return [(minX + maxX) / 2, (minY + maxY) / 2];
}


function jsonquery(id, level, prop, val1, val2) {
    //prepare searchresult array
    searchResult = [];
    searchResultIds = [];

    //convert values to valid integers
    //set values to catch whole range if undefined
    if (val1 == '' || typeof (val1) == 'undefined' || val2 == undefined)
        val1 = "-99999999999";
    if (val2 == '' || typeof (val2) == 'undefined' || val2 == undefined)
        val2 = "99999999999";

    //alert if second value is lower than first value
    if (typeof (val1 == 'string'))
        val1 = parseFloat(val1.replace(',', '.').replace(' ', ''));
    if (typeof (val2 == 'string'))
        val2 = parseFloat(val2.replace(',', '.').replace(' ', ''));

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
            }
            ;
        });
    }
    ;

    if (level == 'strat') {
        $.each(myjson.features, function (i, feature) {
            feature = feature;
            $.each(feature.burials, function (b, burial) {
                levelQuery(feature, burial, id, prop, val1, val2);
                if (searchResultIds.includes(burial.id)) {
                    searchResultIds.push(feature.id);
                    $.each(burial.finds, function (f, find) {
                        searchResultIds.push(parseInt(find.id));
                    });
                }
                ;
            });
        });
    }
    ;

    if (level == 'find') {
        $.each(myjson.features, function (i, feature) {
            feature = feature;
            $.each(feature.burials, function (b, burial) {
                $.each(burial.finds, function (f, find) {
                    levelQuery(feature, find, id, prop, val1, val2);
                    if (searchResultIds.includes(find.id)) {
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
    distinctResult = Array.from(new Set(searchResult));
    searchResult = distinctResult;
    // intermed = finalSearchResult.filter(value => searchResult.includes(value));
    intermed = finalSearchResult.filter(function (n) {
        return searchResult.indexOf(n) !== -1;
    });
    finalSearchResult = intermed;

    distinctResultIds = Array.from(new Set(searchResultIds));
    searchResultIds = distinctResultIds;
    // intermedIds = finalSearchResultIds.filter(value => searchResultIds.includes(value);
    intermedIds = finalSearchResultIds.filter(function (n) {
        return searchResultIds.indexOf(n) !== -1;
    });
    finalSearchResultIds = intermedIds;
}

//query entitites based on level
function levelQuery(feature, entity, id, prop, val1, val2) {
// if search is for maintype push result to layer
    if (prop == 'maintype' && id.includes(entity.properties.maintype.id)) {
        searchResult.push(feature.id);
        if (finalSearchResultIds.includes(entity.id))
            searchResultIds.push(entity.id);
    }
    ;

    // if search is for timespan
    //first check if timespan is available
    if (prop == 'timespan' && (typeof (entity.properties.timespan)) !== 'undefined') {

        //set begin and end if available as integers from timestamp
        if (typeof (entity.properties.timespan.begin_from) !== 'undefined')
            begin = (parseInt(((entity.properties.timespan.begin_from)), 10));
        if (typeof (entity.properties.timespan.end_to) !== 'undefined')
            end = (parseInt(((entity.properties.timespan.end_to)), 10));
        //if begin and end are availale set a between timespan as result
        if (typeof (begin) !== 'undefined' && typeof (end) !== 'undefined' && begin >= val1 && end <= val2) {
            searchResult.push(feature.id);
            if (finalSearchResultIds.includes(entity.id))
                searchResultIds.push(entity.id);
        }

        //if only begin is available get all entities that start with or after begin
        if (typeof (begin) !== 'undefined' && end == '' && begin >= val1) {
            searchResult.push(feature.id);
            if (finalSearchResultIds.includes(entity.id))
                searchResultIds.push(entity.id);
        }

        //if only end is available get all entities that end with or before begin
        if (typeof (end) !== 'undefined' && begin == '' && end <= val2) {
            searchResult.push(feature.id);
            if (finalSearchResultIds.includes(entity.id))
                searchResultIds.push(entity.id);
        }
    }

    // get results of matching types
    if (prop == 'type' && (typeof (entity.properties.types)) !== 'undefined') {
        $.each(entity.properties.types, function (t, type) {
            if (id.includes(type.id)) {
                searchResult.push(feature.id);
                if (finalSearchResultIds.includes(entity.id))
                    searchResultIds.push(entity.id);
            }
        });
    }

    //get results of matching dimensions with values and operators
    if (prop == 'dimension' && (typeof (entity.properties.dimensions)) !== 'undefined') {
        $.each(entity.properties.dimensions, function (d, dim) {
            if (typeof (dim.value) !== 'undefined' && id.includes(dim.id) && dim.value >= val1 && dim.value <= val2) {
                searchResult.push(feature.id);
                if (finalSearchResultIds.includes(entity.id))
                    searchResultIds.push(entity.id);
            }
        });
    }

    //get results of matching material with values and operators
    if (prop == 'material' && (typeof (entity.properties.material)) !== 'undefined') {
        $.each(entity.properties.material, function (m, mat) {
            tempMatValue = mat.value;
            if (mat.value == '0' || mat.value == '')
                tempMatValue = 100;
            if (id.includes(mat.id) && tempMatValue >= val1 && tempMatValue <= val2) {
                searchResult.push(feature.id);
                if (finalSearchResultIds.includes(entity.id))
                    searchResultIds.push(entity.id);
            }
        });
    }
}


function toggleSearchOpt() {
    $('.mysearchoptions').toggle();
}
