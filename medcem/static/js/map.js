//initiate map with certain json
$(document).ready(function () {
  //hardcoded first site
  myjson = jsonpohansko;
  setmap(myjson);
  console.log('Pohansko');
  console.log(myjson);
});

//set map and sidebar content//
///////////////////////////////
function setmap(myjson) {

//set sidebar to current json
    setSidebarContent(myjson);

//define basemaps
    var landscape = L.tileLayer('https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=2245afa655044c5c8f5ef8c129c29cdb', {
        attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        apikey: '<2245afa655044c5c8f5ef8c129c29cdb>',
        maxZoom: 30
    });
    var satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 30
    });

//basemap for minimap
    var mm1 = L.tileLayer('https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=2245afa655044c5c8f5ef8c129c29cdb', {
        attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        apikey: '<2245afa655044c5c8f5ef8c129c29cdb>',
        maxZoom: 30
    });

//define map
    map = L.map('map', {
        zoom: 20,
        zoomControl: false,
        layers: [satellite, landscape]
    });

//define map control
    var baseLayers = {
        "Landscape": landscape,
        "Satellite": satellite,
    };

//add layer control
    L.control.layers(baseLayers).addTo(map);

//hack for right order of basemaps
    map.removeLayer(satellite);

//style polygons
   var myStyle = {
      "color": "#6c757d",
      "weight": 1.5,
      "fillOpacity": 0.5
      //"opacity": 0.4
    };

//add graves
    graves = L.geoJSON(myjson, { style: myStyle }).addTo(map);

    map.fitBounds(graves.getBounds());

    var miniMap = new L.Control.MiniMap(mm1, {
                               toggleDisplay: true,
                               collapsedWidth: 30,
                               collapsedHeight: 30,
                               zoomLevelOffset: -7});
    //miniMap.addTo(map); //uncomment for MiniMap

    //add emtpty Layergroup for search results
    resultpolys = new L.LayerGroup();
    resultpolys.addTo(map);

    //initiate selection of clicked polygons
    polygonSelect();
};

//openpolygon for active sidebargrave
function showpolygon(id) {
   var polys = L.geoJSON(myjson, {
       onEachFeature: function (feature, layer) {
           if (feature.id == id) {
               if (feature.properties.maintype.systemtype == 'feature') {
                   selectedpolys.clearLayers();
                   var polyPoints = layer.getLatLngs()
                   var selectedpoly = L.polygon(polyPoints, {color: 'red'});
                   selectedpolys.addLayer(selectedpoly);
                   var boundscenter = (selectedpoly.getBounds()).getCenter();
                   map.panTo(boundscenter);
                   if (typeof(newMarker) !== 'undefined') {
                      map.removeLayer(newMarker);
                   };
               };
           };
       }
   });
};

//**select overlapping polygons on click**//
///////////////////////////////////////////////
function polygonSelect() {
//define layergroup for selected polygons
selectedpolys = new L.LayerGroup();
selectedpolys.addTo(map);

//define invisible marker
    invisIcon = L.icon({
    iconUrl: '/static/images/icons/burial.png',
    iconSize:     [1, 1] // size of the icon
    });

//function to get coordinates of clicked position and loop through polygons for matches
map.on('click', function(e) {
    //set invisible marker and remove invisible marker and popupconent if exists
    if (typeof(newMarker) !== 'undefined') {
       map.removeLayer(newMarker);
    };
    popupContent = '';
    newMarker = new L.marker(e.latlng, {icon: invisIcon}); //global to have it for further use

    //clear previous polygons
    selectedpolys.clearLayers();
    selectedIDs = [];

    //loop through polygons and set matches
    var polys = L.geoJSON(myjson, {
       onEachFeature: function (feature, layer) {
           isMarkerInsidePolygon (newMarker, layer);
       }
    });

    //set popup content to matching polygons

    if (selectedIDs.length !== 0) {
    newMarker.addTo(map);
    newMarker.bindPopup(popupContent).openPopup();
    if (typeof(oldcollapsediv) !== 'undefined') {
       $('#collapseg' + oldcollapsediv).collapse('hide');
             var down = ($('#btn' + oldcollapsediv).hasClass( "fa-chevron-down" ));
             if (down) $('#btn' + oldcollapsediv).removeClass('fa-chevron-down').addClass('fa-chevron-right');};
    };
});
}

