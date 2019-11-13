//initiate map with certain json
$(document).ready(function () {
    $("#sidebarTitle").text(myjson.name);
    markerset = false;
    setmap(myjson);
    console.log(myjson);

});

//set map and sidebar content//
///////////////////////////////

//filter to get polygons from the geojson
function polygonFilter(feature) {
    if (feature.geometry.type == "Polygon")
        return true
}

//filter to get points from the geojson
function pointFilter(feature) {
    if (feature.geometry.type == "Point")
        return true
}


function setmap(myjson) {
//set sidebar to current json
    if (myjson.features[0].id !== 0) setSidebarContent(myjson);

    //set attribution title
    mywindowtitle = 'THANADOS: ' + myjson.name + '. ';

//define basemaps
    var landscape = L.tileLayer('https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=2245afa655044c5c8f5ef8c129c29cdb', {
        attribution: mywindowtitle + 'Tiles: &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        apikey: '<2245afa655044c5c8f5ef8c129c29cdb>',
        maxZoom: 30
    });
    var satellite = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: mywindowtitle + 'Tiles: &copy; Google Maps ',
        maxZoom: 30
    });

    var basemap = L.tileLayer.wms('http://geoportal.cuzk.cz/WMS_ZM10_PUB/WMService.aspx', {
        layers: 'GR_ZM10',
        maxZoom: 30
    });

    if (myjson.site_id == 111285) {
        var imageUrl = '/static/images/entities/112757.png';
        var imageBounds = [[49.99800, 14.99246], [49.99747, 14.99328]];
        plot = L.imageOverlay(imageUrl, imageBounds);
    }

//define map
    map = L.map('map', {
        zoom: 20,
        zoomControl: false,
        layers: [satellite, landscape]
    });


//style polygons
    var myStyle = {
        "color": "rgba(0,123,217,0.75)",
        "weight": 1.5,
        "fillOpacity": 0.5
        //"opacity": 0.4
    };

    var myStyleSquare = {
        "color": "rgba(0,123,217,0.75)",
        "weight": 1.5,
        "fillOpacity": 0.2,
        "dashArray": [4, 4]
    };

    //add graves with polygon geometry
    graves = L.geoJSON(myjson, {
        filter: polygonFilter,
        style: myStyle
    });

    graves.addTo(map);


    //if geometry is point create a rectangle around that point
    pointgraves = L.geoJSON(myjson, {
        filter: pointFilter,
        pointToLayer: function (feature, latlng) {
            if (feature.id !== 0) {
                var lefttoplat = (latlng.lat - 0.000003);
                var lefttoplon = (latlng.lng - 0.000005);
                var rightbottomlat = (latlng.lat + 0.000003);
                var rightbottomlon = (latlng.lng + 0.000005);
                var bounds = [[lefttoplat, lefttoplon], [rightbottomlat, rightbottomlon]];
                var rect = L.rectangle(bounds).toGeoJSON(13);
                L.extend(rect, {//add necessary properties from json
                    properties: feature.properties,
                    id: feature.id,
                    parent: feature.parent,
                    burials: feature.burials,
                    derivedPoly: "true"
                });
                graves.addData(rect);
                markerset = false;
            }
            else {
                var popupLine = '<a id="' + myjson.site_id + '" onclick="modalsetsite()" href="#"><p><b>' + feature.properties.name + ' </b><br>(' + myjson.properties.maintype.name + ')</p></a>';
                var marker = L.marker(latlng).bindPopup(popupLine).addTo(map);
                centerpoint = latlng;
                markerset = true;
            };
            },
    });

    //style the point geometry graves with a dashed line
    graves.eachLayer(function (layer) {
        if (layer.feature.derivedPoly == 'true') {
            layer.setStyle(myStyleSquare)
        }
    });
    mypolyjson = (graves.toGeoJSON(13));
    L.extend(mypolyjson, {
        name: myjson.name,
        properties: myjson.properties,
        site_id: myjson.site_id
    });
    if (markerset) {
        map.panTo(centerpoint);
        map.setZoom(20);
    } else {
    map.fitBounds(graves.getBounds())};
    myzoom = (map.getZoom());
    if (myzoom > 20) map.setZoom(20);


    //add emtpty Layergroup for search results
    resultpolys = new L.LayerGroup();
    resultpolys.addTo(map);

    resultpoints = new L.LayerGroup();
    resultpoints.addTo(map);

    choroplethLayer = new L.LayerGroup();
    choroplethLayer.addTo(map);


