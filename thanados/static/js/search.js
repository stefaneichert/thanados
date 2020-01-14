$(document).ready(function () {
    $(".sortable").sortable();
    $(".sortable").disableSelection();
    maximumHeight = ($(window).height() - $('#mynavbar').height())
    $('#mycontent').css('max-height', (maximumHeight - 15) + 'px');
    local = false;
    addSearch();
});

$('#AddSearch').click(function () {
    Iter += 1;
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
        '    <div class="card-body">\n' +
        '        <div id="Form' + Iter + '"></div>\n' +
        '        <div class="input-group mb-3 d-none">\n' +
        '                            <textarea readonly id="SQL' + Iter + '" class="form-control" aria-label="Selected sites" placeholder="Query statement"></textarea>\n' +
        '        </div>\n' +
        '    <div class="float-right mb-3">\n' +
        '        <button class="btn btn-link mySearchbutton" type="button" value="' + Iter + '" class="card-link" onclick="returnQuerystring()">search</button>\n' +
        '        <button class="btn btn-link myResetbutton" type="button" value="' + Iter + '" class="card-link">reset</button>\n' +
        '    </div>\n' +
        '    </div>' +
        '    <div class="card-header mt-4" style="border-top: 1px solid rgba(0, 0, 0, 0.125); display: none" id="headingb' + Iter + '">' +
        '        <h5 class="mb-0">\n' +
        '            <button id="Resultlist' + Iter + '" class="btn btn-link" type="button" data-toggle="collapse"\n' +
        '                            data-target="#collapseList' + Iter + '" aria-expanded="true"\n' +
        '                            aria-controls="collapseList' + Iter + '">\n' +
        '                        Results' +
        '            </button>\n' +
        '        </h5>\n' +
        '    </div>' +
        '    <div id="collapseList' + Iter + '" style="display: none" class="collapse show" aria-labelledby="headingb' + Iter + '">\n' +
        '        <div class="card-body">' +
        '            <table id="myResultlist' + Iter + '" class="display table table-striped table-bordered" width="100%">' +
        '                    <thead>\n' +
        '                    <tr>\n' +
        '                        <th>Name</th>\n' +
        '                        <th>Type</th>\n' +
        '                        <th>Min</th>\n' +
        '                        <th>Max</th>\n' +
        '                        <th>Context</th>\n' +
        '                    </tr>\n' +
        '                    </thead>' +
        '            </table>' +
        '        </div>' +
        '    </div>' +
           '    <div class="card-header mt-4" style="border-top: 1px solid rgba(0, 0, 0, 0.125); display: none" id="headingc' + Iter + '">' +
        '        <h5 class="mb-0">\n' +
        '            <button id="MapHeading' + Iter + '" class="btn btn-link" type="button" data-toggle="collapse"\n' +
        '                            data-target="#collapseMap' + Iter + '" aria-expanded="true"\n' +
        '                            aria-controls="collapseMap' + Iter + '">\n' +
        '                        Map' +
        '            </button>\n' +
        '        </h5>\n' +
        '    </div>' +
        '    <div id="collapseMap' + Iter + '" style="display: none" class="collapse show" aria-labelledby="headingc' + Iter + '">\n' +
        '        <div class="card-body">' +
        '            <div id="map' + Iter + '" style="min-width: 300px"></div>' +
        '        </div>' +
        '    </div>' +
        '<div style="display: none">' +
        '<div id="variables" class="row">' +
        '<input class="col" type=text id="level' + Iter + '">' +
        '<input class="col"type=text id="criteria' + Iter + '">' +
        '<input class="col" type=text id="type' + Iter + '">' +
        '<input class="col" type=text id="min' + Iter + '">' +
        '<input class="col" type=text id="max' + Iter + '">' +
        '</div>' +
        '<div class="row">'+
        '<div class="col-12">'+
        '<textarea id="ajaxresult' + Iter + '" style="width: 100%"></textarea>' +
        '</div>'+
        '</div>'+
        '</div>'+
        '</div>\n' +
        '</div>\n' +
        '</div>');
    $(".myResetbutton").click(function f() {
        console.log(this.value);
        $("#Query" + this.value).remove();
        Iter += 1;
        addSearch();
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
        '<label class="input-group-text" for="LevelSelect_' + Iter + '">' + Iter + '. </label>\n' +
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
            '<option value="text">Search in Text</option>\n' +
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

    if (criteria == 'material') { //if material append form with tree select
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
        '<span class="input-group-text input-group-middle">% min: </span>\n' +
        '<input id="valMin_' + Iter + '" class="form-control value-input" type="text">\n' +
        '<div class="input-group-append">\n' +
        '<span class="input-group-text input-group-middle">% max: </span>\n' +
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
    var mylevel = $('#level' + Iter).val();
    mycriteria = $('#criteria' + Iter).val();
    var mymin = $('#min' + Iter).val();
    var mymax = $('#max' + Iter).val();
    var mytypes = $('#type' + Iter).val();
    console.log(mylevel + ', ' + mycriteria + ', ' + mymin + ', ' + mymax + ', ' + mytypes);
    var system_type = mylevel;
    if (mylevel == 'burial_site') var system_type = 'place';
    if (mylevel == 'strat') var system_type = 'stratigraphic unit';

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
            $('#headingb' + Iter).toggle();
            if (result == null) {
                $('#Resultlist' + Iter).html('No results for this search');
                return
            } else {
                $('#headingc' + Iter).toggle();
                $('#Resultlist' + Iter).html('Results (' + result.length + ')')
                eval('result_' + Iter + '= result;');
                console.log(eval('result_' + Iter));
                setdatatable(result, mycriteria);
                $('#collapseList' + Iter).toggle();
                $('#collapseMap' + Iter).toggle();
            };
        }
    });

}

