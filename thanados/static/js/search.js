$(document).ready(function () {
    //$(".sortable").sortable();
    //$(".sortable").disableSelection();
    maximumHeight = ($(window).height() - $('#mynavbar').height())
    $('#mycontent').css('max-height', (maximumHeight - 15) + 'px');
    local = false;
    mymodalwith = ($(window).width());
    if (mymodalwith > 500) mymodalwith = 500;
    addSearch();
});

$(window).resize(function () {
    //$(".sortable").sortable();
    //$(".sortable").disableSelection();
    maximumHeight = ($(window).height() - $('#mynavbar').height())
    $('#mycontent').css('max-height', (maximumHeight - 15) + 'px');
    local = false;
    mymodalwith = ($(window).width());
    if (mymodalwith > 500) mymodalwith = 500;
});

$('#AddSearch').click(function () {
    Iter += 1;
    $('#AddSearch').addClass('d-none');
    addSearch()
});


$(window).resize(function () {
    maximumHeight = ($(window).height() - $('#mynavbar').height());
    $('#mycontent').css('max-height', (maximumHeight - 15) + 'px');
});

Iter = 1;

function addSearch() {
    $("#mySearchCards").append(
        '<div id="Query' + Iter + '" class="card mb-3" style="width: 100%;">\n' +
        '<div class="card-header" id="heading' + Iter + '">\n' +
        '                <h5 class="mb-0">\n' +
        '                    <button id="Heading' + Iter + '" class="btn btn-link" type="button" data-toggle="collapse"\n' +
        '                            data-target="#collapseQuery' + Iter + '" aria-expanded="true"\n' +
        '                            aria-controls="collapseQuery' + Iter + '">\n' +
        '                        Search' +
        '                    </button>\n' +
        '                </h5>\n' +
        '            </div>\n' +
        '<div id="collapseQuery' + Iter + '" class="collapse show" aria-labelledby="heading' + Iter + '">\n' +
        '    <div class="card-body  mb-4">\n' +
        '        <div id="Form' + Iter + '"></div>\n' +
        '        <div class="input-group mb-3 d-none">\n' +
        '                            <textarea readonly id="SQL' + Iter + '" class="form-control" aria-label="Selected sites" placeholder="Query statement"></textarea>\n' +
        '        </div>\n' +
        '    <div class="float-right">\n' +
        '        <button id="SearchBtn' + Iter + '" class="btn btn-link mySearchbutton d-none" type="button" value="' + Iter + '" class="card-link" onclick="returnQuerystring()">Search</button>\n' +
        '        <button id="ResetBtn' + Iter + '" class="btn btn-link myResetbutton d-none" type="button" value="' + Iter + '" class="card-link">Cancel</button>\n' +
        '        <button id="RemoveBtn' + Iter + '" class="btn btn-link myRemovebutton d-none" type="button" value="' + Iter + '" class="card-link">Cancel</button>\n' +
        '    </div>\n' +
        '    </div>' +
        '    <div class="card-header" style="border-top: 1px solid rgba(0, 0, 0, 0.125); display: none" id="headingb' + Iter + '">' +
        '        <h5 class="mb-0">\n' +
        '            <button id="Resultlist' + Iter + '" class="btn btn-link" type="button" data-toggle="collapse"\n' +
        '                            data-target="#collapseList' + Iter + '" aria-expanded="true"\n' +
        '                            aria-controls="collapseList' + Iter + '">\n' +
        '                        Results' +
        '            </button>\n' +
        '        </h5>\n' +
        '    </div>' +
        '    <div id="collapseList' + Iter + '" style="display: none" class="collapse show" aria-labelledby="headingb' + Iter + '">\n' +
        '        <div class="card-body row">' +
        '          <div class="col-lg">' +
        '            <table id="myResultlist' + Iter + '" class="display table table-striped table-bordered" width="100%">' +
        '                    <thead>\n' +
        '                    <tr>\n' +
        '                        <th>Name</th>\n' +
        '                        <th>Type</th>\n' +
        '                        <th id="Min_' + Iter + '">Begin</th>\n' +
        '                        <th>End</th>\n' +
        '                        <th>Context</th>\n' +
        '                    </tr>\n' +
        '                    </thead>' +
        '            </table>' +
        '          </div>' +
        '        <div class="col-lg">' +
        '            <div class="m-1 map" id="map' + Iter + '" style="height: 100%; min-height: 500px; min-width: 300px"></div>' +
        '        </div>' +
        '      </div>' +
        '    </div>' +
        '<div style="display: none">' +
        '<div id="variables" class="row">' +
        '<input class="col" type=text id="level' + Iter + '">' +
        '<input class="col"type=text id="criteria' + Iter + '">' +
        '<input class="col" type=text id="type' + Iter + '">' +
        '<input class="col" type=text id="min' + Iter + '">' +
        '<input class="col" type=text id="max' + Iter + '">' +
        '</div>' +
        '<div class="row">' +
        '<div class="col-lg">' +
        '<textarea id="ajaxresult' + Iter + '" style="width: 100%"></textarea>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>\n' +
        '</div>\n' +
        '</div>');
    $(".myResetbutton").click(function f() {
        $("#Query" + this.value).remove();
        $("#AddSearch").removeClass('d-none');
    });

    $(".myRemovebutton").click(function f() {
        $("#Query" + this.value).remove();
    });

    $(".mySearchbutton").click(function f() {
        $("#Heading" + Iter).html($('#SQL' + Iter).val());
    });
    appendSearch();
};

