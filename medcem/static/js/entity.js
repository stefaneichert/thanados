console.log(jsonmysite);

sitename = jsonmysite.name;
console.log(sitename);
console.log(systemtype);

$('#mybreadcrumb').append(
 '<nav aria-label="breadcrumb">' +
  '<ol id="mybreadcrumbs" class="breadcrumb">' +
    '<li class="breadcrumb-item"><a href="#">' + sitename + '</a></li>' +
    '</ol>' +
'</nav>');

if (systemtype == 'feature') {
   $.each(jsonmysite.features, function (f, feature) {
       if (entity_id == feature.id) {
           graveName = feature.properties.name;
           graveId= feature.id;
           graveGeom = feature.geometry;
           getEntityData(sitename, place_id, feature);
           $('#mybreadcrumbs').append('<li class="breadcrumb-item"><a href="../' + place_id + '/' + entId + '">' + entName + '</a></li>');
       };
   });
}


if (systemtype == 'stratigraphic unit') {
   $.each(jsonmysite.features, function (f, feature) {
       var featureName = feature.properties.name;
       var featureID = feature.id;
       var featureGeom = feature.geometry;
       $.each(feature.burials, function (b, burial) {
         if (entity_id == burial.id) {
             graveName = featureName;
             graveId = featureID;
             graveGeom = featureGeom;
             getEntityData(graveName, graveId, burial);
            $('#mybreadcrumbs').append(
                      '<li class="breadcrumb-item"><a href="../' + place_id + '/' + graveId + '">' + graveName + '</a></li>'+
                      '<li class="breadcrumb-item"><a href="../' + place_id + '/' + entId + '">' + entName + '</a></li>'
                      );
         };
       });
       });
}


if (systemtype == 'find') {
   $.each(jsonmysite.features, function (f, feature) {
       var featureName = feature.properties.name;
       var featureID = feature.id;
       var featureGeom = feature.geometry;
       $.each(feature.burials, function (b, burial) {
             var stratName = burial.properties.name;
             var stratID = burial.id;
             $.each(burial.finds, function (f, find) {
                if (entity_id == find.id) {
                   graveName = featureName;
                   graveId = featureID;
                   graveGeom = featureGeom;
                   burialName = stratName;
                   burialId = stratID;
                   getEntityData(burialName, burialId, find);
                   $('#mybreadcrumbs').append(
                      '<li class="breadcrumb-item"><a href="../' + place_id + '/' + graveId + '">' + graveName + '</a></li>'+
                      '<li class="breadcrumb-item"><a href="../' + place_id + '/' + burialId + '">' + burialName + '</a></li>'+
                      '<li class="breadcrumb-item"><a href="../' + place_id + '/' + entId + '">' + entName + '</a></li>'
                      );
         };
       });
       });
       });
}



    console.log(entId);
    console.log(entName);
    console.log(entDesc);
    console.log(entType);
    console.log(typepath);
    console.log(dateToInsert);
    console.log(children);
    console.log(entfiles);
    console.log(entdims);
    console.log(entmaterial);



