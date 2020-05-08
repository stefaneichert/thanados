//function to query json for types, values etc. recursively


$(document).ready(function () {
    local = true;
    currentLegendTitle = '';
})

function startsearch() {
    $('#infoalert').empty();
    initateQuery();
    $('#mysearchform').empty();
    appendSearch(1);
    if ($('#visdialog').hasClass("ui-dialog-content")) {
        if ($('#visdialog').dialog('isOpen') === true) $("#visdialog").dialog('close');
    }
    $("#dialog").dialog({
        width: mymodalwith,
        height: 450,
        position: {my: "center", at: "center", of: "body"},
        open: function () {
            // Destroy Close Button (for subsequent opens)
            $('#dialog-close').remove();
            // Create the Close Button (this can be a link, an image etc.)
            var link =
                '<btn id="dialog-close" title="close" ' +
                'class="btn btn-sm btn-secondary d-inline-block float-right text-decoration-none;">' +
                '<i class="fas fa-times"></i></btn>';
            // Create Close Button
            $(".ui-dialog-title").css({'width': ''});
            $(this).parent().find(".ui-dialog-titlebar").append(link);
            // Add close event handler to link
            $('#dialog-close').on('click', function () {
                $("#dialog").dialog('close');
            });
        }
    });
}


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

function appendSearch(Iter) {//append search form to dialog
    $('#infoalert').empty();
    $('.toremovebtn').remove(); //removes former buttons to append new search
    $('.mysearchoptions').remove(); //removes former buttons to append new search
    $('#mysearchform').append(
        //selection for search level: grave, burial or find
        '<div id="LevelSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">\n' +
        '<div class="input-group-prepend">\n' +
        '<label class="input-group-text" for="LevelSelect_' + Iter + '">' + Iter + '. </label>\n' +
        '</div>\n' +
        '<select class="custom-select empty" title="Select whether to search in graves, burials (=human remains) or finds" id="LevelSelect_' + Iter + '">\n' +
        '<option selected disabled>Select search level...</option>\n' +
        '<option value="feature">Graves</option>\n' +
        '<option value="strat">Burials</option>\n' +
        '<option value="find">Finds</option>\n' +
        '</select>\n' +
        '</div>');

    //after main level is selected:
    $('#LevelSelect_' + Iter).on('change', function () {
        appendLevel = $('#LevelSelect_' + Iter + ' option:selected').val(); //set level as variable
        appendLevelName = $('#LevelSelect_' + Iter + ' option:selected').html(); //set level as variable
        $('#LevelSelect_' + Iter).prop('disabled', true); //disable former selection field
        if (Iter == 1)
            $('#LevelSelect_' + Iter + '_parent').append(//add reset button on first iteration
                '<div class="input-group-append">' +
                '<button class="btn btn-secondary btn-sm" type="button" id="resetsearchbutton" onclick="delete Globaliter; startsearch()" title="Reset search">' +
                '<i class="fas fa-sync-alt"></i>' +
                '</button>' +
                '</div>'
            );
        $('#mysearchform').append(
            //selection for property to choose: maintype, types, dimensions, material or timespan
            '<div id="PropSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">' +
            '<select class="custom-select empty" title="select what property to search for" id="PropSelect_' + Iter + '">' +
            '<option selected disabled>Select search criteria...</option>' +
            '<option title="Main type of ' + appendLevelName + '" value="maintype">Maintype</option>' +
            '<option title="Classifications, typology and other named types associated with ' + appendLevelName + '" value="type">Properties</option>' +
            '<option title="Date range of ' + appendLevelName + '" value="timespan">Timespan</option>' +
            '<option title="Dimensions and certain other measured values concerning the spatial extend of ' + appendLevelName + '" value="dimension">Dimensions</option>' +
            '<option title="Materials (like copper, iron, ceramics etc.) of ' + appendLevelName + '" value="material">Material</option>' +
            '<option title="Classifications of entities that are connected with values (e.g. maximum age, body height etc.)" value="value">Value Properties</option>' +
            '</select>' +
            '</div>'
        );
        appendCriteria(Iter, appendLevel);
    });
}

function appendCriteria(Iter, appendLevel) { //select search criteria after level is chosen
    $('#PropSelect_' + Iter).on('change', function () {
        criteria = $('#PropSelect_' + Iter + ' option:selected').val().toLowerCase(); //set criteria variable
        currentLegendTitle = appendLevelName + ' > ' + $('#PropSelect_' + Iter + ' option:selected').html();
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
        initiateTree(Iter, appendLevel, criteria, targetField); //open tree to select value and add variable to form after
    }

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
            '<input title="start year (CE) of the entity\'s dating" id="valMin_' + Iter + '" class="form-control value-input" type="text">' +
            '<span class="input-group-text input-group-middle">max: </span>' +
            '<input title="end year (CE) of the entity\'s dating" id="valMax_' + Iter + '" class="form-control value-input" type="text">' +
            '<div class="input-group-append">' +
            '<button class="btn btn-secondary btn-sm" type="button" id="timespanbutton_' + Iter + '" onclick="searchTime(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for timespan">' +
            '<i class="fas fa-search"></i>' +
            '</button>' +
            '</div>' +
            '</div>'
        );
    }

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
            '<option title="Orientation represents the clockwise angle between North and the directed axis of the entity. E.g. between North and a skeleton\'s axis (from head to feet)" value="26192">Orientation (°)</option>' +
            '<option title="Azimuth represents the smallest angle between north and the non directed axis of an entity. E.g. beetween North and a grave pit\'s axis" value="118730">Azimuth (°)</option>' +
            '<option value="15680">Weight (g)</option>' +
            '</select>' +
            '</div>'
        );
        $('#DimensionSelect_' + Iter).on('change', function () {
            $('#DimensionSelect_' + Iter).prop('disabled', true); //disable input
            $('#DimensionSelect_' + Iter + '_parent').append(//append input of values
                '<span class="input-group-text input-group-middle">min: </span>' +
                '<input title="minumum value of the dimension to search for." id="valMin_' + Iter + '" class="form-control value-input" type="text">' +
                '<span class="input-group-text input-group-middle">max: </span>' +
                '<input title="maximum value of the dimension to search for." id="valMax_' + Iter + '" class="form-control value-input" type="text">' +
                '<div class="input-group-append">' +
                '<button class="btn btn-secondary btn-sm" type="button" id="dimMatButton_' + Iter + '" onclick="searchDimMat(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for dimension">' +
                '<i class="fas fa-search"></i>' +
                '</button>' +
                '</div>'
            )
        });
    }

    if (criteria == 'material' || criteria == 'value') { //if material or value append form with tree select
        $('#mysearchform').append(
            '<div id="MaterialSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">' +
            '<div class="input-group-prepend">' +
            '<span id="MaterialSelect_' + Iter + '" class="input-group-text"></span>' +
            '</div>' +
            '</div>'
        );
        targetField = 'MaterialSelect_' + Iter;
        initiateTree(Iter, appendLevel, criteria, targetField);
    }
}

