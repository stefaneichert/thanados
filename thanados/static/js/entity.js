sitename = jsonmysite.name;

$('#mybreadcrumb').append(
    '<nav aria-label="breadcrumb">' +
    '<ol id="mybreadcrumbs" class="breadcrumb">' +
    '<li class="breadcrumb-item"><a href="/entity/view/' + jsonmysite.site_id + '">' + sitename + '</a></li>' +
    '</ol>' +
    '</nav>');


if (systemtype == 'place') {
    getEntityData(sitename, jsonmysite.id, jsonmysite);
    mycitation = '"' + sitename + '".';
    myjson = jsonmysite;
}


if (systemtype == 'feature') {
    $.each(jsonmysite.features, function (f, feature) {
        if (entity_id == feature.id) {
            graveName = feature.properties.name;
            graveId = feature.id;
            graveGeom = feature.geometry;
            getEntityData(sitename, place_id, feature);
            $('#mybreadcrumbs').append('<li class="breadcrumb-item"><a href="/entity/view/' + entId + '">' + entName + '</a></li>');
            mycitation = '"' + sitename + ': ' + entName + '".';
            myjson = {
                "type": "FeatureCollection", //prepare geojson
                "features": [feature],
                "properties": jsonmysite.properties,
                "site_id": jsonmysite.site_id,
                "name": jsonmysite.name
            };
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
                mycitation = '"' + sitename + ': ' + graveName + ': ' + entName + '".';
                myjson = {
                    "type": "FeatureCollection", //prepare geojson
                    "features": [feature],
                    "properties": jsonmysite.properties,
                    "site_id": jsonmysite.site_id,
                    "name": jsonmysite.name
                };

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
                    mycitation = '"' + sitename + ': ' + graveName + ': ' + burialName + ': ' + entName + '".';
                    myjson = {
                        "type": "FeatureCollection", //prepare geojson
                        "features": [feature],
                        "properties": jsonmysite.properties,
                        "site_id": jsonmysite.site_id,
                        "name": jsonmysite.name
                    };
                }
                ;
            });
        });
    });
}


mycitation1 = ' From: Stefan Eichert et al., THANADOS: >>' + window.location + '<<. After: ';