function setdatatable(data) {
    var mymarkers = new L.featureGroup([]);
    table = $('#myResultlist' + Iter).DataTable({
        data: data,
        "pagingType": "numbers",
        "scrollX": true,
        columns: [
            {data: "name",
                "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                    $(nTd).html("<a href='/entity/" + oData.id + "' title='" + oData.maintype + " 'target='_blank'>" + oData.name + "</a>"); //create links in rows
                }
            },
            {
                data: 'type',
                "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                    $(nTd).html("<div title='" + oData.path + "'>" + oData.type + "</div> ");
                    //create markers
                    var marker = L.marker([((oData.lon)), ((oData.lat))], {title: oData.name}).addTo(mymarkers);
                }
            },
            {data: 'min'},
            {data: 'max'},
            {data: 'context'}
        ],
    });
    console.log(mycriteria);
    if (mycriteria == 'type' || criteria == 'maintype') table.columns([2,3]).visible(false);
    $('#collapseList' + Iter).on('shown.bs.collapse', function () {
    table.draw();
});
    table.draw();
    setmymap(mymarkers);
}

function setmymap(markers) {
//define basemaps
    var landscape = L.tileLayer('https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=b3c55fb5010a4038975fd0a0f4976e64', {
        attribution: 'Tiles: &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18
    });
    var satellite = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: 'Tiles: &copy; Google Maps ',
        maxZoom: 18
    });

    var map = L.map('map' + Iter, {
        fullscreenControl: true,
        zoom: 18,
        zoomControl: false,
        layers: [satellite, landscape]
    }).setView([51.505, -0.09], 13);

    var baseLayers = {
        "Landscape": landscape,
        "Satellite": satellite,
    };

    //initiate markers
    var markergroup = new L.layerGroup();
        markergroup.addTo(map)
    markers.addTo(markergroup)

    //initiate markers
    heatmarkers = []
    clustermarkers = L.markerClusterGroup();
    heat = L.heatLayer(heatmarkers, {radius: 25, minOpacity: 0.5, blur: 30});

    var overlays = {
        "Sites": markergroup,
        "Cluster": clustermarkers,
        "Density": heat
    };

    //add layer control
    baseControl = L.control.layers(baseLayers, overlays).addTo(map);

//hack for right order of basemaps
    map.removeLayer(satellite);

    L.control.scale({imperial: false}).addTo(map);//scale on map

}

