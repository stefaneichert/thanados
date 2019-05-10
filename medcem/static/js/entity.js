console.log(jsonmysite);

sitename = jsonmysite.name;
console.log(sitename);
console.log(systemtype);

$('#mybreadcrumb').append(
        '<nav aria-label="breadcrumb">' +
        '<ol id="mybreadcrumbs" class="breadcrumb">' +
        '<li class="breadcrumb-item"><a href="/entity/view/' + jsonmysite.site_id + '">' + sitename + '</a></li>' +
        '</ol>' +
        '</nav>');

if (systemtype == 'place') {
    getEntityData(sitename, jsonmysite.id, jsonmysite);
}


if (systemtype == 'feature') {
    $.each(jsonmysite.features, function (f, feature) {
        if (entity_id == feature.id) {
            graveName = feature.properties.name;
            graveId = feature.id;
            graveGeom = feature.geometry;
            getEntityData(sitename, place_id, feature);
            $('#mybreadcrumbs').append('<li class="breadcrumb-item"><a href="/entity/view/' + entId + '">' + entName + '</a></li>');
        }
        ;
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
                        '<li class="breadcrumb-item"><a href="/entity/view/' + graveId + '">' + graveName + '</a></li>' +
                        '<li class="breadcrumb-item"><a href="/entity/view/' + entId + '">' + entName + '</a></li>'
                        );
            }
            ;
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
                            '<li class="breadcrumb-item"><a href="/entity/view/' + graveId + '">' + graveName + '</a></li>' +
                            '<li class="breadcrumb-item"><a href="/entity/view/' + burialId + '">' + burialName + '</a></li>' +
                            '<li class="breadcrumb-item"><a href="/entity/view/' + entId + '">' + entName + '</a></li>'
                            );
                }
                ;
            });
        });
    });
}