//define map control
    baseLayers = {
        "Landscape": landscape,
        "Satellite": satellite,
        "BasemapCZ": basemap,
    };

    var overlays = {
        "Graves": graves,
        "Search result shapes": resultpolys,
        "Search result markers": resultpoints
    };

//add layer control
    baseControl = L.control.layers(baseLayers, overlays).addTo(map);

//hack for right order of basemaps
    map.removeLayer(satellite);

    L.control.scale({imperial: false}).addTo(map);

    //initiate selection of clicked polygons
    polygonSelect();

    L.easyPrint({
        title: 'Export Map as Image',
        position: 'topright',
        sizeModes: ['Current', 'A4Portrait', 'A4Landscape'],
        filename: 'myMap',
        exportOnly: true,
        hideControlContainer: false,
        customWindowTitle: "mywindowtitle"
    }).addTo(map);
    map.on('baselayerchange', function (e) {
        attributionChange()
    });
    attributionChange();
}
;


//openpolygon for active sidebargrave
function showpolygon(id) {
    var polys = L.geoJSON(mypolyjson, {
            onEachFeature: function (feature, layer) {
                if (feature.id == id) {
                    if (feature.properties.maintype.systemtype == 'feature') {
                        selectedpolys.clearLayers();
                        var polyPoints = layer.getLatLngs()
                        var selectedpoly = L.polygon(polyPoints, {color: 'red'});
                        selectedpolys.addLayer(selectedpoly);
                        var boundscenter = (selectedpoly.getBounds()).getCenter();
                        map.panTo(boundscenter);
                    }
                    if (typeof (newMarker) !== 'undefined') {
                        map.removeLayer(newMarker);
                    }
                    ;
                }
                ;
            }
        }
    );
}
;

//**select overlapping polygons on click**//
///////////////////////////////////////////////
function polygonSelect() {
//define layergroup for selected polygons
    selectedpolys = new L.LayerGroup();
    selectedpolys.addTo(map);

//define invisible marker
    invisIcon = L.icon({
        iconUrl: '/static/images/icons/burial.png',
        iconSize: [1, 1] // size of the icon
    });

//function to get coordinates of clicked position and loop through polygons for matches
    map.on('click', function (e) {
        //set invisible marker and remove invisible marker and popupconent if exists
        if (typeof (newMarker) !== 'undefined') {
            map.removeLayer(newMarker);
        }
        ;
        popupContent = '';
        newMarker = new L.marker(e.latlng, {icon: invisIcon}); //global to have it for further use

        //clear previous polygons
        selectedpolys.clearLayers();
        selectedIDs = [];

        //loop through polygons and set matches
        var polys = L.geoJSON(mypolyjson, {
            onEachFeature: function (feature, layer) {
                isMarkerInsidePolygon(newMarker, layer)
            }
        });
        //set popup content to matching polygons

        if (selectedIDs.length !== 0) {
            newMarker.addTo(map);
            newMarker.bindPopup(popupContent).openPopup();
            if (typeof (oldcollapsediv) !== 'undefined') {
                $('#collapseg' + oldcollapsediv).collapse('hide');
                var down = ($('#btn' + oldcollapsediv).hasClass("fa-chevron-down"));
                if (down)
                    $('#btn' + oldcollapsediv).removeClass('fa-chevron-down').addClass('fa-chevron-right');
            }
            ;
        }
        ;
    });
}


//check if marker is inside polygon and return values
function isMarkerInsidePolygon(checkmarker, poly) {
    if (poly.feature.geometry.type == "Polygon") {
        var inside = false;
        var x = checkmarker.getLatLng().lat, y = checkmarker.getLatLng().lng; //uses the global
        for (var ii = 0; ii < poly.getLatLngs().length; ii++) {
            var polyPoints = poly.getLatLngs()[ii];
            for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
                var xi = polyPoints[i].lat, yi = polyPoints[i].lng;
                var xj = polyPoints[j].lat, yj = polyPoints[j].lng;
                var intersect = ((yi > y) != (yj > y))
                    && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect)
                    inside = !inside;
            }
        }
        if (inside) {
            var mypopupLine = JSON.parse('{"id":"' + poly.feature.id + '", "name":"' + poly.feature.properties.name + '", "type":"' + poly.feature.properties.maintype.name + '"}');
            selectedIDs.push(mypopupLine);
            var popupLine = '<a id="' + poly.feature.id + '" onclick="modalset(this.id)" href="#"><p><b>' + poly.feature.properties.name + ' </b>(' + poly.feature.properties.maintype.name + ')</p></a>';
            popupContent += popupLine;
            var selectedpoly = L.polygon(polyPoints, {color: 'red'});
            selectedpolys.addLayer(selectedpoly);
        }
        ;
        return inside;
    }
}
;