function appendMaterial(Iter) { //append value input after material is chosen
    $('#MaterialSelect_' + Iter + '_parent').append(
        '<span class="input-group-text input-group-middle">min: </span>' +
        '<input title="minimum value of the criteria to search for. In case of material this can be left blank if you want to get all entities with any value of this material" id="valMin_' + Iter + '" class="form-control value-input" type="text">' +
        '<div class="input-group-append">' +
        '<span class="input-group-text input-group-middle">max: </span>' +
        '</div>' +
        '<input title="maximum value of the criteria to search for. In case of material this can be left blank if you want to get all entities with any value of this material" id="valMax_' + Iter + '" class="form-control value-input" type="text">' +
        '<div class="input-group-append">' +
        '<button class="btn btn-secondary btn-sm" type="button" id="dimMatButton_' + Iter + '" onclick="searchDimMat(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for selected criteria">' +
        '<i class="fas fa-search"></i>' +
        '</button>' +
        '</div>'
    );
}

//search functions depending on criteria
function searchDimMat(criteria, appendLevel, Iter, val1, val2) {
    var val1 = $('#valMin_' + Iter).val();
    var val2 = $('#valMax_' + Iter).val();
    if (criteria === 'material') {
        if (typeof (val1) == 'undefined' || val1 === '') val1 = '0';
        if (typeof (val2) == 'undefined' || val2 === '') val2 = '100';
    }
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
        if (criteria !== 'dimension') {
            dimId = nodeIds;
            currentLegendTitle = currentLegendTitle + ': ' + val1 + ' - ' + val2;
            currentCreateLegend = appendLevelName + ' > ' + GlobalSelectedNodeName + ': ' + val1 + ' - ' + val2;
        }
        if (criteria === 'dimension') {
            dimId = $('#DimensionSelect_' + Iter + ' option:selected').val().toLowerCase();
            dimText = $('#DimensionSelect_' + Iter + ' option:selected').html();
            currentLegendTitle = currentLegendTitle + ' > ' + dimText + ': ' + val1 + ' - ' + val2;
            currentCreateLegend = appendLevelName + ' > ' + dimText + ': ' + val1 + ' - ' + val2;
            //console.log(criteria);
            //console.log(currentCreateLegend);
        }
        jsonquery(dimId, appendLevel, criteria, val1, val2);
        $('#dimMatResult_' + Iter).val(uniqueSearchResult.length + ' matches in ' + searchResult.length + ' graves');
        appendPlus(Iter);
    }
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
        currentLegendTitle += ': ' + val1 + ' - ' + val2;
        currentCreateLegend = appendLevelName + ' > Time Span: ' + val1 + ' - ' + val2
        appendPlus(Iter);
    }
}