function getEntityData(parentName, parentId, currentfeature) {
    if (currentfeature.type == "FeatureCollection") {
        entId = currentfeature.site_id;
        entName = currentfeature.name;
    } else {
        entId = currentfeature.id;
        entName = currentfeature.properties.name;
    }
    entDesc = currentfeature.properties.description;
    if (typeof entDesc == 'undefined') {
        entDesc = '';
    }
    ;
    entType = currentfeature.properties.maintype.name;
    typepath = currentfeature.properties.maintype.path;
    if (typeof (currentfeature.properties.timespan) !== 'undefined' && typeof (currentfeature.properties.timespan.begin_from) !== 'undefined')
        tsbegin = parseInt((currentfeature.properties.timespan.begin_from), 10);
    if (typeof (currentfeature.properties.timespan) !== 'undefined' && typeof (currentfeature.properties.timespan.end_to) !== 'undefined')
        tsend = parseInt((currentfeature.properties.timespan.end_to), 10);
    timespan = tsbegin + ' to ' + tsend;
    dateToInsert = timespan;
    if (typeof tsbegin == 'undefined') {
        dateToInsert = '';
    }
    ;

    if (currentfeature.properties.maintype.systemtype == 'place') {
        children = currentfeature.features;
    }
    ;

    if (currentfeature.properties.maintype.systemtype == 'feature') {
        if (typeof (currentfeature.burials) !== 'undefined') {
            children = currentfeature.burials;
        } else {
            children = '';
        }
    }
    ;

    if (currentfeature.properties.maintype.systemtype == 'stratigraphic unit') {
        if (typeof (currentfeature.finds) !== 'undefined') {
            children = currentfeature.finds;
        } else {
            children = '';
        }
    }

    if (currentfeature.properties.maintype.systemtype == 'find') {
        children = '';
    }
    ;

    enttypes = currentfeature.properties.types;
    if (currentfeature.type == "FeatureCollection") {
        entfiles = currentfeature.properties.files;
    } else {
        entfiles = currentfeature.files;
    }
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
            '<div id="myMetadatacontainer' + entId + '"></div>' +
            '</div>' +
            '</div>'
            );

    if (dateToInsert == '') {
        $('#mytimespan' + entId).attr("class", "");
    }
    ;

    setImages(entId, entfiles);

    $('#myTypescontainer' + entId).empty();
    $.each(currentfeature.properties.types, function (t, types) {
        if ($('#myTypescontainer' + entId).is(':empty')) {
            $('#myTypescontainer' + entId).append('<p><h6>Properties</h6></p>');
        }
        ;
        var classification = types.name;
        var classtype = types.path;
        $('#myTypescontainer' + entId).append(
                '<div class="modalrowitem" title="' + classtype + '">' + classification + '</div>');
    });

    $('#myDimensionscontainer' + entId).empty();
    $.each(currentfeature.properties.dimensions, function (d, dimensions) {
        if ($('#myDimensionscontainer' + entId).is(':empty')) {
            $('#myDimensionscontainer' + entId).append('<p><h6>Dimensions</h6></p>');
        }
        ;
        var dimension = dimensions.name;
        var dimvalue = dimensions.value;

        if (dimension == 'Degrees') {
            $('#myDimensionscontainer' + entId).append(
                    '<div class="modalrowitem">' + dimension + ': ' + dimvalue + '°</div>');
        }
        ;

        if (dimension == 'Weight') {
            $('#myDimensionscontainer' + entId).append(
                    '<div class="modalrowitem">' + dimension + ': ' + dimvalue + ' g</div>');
        }
        ;

        if (dimension !== 'Degrees' && dimension !== 'Weight') {
            $('#myDimensionscontainer' + entId).append(
                    '<div class="modalrowitem">' + dimension + ': ' + dimvalue + ' cm</div>');
        }
        ;

    });

    $('#myMaterialcontainer' + entId).empty();
    $.each(currentfeature.properties.material, function (d, material) {
        if ($('#myMaterialcontainer' + entId).is(':empty')) {
            $('#myMaterialcontainer' + entId).append('<p><h6>Material</h6></p>');
        }
        ;
        var materialname = material.name;
        var matvalue = material.value;
        var matpath = material.path;
        if (matvalue > 0) {
            $('#myMaterialcontainer' + entId).append(
                    '<div class="modalrowitem" title="' + matpath + '">' + materialname + ': ' + matvalue + '%</div>');
        }
        ;
        if (matvalue == 0) {
            $('#myMaterialcontainer' + entId).append(
                    '<div class="modalrowitem" title="' + matpath + '">' + materialname + '</div>');
        }
        ;
    });


    $('#myMetadatacontainer' + entId).empty();
    if (typeof (currentfeature.properties.references) !== 'undefined') {
        $('#myMetadatacontainer' + entId).append(
                '<p><h6>Bibliography</h6></p>' +
                '<table class="table table-sm table-hover">' +
                '<thead class="thead-light">' +
                '<tr>' +
                '<th scope="col">#</th>' +
                '<th scope="col">Title</th>' +
                '<th scope="col">Page</th>' +
                '</tr>' +
                '</thead>' +
                '<tbody id="mytablebody">'
                );
    }

    $.each(currentfeature.properties.references, function (t, ref) {
        if (typeof (ref.title) !== 'undefined') {
            var title = ref.title
        } else
            var title = '';
        if (typeof (ref.reference) !== 'undefined') {
            var page = ref.reference
        } else
            var page = '';
        $('#mytablebody').append(
                '<tr>' +
                '<th scope="row">' + (t + 1) + '</th>' +
                '<td>' + title + '</td>' +
                '<td>' + page + '</td>' +
                '</tr>');
    });

    if (systemtype == 'place') {
        files = currentfeature.properties.files
    } else {
        files = currentfeature.files
    }
    ;
    if (typeof (files) !== 'undefined') {
        $('#myMetadatacontainer' + entId).append(
                '<p><h6>Files</h6></p>' +
                '<table class="table table-sm table-hover">' +
                '<thead class="thead-light">' +
                '<tr>' +
                '<th scope="col">#</th>' +
                '<th scope="col">ID</th>' +
                '<th scope="col">Name</th>' +
                '<th scope="col">Source</th>' +
                '<th scope="col">Ref.</th>' +
                '<th scope="col">License</th>' +
                '</tr>' +
                '</thead>' +
                '<tbody id="myfiletablebody">'
                );
    }

    $.each(files, function (t, file) {
        if (typeof (file.source) !== 'undefined') {
            var source = file.source
        } else
            var source = '';
        if (typeof (file.reference) !== 'undefined') {
            var reference = file.reference
        } else
            var reference = '';
        if (typeof (file.license) !== 'undefined') {
            var license = file.license
        } else
            var license = '';

        $('#myfiletablebody').append(
                '<tr>' +
                '<th scope="row">' + (t + 1) + '</th>' +
                '<td>' + file.id + '</td>' +
                '<td><a href="https://thanados.openatlas.eu/display/' + file.id + '.bmp" target="_blank">' + file.name + '</a></td>' +
                '<td>' + source + '</td>' +
                '<td>' + reference + '</td>' +
                '<td>' + license + '</td>' +
                '</tr>');
    });


    $.each(children, function (c, child) {
        if ($('#myChildrencontainer' + entId).is(':empty')) {
            $('#myChildrencontainer' + entId).append(
                    '<p>' +
                    '<div class="d-inline">' +
                    '<h6>' + children.length + ' Subunit(s)<a href="#" onclick="toggleSubunits()" title="show/hide"><i id="subbtn" class="collapsetitle1 collapsebutton1 fa fa-chevron-down"></i></a></h6>' +
                    '</div>' +
                    '</p>');
        }
        ;

        $('#myChildrencontainer' + entId).append(
                '<a class="modalrowitem subunits" href="/entity/view/' + child.id + '">' + child.properties.name + ': ' + child.properties.maintype.name + '</a>'
                );
    });

    if (children.length > 15) {
        toggleSubunits();
    }


    if (currentfeature.type !== "FeatureCollection") {
        if ($('#myParentcontainer' + entId).is(':empty')) {
            $('#myParentcontainer' + entId).append('<p><h6>Parent</h6></p>');
        }
        ;
        $('#myParentcontainer' + entId).append(
                '<a class="modalrowitem" href="/entity/view/' + parentId + '">' + parentName + '</a>'
                );
    }


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

    var myStyleSquare = {
        "color": "#6c757d",
        "weight": 1.5,
        "fillOpacity": 0.2,
        "dashArray": [4, 4]
    };

    var mymap = L.map('myMapcontainer', {
        zoom: 25,
        layers: [landscape]
    });