//check if marker is inside polygon and return values
function isMarkerInsidePolygon(checkmarker, poly) {
            var inside = false;
            var x = checkmarker.getLatLng().lat, y = checkmarker.getLatLng().lng; //uses the global
            for (var ii=0;ii<poly.getLatLngs().length;ii++){
                var polyPoints = poly.getLatLngs()[ii];
                for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
                    var xi = polyPoints[i].lat, yi = polyPoints[i].lng;
                    var xj = polyPoints[j].lat, yj = polyPoints[j].lng;

                    var intersect = ((yi > y) != (yj > y))
                        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                    if (intersect) inside = !inside;
                }
            }
            if (inside) {
            var mypopupLine = JSON.parse('{"id":"' + poly.feature.id + '", "name":"' + poly.feature.properties.name + '", "type":"' +  poly.feature.properties.maintype.name + '"}');
            selectedIDs.push(mypopupLine);
            var popupLine = '<a id="' + poly.feature.id + '" onclick="modalset(this.id)" href="#"><p><b>' + poly.feature.properties.name + ' </b>(' +  poly.feature.properties.maintype.name + ')</p></a>';
            popupContent += popupLine;
            var selectedpoly = L.polygon(polyPoints, {color: 'red'});
            selectedpolys.addLayer(selectedpoly);
            };
            return inside;

};

//UI Elements
//min mid max sidebar
$('#sidebar-start').toggle();
$('#sidebarclosed-menu').toggle();
function animateSidebar() {
    var sidebarSize = $("#sidebar").width();
    switch (sidebarSize) {
        case 0:
            var sidebarNewSize = 350
            $('#sidebar-start').toggle();
            $('#sidebarclosed-menu').toggle();
            break;
        case 350:
            var sidebarNewSize = 0
            $('#sidebar-start').toggle();
            $('#sidebarclosed-menu').toggle();
            break;
        default:
            var sidebarNewSize = 350
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
    var navheight = ($('#mynavbar').height());
    var headingheight = (($('#mysidebarheading').height()) + ($('#mysidebarmenu').height()));
    newListHeight = ($('#sidebar').height());
    $('#mypanel').css('max-height', newListHeight - headingheight -5 + 'px');
});
$(document).ready(function () {
    var navheight = ($('#mynavbar').height());
    var headingheight = (($('#mysidebarheading').height()) + ($('#mysidebarmenu').height()));
    newListHeight = ($('#sidebar').height());
    $('#mypanel').css('max-height', newListHeight - headingheight -5 + 'px');
});