function appendSearch() {//append search form to dialog
    $('#Form' + Iter).append(
        //selection for search level: grave, burial or find
        '<div id="LevelSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">\n' +
        '<div class="input-group-prepend">\n' +
        '<label class="input-group-text" for="LevelSelect_' + Iter + '">1. </label>\n' +
        '</div>\n' +
        '<select class="custom-select empty" id="LevelSelect_' + Iter + '">\n' +
        '<option selected disabled>Select search level...</option>\n' +
        '<option value="burial_site">Cemeteries</option>\n' +
        '<option value="feature">Graves</option>\n' +
        '<option value="strat">Burials</option>\n' +
        '<option value="find">Finds</option>\n' +
        '</select>\n' +
        '</div>');
    //after main level is selected:
    $('#LevelSelect_' + Iter).on('change', function () {
        $('#ResetBtn' + Iter).removeClass('d-none');
        appendLevel = $('#LevelSelect_' + Iter + ' option:selected').val(); //set level as variable
        Querystring = 'Search for "' + $('#LevelSelect_' + Iter + ' option:selected').text() + '"';
        $('#SQL' + Iter).val(Querystring);
        $("#Heading" + Iter).html($('#SQL' + Iter).val());
        $('#level' + Iter).val($('#LevelSelect_' + Iter + ' option:selected').val());
        $('#LevelSelect_' + Iter).prop('disabled', true); //disble former selection field
        $('#Form' + Iter).append(
            //selection for property to choose: maintype, types, dimensions, material or timespan
            '<div id="PropSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">\n' +
            '<select class="custom-select empty" id="PropSelect_' + Iter + '">\n' +
            '<option selected disabled>Select search criteria...</option>\n' +
            '<option value="maintype">Maintype</option>\n' +
            '<option value="type">Properties</option>\n' +
            '<option value="timespan">Timespan</option>\n' +
            '<option value="dimension">Dimensions</option>\n' +
            '<option value="material">Material</option>\n' +
            '<option value="value">Value property</option>\n' +
            '</select>\n' +
            '</div>'
        );
        appendCriteria(Iter, appendLevel);
    });
}

function appendCriteria(Iter, appendLevel) { //select search criteria after level is chosen
    $('#PropSelect_' + Iter).on('change', function () {
        criteria = $('#PropSelect_' + Iter + ' option:selected').val().toLowerCase(); //set criteria variable
        $('#PropSelect_' + Iter).prop('disabled', true); //disable input
        $('#SQL' + Iter).val(Querystring + ' where "' + $('#PropSelect_' + Iter + ' option:selected').text() + '"');
        $("#Heading" + Iter).html($('#SQL' + Iter).val());
        $('#criteria' + Iter).val(criteria);
        appendCriteriaSearch(Iter, criteria, appendLevel); //append further search options
    });
}