//add graves

    function polygonFilter(feature) {
        if (feature.geometry.type == "Polygon")
            return true
    }

//filter to get points from the geojson
    function pointFilter(feature) {
        if (feature.geometry.type == "Point")
            return true
    }

    graves = L.geoJSON(jsonmysite, {
        filter: polygonFilter,
        style: myStyle});

    graves.addTo(mymap);

//if geometry is point create a rectangle around that point
    pointgraves = L.geoJSON(jsonmysite, {
        filter: pointFilter,
        pointToLayer: function (feature, latlng) {
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
        name: jsonmysite.name,
        properties: jsonmysite.properties,
        site_id: jsonmysite.site_id
    });

    mymap.fitBounds(graves.getBounds());

    if (currentfeature.type !== "FeatureCollection") {
        var polys = L.geoJSON(mypolyjson, {
            onEachFeature: function (feature, layer) {
                if (graveId == feature.id) {
                    var polyPoints = layer.getLatLngs();
                    var selectedpoly = L.polygon(polyPoints, {color: 'red'}).addTo(mymap);
                    boundscenter = (selectedpoly.getBounds()).getCenter();
                }
                ;
            }
        })
    }
    ;

    L.control.scale({imperial: false}).addTo(mymap);




    var maximumHeight = (($(window).height() - $('#mynavbar').height()) - $('#mybreadcrumb').height());
    $('#mycontent').css('max-height', (maximumHeight - 17) + 'px');

    $(window).resize(function () {
        var maximumHeight = (($(window).height() - $('#mynavbar').height()) - $('#mybreadcrumb').height());
        $('#mycontent').css('max-height', (maximumHeight - 17) + 'px');
    });


}


function setImages(entId, entfiles) {
    if (entfiles !== undefined) {

        //append one image without slides
        if (entfiles.length == 1) {
            $('#myImagecontainer' + entId).empty();
            $.each(entfiles, function (f, files) {
                $('#myImagecontainer' + entId).append(
                        '<img src="https://thanados.openatlas.eu/display/' + files.id + '.bmp" class="modalimg" id="mymodalimg">'
                        )
            });
        }
        ;

        //append more than one image with slides
        if (entfiles.length !== 1) {
            $('#myImagecontainer' + entId).empty();
            firstimage = entfiles[0].id;
            secondimage = entfiles[1].id;
            //create carousel and apppend first two images
            $('#myImagecontainer' + entId).append(
                    '<div id="carouselExampleIndicators' + entId + '" class="carousel slide" data-ride="carousel" data-interval="false">' +
                    '<ol id="mymodalimageindicators' + entId + '" class="carousel-indicators">' +
                    '<li data-target="#carouselExampleIndicators' + entId + '" data-slide-to="0" class="active"></li>' +
                    '<li data-target="#carouselExampleIndicators' + entId + '" data-slide-to="1"></li>' +
                    '</ol>' +
                    '<div id="mycarouselimages' + entId + '" class="carousel-inner">' +
                    '<div class="carousel-item active">' +
                    '<img class="d-block modalimg" src="https://thanados.openatlas.eu/display/' + firstimage + '.bmp">' +
                    '</div>' +
                    '<div class="carousel-item">' +
                    '<img class="d-block modalimg" src="https://thanados.openatlas.eu/display/' + secondimage + '.bmp">' +
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
                if (f > 1) {
                    $('#mycarouselimages' + entId).append(
                            '<div class="carousel-item">' +
                            '<img class="d-block modalimg" src="https://thanados.openatlas.eu/display/' + files.id + '.bmp">' +
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

    } else {
        $('#myImagecontainer' + entId).remove()
    }
}

function toggleSubunits() {
    var down = ($('#subbtn').hasClass("fa-chevron-down"));
    if (down) {
        $('#subbtn').removeClass('fa-chevron-down').addClass('fa-chevron-right');
    }
    if (down === false) {
        $('#subbtn').removeClass('fa-chevron-right').addClass('fa-chevron-down');
    }
    $('.subunits').toggle();
}