//UI Elements
//min mid max sidebar
$('#sidebar-start').toggle();
$('#sidebarclosed-menu').toggle();

function animateSidebar() {
    sidebarSize = $("#sidebar").width();
    switch (sidebarSize) {
        case 0:
            sidebarNewSize = 350
            $('#sidebar-start').toggle();
            $('#sidebarclosed-menu').toggle();
            break;
        case 350:
            sidebarNewSize = 0
            $('#sidebar-start').toggle();
            $('#sidebarclosed-menu').toggle();
            break;
        default:
            sidebarNewSize = 350
            $('#sidebar-max').attr("disabled", false);
    }
    ;
    $("#sidebar").animate({
        width: sidebarNewSize + "px"
    }, 10, function () {
        map.invalidateSize();
    });
}

function animateSidebarMax() {
    $("#sidebar").animate({
        width: "100%"
    }, 10, function () {
        map.invalidateSize();
        $('#sidebar-max').attr("disabled", true);
    });
}

$("#sidebar-start").click(function () {
    animateSidebar();
    return false;
});

$("#sidebar-max").click(function () {
    animateSidebarMax();
    return false;
});

$("#sidebar-smaller").click(function () {
    animateSidebar();
    return false;
});

$(window).resize(function () {
    navheight = ($('#mynavbar').height());
    containerheight = ($('#container').height());
    headingheight = (($('#mysidebarheading').height()) + ($('#mysidebarmenu').height()));
    newListHeight = ($('#sidebar').height());
    $('#mypanel').css('max-height', newListHeight - headingheight - 5 + 'px');
    containerheight = ($('#container').height());
    windowheight = ($(window).height());
    $('body').css('max-height', windowheight - 56 + 'px');
});

$(document).ready(function () {
    navheight = ($('#mynavbar').height());
    containerheight = ($('#container').height());
    headingheight = (($('#mysidebarheading').height()) + ($('#mysidebarmenu').height()));
    newListHeight = ($('#sidebar').height());
    $('#mypanel').css('max-height', newListHeight - headingheight - 65 + 'px');
    containerheight = ($('#container').height());
    windowheight = ($(window).height());
    $('body').css('max-height', windowheight - 56 + 'px');
    mapwidth = ($('#map').width());
    if (mapwidth < 600) animateSidebar();
});