function appendPlus(Iter) {
    //console.log(Iter);
    Globaliter = Iter + 1;
    var features = false;
    if (Iter > 1) {
        resultlength = [];
        $.each(myjson.features, function (i, feature) {
            if (finalSearchResultIds.includes(feature.id)) {
                resultlength.push(feature.properties.name);
            }
        });

        $('#mysearchform').append(
            '<div class="input-group input-group-sm mb-3">' +
            '<input id="finalresult_' + Iter + '" class="form-control combiresult" onclick="this.blur()" title="' + resultlength + '" type="text" placeholder="' + CSVresult.length + ' combined matches in ' + resultlength.length + ' graves" readonly disabled>' +
            '</div>'
        );
    }


    if (finalSearchResultIds.length > 0) {
        $.each(myjson.features, function (i, feature) {
            if (finalSearchResultIds.includes(feature.id)) {
                if (typeof (feature.geometry) !== 'undefined') features = true;
            }
        });


        $('#mysearchform').append(
            '<div class="mysearchoptions input-group input-group-sm mb-3">' +
            '<div class="input-group-prepend">' +
            '<label class="input-group-text" for="legendtitle">Legend title: </label>' +
            '</div>' +
            '<input class="form-control legendtext" id="legendtitle" type="text" value="' + currentCreateLegend + '">' +
            '</div>' +
            '</div>' +
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
            '<button class="showPolygons btn btn-secondary btn-sm toremovebtn" type="button" onclick="finishQuery(\'poly\', finalSearchResultIds, CSVresult, true, null)" title="Add layer to map">' +
            '<i class="fas fa-map-marked"></i>' +
            //'Add layer' +
            '</button>' +
            /*'<button class="showPoints btn btn-secondary btn-sm toremovebtn" type="button" onclick="finishQuery(\'point\', finalSearchResultIds, CSVresult, true, null)" title="Add point layer">' +
            '<i class="fas fa-map-marker"></i>' +
            '</button>' +*/
            /*'<div class="dropdown">' +
            '<button class="btn btn-secondary btn-sm dropdown-toggle toremovebtn" type="button" id="dropdownMenuButtonDL" title="Download search result geodata" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
            '<i class="far fa-save"></i>' +
            '</button>' +
            '<div class="dropdown-menu" aria-labelledby="dropdownMenuButtonDL">' +
            '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, null); exportToJsonFile(jsonresult)" title="Download as GEOJson polygons" href="#">Polygons</a>' +
            '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, null); exportToJsonFile(jsonresultPoints)" title="Download as GEOJson points" href="#">Points</a>' +
            '</div>' +
            '</div>' +*/
            '<button class="btn btn-secondary btn-sm toremovebtn" onclick="finishQuery(\'table\', finalSearchResultIds, CSVresult, true, null)" type="button" id="ShowListButton" title="Show/Export result list" data-toggle="modal" data-target="#CSVmodal">' +
            '<i class="fas fa-list"></i>' +
            '</button>' +
            '<button class="btn btn-secondary btn-sm toremovebtn" type="button" id="addNewSearchCritBtn" onclick="appendSearch(Globaliter)" title="Add another search criteria to search for in this result">' +
            '<i class="fas fa-plus"></i>' +
            //'Continue search' +
            '</button>'
        );

        if (features === false) {
            $('.showPolygons').addClass('d-none');
            infoalert = '<div onclick="$(\'#infoalert\').empty()" class="alert alert-info fade show" role="alert"><i style="float: right; font-size: 2em; margin-top: 0.2em; margin-left: 0.7em; color: #00acff;" class="fas fa-exclamation-circle"></i><span style="font-size: 0.9em;">\n' +
                'Your search contains only results with unkown location and cannot be displayed on the map </span>\n' +
                '</div>';
            $('#infoalert').html(infoalert);
            var thisAlert = document.getElementById('infoalert');
            thisAlert.scrollIntoView(false);
        }

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

    $('#mysearchform').append(
        '<button class="btn btn-secondary btn-sm toremovebtn" type="button" id="resetSearchEndBtn" onclick="delete Globaliter; startsearch()" title="Reset search">' +
        '<i class="fas fa-sync-alt"></i>' +
        '</button>'
    );

    $('#resetSearchEndBtn')[0].scrollIntoView(
        {
            behavior: "smooth", // or "auto" or "instant"
            block: "end"
        }
    );
}


function finishQuery(type, idlist, csvData, first, layerId) { //finish query and show results on map
    //console.log('finishQuery');
    if (first) {
        if (currentCreateLegend !== '') currentLegend = currentCreateLegend;
        fillcolor = chroma.random().hex();
        mysearchbordercolor = '#000000';
        mysearchborderwidth = 1;
        choroOptions.radius = 8;
        choroOptions.minradius = 5;
        choroOptions.choroPntMode = 0;
        var layer_id = makeid(3)
        //console.log(layer_id);
        while (layerIds.includes(layer_id)) {
            var layer_id = makeid(3)
        }
        layerIds.push(layer_id);
        //console.log(layerIds);
    } else {
        layer_id = layerId;
        if (type !== 'table' && type !== null) eval('map.removeLayer(' + layer_id + ')');
    }
    jsonresult = {
        "type": "FeatureCollection", //prepare geojson
        "features": [],
        "properties": {},
        "uniqueLayerId": layer_id
    };
    jsonresultPoints = {
        "type": "FeatureCollection", //prepare geojson
        "features": [],
        "properties": {},
        "uniqueLayerId": layer_id
    };

    //console.log('create jsons');
    $.each(mypolyjson.features, function (i, feature) {
        if (idlist.includes(feature.id)) {
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
        "radius": mysearchpointradius,
        "fillColor": fillcolor,
        "color": mysearchbordercolor,
        "weight": mysearchborderwidth,
        "opacity": 1,
        "fillOpacity": 1 - mysearchopacity / 100
    };

    //console.log('createCSV_begin')
    CSVresultJSON = jQuery.extend(true, [], csvData);
    var tmpCSV = JSON.parse(JSON.stringify(csvData));
    $.each(tmpCSV, function (i, dataset) {
        delete dataset.image
    });
    CSVresultExport = toCSV(tmpCSV);

    jsonresult = setSearchInfo(jsonresult, CSVresultJSON, first);
    jsonresultPoints = setSearchInfo(jsonresultPoints, CSVresultJSON, first);


    if (type === 'poly') {
        resultpoly = L.geoJSON(jsonresult, {
            style: mysearchresultstyle,
            shapetype: 'poly',
            legendTitle: currentLegend,
            layername: layer_id
        });
        eval(layer_id + ' = $.extend(true, {}, resultpoly)');
        //console.log(eval(layer_id));
        $('.showPolygons').addClass('disabled').prop('disabled', true).prop('title', '').css('cursor', 'default').addClass('noHover');
        map.addLayer((eval(layer_id)));

        var currentSearchPolys =
            '<li class="layerOptionsClick" title="click to open layer options" ' +
            'onclick="currentLegend = (this.getAttribute(\'data-legend\')); ' +
            'CSVresult = JSON.parse(this.getAttribute(\'data-CSVresult\')); ' +
            'finalSearchResultIds = JSON.parse(this.getAttribute(\'data-idlist\')); ' +
            'currentStatistics = JSON.parse(this.getAttribute(\'data-search\')); ' +
            'layertypes = JSON.parse(this.getAttribute(\'data-layertypes\')); ' +
            'jsonresult.properties.statistics = currentStatistics; ' +
            'jsonresultPoints.properties.statistics = currentStatistics; ' +
            'searchStyle = JSON.parse(this.getAttribute(\'data-style\')); ' +
            'currentLayerId = this.getAttribute(\'data-layerId\'); ' +
            'openStyleDialog(\'info\')" data-CSVresult=\'' + JSON.stringify(csvData) + '\' ' +
            'data-legend=\'' + currentLegend + '\' ' +
            'data-search=\'' + JSON.stringify(jsonresult.properties.statistics) + '\' ' +
            'data-layertypes=\'' + JSON.stringify(jsonresult.properties.layertypes) + '\' ' +
            'data-idlist="' + JSON.stringify(finalSearchResultIds) + '" ' +
            'data-layerId="' + layer_id + '" ' +
            'data-style=\'' + JSON.stringify(mysearchresultstyle) + '\' ' +
            'style="background-color: ' + hexToRgbA(mysearchresultstyle.fillColor, mysearchresultstyle.fillOpacity) + '; ' +
            'border: ' + mysearchresultstyle.weight + 'px solid ' + mysearchresultstyle.color + '"> &nbsp;</li>'
        createLegend(map, (eval(layer_id)), currentSearchPolys);
        orderlayer(myselector);

    }
    if (type === 'point') {
        resultpoint = L.geoJSON(jsonresultPoints, {
            shapetype: 'point',
            style: geojsonMarkerOptions,
            legendTitle: currentLegend,
            layername: layer_id,
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, geojsonMarkerOptions);
            }
        });
        eval(layer_id + ' = $.extend(true, {}, resultpoint)');
        //console.log(eval(layer_id));
        $('.showPoints').addClass('disabled').prop('disabled', true).prop('title', '').css('cursor', 'default').addClass('noHover');
        map.addLayer((eval(layer_id)));

        var currentSearchPoints =
            '<li class="layerOptionsClickPoint" title="click to open layer options" ' +
            'onclick="currentLegend = (this.getAttribute(\'data-legend\')); ' +
            'CSVresult = JSON.parse(this.getAttribute(\'data-CSVresult\')); ' +
            'finalSearchResultIds = JSON.parse(this.getAttribute(\'data-idlist\')); ' +
            'currentStatistics = JSON.parse(this.getAttribute(\'data-search\')); ' +
            'layertypes = JSON.parse(this.getAttribute(\'data-layertypes\')); ' +
            'jsonresult.properties.statistics = currentStatistics; ' +
            'jsonresultPoints.properties.statistics = currentStatistics; ' +
            'searchStyle = JSON.parse(this.getAttribute(\'data-style\')); ' +
            'currentLayerId = this.getAttribute(\'data-layerId\'); ' +
            'openStyleDialog(\'info\')" ' +
            'data-CSVresult=\'' + JSON.stringify(csvData) + '\' ' +
            'data-legend=\'' + currentLegend + '\' ' +
            'data-search=\'' + JSON.stringify(jsonresult.properties.statistics) + '\' ' +
            'data-layertypes=\'' + JSON.stringify(jsonresult.properties.layertypes) + '\' ' +
            'data-idlist="' + JSON.stringify(finalSearchResultIds) + '" ' +
            'data-layerId="' + layer_id + '" ' +
            'data-style=\'' + JSON.stringify(geojsonMarkerOptions) + '\' ' +
            'style="background-color: ' + hexToRgbA(geojsonMarkerOptions.fillColor, geojsonMarkerOptions.fillOpacity) + '; ' +
            'border: ' + geojsonMarkerOptions.weight + 'px solid ' + geojsonMarkerOptions.color + '">&nbsp;</li>'
        createLegend(map, (eval(layer_id)), currentSearchPoints);
        orderlayer(myselector);
    }


    CSVtable(CSVresultJSON);


    if (type === 'colorpoly' || type === 'colorpoint') {

        /*if (jsonresult.properties.layertypes.multicolorNoOverlaps === false) {
            $('#mystyleform').prepend(infoalert);
            $('.infotext').html('Please note that there are overlapping categories for some graves.')
        }*/

        if (type === 'colorpoly') {

            MultiColorSearchStyle = {
                "color": mysearchbordercolor,
                "weight": mysearchborderwidth,
                "fillOpacity": (1 - (mysearchopacity / 100)),
                "radius": mysearchpointradius
            }
            //console.log('colorpoly resultjson')
            resultpoly = L.geoJSON(jsonresult, {
                style: function (feature) {
                    var color = feature.search.searchResults[0].fillColor;
                    return {
                        fillColor: color,
                        weight: mysearchborderwidth,
                        fillOpacity: (1 - mysearchopacity / 100),
                        color: mysearchbordercolor
                    }
                },
                shapetype: 'poly',
                legendTitle: currentLegend,
                layername: layer_id
            });
            eval(layer_id + ' = $.extend(true, {}, resultpoly)');
            map.addLayer((eval(layer_id)));
            var currentColorPolys

            //console.log('create color entries poly');
            $.each(currentStatistics, function (i, stat) {
                //console.log(stat);
                if (i == 0) {
                    currentColorPolys = '<ul class="multicolorlist"><li class="multicolor" style="float: left; width: auto; margin-right: 6px">' + stat.SearchKey + '</li><li class="multicolor"' +
                        ' style="float: right; min-width: 60px; border: ' + mysearchborderwidth + 'px solid ' + mysearchbordercolor + '; background-color: ' + stat.FillColor + ';">&nbsp;</li></ul>';
                } else {
                    currentColorPolys += '<ul class="multicolorlist"><li class="multicolor" style="float: left; width: auto; margin-right: 6px">' + stat.SearchKey + '</li><li class="multicolor"' +
                        ' style="float: right; min-width: 60px; border: ' + mysearchborderwidth + 'px solid ' + mysearchbordercolor + '; background-color: ' + stat.FillColor + ';">&nbsp;</li></ul>';
                }
            })
        }

        if (type === 'colorpoint') {
            //console.log('colorpoint resultjson')
            resultpoint = L.geoJSON(jsonresultPoints, {
                style: function (feature) {
                    var color = feature.search.searchResults[0].fillColor;
                    return {
                        fillColor: color,
                        weight: mysearchborderwidth,
                        fillOpacity: (1 - mysearchopacity / 100),
                        radius: mysearchpointradius,
                        color: mysearchbordercolor
                    }
                },
                shapetype: 'point',
                legendTitle: currentLegend,
                layername: layer_id,
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng);
                }
            });
            eval(layer_id + ' = $.extend(true, {}, resultpoint)');
            map.addLayer((eval(layer_id)));
            var currentColorPolys
            //console.log('create color entries point');
            $.each(currentStatistics, function (i, stat) {
                //console.log(stat);
                if (i == 0) {
                    currentColorPolys = '<ul class="multicolorlist"><li class="multicolor" style="float: left; width: auto; margin-right: 6px">' + stat.SearchKey + '</li><li class="multicolor" ' +
                        'style="float: right; margin-left: 1em;\n' +
                        '    margin-top: -2px;\n' +
                        '    border-radius: 50%; width: 16px !important;\n' +
                        '    height: 16px !important; max-height: 16px; border: ' + mysearchborderwidth + 'px solid ' + mysearchbordercolor + '; background-color: ' + stat.FillColor + ';">&nbsp;</li></ul>';
                } else {
                    currentColorPolys += '<ul class="multicolorlist"><li class="multicolor" style="float: left; width: auto; margin-right: 6px">' + stat.SearchKey + '</li><li class="multicolor" ' +
                        'style="float: right; margin-left: 1em;\n' +
                        '    margin-top: -2px;\n' +
                        '    border-radius: 50%; width: 16px !important;\n' +
                        '    height: 16px !important; max-height: 16px; border: ' + mysearchborderwidth + 'px solid ' + mysearchbordercolor + '; background-color: ' + stat.FillColor + ';">&nbsp;</li></ul>';
                }
            })
        }
        var multibutton = '<a onclick="minmaxLegend(this);"' +
            ' style="cursor: pointer; font-size: 1.3em; margin-top: -1px;" class="float-right"><i class="far fa-minus-square" title="collapse"></i></a>' +
            '<a class="multicolorbtn float-right" ' +
            'onclick="currentLegend = (this.getAttribute(\'data-legend\')); ' +
            'CSVresult = JSON.parse(this.getAttribute(\'data-CSVresult\')); ' +
            'finalSearchResultIds = JSON.parse(this.getAttribute(\'data-idlist\')); ' +
            'MultiColorSearchStyle = JSON.parse(this.getAttribute(\'data-style\')); ' +
            'currentStatistics = JSON.parse(this.getAttribute(\'data-search\')); ' +
            'layertypes = JSON.parse(this.getAttribute(\'data-layertypes\')); ' +
            'jsonresult.properties.statistics = currentStatistics; ' +
            'jsonresultPoints.properties.statistics = currentStatistics; ' +
            'currentLayerId = this.getAttribute(\'data-layerId\'); ' +
            'openStyleDialog(\'info\')" ' +
            'data-CSVresult=\'' + JSON.stringify(csvData) + '\' ' +
            'data-legend=\'' + currentLegend + '\' ' +
            'data-search=\'' + JSON.stringify(jsonresult.properties.statistics) + '\' ' +
            'data-layertypes=\'' + JSON.stringify(jsonresult.properties.layertypes) + '\' ' +
            'data-idlist="' + JSON.stringify(finalSearchResultIds) + '" ' +
            'data-layerId="' + layer_id + '" ' +
            'data-style=\'' + JSON.stringify(MultiColorSearchStyle) + '\' ' +
            '>' +
            '<i class="fas fa-palette" title="click to open layer options"></i></a>' +
            '<div class="mt-2"></div>'
        currentColorPolys = multibutton + '<div class="overflowlegend">' + currentColorPolys + '</div>'

        createLegend(map, (eval(layer_id)), currentColorPolys);
        orderlayer(myselector);
    }

    if (type === 'choropoly' || type === 'choropoint') {
        //console.log('create chorolayers');
        if (type === 'choropoly') jsonresult = setChoroplethJSON(jsonresult, myValueMode);
        if (type === 'choropoint') jsonresult = setChoroplethJSON(jsonresultPoints, myValueMode);
        choroplethLayer = L.choropleth(jsonresult, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng);
            },
            shapetype: 'choropoly',
            legendTitle: currentLegend,
            radius: mysearchpointradius,
            minradius: mysearchpointminradius,
            layername: layer_id,
            valueProperty: 'chorovalue', // which property in the features to use
            scale: myChorocolor, // chroma.js scale - include as many as you like
            steps: myChorosteps, // number of breaks or steps in range
            mode: myChoromode, // q for quantile, e for equidistant, k for k-means
            choroPntMode: myChoroPntMode, // 0 for single size, 1 for gradient size
            valuemode: myValueMode, // count, value, begin, middle, end
            polygonstyle: {
                color: myChoroborder, // border color
                weight: myChoroborderwidth,
                fillOpacity: myChorofinalopacity
            },
            style: function (feature) {
                if (myChoroPntMode == 1) {
                    return {
                        color: myChoroborder, // border color
                        weight: myChoroborderwidth,
                        fillOpacity: myChorofinalopacity,
                        radius: feature.properties.radius
                    }
                } else {
                    return {
                        color: myChoroborder, // border color
                        weight: myChoroborderwidth,
                        fillOpacity: myChorofinalopacity,
                        radius: mysearchpointradius
                    }
                }
            },
        })

        eval(layer_id + ' = $.extend(true, {}, choroplethLayer)');
        map.addLayer((eval(layer_id)));

        var div = document.createElement('div');
        var limits = choroplethLayer.options.limits;
        var colors = choroplethLayer.options.colors;
        var labels = [];

        limits.forEach(function (limit, index) {
            labels.push('<li style="background-color: ' + colors[index] + '"></li>')
        })

        div.innerHTML += '<ul class="mt-2"' +
            ' onclick="' +
            'choroOptions=JSON.parse(this.getAttribute(\'data-options\'));' +
            'currentLegend = (this.getAttribute(\'data-legend\'));' +
            'CSVresult = JSON.parse(this.getAttribute(\'data-CSVresult\')); ' +
            'finalSearchResultIds = JSON.parse(this.getAttribute(\'data-idlist\')); ' +
            'currentStatistics = JSON.parse(this.getAttribute(\'data-search\')); ' +
            'layertypes = JSON.parse(this.getAttribute(\'data-layertypes\')); ' +
            'jsonresult.properties.statistics = currentStatistics; ' +
            'jsonresultPoints.properties.statistics = currentStatistics; ' +
            'currentLayerId = this.getAttribute(\'data-layerId\'); ' +
            'openStyleDialog(\'info\')"' +
            ' title="Click for layer options" style="cursor: pointer!important"' +
            ' data-options=\'' + JSON.stringify(choroplethLayer.options) + '\' ' +
            'data-legend=\'' + currentLegend + '\' ' +
            'data-search=\'' + JSON.stringify(jsonresult.properties.statistics) + '\' ' +
            'data-layertypes=\'' + JSON.stringify(jsonresult.properties.layertypes) + '\' ' +
            'data-CSVresult=\'' + JSON.stringify(csvData) + '\' ' +
            'data-idlist="' + JSON.stringify(finalSearchResultIds) + '" ' +
            'data-layerId="' + layer_id + '" ' +
            '<span style="display: table; margin: auto;"><li style="width: auto; margin-right: 9px">' +
            +limits[0] + '</li>' + labels.join('') + '<li style="width: auto; margin-left: 9px">' + limits[limits.length - 1] + '</li></span></ul>'
        //return div
        createLegend(map, choroplethLayer, div);
        orderlayer(myselector);
    }


    if (type === 'chart') {

        var chartmarkers = [];
        //console.log(mysearchpointradius);

        $.each(jsonresultPoints.features, function (i, feature) {
            var options = {
                data: feature.search.distinctCount,
                chartOptions: jsonresultPoints.properties.ChartOptions,
                //color: '#000000',
                //fillColor: 'hsl(' + (Math.random() * 360) + ',100%,100%)',
                weight: parseFloat(mysearchborderwidth),
                radius: parseFloat(mysearchpointradius),
                fillOpacity: parseFloat(1 - mysearchopacity / 100),
                barThickness: parseFloat(mysearchbarthickness)
            };

            var ChartMarker = new L.PieChartMarker(new L.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]), options);
            chartmarkers.push(ChartMarker);
        });
        ChartStyle = {
            "color": mysearchbordercolor,
            "weight": mysearchborderwidth,
            "fillOpacity": (1 - (mysearchopacity / 100)),
            "radius": mysearchpointradius,
            "barthickness": mysearchbarthickness
        }
        //console.log('colorpoly resultjson')

        eval(layer_id + ' = L.layerGroup(chartmarkers, {shapetype: \'chart\', legendTitle: currentLegend, layername: layer_id})');
        map.addLayer((eval(layer_id)));
        var currentColorPolys;

        //console.log('create color entries poly');
        $.each(currentStatistics, function (i, stat) {
            //console.log(stat);
            if (i == 0) {
                currentColorPolys = '<ul class="multicolorlist"><li class="multicolor" style="float: left; width: auto; margin-right: 6px">' + stat.SearchKey + '</li><li class="multicolor"' +
                    ' style="float: right; min-width: 60px; border: ' + mysearchborderwidth + 'px solid ' + mysearchbordercolor + '; background-color: ' + stat.FillColor + ';">&nbsp;</li></ul>';
            } else {
                currentColorPolys += '<ul class="multicolorlist"><li class="multicolor" style="float: left; width: auto; margin-right: 6px">' + stat.SearchKey + '</li><li class="multicolor"' +
                    ' style="float: right; min-width: 60px; border: ' + mysearchborderwidth + 'px solid ' + mysearchbordercolor + '; background-color: ' + stat.FillColor + ';">&nbsp;</li></ul>';
            }
        })

        var multibutton = '<a onclick="minmaxLegend(this);"' +
            ' style="cursor: pointer; font-size: 1.3em; margin-top: -1px;" class="float-right"><i class="far fa-minus-square" title="collapse"></i></a>' +
            '<a class="multicolorbtn float-right" ' +
            'onclick="currentLegend = (this.getAttribute(\'data-legend\')); ' +
            'CSVresult = JSON.parse(this.getAttribute(\'data-CSVresult\')); ' +
            'finalSearchResultIds = JSON.parse(this.getAttribute(\'data-idlist\')); ' +
            'ChartStyle = JSON.parse(this.getAttribute(\'data-style\')); ' +
            'currentStatistics = JSON.parse(this.getAttribute(\'data-search\')); ' +
            'layertypes = JSON.parse(this.getAttribute(\'data-layertypes\')); ' +
            'jsonresult.properties.statistics = currentStatistics; ' +
            'jsonresultPoints.properties.statistics = currentStatistics; ' +
            'currentLayerId = this.getAttribute(\'data-layerId\'); ' +
            'openStyleDialog(\'info\')" ' +
            'data-CSVresult=\'' + JSON.stringify(csvData) + '\' ' +
            'data-legend=\'' + currentLegend + '\' ' +
            'data-search=\'' + JSON.stringify(jsonresult.properties.statistics) + '\' ' +
            'data-layertypes=\'' + JSON.stringify(jsonresult.properties.layertypes) + '\' ' +
            'data-idlist="' + JSON.stringify(finalSearchResultIds) + '" ' +
            'data-layerId="' + layer_id + '" ' +
            'data-style=\'' + JSON.stringify(ChartStyle) + '\' ' +
            '>' +
            '<i class="fas fa-palette" title="click to open layer options"></i></a>' +
            '<div class="mt-2"></div>'
        currentColorPolys = multibutton + '<div class="overflowlegend">' + currentColorPolys + '</div>'

        createLegend(map, (eval(layer_id)), currentColorPolys);
        orderlayer(myselector);
    }

    infoalert = '<div onclick="$(\'#infoalert\').empty()" class="alert alert-info fade show" role="alert"><i style="float: right; font-size: 2em; margin: 0.5em; color: #00acff;" class="fas fa-check"></i><span style="font-size: 0.9em;">\n' +
        'One layer has been added to the map. <br> Click the legend entry for further options or add other search criteria. </span>\n' +
        '</div>';
    if (first && type !== 'table') {
        $('#infoalert').html(infoalert);
        var thisAlert = document.getElementById('infoalert');
        thisAlert.scrollIntoView(false);
    }


}