//sidebar content
//set sidebarcontent to current json
function setSidebarContent(myjson){
$.each(myjson.features, function (i, features) {
        gravediv = 'g' + features.id;
        var gravename = features.properties.name;
        if (gravename == null) {gravename = 'unnamed'};
        var gravedescription = features.properties.description
        if (gravedescription == null) {gravedescription = 'no description available'};
        $('#accordion1').append(
        '<div id="' + gravediv + '" style="max-height: 42px">' +
                  '<a grave="' + features.id + '" onclick="collapseAllOthers(' + features.id + '); toggleButtons(' + features.id + ', true)" for="collapse' + gravediv +'" class="entity sidebarheading"' +
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
                  if (burialname == null) {burialname = 'unnamed'};
                  burialdescription = burials.properties.description;
                  if (burialdescription == null) {burialdescription = 'no description available'};
                  $('#desc_' + gravediv).append(
                            '<div id="' + burialdiv + '">' +
                                 '<a onclick="toggleButtons(' + burials.id + ')" for="collapse' + burialdiv +'" class="entity subheading" data-toggle="collapse" aria-expanded="true" aria-controls="#collapse' + burialdiv + '" data-parent="#'  + burialdiv +  '" href="#collapse'  + burialdiv +  '">' +
                                      '<i id="btn' + burials.id + '" class="collapsetitle1 collapsebutton1 fa fa-chevron-right fa-pull-right"></i>' +
                                      '<div class="collapsetitle1">' + burialname + '</div>' +
                                 '</a>' +
                            '</div>' +
                            '<div id="collapse'  + burialdiv + '" class="panel-collapse collapse">' +
                                       '<div class="sidebardescription1">' + burialdescription + '</div>' +
                                       '<div id="desc_' + burialdiv + '"></div>' +
                            '</div>');
                             $.each(burials.finds, function (f, finds) {
                             finddiv = burialdiv + '_f' + finds.id;
                             findname = finds.properties.name;
                             if (findname == null) {findname = 'unnamed'};
                             finddescription = finds.properties.description;
                             if (finddescription == null) {finddescription = 'no description available'};
                             $('#desc_' + burialdiv).append(
                             '<div id="' + finddiv + '">' +
                                 '<a onclick="toggleButtons(' + finds.id + ')" for="collapse' + finddiv +'"class="entity entity subheading" data-toggle="collapse" aria-expanded="true" aria-controls="#collapse' + finddiv + '" data-parent="#'  + finddiv +  '" href="#collapse'  + finddiv +  '">' +
                                           '<i id="btn' + finds.id + '" class="collapsetitle2 collapsebutton2 fa fa-chevron-right fa-pull-right"></i>' +
                                           '<div class="collapsetitle2">' + findname + '</div>' +
                                       '</a>' +
                                 '</div>' +
                                 '<div id="collapse'  + finddiv + '" class="panel-collapse collapse">' +
                                       '<div class="sidebardescription2">' + finddescription + '</div>' +
                                 '</div>' +
                            '</div>');

                             });
    })});
}

//toggle buttons if expanded/collapsed
function toggleButtons(id, grave) {
    var down = ($('#btn' + id).hasClass( "fa-chevron-down" ));
    if (down) {
        $('#btn' + id).removeClass('fa-chevron-down').addClass('fa-chevron-right');
        if (grave) selectedpolys.clearLayers();
    }
    if (down === false) {
        $('#btn' + id).removeClass('fa-chevron-right').addClass('fa-chevron-down');
        showpolygon(id);
    }

};

//collapse not selected graves in sidebar
function collapseAllOthers(collapseDiv) {
      if (typeof(oldcollapsediv) !== 'undefined') {
         if (oldcollapsediv !== collapseDiv) {
             $('#collapseg' + oldcollapsediv).collapse('hide');
             var down = ($('#btn' + oldcollapsediv).hasClass( "fa-chevron-down" ));
             if (down) $('#btn' + oldcollapsediv).removeClass('fa-chevron-down').addClass('fa-chevron-right');
             }
      };
      oldcollapsediv = collapseDiv;
}

//buttons to select between sites
$(".thunaubutton").click(function () {
    map.remove();
    $( "#accordion1" ).empty();
    myjson = jsonthunau;
    setmap(myjson);
    console.log('Thunau')
    console.log(myjson);
    $("#sidebarTitle").text("Thunau Obere Holzwiese");
    $("#mypanel").animate({ scrollTop: 0 });
    });

$(".pohanskobutton").click(function () {
    map.remove();
    $( "#accordion1" ).empty();
    myjson = jsonpohansko;
    setmap(myjson);
    console.log('Pohansko')
    console.log(myjson);
    $("#sidebarTitle").text("Pohansko Herrenhof");
    $("#mypanel").animate({ scrollTop: 0 });
    });


