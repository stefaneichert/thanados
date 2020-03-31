//initiate map with certain json
$(document).ready(function () {
    $("#sidebarTitle").text(myjson.name);
    markerset = false;
    getBasemaps();
    setmap(myjson);
    //console.log(myjson);
    $('#CSVmodal').on('shown.bs.modal', function (e) {
        table.draw();
    })
    layerIds = [];
});

//set map and sidebar content//
///////////////////////////////

//filter to get polygons from the geojson
function polygonFilter(feature) {
    if (feature.geometry.type === "Polygon")
        return true
}

//filter to get points from the geojson
function pointFilter(feature) {
    if (feature.geometry.type === "Point")
        return true
}


function setmap(myjson) {
    //set sidebar to current json
    if (myjson.features[0].id !== 0) setSidebarContent(myjson);


    //define map
    map = L.map('map', {
        zoom: 22,
        zoomControl: false,
        layers: [landscape, satellite, streets]
    });

    //hack to show landscape first
    map.removeLayer(streets);
    map.removeLayer(Esri_WorldImagery);


    //style polygons
    myStyle = {
        "color": "#007bd9",
        "weight": 1.5,
        "fillOpacity": 0.5,
        "fillColor": "#007bd9"
    };

    HoverStyle = {
        "fillColor": "rgb(255,0,9)",
        "color": "rgb(64,64,64)",
        "weight": 3,
        "fillOpacity": 0.3
    };

    SelectionStyle = {
        "fillColor": "rgb(255,0,9)",
        "color": "rgb(255,0,2)",
        "weight": 3,
        "fillOpacity": 0.5
    };

    myStyleSquare = {
        "color": "rgba(0,123,217,0.75)",
        "weight": 1.5,
        "fillOpacity": 0.5,
        "dashArray": [4, 4]
    };

    choroOptions = {
        "steps": 5,
        "mode": "e",
        "scale": ["#ffffff","#ff0000"],
        "polygonstyle": {
            "color": "#000000",
            "weight": 0,
            "fillOpacity": 10
        }
    };

    legendlayers = []

    //add graves with polygon geometry
    graves = L.geoJSON(myjson, {
        filter: polygonFilter,
        style: myStyle,
        shapetype: 'single',
        legendTitle: 'Graves',
        layername: 'graves'
    });

    //add graves with legend
    var currentGraves =
        '<div class="layerOptionsClick" ' +
        'onclick="openStyleDialog(\'single\')" ' +
        'style="background-color: ' + hexToRgbA(myStyle.color, myStyle.fillOpacity) + '; ' +
        'border: ' + myStyle.weight + 'px solid ' + myStyle.color + '">&nbsp;</div>';
    createLegend(map, graves, currentGraves);
    graves.addTo(map);
    legendlayers.push(graves);

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
            } else {
                var popupLine =
                    '<a id="' + myjson.site_id + '" onclick="modalsetsite()" href="#">' +
                    '<p><b>' + feature.properties.name + ' </b>' +
                    '<br>(' + myjson.properties.maintype.name + ')</p></a>';
                var marker = L.marker(latlng).bindPopup(popupLine).addTo(map);
                centerpoint = latlng;
                markerset = true;
            }
        },
    });

    //style the point geometry graves with a dashed line
    graves.eachLayer(function (layer) {
        if (layer.feature.derivedPoly === 'true') {
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
        if (setJson(myjson)) map.fitBounds(graves.getBounds());
        else {
            var popupLine =
                '<a id="' + myjson.site_id + '" onclick="modalsetsite()" href="#"><p>' +
                '<b>' + myjson.name + ' </b><br>(' + myjson.properties.maintype.name + ')</p></a>';
            var latlng = [myjson.properties.center.coordinates[1], myjson.properties.center.coordinates[0]];
            var marker = L.marker(latlng).bindPopup(popupLine).addTo(map);
            centerpoint = latlng;
            map.panTo(centerpoint);
        }
    }

    //set zoom
    myzoom = (map.getZoom());
    if (myzoom > 20) map.setZoom(20);

    //add emtpty Layergroup for search results

    choroplethLayer = new L.LayerGroup();
    choroplethLayer.addTo(map);


//define map controls
    //sidebar toggle button
    L.easyButton({
        id: 'SidebarButton',  // an id for the generated button
        position: 'topleft',      // inherited from L.Control -- the corner it goes in
        type: 'replace',          // set to animate when you're comfy with css
        leafletClasses: true,     // use leaflet classes to style the button?
        states: [{                 // specify different icons and responses for your button
            stateName: 'sidebar',
            onClick: function (button, map) {
                animateSidebar();
            },
            title: 'toggle sidebar',
            icon: 'fas fa-exchange-alt'
        }]
    }).addTo(map);

    //add option button and exportbutton for map as image
    printMapbutton('map', 'topleft');

    //add filter/Search button
    addFilterSearch();

    //add layer control
    baseControl = L.control.layers(baseLayers).addTo(map);

    //add scalebar
    L.control.scale({imperial: false}).addTo(map);

    //initiate selection of clicked polygons
    polygonSelect();

    //initiate map attribution
    map.on('baselayerchange', function (e) {
        attributionChange()
    });
    attributionChange();

    //set THANADOS style for layer control (see style.css)
    $('.leaflet-control-layers-toggle').css({'background-image': ''});

}


//highlight polygon for active selection in sidebar
function showpolygon(id) {
    var polys = L.geoJSON(mypolyjson, {
            onEachFeature: function (feature, layer) {
                if (feature.id === id) {
                    if (feature.properties.maintype.systemtype === 'feature') {
                        selectedpolys.clearLayers();
                        var polyPoints = layer.getLatLngs()
                        var selectedpoly = L.polygon(polyPoints, SelectionStyle);
                        selectedpolys.addLayer(selectedpoly);
                        var boundscenter = (selectedpoly.getBounds()).getCenter();
                        map.panTo(boundscenter);
                    }
                    if (typeof (newMarker) !== 'undefined') {
                        map.removeLayer(newMarker);
                    }
                }
            }
        }
    );
}


//**select overlapping polygons on click**//
///////////////////////////////////////////////
function polygonSelect() {
    //define layergroup for selected polygons
    selectedpolys = new L.LayerGroup();
    selectedpolys.addTo(map);

    //layergroup for highlighting on popup hover
    hoverPolys = new L.LayerGroup();
    hoverPolys.addTo(map);

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

        //set popup content to matching polygons for invisible marker
        if (selectedIDs.length !== 0) {
            newMarker.addTo(map);
            newMarker.bindPopup(popupContent).openPopup();
            if (typeof (oldcollapsediv) !== 'undefined') {
                $('#collapseg' + oldcollapsediv).collapse('hide');
                var down = ($('#btn' + oldcollapsediv).hasClass("fa-chevron-down"));
                if (down)
                    $('#btn' + oldcollapsediv).removeClass('fa-chevron-down').addClass('fa-chevron-right');
            }
        }
    });
}