//sidebar content
//set sidebarcontent to current json
function setSidebarContent(myjson) {
    $.each(myjson.features, function (i, features) {
        gravediv = 'g' + features.id;
        var gravename = features.properties.name;
        if (gravename == null) {
            gravename = 'unnamed'
        }
        ;
        var gravedescription = features.properties.description
        if (gravedescription == null) {
            gravedescription = 'no description available'
        }
        ;
        $('#accordion1').append(
            '<div id="' + gravediv + '" style="max-height: 42px">' +
            '<a grave="' + features.id + '" onclick="collapseAllOthers(' + features.id + '); toggleButtons(' + features.id + ', true)" for="collapse' + gravediv + '" class="entity sidebarheading" ' +
            'data-toggle="collapse" aria-expanded="true" aria-controls="#collapse' + gravediv + '" data-parent="#accordion1" href="#collapse' + gravediv + '">' +
            '<i id="btn' + features.id + '" class="collapsetitle collapsebutton fa fa-chevron-right fa-pull-left"></i>' +
            '<div class="collapsetitle">' + gravename +
            '</div>' +
            '</a>' +
            '<button type="button" class="gravebutton btn btn-secondary btn-xs" onclick="this.blur(); modalset(this.id)" title="show details" id="' + features.id + '">' +
            '<i class="fa fa-info"></i>' +
            '</button>' +
            '</div>' +
            '<div id="collapse' + gravediv + '" class="panel-collapse collapse">' +
            '<div class="sidebardescription">' + gravedescription + '</div>' +
            '<div id= "desc_' + gravediv + '"></div>' +
            '</div>');
        $.each(features.burials, function (u, burials) {
            burialdiv = gravediv + '_b' + burials.id;
            burialname = burials.properties.name;
            if (burialname == null) {
                burialname = 'unnamed'
            }
            ;
            burialdescription = burials.properties.description;
            if (burialdescription == null) {
                burialdescription = 'no description available'
            }
            ;
            $('#desc_' + gravediv).append(
                '<div id="' + burialdiv + '">' +
                '<a onclick="toggleButtons(' + burials.id + ')" for="collapse' + burialdiv + '" class="entity subheading" data-toggle="collapse" aria-expanded="true" aria-controls="#collapse' + burialdiv + '" data-parent="#' + burialdiv + '" href="#collapse' + burialdiv + '">' +
                '<i id="btn' + burials.id + '" class="collapsetitle1 collapsebutton1 fa fa-chevron-right fa-pull-right"></i>' +
                '<div class="collapsetitle1">' + burialname + '</div>' +
                '</a>' +
                '</div>' +
                '<div id="collapse' + burialdiv + '" class="panel-collapse collapse">' +
                '<div class="sidebardescription1">' + burialdescription + '</div>' +
                '<div id="desc_' + burialdiv + '"></div>' +
                '</div>');
            $.each(burials.finds, function (f, finds) {
                finddiv = burialdiv + '_f' + finds.id;
                findname = finds.properties.name;
                if (findname == null) {
                    findname = 'unnamed'
                }
                ;
                finddescription = finds.properties.description;
                if (finddescription == null) {
                    finddescription = 'no description available'
                }
                ;
                $('#desc_' + burialdiv).append(
                    '<div id="' + finddiv + '">' +
                    '<a onclick="toggleButtons(' + finds.id + ')" for="collapse' + finddiv + '" class="entity entity subheading" data-toggle="collapse" aria-expanded="true" aria-controls="#collapse' + finddiv + '" data-parent="#' + finddiv + '" href="#collapse' + finddiv + '">' +
                    '<i id="btn' + finds.id + '" class="collapsetitle2 collapsebutton2 fa fa-chevron-right fa-pull-right"></i>' +
                    '<div class="collapsetitle2">' + findname + '</div>' +
                    '</a>' +
                    '</div>' +
                    '<div id="collapse' + finddiv + '" class="panel-collapse collapse">' +
                    '<div class="sidebardescription2">' + finddescription + '</div>' +
                    '</div>' +
                    '</div>');
            });
        })
    });
}

//toggle buttons if expanded/collapsed
function toggleButtons(id, grave) {
    var down = ($('#btn' + id).hasClass("fa-chevron-down"));
    if (down) {
        $('#btn' + id).removeClass('fa-chevron-down').addClass('fa-chevron-right');
        if (grave)
            selectedpolys.clearLayers();
    }
    if (down === false) {
        $('#btn' + id).removeClass('fa-chevron-right').addClass('fa-chevron-down');
        showpolygon(id);
    }
}
;

//collapse not selected graves in sidebar
function collapseAllOthers(collapseDiv) {
    if (typeof (oldcollapsediv) !== 'undefined') {
        if (oldcollapsediv !== collapseDiv) {
            $('#collapseg' + oldcollapsediv).collapse('hide');
            var down = ($('#btn' + oldcollapsediv).hasClass("fa-chevron-down"));
            if (down)
                $('#btn' + oldcollapsediv).removeClass('fa-chevron-down').addClass('fa-chevron-right');
        }
    }
    ;
    oldcollapsediv = collapseDiv;
}

//buttons to select between sites
/*$(".thunaubutton").click(function () {
    map.remove();
    $("#accordion1").empty();
    myjson = jsonthunau;
    setmap(myjson);
    console.log('Thunau')
    console.log(myjson);
    $("#sidebarTitle").text("Thunau Obere Holzwiese");
    $("#mypanel").animate({scrollTop: 0});
    $(".ui-dialog-content").dialog("close");
});

$(".pohanskobutton").click(function () {
    map.remove();
    $("#accordion1").empty();
    myjson = jsonpohansko;
    setmap(myjson);
    console.log('Pohansko')
    console.log(myjson);
    $("#sidebarTitle").text("Pohansko Herrenhof");
    $("#mypanel").animate({scrollTop: 0});
    $(".ui-dialog-content").dialog("close");
});

$(".kourimbutton").click(function () {
    map.remove();
    $("#accordion1").empty();
    myjson = jsonkourim;
    setmap(myjson);
    console.log('Kourim')
    console.log(myjson);
    $("#sidebarTitle").text("Stará Kouřim");
    $("#mypanel").animate({scrollTop: 0});
    $(".ui-dialog-content").dialog("close");
});*/