//Modal
//get current entity data and appent to modal
function getModalData(parentDiv, currentfeature, parenttimespan) {
        var closebutton = '';
        var entId = currentfeature.id;
        var entName = currentfeature.properties.name;
        var entDesc = currentfeature.properties.description;
        if (typeof entDesc == 'undefined') {var entDesc = '';};
        var entType = currentfeature.properties.maintype.name;

        var typepath =  currentfeature.properties.maintype.name;
        if (typeof(currentfeature.properties.timespan) !== 'undefined' && typeof(currentfeature.properties.timespan.begin_from) !== 'undefined') var tsbegin = parseInt(((currentfeature.properties.timespan.begin_from)), 10);
        if (typeof(currentfeature.properties.timespan) !== 'undefined' && typeof(currentfeature.properties.timespan.end_to) !== 'undefined') var tsend = parseInt(((currentfeature.properties.timespan.end_to)), 10);
        var timespan = tsbegin + ' to ' + tsend;
        var dateToInsert = timespan;
        if (typeof tsbegin == 'undefined') {var dateToInsert = '';};
        if (timespan == parenttimespan) {var dateToInsert = '';};

        if (currentfeature.properties.maintype.systemtype == 'feature') {
            var children = currentfeature.burials;
            var iconpath = '/static/images/icons/grave30px.png';
            var parentDiv = 'myModalContent';
            $( '#myModalContent' ).empty();
            var closebutton = '<button type="button" class="close" onclick="this.blur()" data-dismiss="modal" aria-label="Close">' +
                                '<span aria-hidden="true">&times;</span>' +
                              '</button>';
            $(parentDiv).empty();
        };

        if (currentfeature.properties.maintype.systemtype == 'stratigraphic unit') {
        var children = currentfeature.finds;
        var iconpath = '/static/images/icons/burial.png';
        }

        if (currentfeature.properties.maintype.systemtype == 'find') {
            var iconpath = '/static/images/icons/find.png';
        };


        var enttypes = currentfeature.properties.types;
        var entfiles = currentfeature.files;
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
                '</div>' +
                '<div id="'+ parentDiv + '_' + entId + '"></div>'

        );

        if (dateToInsert == '') {
            $( '#myModaltimespan' + entId ).attr("class","");
        };

        setImages(entId, entfiles);
        $('#myModalTypescontainer' + entId).empty();
          $.each(currentfeature.properties.types, function (t, types) {
             if ($('#myModalTypescontainer' + entId).is(':empty')) {
             $('#myModalTypescontainer' + entId).append('<p><h6>Properties</h6></p>');
             };
             var classification = types.name;
             var classtype = types.path;
             $('#myModalTypescontainer' + entId).append(
             '<div class="modalrowitem" title="' + classtype + '">' + classification + '</div>');
          });

          $('#myModalDimensionscontainer' + entId).empty();
          $.each(currentfeature.properties.dimensions, function (d, dimensions) {
             if ($('#myModalDimensionscontainer' + entId).is(':empty')) {
             $('#myModalDimensionscontainer' + entId).append('<p><h6>Dimensions</h6></p>');
             };
             var dimension = dimensions.name;
             var dimvalue = dimensions.value;

             if (dimension == 'Degrees') {
               $('#myModalDimensionscontainer' + entId).append(
                  '<div class="modalrowitem">' + dimension + ': ' + dimvalue + '°</div>');
             };

             if (dimension == 'Weight') {
               $('#myModalDimensionscontainer' + entId).append(
                  '<div class="modalrowitem">' + dimension + ': ' + dimvalue + ' g</div>');
             };

             if (dimension !== 'Degrees' && dimension !== 'Weight') {
               $('#myModalDimensionscontainer' + entId).append(
                  '<div class="modalrowitem">' + dimension + ': ' + dimvalue + ' cm</div>');
             };

          });

          $('#myModalMaterialcontainer' + entId).empty();
          $.each(currentfeature.properties.material, function (d, material) {
             if ($('#myModalMaterialcontainer' + entId).is(':empty')) {
             $('#myModalMaterialcontainer' + entId).append('<p><h6>Material</h6></p>');
             };
             var materialname = material.name;
             var matvalue = material.value;
             var matpath = material.path;
             if (matvalue > 0) {
                $('#myModalMaterialcontainer' + entId).append(
                '<div class="modalrowitem" title="' + matpath + '">' + materialname + ': ' + matvalue + '%</div>');
                };
             if (matvalue == 0) {
                $('#myModalMaterialcontainer' + entId).append(
                '<div class="modalrowitem" title="' + matpath + '">' + materialname + '</div>');
                };
          });

        var parentDiv = (parentDiv + '_' + entId);
        $.each(children, function (c, child) {
            getModalData(parentDiv, child, timespan)}); //loop throuh subunits until finds
}