//check if marker is inside polygon and return values
function isMarkerInsidePolygon(checkmarker, poly) {
    if (poly.feature.geometry.type === "Polygon") {
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
            var mypopupLine =
                JSON.parse('{"id":"' + poly.feature.id + '"' +
                    ', "name":"' + poly.feature.properties.name + '"' +
                    ', "type":"' + poly.feature.properties.maintype.name + '"}');
            selectedIDs.push(mypopupLine);
            var popupLine =
                '<a id="' + poly.feature.id + '"' +
                ' onclick="modalset(this.id)" ' +
                ' onmouseout="hoverPolys.clearLayers()"' +
                ' onmouseover="HoverId = this.id; hoverPoly()"' +
                ' href="#"><p><b>' + poly.feature.properties.name + ' </b>' +
                '(' + poly.feature.properties.maintype.name + ')</p></a>';
            popupContent += popupLine;
            var selectedpoly = L.polygon(polyPoints, SelectionStyle);
            selectedpolys.addLayer(selectedpoly);
        }
        return inside;
    }
}

//add the respective polygon if hovered over popup link
function hoverPoly() {
    hoverPolys.clearLayers();
    hoverGraves = L.geoJSON(mypolyjson, {
        filter: hoverFilter,
        style: HoverStyle
    });
    hoverPolys.addLayer(hoverGraves);
}