function appendCriteriaSearch(Iter, criteria, appendLevel) { //append respective forms depending on search criteria e.g. with values for timespan etc.
    $('#PropSelect_' + Iter + '_parent').remove(); //remove former input
    if (criteria == 'maintype' || criteria == 'type') { //if maintype or type append form with tree select
        $('#Form' + Iter).append(
            '<div id="MaintypeSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">\n' +
            '<div class="input-group-prepend">\n' +
            '<label class="input-group-text" for="MaintypeSelect_' + Iter + '">Type </label>\n' +
            '</div>\n' +
            '<input id="MaintypeSelect_' + Iter + '" class="form-control" onclick="this.blur()" type="text" placeholder="Select type.." readonly>\n' +
            '<input id="MaintypeSelect_' + Iter + '_Result" class="form-control" onclick="this.blur()" type="text" readonly disabled>\n' +
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

        $('#Form' + Iter).append(
            '<div id="TimespanSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">\n' +
            '<div class="input-group-prepend">\n' +
            '<span class="input-group-text dim-label">Timespan min: </span>\n' +
            '</div>\n' +
            '<input id="valMin_' + Iter + '" class="form-control value-input" type="text">\n' +
            '<span class="input-group-text input-group-middle">max: </span>\n' +
            '<input id="valMax_' + Iter + '" class="form-control value-input" type="text">\n' +
            '<div class="input-group-append">\n' +
            '<button class="btn btn-secondary btn-sm" type="button" id="timespanbutton_' + Iter + '" onclick="searchTime(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for timespan">\n' +
            'Validate\n' +
            '</button>\n' +
            '</div>\n' +
            '</div>'
        );
        /*timestring = $('#SQL' + Iter).val();
        var $MinTime = $('#valMin_' + Iter);
        var $MaxTime = $('#valMax_' + Iter);
        $MinTime.add($MaxTime).on('input', function () {
            var val1 = $('#valMin_' + Iter).val();
            var val2 = $('#valMax_' + Iter).val();
            var SQLString = ('is between ' + val1 + ' and ' + val2);
            $('#SQL' + Iter).val(timestring + SQLString);
            console.log(SQLString);
        });*/
    }
    ;

    if (criteria == 'dimension') {//if dimension append form with select
        UnsetGlobalVars();
        Globalcriteria = criteria;
        GlobalappendLevel = appendLevel;
        Globaliter = Iter;
        $('#Form' + Iter).append(
            '<div id="DimensionSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">\n' +
            '<select class="custom-select  dim-label empty" id="DimensionSelect_' + Iter + '">\n' +
            '<option selected disabled>Select dimension...</option>\n' +
            '<option value="15679">Height/Depth (cm)</option>\n' +
            '<option value="26189">Length (cm)</option>\n' +
            '<option value="26188">Width (cm)</option>\n' +
            '<option value="26191">Diameter (cm)</option>\n' +
            '<option value="26190">Thickness (cm)</option>\n' +
            '<option value="26192">Orientation (°)</option>\n' +
            '<option value="118730">Azimuth (°)</option>\n' +
            '<option value="15680">Weight (g)</option>\n' +
            '</select>\n' +
            '</div>'
        );
        $('#DimensionSelect_' + Iter).on('change', function () {
            $('#DimensionSelect_' + Iter).prop('disabled', true); //disable input
            $('#DimensionSelect_' + Iter + '_parent').append(//append input of values
                '<span class="input-group-text input-group-middle">min: </span>\n' +
                '<input id="valMin_' + Iter + '" class="form-control value-input" type="text">\n' +
                '<span class="input-group-text input-group-middle">max: </span>\n' +
                '<input id="valMax_' + Iter + '" class="form-control value-input" type="text">\n' +
                '<div class="input-group-append">\n' +
                '<button class="btn btn-secondary btn-sm" type="button" id="dimMatButton_' + Iter + '" onclick="searchDimMat(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for dimension">\n' +
                'Validate\n' +
                '</button>\n' +
                '</div>'
            );
            $('#SQL' + Iter).val($('#SQL' + Iter).val() + ' is "' + $('#DimensionSelect_' + Iter + ' option:selected').text() + '"');
            $("#Heading" + Iter).html($('#SQL' + Iter).val());
        });
    }
    ;

    if (criteria == 'material' || criteria == 'value') { //if material append form with tree select
        $('#Form' + Iter).append(
            '<div id="MaterialSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">\n' +
            '<div class="input-group-prepend">\n' +
            '<span id="MaterialSelect_' + Iter + '" class="input-group-text"></span>\n' +
            '</div>\n' +
            '</div>'
        );
        targetField = 'MaterialSelect_' + Iter;
        iniateTree(Iter, appendLevel, criteria, targetField);
    }
    ;
}

function appendMaterial(Iter) { //append value input after material is chosen
    $('#MaterialSelect_' + Iter + '_parent').append(
        '<span class="input-group-text input-group-middle">min: </span>\n' +
        '<input id="valMin_' + Iter + '" class="form-control value-input" type="text">\n' +
        '<div class="input-group-append">\n' +
        '<span class="input-group-text input-group-middle">max: </span>\n' +
        '</div>\n' +
        '<input id="valMax_' + Iter + '" class="form-control value-input" type="text">\n' +
        '<div class="input-group-append">\n' +
        '<button class="btn btn-secondary btn-sm" type="button" id="dimMatButton_' + Iter + '" onclick="searchDimMat(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for dimension">\n' +
        'Validate\n' +
        '</button>\n' +
        '</div>'
    );
}

//search functions depending on criteria
function searchDimMat(criteria, appendLevel, iter, val1, val2) {
    val1 = $('#valMin_' + iter).val();
    val2 = $('#valMax_' + iter).val();
    goOn = validateNumbers(val1, val2, criteria);
    if (goOn) {
        if (val1 == '') {
            val1 = 0;
        }
        ;
        if (criteria == 'material' && val2 == '') {
            val2 = 100;
        }
        ;
        if (criteria == 'dimension' && val2 != '') {
            var SQLString = (' minumum ' + val1 + ' and maximum ' + val2)
        }
        ;

        if (criteria == 'dimension' && val2 == '') {
            val2 = 9999999999999999999999999999999999999999999999999999999999999999999999999999999999999;
            var SQLString = (' minumum ' + val1)
        }
        ;

        $('#dimMatButton_' + iter).prop('disabled', true);
        $('#valMin_' + iter).prop('disabled', true);
        $('#min' + iter).val(val1);
        $('#valMax_' + iter).prop('disabled', true);
        $('#max' + iter).val(val2);
        dimId = $('#DimensionSelect_' + iter + ' option:selected').val(); //set criteria variable
        if (criteria == 'material') {
            var SQLString = (' between ' + val1 + '% and ' + val2 + '%')
            dimId = nodeIds;
        }
        ;
        if (criteria == 'value') {
            var SQLString = (' between ' + val1 + ' and ' + val2)
            dimId = nodeIds;
        }
        ;
        if (criteria == 'dimension') dimId = $('#DimensionSelect_' + iter + ' option:selected').val().toLowerCase();
        $('#type' + iter).val(dimId);
        $('#SQL' + iter).val($('#SQL' + iter).val() + SQLString);
        $("#Heading" + Iter).html($('#SQL' + Iter).val());

    }
    ;
}

function searchTime(criteria, appendLevel, iter, val1, val2) {
    val1 = $('#valMin_' + iter).val();
    val2 = $('#valMax_' + iter).val();
    nodeIds = [];
    goOn = validateNumbers(val1, val2, criteria);
    if (goOn) {
        $('#timespanbutton_' + iter).prop('disabled', true);
        $('#valMin_' + iter).prop('disabled', true);
        $('#valMax_' + iter).prop('disabled', true);
        $('#min' + iter).val(val1);
        $('#max' + iter).val(val2);
        var SQLString = (' is between ' + val1 + ' and ' + val2)
        $('#SQL' + iter).val($('#SQL' + iter).val() + SQLString);
        $("#Heading" + Iter).html($('#SQL' + Iter).val());
    }
    ;
}

function returnQuerystring() {
    $('#SearchBtn' + Iter).addClass('disabled');
    $('#ResetBtn' + Iter).addClass('d-none');
    $('#RemoveBtn' + Iter).removeClass('d-none');
    $('#AddSearch').removeClass('d-none');
    var mylevel = $('#level' + Iter).val();
    mycriteria = $('#criteria' + Iter).val();
    var mymin = $('#min' + Iter).val();
    var mymax = $('#max' + Iter).val();
    var mytypes = $('#type' + Iter).val();
    var system_type = mylevel;
    if (mylevel == 'burial_site') var system_type = 'place';
    if (mylevel == 'strat') var system_type = 'stratigraphic unit';
    $('#headingb' + Iter).toggle();
    $('#Resultlist' + Iter).html('<span class="spinner-border spinner-border-sm mr-3" role="status" aria-hidden="true"></span>...Search in progress');
    $.ajax({
        type: 'POST',
        url: '/ajax/test',
        data: {
            'system_type': system_type,
            'types': mytypes,
            'criteria': mycriteria,
            'min': mymin,
            'max': mymax
        },
        success: function (result) {
            //$('#ajaxresult' + Iter).html(JSON.stringify(result));
            if (result == null) {
                $('#Resultlist' + Iter).html('No results for this search');
                return
            } else {
                $('#Resultlist' + Iter).html('Results (' + result.length + ')')
                eval('result_' + Iter + '= result;');
                setdatatable(result, mycriteria);
                $('#collapseList' + Iter).toggle();
                eval('map' + Iter).invalidateSize()
                eval('map' + Iter + '.fitBounds(markers' + Iter + '.getBounds());')
                eval('table' + Iter).draw();

            }
            ;
        }
    });

}

function setdatatable(data) {
    var mymarkers = new L.featureGroup([]);
    var heatmarkers = [];
    var table = $('#myResultlist' + Iter).DataTable({
        data: data,
        "pagingType": "numbers",
        "scrollX": true,
        columns: [
            {
                data: "name",
                "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                    $(nTd).html("<a href='/entity/" + oData.id + "' title='" + oData.maintype + " 'target='_blank'>" + oData.name + "</a>"); //create links in rows
                }
            },
            {
                data: 'type',
                "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                    $(nTd).html("<div title='" + oData.path + "'>" + oData.type + "</div> ");
                    if (mycriteria == 'type' || mycriteria == 'maintype') var myPopupLine = '<a href="/entity/' + oData.id + '" title="' + oData.maintype + '" target="_blank"><b>' + oData.context + '</b></a><br><br><i title="' + oData.path + '">' + oData.type + '</i>'
                    if (mycriteria == 'timespan') var myPopupLine = '<a href="/entity/' + oData.id + '" title="' + oData.maintype + '" target="_blank"><b>' + oData.context + '</b></a><br><br><i>Timespan: ' + oData.min + ' to ' + oData.max + '</i>'
                    if (mycriteria == 'dimension') var myPopupLine = '<a href="/entity/' + oData.id + '" title="' + oData.maintype + '" target="_blank"><b>' + oData.context + '</b></a><br><br><i title="' + oData.path + '">' + oData.type + ': ' + oData.min + '</i>'
                    if (mycriteria == 'material') {
                        var matString = oData.type;
                        if (oData.min > 0) var matString = oData.type + ': ' + oData.min + '%';
                        var myPopupLine = '<a href="/entity/' + oData.id + '" title="' + oData.maintype + '" target="_blank"><b>' + oData.context + '</b></a><br><br><i title="' + oData.path + '">' + matString + '</i>'
                    }
                    if (mycriteria == 'value') var myPopupLine = '<a href="/entity/' + oData.id + '" title="' + oData.maintype + '" target="_blank"><b>' + oData.context + '</b></a><br><br><i title="' + oData.path + '">' + oData.type + ': ' + oData.min + '</i>'

                    //create markers
                    var marker = L.marker([((oData.lon)), ((oData.lat))], {title: (oData.context)}).addTo(mymarkers).bindPopup(myPopupLine);
                    ;
                    heatmarkers.push([JSON.parse(oData.lon) + ',' + JSON.parse(oData.lat)]);
                }
            },
            {data: 'min'},
            {data: 'max'},
            {data: 'context'}
        ],
    });
    eval('table' + Iter + '= table');
    if (mycriteria == 'type' || criteria == 'maintype') table.columns([2, 3]).visible(false);
    if (mycriteria == 'material' || mycriteria == 'dimension') {
        table.columns([3]).visible(false);
        $('#Min_' + Iter).html('Value');
    }
    $('#collapseList' + Iter).on('shown.bs.collapse', function () {
        //table.draw();
    });
    //table.draw();
    setmymap(mymarkers, heatmarkers);
}