//Modal
//get current entity data and appent to modal
// noinspection JSDuplicatedDeclaration
function getModalData(parentDiv, currentfeature, parenttimespan) {

    if (currentfeature.type == "FeatureCollection") {
        var closebutton = '';
        var entId = currentfeature.site_id;
        var entName = currentfeature.name;
        var iconpath = '/static/images/icons/grave30px.png';
        var entDesc = currentfeature.properties.description;
        if (typeof entDesc == 'undefined') {
            var entDesc = '';
        }
        ;
        var entType = currentfeature.properties.maintype.name;
        var typepath = currentfeature.properties.maintype.path;
        if (typeof (currentfeature.properties.timespan) !== 'undefined' && typeof (currentfeature.properties.timespan.begin_from) !== 'undefined')
            var tsbegin = parseInt((currentfeature.properties.timespan.begin_from), 10);
        if (typeof (currentfeature.properties.timespan) !== 'undefined' && typeof (currentfeature.properties.timespan.end_to) !== 'undefined')
            var tsend = parseInt((currentfeature.properties.timespan.end_to), 10);
        var timespan = tsbegin + ' to ' + tsend;
        var dateToInsert = timespan;
        if (typeof tsbegin == 'undefined') {
            var dateToInsert = '';
        }
        ;
        var parentDiv = 'myModalContent';
        $('#myModalContent').empty();
        $(parentDiv).empty();
        globalentName = entName;
    } else {
        var closebutton = '';
        var entId = currentfeature.id;
        var entName = currentfeature.properties.name;
        var entDesc = currentfeature.properties.description;
        if (typeof entDesc == 'undefined') {
            var entDesc = '';
        }
        ;
        var entType = currentfeature.properties.maintype.name;

        var typepath = currentfeature.properties.maintype.path;
        if (typeof (currentfeature.properties.timespan) !== 'undefined' && typeof (currentfeature.properties.timespan.begin_from) !== 'undefined')
            var tsbegin = parseInt((currentfeature.properties.timespan.begin_from), 10);
        if (typeof (currentfeature.properties.timespan) !== 'undefined' && typeof (currentfeature.properties.timespan.end_to) !== 'undefined')
            var tsend = parseInt((currentfeature.properties.timespan.end_to), 10);
        var timespan = tsbegin + ' to ' + tsend;
        var dateToInsert = timespan;
        if (typeof tsbegin == 'undefined') {
            var dateToInsert = '';
        }
        ;
        if (timespan == parenttimespan) {
            var dateToInsert = '';
        }
        ;

        if (currentfeature.properties.maintype.systemtype == 'feature') {
            var children = currentfeature.burials;
            var iconpath = '/static/images/icons/grave30px.png';
            var parentDiv = 'myModalContent';
            $('#myModalContent').empty();
            //var closebutton = '<button type="button" class="close" onclick="this.blur()" data-dismiss="modal" aria-label="Close">' +
            //                    '<span aria-hidden="true">&times;</span>' +
            //                  '</button>';
            $(parentDiv).empty();
            globalentName = entName;
        }
        ;

        if (currentfeature.properties.maintype.systemtype == 'stratigraphic unit') {
            var children = currentfeature.finds;
            var iconpath = '/static/images/icons/burial.png';
        }
        ;
        if (currentfeature.properties.maintype.systemtype == 'find') {
            var iconpath = '/static/images/icons/find.png';
        }
        ;
    }

    var enttypes = currentfeature.properties.types;
    if (currentfeature.type == "FeatureCollection") {
        var entfiles = currentfeature.properties.files;
    } else {
        var entfiles = currentfeature.files;
    }
    var entdims = currentfeature.properties.dimensions;
    var entmaterial = currentfeature.properties.material;

    $('#' + parentDiv).append(
        '<div class="modal-header">' +
        '<h5 class="modal-title">' +
        '<img src="' + iconpath + '" width="30" height="30" class="modaltitleicon">' + entName + '</h5>' +
        closebutton +
        '</div>' +
        '<div class="modal-body">' +
        '<div class="container-fluid">' +
        '<div class="row">' +
        '<div id="myModalData_' + entId + '">' +
        '<div id="myModaltype_' + entId + '" class="modalrowitem" title="' + typepath + '">' + entType + '</div>' +
        '<div id="myModaltimespan' + entId + '" class="modalrowitem">' + dateToInsert + '</div>' +
        '<div id="myModalDescr' + entId + '">' + entDesc + '</div>' +
        '<div id="myModalTypescontainer' + entId + '"></div>' +
        '<div id="myModalDimensionscontainer' + entId + '"></div>' +
        '<div id="myModalMaterialcontainer' + entId + '"></div>' +
        '</div>' +
        '<div id="myModalImagecontainer' + entId + '"></div>' +
        '</div>' +
        '</div>' +
        '<div class="float-right" style="margin-right: 4em; margin-bottom: -2em; margin-top: 1em;" id="myModalPermalink' + entId + '"></div>' +
        '</div>' +
        '<div id="' + parentDiv + '_' + entId + '"></div>'
    );

    $('#myModalPermalink' + entId).append(
        '<a href="../entity/view/' + entId + '"><h6>Permalink</h6></a>'
    );

    if (dateToInsert == '') {
        $('#myModaltimespan' + entId).attr("class", "");
    }
    ;

    setImages(entId, entfiles);
    $('#myModalTypescontainer' + entId).empty();
    $.each(currentfeature.properties.types, function (t, types) {
        if ($('#myModalTypescontainer' + entId).is(':empty')) {
            $('#myModalTypescontainer' + entId).append('<p><h6>Properties</h6></p>');
        }
        ;
        var classification = types.name;
        var classtype = types.path;
        var typevalue = types.value;
        var typeunit = types.description;
        if (typeof(typevalue) !== 'undefined') var classification = (types.name + ': ' + typevalue + ' ' + typeunit);
        $('#myModalTypescontainer' + entId).append(
            '<div class="modalrowitem" title="' + classtype + '">' + classification + '</div>');
    });

    $('#myModalDimensionscontainer' + entId).empty();
    $.each(currentfeature.properties.dimensions, function (d, dimensions) {
        if ($('#myModalDimensionscontainer' + entId).is(':empty')) {
            $('#myModalDimensionscontainer' + entId).append('<p><h6>Dimensions</h6></p>');
        }
        ;
        var dimension = dimensions.name;
        var dimvalue = dimensions.value;

        if (dimension == 'Degrees') {
            $('#myModalDimensionscontainer' + entId).append(
                '<div class="modalrowitem">' + dimension + ': ' + dimvalue + '°</div>');
        }
        ;
        if (dimension == 'Weight') {
            $('#myModalDimensionscontainer' + entId).append(
                '<div class="modalrowitem">' + dimension + ': ' + dimvalue + ' g</div>');
        }
        ;
        if (dimension !== 'Degrees' && dimension !== 'Weight') {
            $('#myModalDimensionscontainer' + entId).append(
                '<div class="modalrowitem">' + dimension + ': ' + dimvalue + ' cm</div>');
        }
        ;
    });

    $('#myModalMaterialcontainer' + entId).empty();
    $.each(currentfeature.properties.material, function (d, material) {
        if ($('#myModalMaterialcontainer' + entId).is(':empty')) {
            $('#myModalMaterialcontainer' + entId).append('<p><h6>Material</h6></p>');
        }
        ;
        var materialname = material.name;
        var matvalue = material.value;
        var matpath = material.path;
        if (matvalue > 0) {
            $('#myModalMaterialcontainer' + entId).append(
                '<div class="modalrowitem" title="' + matpath + '">' + materialname + ': ' + matvalue + '%</div>');
        }
        ;
        if (matvalue == 0) {
            $('#myModalMaterialcontainer' + entId).append(
                '<div class="modalrowitem" title="' + matpath + '">' + materialname + '</div>');
        }
        ;
    });

    var parentDiv = (parentDiv + '_' + entId);
    if (currentfeature.type !== "FeatureCollection") {
        $.each(children, function (c, child) {
            getModalData(parentDiv, child, timespan)
        })
    }
    ; //loop throuh subunits until finds
}