//filter to check whether it is the matching polygon
function hoverFilter(feature) {
    if (feature.id == HoverId) {
        return true
    }
}

//UI Elements
//////////////////////////////
//min mid max sidebar
function animateSidebar(withzoom) {
    sidebarSize = $("#sidebar").width();
    if (sidebarSize > 0) sidebarSize = 350;
    switch (sidebarSize) {
        case 0:
            sidebarNewSize = 350
            break;
        case 350:
            sidebarNewSize = 0
            break;
        default:
            sidebarNewSize = 350
    }

    $("#sidebar").animate({
        width: sidebarNewSize + "px"
    }, 10, function () {
        map.invalidateSize();
        if (withzoom) {
            if (markerset) {
                map.panTo(centerpoint);
                map.setZoom(22);
            } else {
                map.fitBounds(graves.getBounds())
                myzoom = (map.getZoom());
                if (myzoom > 20) map.setZoom(20);
            }
        }
    });
}

$(window).resize(function () {
    navheight = ($('#mynavbar').height());
    containerheight = ($('#container').height());
    headingheight = (($('#mysidebarheading').height()) + ($('#mysidebarmenu').height()));
    newListHeight = ($('#sidebar').height());
    $('#mypanel').css('max-height', newListHeight - headingheight - 5 + 'px');
    containerheight = ($('#container').height());
    windowheight = ($(window).height());
    $('body').css('max-height', windowheight - 56 + 'px');
    mymodalwith = ($(window).width());
    if (mymodalwith > 500) mymodalwith = 500;
    $('.ui-dialog').css('max-width', mymodalwith + 'px');
    $('#mytreeModal').css('max-width', ($(window).width()) + 'px');
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
    if (mapwidth < 600) animateSidebar(true);
    mymodalwith = ($(window).width());
    if (mymodalwith > 500) mymodalwith = 500;
    $('.ui-dialog').css('max-width', mymodalwith + 'px');
    $('#mytreeModal').css('max-width', ($(window).width()) + 'px');
    $('.legend').css('max-height', (containerheight - 159))

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

        var gravedescription = features.properties.description
        if (gravedescription == null) {
            gravedescription = 'no description available'
        }
        if (typeof (features.geometry) == "undefined") {
            gravename = (gravename + ' <i class="far fa-eye-slash" title="location unknown"></i>')
        }


        $('#accordion1').append(
            '<div class="gravediv" id="' + gravediv + '">\n' +
            '<a grave="' + features.id + '" onclick="collapseAllOthers(' + features.id + '); ' +
            'toggleButtons(' + features.id + ', true)"' +
            ' for="collapse' + gravediv + '" class="entity sidebarheading" ' +
            'data-toggle="collapse" aria-expanded="true"' +
            ' aria-controls="#collapse' + gravediv + '"' +
            ' data-parent="#accordion1" href="#collapse' + gravediv + '">\n' +
            '<i id="btn' + features.id + '"' +
            ' class="collapsetitle collapsebutton fa fa-chevron-right fa-pull-left"></i>' +
            '<div class="collapsetitle">' + gravename +
            '</div>\n' +
            '</a>\n' +
            '<button type="button" class="gravebutton btn btn-secondary btn-xs"' +
            ' onclick="this.blur(); modalset(this.id)" title="show details" id="' + features.id + '">\n' +
            '<i class="fa fa-info"></i>\n' +
            '</button>\n' +
            '</div>\n' +
            '<div id="collapse' + gravediv + '" class="panel-collapse collapse">\n' +
            '<div class="sidebardescription">' + gravedescription + '</div>\n' +
            '<div id= "desc_' + gravediv + '"></div>' +
            '</div>');

        $.each(features.burials, function (u, burials) {
            burialdiv = gravediv + '_b' + burials.id;
            burialname = burials.properties.name;
            if (burialname == null) {
                burialname = 'unnamed'
            }

            burialdescription = burials.properties.description;
            if (burialdescription == null) {
                burialdescription = 'no description available'
            }

            $('#desc_' + gravediv).append(
                '<div id="' + burialdiv + '">' +
                '<a onclick="toggleButtons(' + burials.id + ')" for="collapse' + burialdiv + '"' +
                ' class="entity subheading" data-toggle="collapse" aria-expanded="true"' +
                ' aria-controls="#collapse' + burialdiv + '" data-parent="#' + burialdiv + '"' +
                ' href="#collapse' + burialdiv + '">' +
                '<i id="btn' + burials.id + '"' +
                ' class="collapsetitle1 collapsebutton1 fa fa-chevron-right fa-pull-right"></i>' +
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

                finddescription = finds.properties.description;
                if (finddescription == null) {
                    finddescription = 'no description available'
                }

                $('#desc_' + burialdiv).append(
                    '<div id="' + finddiv + '">' +
                    '<a onclick="toggleButtons(' + finds.id + ')" for="collapse' + finddiv + '" ' +
                    'class="entity entity subheading" data-toggle="collapse" aria-expanded="true" ' +
                    'aria-controls="#collapse' + finddiv + '" data-parent="#' + finddiv + '" ' +
                    'href="#collapse' + finddiv + '">' +
                    '<i id="btn' + finds.id + '" ' +
                    'class="collapsetitle2 collapsebutton2 fa fa-chevron-right fa-pull-right"></i>' +
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
    oldcollapsediv = collapseDiv;
}

//Modal
//get current entity data and appent to modal
// noinspection JSDuplicatedDeclaration
function getModalData(parentDiv, currentfeature, parenttimespan) {
    console.log(currentfeature);

    if (currentfeature.type == "FeatureCollection") {
        var closebutton = '';
        var entId = currentfeature.site_id;
        var entName = currentfeature.name;
        var iconpath = '/static/images/icons/grave30px.png';
        var entDesc = currentfeature.properties.description;
        if (typeof entDesc == 'undefined') {
            var entDesc = '';
        }

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

        if (timespan == parenttimespan) {
            var dateToInsert = '';
        }

        if (currentfeature.properties.maintype.systemtype == 'feature') {
            var children = currentfeature.burials;
            var iconpath = '/static/images/icons/grave30px.png';
            var parentDiv = 'myModalContent';
            $('#myModalContent').empty();
            $(parentDiv).empty();
            globalentName = entName;
        }

        if (currentfeature.properties.maintype.systemtype == 'stratigraphic unit') {
            var children = currentfeature.finds;
            var iconpath = '/static/images/icons/burial.png';
        }

        if (currentfeature.properties.maintype.systemtype == 'find') {
            var iconpath = '/static/images/icons/find.png';
        }
    }

    var enttypes = currentfeature.properties.types;
    if (currentfeature.type == "FeatureCollection") {
        var entfiles = currentfeature.properties.files;
    } else {
        var entfiles = currentfeature.files;
    }
    var entdims = currentfeature.properties.dimensions;
    var entmaterial = currentfeature.properties.material;
    console.log(entName);
    $('#' + parentDiv).append(
        '<div class="modal-header">' +
        '<h5 class="modal-title">' +
        '<img src="' + iconpath + '" width="30" height="30" class="modaltitleicon" alt="my image">' +
        '' + entName + '<div class="float-right mt-1" id="myModalPermalink' +
        '' + entId + '"></div></h5>' + closebutton +
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
        '</div>' +
        '<div id="' + parentDiv + '_' + entId + '"></div>'
    );

    $('#myModalPermalink' + entId).append(
        '<a href="../entity/' + entId + '" title="Permalink to this entity"><h6><i class="fas fa-link"></i></h6></a>'
    );

    if (dateToInsert == '') {
        $('#myModaltimespan' + entId).attr("class", "");
    }


    setImages(entId, entfiles);
    $('#myModalTypescontainer' + entId).empty();
    $.each(currentfeature.properties.types, function (t, types) {
        if ($('#myModalTypescontainer' + entId).is(':empty')) {
            $('#myModalTypescontainer' + entId).append('<p><h6>Properties</h6></p>');
        }

        var classification = types.name;
        var classtype = types.path;
        var typevalue = types.value;
        var typeunit = types.description;
        if (typeof (typevalue) !== 'undefined') var classification = (types.name + ': ' + typevalue + ' ' + typeunit);
        $('#myModalTypescontainer' + entId).append(
            '<div class="modalrowitem" title="' + classtype + '">' + classification + '</div>');
    });

    $('#myModalDimensionscontainer' + entId).empty();
    $.each(currentfeature.properties.dimensions, function (d, dimensions) {
        if ($('#myModalDimensionscontainer' + entId).is(':empty')) {
            $('#myModalDimensionscontainer' + entId).append('<p><h6>Dimensions</h6></p>');
        }

        var dimension = dimensions.name;
        var dimvalue = dimensions.value;
        var dimunit = dimensions.unit;

        $('#myModalDimensionscontainer' + entId).append(
            '<div class="modalrowitem">' + dimension + ': ' + dimvalue + ' ' + dimunit + '</div>');

    });

    $('#myModalMaterialcontainer' + entId).empty();
    $.each(currentfeature.properties.material, function (d, material) {
        if ($('#myModalMaterialcontainer' + entId).is(':empty')) {
            $('#myModalMaterialcontainer' + entId).append('<p><h6>Material</h6></p>');
        }

        var materialname = material.name;
        var matvalue = material.value;
        var matpath = material.path;
        if (matvalue > 0) {
            $('#myModalMaterialcontainer' + entId).append(
                '<div class="modalrowitem" title="' + matpath + '">' + materialname + ': ' + matvalue + '%</div>');
        }

        if (matvalue == 0) {
            $('#myModalMaterialcontainer' + entId).append(
                '<div class="modalrowitem" title="' + matpath + '">' + materialname + '</div>');
        }

    });

    parentDiv = (parentDiv + '_' + entId);
    if (currentfeature.type !== "FeatureCollection") {
        $.each(children, function (c, child) {
            getModalData(parentDiv, child, timespan)
        })
    }
    //loop throuh subunits until finds
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
                    '<a href="' + files.file_name + '" data-featherlight> \n' +
                    '<img src="' + files.file_name + '" class="modalimg" id="mymodalimg" alt="image">\n' +
                    '</a>\n'
                )
            });
        }


        //append more than one image with slides
        if (entfiles.length !== 1) {
            $('#myModalImagecontainer' + entId).attr("class", "col-md-4 col-sm-6");
            $('#myModalData_' + entId).attr("class", "col-md-8 col-sm-6");
            $('#myModalImagecontainer' + entId).empty();
            firstimage = entfiles[0].file_name;
            secondimage = entfiles[1].file_name;
            //create carousel and apppend first two images
            $('#myModalImagecontainer' + entId).append(
                '<div id="carouselExampleIndicators' + entId + '" class="carousel slide" data-ride="carousel" data-interval="false">' +
                '<ol id="mymodalimageindicators' + entId + '" class="carousel-indicators">' +
                '<li data-target="#carouselExampleIndicators' + entId + '" data-slide-to="0" class="active"></li>' +
                '<li data-target="#carouselExampleIndicators' + entId + '" data-slide-to="1"></li>' +
                '</ol>' +
                '<div id="mycarouselimages' + entId + '" class="carousel-inner">' +
                '<div class="carousel-item active">' +
                '<a href="' + firstimage + '" data-featherlight><img class="d-block modalimg" src="' + firstimage + '" alt="image"></a>' +
                '</div>' +
                '<div class="carousel-item">' +
                '<a href="' + secondimage + '" data-featherlight><img class="d-block modalimg" src="' + secondimage + '" alt="image"></a>' +
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
                        '<a href="' + files.file_name + '" data-featherlight><img class="d-block modalimg" src="' + files.file_name + '" alt="image"></a>' +
                        '</div>'
                    );
                    $('#mymodalimageindicators' + entId).append(
                        '<li data-target="#carouselExampleIndicators' + entId + '" data-slide-to="' + f + '"></li>'
                    );
                }
            });
        }
    }

    //remove image column
    if (entfiles == undefined) {
        $('#myModalImagecontainer' + entId).attr("class", "");
        $('#myModalImagecontainer' + entId).empty();
        $('#myModalData_' + entId).attr("class", "modalwithoutimage");
    }
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
    $("#myModal").dialog({
        width: mymodalwith,
        height: (newListHeight - 188),
        title: globalentName,
        position: {my: 'right bottom', at: 'right bottom-19', of: window},
        open: function () {
            // Destroy Close Button (for subsequent opens)
            $('#myModal-close').remove();
            // Create the Close Button (this can be a link, an image etc.)
            var link =
                '<btn id="myModal-close" title="close" ' +
                'class="text-decoration-none btn btn-sm btn-secondary d-inline-block float-right">' +
                '<i class="fas fa-times"></i></btn>';
            // Create Close Button
            $(".ui-dialog-title").css({'width': ''});
            $(this).parent().find(".ui-dialog-titlebar").append(link);
            // Add close event handler to link
            $('#myModal-close').on('click', function () {
                $("#myModal").dialog('close');
            });
        }
    });
    $("#myModal").scrollTop("0");
}