function getEntityData(parentName, parentId, currentfeature) {
        entId = currentfeature.id;
        entName = currentfeature.properties.name;
        entDesc = currentfeature.properties.description;
        if (typeof entDesc == 'undefined') {entDesc = '';};
        entType = currentfeature.properties.maintype.name;
        typepath =  currentfeature.properties.maintype.path;
        if (typeof(currentfeature.properties.timespan) !== 'undefined' && typeof(currentfeature.properties.timespan.begin_from) !== 'undefined') tsbegin = parseInt((currentfeature.properties.timespan.begin_from), 10);
        if (typeof(currentfeature.properties.timespan) !== 'undefined' && typeof(currentfeature.properties.timespan.end_to) !== 'undefined') tsend = parseInt((currentfeature.properties.timespan.end_to), 10);
        timespan = tsbegin + ' to ' + tsend;
        dateToInsert = timespan;
        if (typeof tsbegin == 'undefined') {dateToInsert = '';};

        if (currentfeature.properties.maintype.systemtype == 'feature') {
            children = currentfeature.burials;
            iconpath = '/static/images/icons/grave30px.png';
        };

        if (currentfeature.properties.maintype.systemtype == 'stratigraphic unit') {
        children = currentfeature.finds;
        iconpath = '/static/images/icons/burial.png';
        }

        if (currentfeature.properties.maintype.systemtype == 'find') {
            iconpath = '/static/images/icons/find.png';
            children = '';
        };

        enttypes = currentfeature.properties.types;
        entfiles = currentfeature.files;
        entdims = currentfeature.properties.dimensions;
        entmaterial = currentfeature.properties.material;
        $('#mycontent').append(
            '<div class="container-fluid">' +
                        '<div class="row">' +
                            '<div id="myData_' + entId + '" class="col-md">' +
                                '<h4 style="margin-bottom: 1em; margin-top: 0.5em" id="myname_' + entId + '">' + entName + '</h4>' +
                                '<div id="mytype_' + entId + '" class="modalrowitem" title="' + typepath + '">' + entType + '</div>' +
                                '<div id="mytimespan' + entId + '" class="modalrowitem">' + dateToInsert + '</div>' +
                                '<div id="myDescr' + entId + '">' + entDesc + '</div>' +
                                '<div id="myTypescontainer' + entId + '"></div>' +
                                '<div id="myDimensionscontainer' + entId + '"></div>' +
                                '<div id="myMaterialcontainer' + entId + '"></div>' +
                                '<div id="myChildrencontainer' + entId + '"></div>' +
                                '<div id="myParentcontainer' + entId + '"></div>' +
                            '</div>' +
                            '<div id="myImagecontainer' + entId + '" class="col-md-auto" style="margin-top: 4em" ></div>' +
                            '<div id="myMapcontainer" class="col-md" style="border: 1px solid rgba(0, 0, 0, 0.125); margin-top: 5.35em; margin-left: 1em; margin-right: 1em; width: 100%; height: 400px; margin-right: 1em"></div>' +
                            '</div>' +
                        '</div>' +
                    '</div>'
        );
        
        if (dateToInsert == '') {
            $( '#mytimespan' + entId ).attr("class","");
        };

        setImages(entId, entfiles);
        $('#myTypescontainer' + entId).empty();
          $.each(currentfeature.properties.types, function (t, types) {
             if ($('#myTypescontainer' + entId).is(':empty')) {
             $('#myTypescontainer' + entId).append('<p><h6>Properties</h6></p>');
             };
             var classification = types.name;
             var classtype = types.path;
             $('#myTypescontainer' + entId).append(
             '<div class="modalrowitem" title="' + classtype + '">' + classification + '</div>');
          });

          $('#myDimensionscontainer' + entId).empty();
          $.each(currentfeature.properties.dimensions, function (d, dimensions) {
             if ($('#myDimensionscontainer' + entId).is(':empty')) {
             $('#myDimensionscontainer' + entId).append('<p><h6>Dimensions</h6></p>');
             };
             var dimension = dimensions.name;
             var dimvalue = dimensions.value;

             if (dimension == 'Degrees') {
               $('#myDimensionscontainer' + entId).append(
                  '<div class="modalrowitem">' + dimension + ': ' + dimvalue + '°</div>');
             };

             if (dimension == 'Weight') {
               $('#myDimensionscontainer' + entId).append(
                  '<div class="modalrowitem">' + dimension + ': ' + dimvalue + ' g</div>');
             };

             if (dimension !== 'Degrees' && dimension !== 'Weight') {
               $('#myDimensionscontainer' + entId).append(
                  '<div class="modalrowitem">' + dimension + ': ' + dimvalue + ' cm</div>');
             };

          });

          $('#myMaterialcontainer' + entId).empty();
          $.each(currentfeature.properties.material, function (d, material) {
             if ($('#myMaterialcontainer' + entId).is(':empty')) {
             $('#myMaterialcontainer' + entId).append('<p><h6>Material</h6></p>');
             };
             var materialname = material.name;
             var matvalue = material.value;
             var matpath = material.path;
             if (matvalue > 0) {
                $('#myMaterialcontainer' + entId).append(
                '<div class="modalrowitem" title="' + matpath + '">' + materialname + ': ' + matvalue + '%</div>');
                };
             if (matvalue == 0) {
                $('#myMaterialcontainer' + entId).append(
                '<div class="modalrowitem" title="' + matpath + '">' + materialname + '</div>');
                };
          });

        $.each(children, function (c, child) {
            if ($('#myChildrencontainer' + entId).is(':empty')) {
             $('#myChildrencontainer' + entId).append('<p><h6>Subunits</h6></p>');
             };

            $('#myChildrencontainer' + entId).append(
            '<a class="modalrowitem" href="../' + place_id + '/' + child.id + '">' + child.properties.name + ': ' + child.properties.maintype.name + '</a>'
            );
        });

        if ($('#myParentcontainer' + entId).is(':empty')) {
             $('#myParentcontainer' + entId).append('<p><h6>Parent</h6></p>');
             };
        $('#myParentcontainer' + entId).append(
            '<a class="modalrowitem" href="../' + place_id + '/' + parentId + '">' + parentName + '</a>'
            );


        var landscape = L.tileLayer('https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=2245afa655044c5c8f5ef8c129c29cdb', {
           attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
           apikey: '<2245afa655044c5c8f5ef8c129c29cdb>',
           maxZoom: 30
        });

        var myStyle = {
          "color": "#6c757d",
          "weight": 1.5,
          "fillOpacity": 0.5
        };

        var mymap = L.map('myMapcontainer', {
          zoom: 25,
          layers: [landscape]
        });


//add graves
    var graves = L.geoJSON(jsonmysite, { style: myStyle }).addTo(mymap);
    mymap.fitBounds(graves.getBounds());

    var polys = L.geoJSON(jsonmysite, {
       onEachFeature: function (feature, layer) {
           if (graveId == feature.id) {
                   var polyPoints = layer.getLatLngs();
                   var selectedpoly = L.polygon(polyPoints, {color: 'red'}).addTo(mymap);
                   boundscenter = (selectedpoly.getBounds()).getCenter();
               };
           }
       })




    var maximumHeight = (($(window).height() - $('#mynavbar').height()) - $('#mybreadcrumb').height());
    $('#mycontent').css('max-height', (maximumHeight - 17) + 'px');

	$(window).resize(function () {
    var maximumHeight = (($(window).height() - $('#mynavbar').height()) - $('#mybreadcrumb').height());
    $('#mycontent').css('max-height', (maximumHeight - 17) + 'px');
});


}
       
       
function setImages(entId, entfiles) {
  if (entfiles !== undefined){

              //append one image without slides
              if (entfiles.length == 1) {
                 $( '#myImagecontainer' + entId ).empty();
                 $.each(entfiles, function (f, files) {
                  $( '#myImagecontainer' + entId ).append(
                       '<img src="https://dppopenatlas.oeaw.ac.at/display/' + files.id + '.bmp" class="modalimg" id="mymodalimg">'
                  )
                  });
              };

              //append more than one image with slides
              if (entfiles.length !== 1){
              $( '#myImagecontainer' + entId ).empty();
              firstimage = entfiles[0].id;
              secondimage = entfiles[1].id;
              //create carousel and apppend first two images
              $( '#myImagecontainer' + entId ).append(

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

          } else { $( '#myImagecontainer' + entId ).remove()}
}

mymap.panTo(boundscenter);