function CSVtable(csvData) {
    //console.log('CSVtable');
    var level = csvData[0].ObjectClass;
    var search = csvData[0].Search;
    if (search === 'timespan') search = (JSON.stringify(csvData[0].searchResult)).slice(12, -1);
    if (typeof (tableIter) !== 'undefined') {
        if (tableIter >= Globaliter) delete tableIter
    }


    table = $('#CSVmodalContent').DataTable({
        destroy: true,
        data: csvData,
        "pagingType": "numbers",
        "scrollX": true,
        "autoWidth": true,
        drawCallback: function () {
            $('a[rel=popover]').popover({
                html: true,
                trigger: 'hover',
                placement: 'right',
                container: '.modal-body',
                content: function () {
                    return '<img class="popover-img" src="' + $(this).data('img') + '" alt=""/>';
                }
            });
        },
        columns: [
            {
                data: "ObjectName",
                "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                    if (oData.image === null) $(nTd).html("<a href='/entity/" + oData.ObjectId + "' target='_blank' title='open in new tab'>" + oData.ObjectName + "</a>");
                    if (oData.image !== null) $(nTd).html("<a href='/entity/" + oData.ObjectId + "' target='_blank' title='open in new tab'>" + oData.ObjectName + "</a>" +
                        "<a class='btn-xs float-right' rel='popover' data-img='" + oData.image + "'><i class='fas fa-image'></i></a>"); //create links in rows
                }
            },
            {data: 'ObjectType'},
            {data: 'searchResult'},
            {data: 'value'},
            {data: 'unit'},
            {data: 'earliestBegin'},
            {data: 'latestEnd'},
            {data: 'grave'}
        ],
    });

    if ((search.includes('dimension') || search.includes('material') || search.includes('value')) === false) {
        table.columns([3, 4]).visible(false);
    }

    if (typeof (tableIter) === 'undefined') {
        oldQuery = search;
    }
    if (typeof (tableIter) !== 'undefined' && tableIter < Globaliter) {
        oldQuery += '" and "' + search;
    }
    $('#CSVmodalLabel').html('Search for: "' + level + '" where "' + oldQuery + '"');
    tableIter = Globaliter;
    currentInfoHeadline = $('#CSVmodalLabel').html();
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
    CSVresult = [];

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

        });
    }


    if (level == 'strat') {
        $.each(myjson.features, function (i, feature) {
            $.each(feature.burials, function (b, burial) {
                levelQuery(feature, burial, id, prop, val1, val2);
                if (searchResultIds.includes(burial.id)) {
                    searchResultIds.push(feature.id);
                    $.each(burial.finds, function (f, find) {
                        searchResultIds.push(parseInt(find.id));
                    });
                }

            });
        });
    }


    if (level == 'find') {
        $.each(myjson.features, function (i, feature) {
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

function prepareCSV(result, path, value, unit, feature, level, entity) {
    var tmpValue = {};
    tmpValue.site = myjson.name.replace(/"/g, '\'');
    tmpValue.siteID = myjson.site_id;
    tmpValue.ObjectId = entity.id;
    tmpValue.ObjectName = entity.properties.name.replace(/"/g, '\'');
    tmpValue.ObjectType = entity.properties.maintype.name.replace(/"/g, '\'');
    tmpValue.ObjectClass = entity.properties.maintype.systemtype;
    tmpValue.Search = level;
    tmpValue.searchResult = result.replace(/"/g, '\'');
    tmpValue.path = path.replace(/"/g, '\'');
    tmpValue.value = value;
    tmpValue.unit = unit.replace(/"/g, '\'');
    tmpValue.earliestBegin = null;
    tmpValue.latestBegin = null;
    tmpValue.earliestEnd = null;
    tmpValue.latestEnd = null;
    tmpValue.grave = feature.properties.name.replace(/"/g, '\'');
    tmpValue.gravetype = feature.properties.maintype.name.replace(/"/g, '\'');
    tmpValue.graveID = feature.id;
    tmpValue.WGS84_Geometry = null;
    tmpValue.easting = null;
    tmpValue.northing = null;
    tmpValue.image = null;

    if (typeof (feature.geometry) != 'undefined') {
        var wkt = new Wkt.Wkt();
        var currentGeom = feature.geometry;
        wkt.fromObject(currentGeom);
        var wktGeom = (wkt.write());

        if (feature.geometry.type === "Polygon") {
            var arr = JSON.parse(JSON.stringify(feature.geometry.coordinates).slice(1, -1));
            mycenter = getCenter(arr);
            tmpValue.easting = mycenter[0];
            tmpValue.northing = mycenter[1];
        }
        if (feature.geometry.type === "Point") {
            tmpValue.easting = feature.geometry.coordinates[0];
            tmpValue.northing = feature.geometry.coordinates[1];
        }
        tmpValue.WGS84_Geometry = wktGeom.replace(/"/g, '\'');
    }
    if (typeof (entity.properties.timespan) != 'undefined') {
        if (typeof (entity.properties.timespan.begin_from) != 'undefined') tmpValue.earliestBegin = entity.properties.timespan.begin_from;
        if (typeof (entity.properties.timespan.begin_to) != 'undefined') tmpValue.latestBegin = entity.properties.timespan.begin_to;
        if (typeof (entity.properties.timespan.end_from) != 'undefined') tmpValue.earliestEnd = entity.properties.timespan.end_from;
        if (typeof (entity.properties.timespan.end_to) != 'undefined') tmpValue.latestEnd = entity.properties.timespan.end_to;
    }

    if (typeof (entity.files) != 'undefined') tmpValue.image = entity.files[0].file_name;

    CSVresult.push(tmpValue);
}


//query entitites based on level
function levelQuery(feature, entity, id, prop, val1, val2) {

// if search is for maintype push result to layer
    if (prop == 'maintype' && id.includes(entity.properties.maintype.id)) {
        searchResult.push(feature.id);
        if (finalSearchResultIds.includes(entity.id)) {
            searchResultIds.push(entity.id);
            prepareCSV(entity.properties.maintype.name, entity.properties.maintype.path, "", "", feature, "maintype is: " + GlobalSelectedNodeName, entity);
        }
    }


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
            if (finalSearchResultIds.includes(entity.id)) {
                searchResultIds.push(entity.id);
                prepareCSV('Search for timespan between: ' + val1 + ' and ' + val2, "", "", "", feature, "timespan", entity);
            }
        }

        //if only begin is available get all entities that start with or after begin
        if (typeof (begin) !== 'undefined' && end == '' && begin >= val1) {
            searchResult.push(feature.id);
            if (finalSearchResultIds.includes(entity.id)) {
                searchResultIds.push(entity.id);
                prepareCSV('Search for timespan begins after: ' + (val1), "", "", "", feature, "timespan", entity);
            }
        }

        //if only end is available get all entities that end with or before begin
        if (typeof (end) !== 'undefined' && begin == '' && end <= val2) {
            searchResult.push(feature.id);
            if (finalSearchResultIds.includes(entity.id)) {
                searchResultIds.push(entity.id);
                prepareCSV('Search for timespan ends before: ' + (val2), "", "", "", feature, "timespan", entity);
            }
        }
    }

    // get results of matching types
    if (prop == 'type' && (typeof (entity.properties.types)) !== 'undefined') {
        $.each(entity.properties.types, function (t, type) {
            if (id.includes(type.id)) {
                searchResult.push(feature.id);
                if (finalSearchResultIds.includes(entity.id)) {
                    searchResultIds.push(entity.id);
                    prepareCSV(type.name, type.path, "", "", feature, "property is: " + GlobalSelectedNodeName, entity);
                }
            }
        });
    }

    //get results of matching dimensions with values and operators
    if (prop == 'dimension' && (typeof (entity.properties.dimensions)) !== 'undefined') {
        $.each(entity.properties.dimensions, function (d, dim) {
            if (typeof (dim.value) !== 'undefined' && id.includes(dim.id) && dim.value >= val1 && dim.value <= val2) {
                searchResult.push(feature.id);
                if (finalSearchResultIds.includes(entity.id)) {
                    searchResultIds.push(entity.id);
                    prepareCSV(dim.name, dim.path, dim.value, dim.unit, feature, "dimension is: " + dimText + " between " + val1 + " and " + val2, entity);
                }
            }
        });
    }

    //get results of matching material with values and operators
    if (prop == 'material' && (typeof (entity.properties.material)) !== 'undefined') {
        $.each(entity.properties.material, function (m, mat) {
            tempMatValue = mat.value;
            if (mat.value == '0' || mat.value == '' || mat.value == 0)
                tempMatValue = 100;
            if (id.includes(mat.id) && tempMatValue >= val1 && tempMatValue <= val2) {
                searchResult.push(feature.id);
                if (finalSearchResultIds.includes(entity.id)) {
                    searchResultIds.push(entity.id);
                    if (val1 < 0) {
                        var tmpVal1 = 0
                    } else {
                        tmpVal1 = val1
                    }
                    if (val2 > 100) {
                        var tmpVal2 = 100
                    } else {
                        tmpVal2 = val2
                    }
                    prepareCSV(mat.name, mat.path, tempMatValue, "weight percentage", feature, "material is: " + GlobalSelectedNodeName + " between " + tmpVal1 + "% and " + tmpVal2 + "%", entity);
                }
            }
        });
    }
    if (prop == 'value' && (typeof (entity.properties.types)) !== 'undefined') {
        $.each(entity.properties.types, function (m, mat) {
            tempMatValue = mat.value;
            if (id.includes(mat.id) && tempMatValue >= val1 && tempMatValue <= val2) {
                searchResult.push(feature.id);
                if (finalSearchResultIds.includes(entity.id)) {
                    searchResultIds.push(entity.id);
                    prepareCSV(mat.name, mat.path, tempMatValue, mat.description, feature, "value is: " + GlobalSelectedNodeName + " between " + val1 + " and " + val2 + " (" + mat.description + ")", entity);
                }
            }
        });
    }

}


function toggleSearchOpt() {
    $('.mysearchoptions').toggle();
}