function modalsetsite() {
    getModalData(0, myjson);
    $("#myModal").dialog({
        width: mymodalwith,
        height: (newListHeight - 188),
        title: myjson.name,
        position: {my: 'right bottom', at: 'right bottom-19', of: window},
        open: function () {
            // Destroy Close Button (for subsequent opens)
            $('#myModal-close').remove();
            // Create the Close Button (this can be a link, an image etc.)
            var link =
                '<btn id="myModal-close" title="close" ' +
                'class="text-decoration-none float-right btn btn-sm btn-secondary d-inline-block">' +
                '<i class="fas fa-times"></i></btn>';
            // Create Close Button
            $(".ui-dialog-title").css({'width': ''});
            $(this).parent().find(".ui-dialog-titlebar").append(link);
            // Add close event handler to link
            $('#myModal-close').on('click', function () {
                $("#myModal").dialog('close');
            });
        }
    });
    $("#myModal").scrollTop("0");
}

function addFilterSearch() {
    LeafletDropdownButton = L.control({position: 'topleft'});
    LeafletDropdownButton.onAdd = function (map) {
        var div = L.DomUtil.create('div');
        div.innerHTML = '<div class="dropdown" id="sidebarclosed-menu">\n' +
            '                <button class="btn btn-secondary btn-sm mapbutton" type="button" onclick="this.blur()"\n' +
            '                        id="dropdownMenuButtonMap" data-toggle="dropdown" title="Filter/Search/Visualise"\n' +
            '                        aria-haspopup="true"\n' +
            '                        aria-expanded="false">\n' +
            '                    <i class="fas fa-search"></i>\n' +
            '                </button>\n' +
            '                <div class="dropdown-menu" aria-labelledby="dropdownMenuButtonMap">\n' +
            '                    <a class="dropdown-item searchbutton" onclick="startsearch()" href="#">Filter/Search</a>\n' +
            '                    <a class="dropdown-item visbutton" onclick="startvis(false)" href="#">Visualisations</a>\n' +
            '                </div>\n' +
            '            </div>';
        return div;
    };
    LeafletDropdownButton.addTo(map)
}