function getEntityData(parentName, parentId, currentfeature) {
    globalfeature = currentfeature;
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
    var tsbegin;
    var tsend;
    if (typeof (currentfeature.properties.timespan) !== 'undefined' && typeof (currentfeature.properties.timespan.begin_from) !== 'undefined') {
        tsbegin = parseInt((currentfeature.properties.timespan.begin_from), 10);
        if (typeof (currentfeature.properties.timespan) !== 'undefined' && typeof (currentfeature.properties.timespan.end_to) !== 'undefined')
            tsend = parseInt((currentfeature.properties.timespan.end_to), 10)
    }
    ;
    if (typeof (tsbegin !== 'undefined')) timespan = tsbegin + ' to ' + tsend;
    if (typeof tsbegin == 'undefined') {
        timespan = '';
    }
    ;
    dateToInsert = timespan;

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
        '<div class="row">' +
        '<h4 style="margin-bottom: 1em; margin-top: 0.5em; margin-left: 0.5em" id="myname_' + entId + '" title="Name of entity">' + entName + '</h4>' +
        '<div style="margin-top: 0.8em; margin-bottom: 0.8em; margin-right: 0.8em; margin-left: auto">' +
        '<button type="button" onclick="this.blur()" class="btn btn-sm btn-secondary" data-toggle="modal" data-target="#citeModal" title="How to cite this"><i class="fas fa-quote-right"></i></button>' +
        '<button type="button" style="margin-left: 0.1em" onclick="this.blur(); exportToJsonFile(myjson)" class="btn btn-sm btn-secondary" title="Download data as GeoJSON"><i class="fas fa-download"></i></button>' +
        '<button type="button" style="margin-left: 0.1em" onclick="this.blur(); openInNewTab(\'/map/\' + place_id)" class="btn btn-sm btn-secondary" title="Open detailed map of this site">Map</button>' +
        '</div>' +
        '</div>' +
        '<div id="mytype_' + entId + '" class="modalrowitem" title="' + typepath + '">' + entType + '</div>' +
        '<div id="mytimespan' + entId + '" class="modalrowitem" title="Timespan/daterange of entity">' + dateToInsert + '</div>' +
        '<div id="myDescr' + entId + '" title="Description of entity">' + entDesc + '</div>' +
        '<div id="myTypescontainer' + entId + '"></div>' +
        '<div id="myDimensionscontainer' + entId + '"></div>' +
        '<div id="myMaterialcontainer' + entId + '"></div>' +
        '<div id="myParentcontainer' + entId + '"></div>' +
        '</div>' +
        '<div id="myImagecontainer' + entId + '" class="col-md-auto" style="margin-top: 4em" ></div>' +
        '<div id="myMapcontainer" title="Static map of site with entity higlighted. For interactive map please click the map button in the left top corner." class="col-md" style="border: 1px solid rgba(0, 0, 0, 0.125); margin-top: 5.35em; margin-left: 1em; margin-right: 1em; width: 100%; height: 400px; margin-right: 1em"></div>' +
        '</div>' +
        '<div id="myChildrencontainer' + entId + '"></div>' +
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
        var typevalue = types.value;
        var typeunit = types.description;
        if (typeof(typevalue) !== 'undefined') var classification = (types.name + ': ' + typevalue + ' ' + typeunit);
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
    $('#myMetadatacontainer' + entId).append(
        '<p><h6>Sources</h6></p>' +
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

    if (typeof (currentfeature.properties.references) !== 'undefined') {
        $.each(currentfeature.properties.references, function (t, ref) {
            if (typeof (ref.title) !== 'undefined') {
                title = ref.title;
                citeme = title;
            } else {
                title = '';
                citeme = 'unknown source';
            }
            if (typeof (ref.reference) !== 'undefined') {
                page = ref.reference
                citeme = citeme + ' ' + page + '.';
            } else
                page = '';

            $('#mytablebody').append(
                '<tr>' +
                '<th scope="row">' + (t + 1) + '</th>' +
                '<td>' + title + '</td>' +
                '<td>' + page + '</td>' +
                '</tr>');
            if (t == 0) {
                mycitation2 = citeme
            } else {
                mycitation2 += '. ' + citeme
            }
            ;
        });
    } else {
        $.each(jsonmysite.properties.references, function (t, ref) {
            if (typeof (ref.title) !== 'undefined') {
                title = ref.title;
                citeme = title;
            } else {
                title = '';
                citeme = 'unknown source';
            }
            if (typeof (ref.reference) !== 'undefined') {
                page = ref.reference;
                citeme = citeme + ' ' + page;
            } else {
                page = '';
            }
            $('#mytablebody').append(
                '<tr>' +
                '<th scope="row">' + (t + 1) + '</th>' +
                '<td>' + title + '</td>' +
                '<td>' + page + '</td>' +
                '</tr>');
            if (t == 0) {
                mycitation2 = citeme
            } else {
                mycitation2 += '. ' + citeme
            }
            ;
        });
    }
    ;

    if (typeof (currentfeature.properties.externalreference) !== 'undefined') {
        $('#myMetadatacontainer' + entId).append(
            '<p><h6>External references</h6></p>' +
            '<table class="table table-sm table-hover">' +
            '<thead class="thead-light">' +
            '<tr>' +
            '<th scope="col">#</th>' +
            '<th scope="col">URL</th>' +
            '<th scope="col">Name</th>' +
            '<th scope="col">Description</th>' +
            '</tr>' +
            '</thead>' +
            '<tbody id="myexttablebody">'
        );
    }

    $.each(currentfeature.properties.externalreference, function (t, ref) {
        if (typeof (ref.url) !== 'undefined') {
            url = ref.url
        } else
            url = '';
        if (typeof (ref.name) !== 'undefined') {
            name = ref.name
        } else
            name = '';
        if (typeof (ref.description) !== 'undefined') {
            description = ref.description
        } else
            description = '';
        $('#myexttablebody').append(
            '<tr>' +
            '<th scope="row">' + (t + 1) + '</th>' +
            '<td><a href="' + url + '">' + url + '</a></td>' +
            '<td>' + name + '</td>' +
            '<td>' + description + '</td>' +
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
            source = file.source
        } else
            source = '';
        if (typeof (file.reference) !== 'undefined') {
            reference = file.reference
        } else
            reference = '';
        if (typeof (file.license) !== 'undefined') {
            license = file.license
        } else
            license = '';

        $('#myfiletablebody').append(
            '<tr>' +
            '<th scope="row">' + (t + 1) + '</th>' +
            '<td>' + file.id + '</td>' +
            '<td><a href="/static/images/entities/' + file.id + '.jpg">' + file.name + '</a></td>' +
            '<td>' + source + '</td>' +
            '<td>' + reference + '</td>' +
            '<td>' + license + '</td>' +
            '</tr>');
    });

    if (children != '' && children[0].id !== 0) {
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
                '<a class="modalrowitem subunits" href="/entity/view/' + child.id + '" title="' + child.properties.maintype.name + '">' + child.properties.name + '</a>'
            );
        });
    }
    ;

    if (children.length > 200) {
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


    landscape = L.tileLayer('https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=2245afa655044c5c8f5ef8c129c29cdb', {
        attribution: 'Tiles: &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        apikey: '<2245afa655044c5c8f5ef8c129c29cdb>',
        maxZoom: 22
    });

    myStyle = {
        "color": "rgba(0,123,217,0.75)",
        "weight": 1.5,
        "fillOpacity": 0.8
    };

    myStyleSquare = {
        "color": "rgba(0,123,217,0.75)",
        "weight": 1.5,
        "fillOpacity": 0.5,
        "dashArray": [4, 4]
    };

    mymap = L.map('myMapcontainer', {
        zoom: 18,
        keyboard: false,
        dragging: false,
        zoomControl: false,
        boxZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        tap: false,
        touchZoom: false,
        layers: [landscape]
    });


//add graves
    if (children != '' && children[0].id !== 0 || globalfeature.properties.maintype.systemtype !== 'feature') {
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
            style: myStyle
        });

        graves.addTo(mymap);

