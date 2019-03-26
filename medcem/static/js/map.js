//initiate map with certain json
$(document).ready(function () {
  //hardcoded first site
  myjson = jsonpohansko;
  setmap(myjson);
  console.log('Pohansko');
  console.log(myjson);
  startsearch(); //TODO remove afer
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
function animateSidebar() {
    var sidebarSize = $("#sidebar").width();
    switch (sidebarSize) {
        case 0:
            var sidebarNewSize = 350
            $('#sidebar-start').toggle(350);
            break;
        case 350:
            var sidebarNewSize = 0
            $('#sidebar-start').toggle(350);
            break;
        default:
            var sidebarNewSize = 350
            $('#sidebar-max').attr("disabled", false);
    }
    ;
    $("#sidebar").animate({
        width: sidebarNewSize + "px"
    }, 350, function () {
        map.invalidateSize();
    });
}
function animateSidebarMax() {
    $("#sidebar").animate({
        width: "100%"
    }, 350, function () {
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
$("#thunaubutton").click(function () {
    map.remove();
    $( "#accordion1" ).empty();
    myjson = jsonthunau;
    setmap(myjson);
    console.log('Thunau')
    console.log(myjson);
    $("#sidebarTitle").text("Thunau Obere Holzwiese");
    $("#mypanel").animate({ scrollTop: 0 });
    });

$("#pohanskobutton").click(function () {
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
        if (typeof(currentfeature.properties.timespan) !== 'undefined' && typeof(currentfeature.properties.timespan.begin_from) !== 'undefined') var tsbegin = parseInt(((currentfeature.properties.timespan.begin_from).substring(0, 4)), 10);
        if (typeof(currentfeature.properties.timespan) !== 'undefined' && typeof(currentfeature.properties.timespan.end_to) !== 'undefined') var tsend = parseInt(((currentfeature.properties.timespan.end_to).substring(0, 4)), 10);
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


//function to query json for types, values etc. recursively
$("#searchbutton").click(startsearch);

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
  //set global variables for intermediate search results
  jsonresult = {"type": "FeatureCollection", //prepare geojson
                 "features": []
                };
  finalSearchResult = [];  //array for intersection of search results
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
                 '<span class="input-group-text dim-label">Timespan between </span>' +
                 '</div>' +
                 '<input id="selectbegin_' + iter + '" class="form-control value-input" type="text">' +
                 '<span class="input-group-text input-group-middle">and </span>' +
                 '<input id="selectend_' + iter + '" class="form-control value-input" type="text">' +
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
                '<span class="input-group-text input-group-middle">between: </span>' +
                '<input id="dimbegin_' + iter + '" class="form-control value-input" type="text">' +
                '<span class="input-group-text input-group-middle">and </span>' +
                '<input id="dimend_' + iter + '" class="form-control value-input" type="text">' +
                '<div class="input-group-append">' +
                '<button class="btn btn-secondary btn-sm" type="button" id="dimbutton_' + iter + '" onclick="searchDim(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for dimension">' +
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
               '<span class="input-group-text input-group-middle">in % between: </span>' +
                '</div>' +
                '<input id="dimbegin_' + iter + '" class="form-control value-input" type="text">' +
                '<div class="input-group-append">' +
                    '<span class="input-group-text input-group-middle">and </span>' +
                '</div>' +
                '<input id="dimend_' + iter + '" class="form-control value-input" type="text">' +
                '<div class="input-group-append">' +
                '<button class="btn btn-secondary btn-sm" type="button" id="dimbutton_' + iter + '" onclick="searchDim(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for dimension">' +
                     '<i class="fas fa-search"></i>' +
                '</button>' +
                '</div>'

           );
}


function searchDim(criteria, appendLevel, iter, val1, val2) {
    $('#dimbutton_' + iter).remove();
    $( '#mysearchform').append(
       '<div id="DimResult_' + iter +'_parent" class="input-group input-group-sm mb-3">' +
         '<input id="DimResult_' + iter + '" class="form-control" onclick="this.blur()" type="text" disabled>' +
       '</div>'
    );
    $('#dimbegin_' + iter).prop('disabled', true);
    $('#dimend_' + iter).prop('disabled', true);
    var val1 =  $('#dimbegin_' + iter).val();
    var val2 =  $('#dimend_' + iter).val();
    var dimId = $( '#DimensionSelect_' + iter+ ' option:selected').val(); //set criteria variable
    if (criteria == 'material') var dimId = nodeIds;
    if (criteria == 'dimension') var dimId =  $( '#DimensionSelect_' + iter+ ' option:selected').val().toLowerCase();
    jsonquery(dimId, appendLevel, criteria, val1, val2);
    $('#DimResult_' + iter).val(uniqueSearchResult.length + ' matches in ' + searchResult.length + ' graves');
    appendPlus(iter);
}


function searchTime(criteria, appendLevel, iter, val1, val2) {
    $('#timespanbutton_' + iter).remove();
    $( '#mysearchform').append(
       '<div id="TimespanResult_' + iter +'_parent" class="input-group input-group-sm mb-3">' +
         '<input id="TimespanResult_' + iter + '" class="form-control" onclick="this.blur()" type="text" disabled>' +
       '</div>'
    );
    $('#selectbegin_' + iter).prop('disabled', true);
    $('#selectend_' + iter).prop('disabled', true);
    var val1 =  $('#selectbegin_' + iter).val();
    var val2 =  $('#selectend_' + iter).val();
    var nodeIds = [];
    jsonquery(nodeIds, appendLevel, criteria, val1, val2);
    $('#TimespanResult_' + iter).val(uniqueSearchResult.length + ' matches in ' + searchResult.length + ' graves');
    appendPlus(iter);
}

function validateValues(criteria, appendLevel, iter, val1, val2) {

    console.log(typeof(val1));
    console.log(typeof(val2));
    if (typeof(val1) == 'string') var val1 = parseFloat(val1.replace(',','.').replace(' ',''));
    if (typeof(val2) == 'string') var val2 = parseFloat(val2.replace(',','.').replace(' ',''));
    console.log ('val1: ' + val1 + '; val2: ' + val2);

    if (val1 > val2) {
        alert('First value must be lower than second value');
    }

    if (criteria == 'material') {
        if (val1 <0 || val2 <0 || val1 >100 || val2 >100) alert('Values must be between 0 and 100 (%)');
    };
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
    //zeros to below or above zero due to zero behaves like undefined
    if (val1 == '0')
        var val1 = "-0.1";
    if (val2 == '0')
        var val2 = "0.1";
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

    if (val1 > val2) {
        alert('First value must be lower than second value');
        return;
    }

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