function setmymap(markers, heatmarkers) {
//define basemaps

    var landscape = L.tileLayer('https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=b3c55fb5010a4038975fd0a0f4976e64', {
        attribution: 'Tiles: &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18
    });
    var satellite = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: 'Tiles: &copy; Google Maps ',
        maxZoom: 18
    });

    //initiate markers
    var clustermarkers = L.markerClusterGroup({
        singleMarkerMode: true,
        maxClusterRadius: 0,

    });


    markers.addTo(clustermarkers);
    eval('markers' + Iter + '= markers;')


    eval('map' + Iter + ' = L.map(\'map\' + Iter, {fullscreenControl: true, zoomControl: false, layers: [satellite, landscape]}).fitBounds(markers.getBounds());')


    clustermarkers.addTo((eval('map' + Iter)));


    var baseLayers = {
        "Landscape": landscape,
        "Satellite": satellite,
    };


    (eval('map' + Iter)).fitBounds(markers.getBounds());

    //initiate markers
    var heatmarkersNew = JSON.parse(JSON.stringify(heatmarkers).replace(/"/g, ''));
    heat = L.heatLayer(heatmarkersNew, {radius: 25, minOpacity: 0.5, blur: 30});

    var overlays = {
        "Sites": clustermarkers,
        "Density": heat
    };

    //add layer control
    baseControl = L.control.layers(baseLayers, overlays).addTo((eval('map' + Iter)));

//hack for right order of basemaps
    (eval('map' + Iter)).removeLayer(satellite);

    L.control.scale({imperial: false}).addTo((eval('map' + Iter)));//scale on map
    (eval('map' + Iter)).invalidateSize();

    L.easyButton({
        id: '' + Iter + '',  // an id for the generated button
        position: 'topleft',      // inherited from L.Control -- the corner it goes in
        type: 'replace',          // set to animate when you're comfy with css
        leafletClasses: true,     // use leaflet classes to style the button?
        states: [{                 // specify different icons and responses for your button
            stateName: 'get-center',
            onClick: function (button, map) {
                currentID = button.options.id;
                openStyleDialog();
            },
            title: 'style result',
            icon: 'fa-crosshairs'
        }]
    }).addTo(eval('map' + Iter));


}

function createResult(data, iter) { //finish query and show results on map

    var jsonresult = {
        "type": "FeatureCollection", //prepare geojson
        "features": [],
        "query": $('#Heading' + iter).html(),
    };
    var uniqueSiteIds = [];
    $.each(data, function (i, dataset) {
        uniqueSiteIds.push(dataset.site_id);
    });

    var distinctResultIds = Array.from(new Set(uniqueSiteIds));
    $.each(distinctResultIds, function (i, dataset) {
        jsonresult.features.push({id: dataset});
    });

    $.each(sitelist, function (i, dataset) {
        $.each(jsonresult.features, function (i, feature) {
            if (feature.id == dataset.id) {
                feature.properties = {
                    name: dataset.name,
                    description: dataset.description,
                    type: dataset.type,
                    path: dataset.path,
                    begin: dataset.begin,
                    end: dataset.end
                }
                feature.geometry = {
                    "type": "Point",
                    "coordinates": [dataset.lat, dataset.lon]
                }
                feature.type = "Feature"
                feature.search = []
            }
        })
    });

    $.each(jsonresult.features, function (i, feature) {
        $.each(data, function (i, dataset) {
            if (feature.id == dataset.site_id) {
                feature.search.push(dataset)
            }
        })
        feature.results = feature.search.length
    })

    eval('myGeoJSON' + Iter + '  = JSON.parse(JSON.stringify(jsonresult))');
    resultrange = [];
    eval('customResult' + Iter + ' = L.geoJSON(jsonresult, {' +
        'pointToLayer: function (feature, latlng) {' +
        'return L.circleMarker(latlng, myStyle)' +
        '},' +
        'onEachFeature: function (feature, layer) {' +
        'var myPopup = \'<a href="/entity/\' + feature.id + \'" title="\' + feature.properties.path + \'" target="_blank"><b>\' + feature.properties.name + \'</b></a><br><br><i>Search results here: \' + feature.results + \'</i>\';' +
        'layer.bindPopup(myPopup);' +
        '}' +
        '}).addTo(map' + Iter + ');')

}

function applyButton() {
    applyStyle(fillcolor, (1 - MyStyleOpacityVar / 100), mystylebordercolor, mystyleborderwidth);
    eval('if (typeof(customResult' + currentID + ') != "undefined") map' + currentID + '.removeLayer(customResult' + currentID +');')
    eval('createResult(result_' + currentID +', ' + currentID +')');
    $('#styledialog').dialog('close');

}


myStyle = {
    "color": "rgba(0,123,217,0.75)",
    "weight": 1.5,
    "fillOpacity": 0.5,
    "radius": 10
    //"opacity": 0.4
};

myStyleSquare = {};