//if geometry is point create a rectangle around that point
        pointgraves = L.geoJSON(jsonmysite, {
            filter: pointFilter,
            pointToLayer: function (feature, latlng) {
                lefttoplat = (latlng.lat - 0.000003);
                lefttoplon = (latlng.lng - 0.000005);
                rightbottomlat = (latlng.lat + 0.000003);
                rightbottomlon = (latlng.lng + 0.000005);
                bounds = [[lefttoplat, lefttoplon], [rightbottomlat, rightbottomlon]];
                rect = L.rectangle(bounds).toGeoJSON(13);
                //point = L.marker(latlng).addTo(mymap)
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
        if ((mymap.getZoom()) > 20) mymap.setZoom(20);


        if (currentfeature.type !== "FeatureCollection") {
            polys = L.geoJSON(mypolyjson, {
                onEachFeature: function (feature, layer) {
                    if (graveId == feature.id) {
                        polyPoints = layer.getLatLngs();
                        selectedpoly = L.polygon(polyPoints, {color: 'red'}).addTo(mymap);
                        boundscenter = (selectedpoly.getBounds()).getCenter();
                    }
                    ;
                }
            })
        }
        ;
    }
    ;

    if (children !== '') {if (children[0].id == 0) {
        graves = L.marker([jsonmysite.properties.center.coordinates[1], jsonmysite.properties.center.coordinates[0]]).addTo(mymap);

    }};
    L.control.scale({imperial: false}).addTo(mymap);


    maximumHeight = (($(window).height() - $('#mynavbar').height()) - $('#mybreadcrumb').height());
    $('#mycontent').css('max-height', (maximumHeight - 17) + 'px');

    $(window).resize(function () {
        maximumHeight = (($(window).height() - $('#mynavbar').height()) - $('#mybreadcrumb').height());
        $('#mycontent').css('max-height', (maximumHeight - 17) + 'px');
    });

    var osm2 = new L.TileLayer('https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=2245afa655044c5c8f5ef8c129c29cdb',
        {
            apikey: '<2245afa655044c5c8f5ef8c129c29cdb>',
            minZoom: 0,
            maxZoom: 13,
            attribution: 'Tiles: &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }
    );
    var rect1 = {color: "#ff1100", weight: 15};

    if (children != '' && children[0].id !== 0 || globalfeature.properties.maintype.systemtype !== 'find'|| globalfeature.properties.maintype.systemtype !== 'stratigraphic unit') {
        mapcenter = mymap.getCenter();
    } else {
        mapcenter = graves.getLatLng();
        mymap.panTo(mapcenter);
        if ((mymap.getZoom()) > 20) mymap.setZoom(20);
    }
    ;

    var miniMap = new L.Control.MiniMap(osm2,
        {
            centerFixed: mapcenter,
            zoomLevelFixed: 6,
            toggleDisplay: true,
            collapsedWidth: 24,
            collapsedHeight: 24,
            aimingRectOptions: rect1
        }).addTo(mymap);

    L.easyButton('fas fa-map-marked-alt', function (btn, map) {
        openInNewTab('/map/' + place_id);
        'Open detailed map of site'
    }).addTo(mymap);
    attributionChange();
}


function setImages(entId, entfiles) {
    if (entfiles !== undefined) {

        //append one image without slides
        if (entfiles.length == 1) {
            $('#myImagecontainer' + entId).empty();
            $.each(entfiles, function (f, files) {
                $('#myImagecontainer' + entId).append(
                    '<a href="/static/images/entities/' + files.id + '.jpg" data-featherlight><img src="/static/images/entities/' + files.id + '.jpg" class="modalimg" id="mymodalimg"></a>'
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

    } else {
        $('#myImagecontainer' + entId).remove()
    }
}

function toggleSubunits() {
    down = ($('#subbtn').hasClass("fa-chevron-down"));
    if (down) {
        $('#subbtn').removeClass('fa-chevron-down').addClass('fa-chevron-right');
    }
    if (down === false) {
        $('#subbtn').removeClass('fa-chevron-right').addClass('fa-chevron-down');
    }
    $('.subunits').toggle();
}

today = new Date();
dd = String(today.getDate()).padStart(2, '0');
mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
yyyy = today.getFullYear();

today = yyyy + '/' + mm + '/' + dd;
mysource = (mycitation + mycitation1 + mycitation2 + ' [Accessed: ' + today + ']');
mysource = mysource.replace(/(\r\n|\n|\r)/gm, "");
$('#mycitation').append('<div style="border: 1px solid #dee2e6; border-radius: 5px; padding: 0.5em; color: #495057; font-size: 0.9em;" id="Textarea1">' + mysource + '</div>');
L.extend(myjson, {//add necessary properties from json
    source: mysource
});

//add title to breadcrumb items
$('.breadcrumb-item').prop('title', 'Path of the entity. Click to navigate');