//set images in modal
function setImages(entId, entfiles) {
  if (entfiles !== undefined){

              //append one image without slides
              if (entfiles.length == 1) {
                 $( '#myModalImagecontainer' + entId ).attr("class","col-md-4 col-sm-6");
                 $( '#myModalData_' + entId ).attr("class", "col-md-8 col-sm-6" );
                 $( '#myModalImagecontainer' + entId ).empty();
                 $.each(entfiles, function (f, files) {
                  $( '#myModalImagecontainer' + entId ).append(
                       '<img src="https://dppopenatlas.oeaw.ac.at/display/' + files.id + '.bmp" class="modalimg" id="mymodalimg">'
                  )
                  });
              };

              //append more than one image with slides
              if (entfiles.length !== 1){
              $( '#myModalImagecontainer' + entId ).attr("class","col-md-4 col-sm-6");
              $( '#myModalData_' + entId ).attr("class", "col-md-8 col-sm-6" );
              $( '#myModalImagecontainer' + entId ).empty();
              firstimage = entfiles[0].id;
              secondimage = entfiles[1].id;
              //create carousel and apppend first two images
              $( '#myModalImagecontainer' + entId ).append(

                     '<div id="carouselExampleIndicators' + entId + '" class="carousel slide" data-ride="carousel" data-interval="false">' +
                           '<ol id="mymodalimageindicators' + entId + '" class="carousel-indicators">' +
                                '<li data-target="#carouselExampleIndicators' + entId + '" data-slide-to="0" class="active"></li>' +
                                '<li data-target="#carouselExampleIndicators' + entId + '" data-slide-to="1"></li>' +
                           '</ol>' +
                       '<div id="mycarouselimages' + entId + '" class="carousel-inner">' +
                            '<div class="carousel-item active">' +
                                 '<img class="d-block modalimg" src="https://dppopenatlas.oeaw.ac.at/display/' + firstimage + '.bmp">' +
                            '</div>' +
                            '<div class="carousel-item">' +
                                 '<img class="d-block modalimg" src="https://dppopenatlas.oeaw.ac.at/display/' + secondimage + '.bmp">' +
                            '</div>' +
                       '</div>' +
                       '<a class="carousel-control-prev" href="#carouselExampleIndicators' + entId + '" role="button" data-slide="prev">' +
                          '<span aria-hidden="true"><button onclick="this.blur()" type="button" class="btn btn-secondary"><</button></span>' +
                          '<span class="sr-only">Previous</span>' +
                       '</a>' +
                       '<a class="carousel-control-next" href="#carouselExampleIndicators' + entId + '" role="button" data-slide="next">' +
                           '<span aria-hidden="true"><button onclick="this.blur()"type="button" class="btn btn-secondary">></button></span>' +
                           '<span class="sr-only">Next</span>' +
                        '</a>' +
                     '</div>'
              );

              //append further images to carousel
              $.each(entfiles, function (f, files) {
                  if(f > 1) {
                     $( '#mycarouselimages' + entId ).append(
                       '<div class="carousel-item">' +
                             '<img class="d-block modalimg" src="https://dppopenatlas.oeaw.ac.at/display/' + files.id + '.bmp">' +
                       '</div>'
                     );
                     $( '#mymodalimageindicators' + entId ).append(
                        '<li data-target="#carouselExampleIndicators' + entId + '" data-slide-to="' + f + '"></li>'
                     );
                  };
              });
              };

          };

          //remove image column and
          if (entfiles == undefined){
              $( '#myModalImagecontainer' + entId ).attr("class","");
              $( '#myModalImagecontainer' + entId ).empty();
              $( '#myModalData_' + entId ).attr("class", "modalwithoutimage" );
          };

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
  $('#myModal').modal();
}