//set images in modal
function setImages(entId, entfiles) {
    if (entfiles !== undefined) {

        //append one image without slides
        if (entfiles.length == 1) {
            $('#myModalImagecontainer' + entId).attr("class", "col-md-4 col-sm-6");
            $('#myModalData_' + entId).attr("class", "col-md-8 col-sm-6");
            $('#myModalImagecontainer' + entId).empty();
            $.each(entfiles, function (f, files) {
                $('#myModalImagecontainer' + entId).append(
                    '<a href="/static/images/entities/' + files.id + '.jpg" data-featherlight><img src="/static/images/entities/' + files.id + '.jpg" class="modalimg" id="mymodalimg"></a>'
                )
            });
        }
        ;

        //append more than one image with slides
        if (entfiles.length !== 1) {
            $('#myModalImagecontainer' + entId).attr("class", "col-md-4 col-sm-6");
            $('#myModalData_' + entId).attr("class", "col-md-8 col-sm-6");
            $('#myModalImagecontainer' + entId).empty();
            firstimage = entfiles[0].id;
            secondimage = entfiles[1].id;
            //create carousel and apppend first two images
            $('#myModalImagecontainer' + entId).append(
                '<div id="carouselExampleIndicators' + entId + '" class="carousel slide" data-ride="carousel" data-interval="false">' +
                '<ol id="mymodalimageindicators' + entId + '" class="carousel-indicators">' +
                '<li data-target="#carouselExampleIndicators' + entId + '" data-slide-to="0" class="active"></li>' +
                '<li data-target="#carouselExampleIndicators' + entId + '" data-slide-to="1"></li>' +
                '</ol>' +
                '<div id="mycarouselimages' + entId + '" class="carousel-inner">' +
                '<div class="carousel-item active">' +
                '<a href="/static/images/entities/' + firstimage + '.jpg" data-featherlight><img class="d-block modalimg" src="/static/images/entities/' + firstimage + '.jpg"></a>' +
                '</div>' +
                '<div class="carousel-item">' +
                '<a href="/static/images/entities/' + secondimage + '.jpg" data-featherlight><img class="d-block modalimg" src="/static/images/entities/' + secondimage + '.jpg"></a>' +
                '</div>' +
                '</div>' +
                '<a class="carousel-control-prev" href="#carouselExampleIndicators' + entId + '" role="button" data-slide="prev">' +
                '<span aria-hidden="true"><button onclick="this.blur()" type="button" class="btn btn-secondary"><</button></span>' +
                '<span class="sr-only">Previous</span>' +
                '</a>' +
                '<a class="carousel-control-next" href="#carouselExampleIndicators' + entId + '" role="button" data-slide="next">' +
                '<span aria-hidden="true"><button onclick="this.blur()" type="button" class="btn btn-secondary">></button></span>' +
                '<span class="sr-only">Next</span>' +
                '</a>' +
                '</div>'
            );

            //append further images to carousel
            $.each(entfiles, function (f, files) {
                if (f > 1) {
                    $('#mycarouselimages' + entId).append(
                        '<div class="carousel-item">' +
                        '<a href="/static/images/entities/' + files.id + '.jpg" data-featherlight><img class="d-block modalimg" src="/static/images/entities/' + files.id + '.jpg"></a>' +
                        '</div>'
                    );
                    $('#mymodalimageindicators' + entId).append(
                        '<li data-target="#carouselExampleIndicators' + entId + '" data-slide-to="' + f + '"></li>'
                    );
                }
                ;
            });
        }
        ;
    }
    ;

    //remove image column
    if (entfiles == undefined) {
        $('#myModalImagecontainer' + entId).attr("class", "");
        $('#myModalImagecontainer' + entId).empty();
        $('#myModalData_' + entId).attr("class", "modalwithoutimage");
    }
    ;
}

//initiate modal
function modalset(id) {
    $.each(myjson.features, function (i, features) {
        if (features.id == id) {
            getModalData(0, features);
        }
    });
    showpolygon(id);
    collapseAllOthers(id);
    //$('#myModal').modal();
    $("#myModal").dialog({
        width: 500,
        height: (newListHeight - 188),
        title: globalentName,
        position: {my: 'right bottom', at: 'right bottom-19', of: window}
    });
    $("#myModal").scrollTop("0");
}

function modalsetsite() {
    getModalData(0, myjson);
    $("#myModal").dialog({
        width: 500,
        height: (newListHeight - 188),
        title: myjson.name,
        position: {my: 'right bottom', at: 'right bottom-19', of: window}
    });
    $("#myModal").scrollTop("0");
}

