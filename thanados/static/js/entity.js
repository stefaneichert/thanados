bodyheighttypes = [];

$(document).ready(function () {
    $('#mycontent').scroll(function () {
        if ($(this).scrollTop() > 50) {
            $('#back-to-top').fadeIn();
        } else {
            $('#back-to-top').fadeOut();
        }
    });
    // scroll body to 0px on click
    $('#back-to-top').click(function () {
        //$('#back-to-top').tooltip('hide');
        $('#mycontent').animate({
            scrollTop: 0
        }, 200);
        return false;
    });

    initPopovers();
    $('#nav-humanremains-tab').on('shown.bs.tab', function (e) {
        $('.bonetext').each(function (i) {
            if ($(this).height() > 150) {
                $(this).shave(150);
                $(this).after(
                    '<a style="cursor: pointer" class="BonetruncBtn mb-2">Show more</a><br>'
                )
            }
        })
        $('.BonetruncBtn').click(function (e) {
            if ($(this).text() === 'Show less') {

                $(this).prev().shave(150);
                $(this).text('Show more')
            } else {
                $(this).text('Show less');
                $(this).prev().shave(999999999);
            }
        });

    })
});


getBasemaps();
jsonmysite = repairJson(jsonmysite);
sitename = jsonmysite.name;

descriptionSummary = {
    graves: jsonmysite.features.length,
    burials: 0,
    finds: 0,
}

showDashboard = true;

$.each(jsonmysite.features, function (i, feature) {
    if (feature.id === 0) {
        descriptionSummary.graves = 0;
        showDashboard = false
    }
    $.each(feature.burials, function (i, burial) {
        descriptionSummary.burials += 1;
        $.each(burial.finds, function (i, feature) {
            descriptionSummary.finds += 1;
        })
    })
})
//console.log(showDashboard);


$('#mybreadcrumb').append(
    '<nav aria-label="breadcrumb">' +
    '<ol id="mybreadcrumbs" class="breadcrumb">' +
    '<li class="breadcrumb-item"><a href="/entity/' + jsonmysite.site_id + '">' + sitename + '</a></li>' +
    '</ol>' +
    '</nav>');

subLabel = 'Subunits'

if (systemtype == 'place') {
    subLabel = 'Graves';
    getEntityData(sitename, jsonmysite.id, jsonmysite);
    mycitation = '"' + sitename + '".';
    myjson = jsonmysite;
    $('#mybreadcrumbs').append('<div class="ml-3 text-muted"> (Site) </div>');
}

window.addEventListener('load', function () {
    var myTrunc = $(".shrinkable")
    var truncHeight = $(myTrunc).height();
    if (truncHeight > 250) {
        $(myTrunc).shave(250);
    } else {
        $('.truncBtn').empty()
    }

    $('.truncBtn').click(function (e) {
        var truncHeight = $(this).parent().find('.shrinkable').height();
        if (truncHeight > 250) {
            $(".shrinkable").shave(250);
            $(this).html('Show more')
        } else {
            $(".shrinkable").shave(999999);
            $(this).html('Show less')
        }
    });
})


if (systemtype == 'feature') {
    subLabel = 'Burials';
    $.each(jsonmysite.features, function (f, feature) {
        if (entity_id == feature.id) {
            graveName = feature.properties.name;
            graveId = feature.id;
            graveGeom = feature.geometry;
            getEntityData(sitename, place_id, feature);
            $('#mybreadcrumbs').append('<li class="breadcrumb-item"><a href="/entity/' + entId + '">' + entName + '</a></li>');
            mycitation = '"' + sitename + ': ' + entName + '".';
            myjson = {
                "type": "FeatureCollection", //prepare geojson
                "features": [feature],
                "properties": jsonmysite.properties,
                "site_id": jsonmysite.site_id,
                "name": jsonmysite.name
            };
        }

    });
    $('#mybreadcrumbs').append('<div class="ml-3 text-muted"> (Feature/Grave) </div>');
}


if (systemtype == 'stratigraphic unit') {
    subLabel = 'Finds';
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
                    '<li class="breadcrumb-item"><a href="/entity/' + graveId + '">' + graveName + '</a></li>' +
                    '<li class="breadcrumb-item"><a href="/entity/' + entId + '">' + entName + '</a></li>'
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

        });
    });
    $('#mybreadcrumbs').append('<div class="ml-3 text-muted"> (Burial/Stratigraphic Unit) </div>');
}


if (systemtype === 'find' || systemtype === 'human remains') {
    $.each(jsonmysite.features, function (f, feature) {
        var featureName = feature.properties.name;
        var featureID = feature.id;
        var featureGeom = feature.geometry;

        $.each(feature.burials, function (b, burial) {

            if (systemtype === 'find') {
                currentobjects = burial.finds
            } else {
                currentobjects = burial.humanremains
            }

            var stratName = burial.properties.name;
            var stratID = burial.id;
            $.each(currentobjects, function (f, find) {
                if (entity_id == find.id) {
                    graveName = featureName;
                    graveId = featureID;
                    graveGeom = featureGeom;
                    burialName = stratName;
                    burialId = stratID;
                    getEntityData(burialName, burialId, find);
                    $('#mybreadcrumbs').append(
                        '<li class="breadcrumb-item"><a href="/entity/' + graveId + '">' + graveName + '</a></li>' +
                        '<li class="breadcrumb-item"><a href="/entity/' + burialId + '">' + burialName + '</a></li>' +
                        '<li class="breadcrumb-item"><a href="/entity/' + entId + '">' + entName + '</a></li>'
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

            });
        });
    });
    if (systemtype === 'find') {
        $('#mybreadcrumbs').append('<div class="ml-3 text-muted"> (Find) </div>')
    } else {
        $('#mybreadcrumbs').append('<div class="ml-3 text-muted"> (Osteology) </div>');
    }
    ;
}

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

    entType = currentfeature.properties.maintype.name;
    entTypeId = currentfeature.properties.maintype.id;
    typepath = currentfeature.properties.maintype.path;
    var tsbegin;
    var tsend;
    if (typeof (currentfeature.properties.timespan) !== 'undefined' && typeof (currentfeature.properties.timespan.begin_from) !== 'undefined') {
        tsbegin = parseInt((currentfeature.properties.timespan.begin_from), 10);
        if (typeof (currentfeature.properties.timespan) !== 'undefined' && typeof (currentfeature.properties.timespan.end_to) !== 'undefined')
            tsend = parseInt((currentfeature.properties.timespan.end_to), 10)
    }

    if (typeof (tsbegin !== 'undefined')) timespan = tsbegin + ' to ' + tsend;
    if (typeof tsbegin == 'undefined') {
        timespan = '';
    }

    dateToInsert = timespan;

    if (currentfeature.properties.maintype.systemtype == 'place') {
        children = currentfeature.features;
    }


    if (currentfeature.properties.maintype.systemtype == 'feature') {
        if (typeof (currentfeature.burials) !== 'undefined') {
            children = currentfeature.burials;
        } else {
            children = '';
        }
    }


    if (currentfeature.properties.maintype.systemtype == 'stratigraphic unit') {
        if (typeof (currentfeature.finds) !== 'undefined') {
            children = currentfeature.finds;
        } else {
            children = '';
        }
    }

    if (currentfeature.properties.maintype.systemtype == 'find' || currentfeature.properties.maintype.systemtype == 'human remains') {
        children = '';
    }


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
        '<div class="row mb-5">' +
        '<div id="myData_' + entId + '" class="col-lg">' +
        '<div class="row mb-3">' +
        '<h4 style="margin-top: 0.5em; margin-left: 0.5em" id="myname_' + entId + '" title="Name of entity">' + entName + '&nbsp;</h4>' +
        '<div id="entbuttons" style="margin-top: 0.6em; margin-left: 1em; padding-bottom: 0.6em;">' +
        '<button type="button" onclick="this.blur()" class="btn btn-sm btn-secondary" data-toggle="modal" data-target="#citeModal" title="How to cite this"><i class="fas fa-quote-right"></i></button>' +
        ((showDashboard) ? '<a style="margin-left: 0.2em" onclick="this.blur();" href="/entity/' + place_id + '/dashboard" class="btn btn-sm btn-secondary" title="Dashboard"><i class="fas fa-chart-line"></i></a>' : '') +
        '<button type="button" style="margin-left: 0.2em" onclick="this.blur(); openInNewTab(\'/map/\' + place_id)" class="btn btn-sm btn-secondary" title="Open detailed map of this site"><i class="fas fa-map-marked-alt"></i></button>' +

        '<a style="margin-left: 0.2em" onclick="this.blur();" href="' + openAtlasUrl + entId + '" target="_blank" class="backendlink d-none btn btn-sm btn-secondary" title="Backend link"><i class="fas fa-database"></i></a>' +

        '<div class="dropdown" style="display: inline-block; margin-left: 0.2em;" >\n' +
        '  <button class="btn btn-sm btn-secondary" type="button" id="dropdownMenuButton" title="More" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\n' +
        '  <i class="fas fa-ellipsis-v"></i>  ' +
        '  </button>' +
        '   <div class="dropdown-menu" aria-labelledby="dropdownMenu">' +
        '       <a class="dropdown-item" onclick="this.blur(); exportToJsonFile(myjson)" title="Download data as GeoJSON" href="#">' +
        '       <i class="fas fa-download mr-1"></i>GeoJSON</a>' +
        '       <a class="dropdown-item" title="Network visualisation" href="/entity/' + entId + '/network">' +
        '<i class="fas fa-project-diagram mr-1"></i>Network</a>' +
        '   </div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div type="button" data-value="' + entTypeId + '" class="modalrowitem typebutton"' +
        ' data-toggle="popover">' + entType + '</div><span class="popover-wrapper"></span>' +
        '<div id="mytimespan' + entId + '" class="modalrowitem" title="Timespan/daterange of entity">' + dateToInsert + '</div>' +
        '<div id="myDescr' + entId + '" title="Description of entity"><span class="shrinkable">' + entDesc + '</span></div><a class="truncBtn" onclick="truncId=\'#myDescr' + entId + '\'" href="#">Show more</a>' +
        '<div class="mt-5" id="myTypescontainer' + entId + '"></div>' +
        '<div id="myDimensionscontainer' + entId + '"></div>' +
        '<div id="myMaterialcontainer' + entId + '"></div>' +
        '<div id="myParentcontainer' + entId + '"></div>' +
        '</div>' +
        '<div id="myImagecontainer' + entId + '" class="col-lg-auto" style="margin-top: 4em" ></div>' +
        '<div id="myMapcontainer" onclick="this.blur(); openInNewTab(\'/map/\' + place_id)" title="Click to open detailed map" class="col-lg" style="border: 1px solid rgba(0, 0, 0, 0.125); margin-top: 5.35em; margin-left: 1em; margin-right: 1em; width: 100%; height: 400px; cursor: pointer"></div>' +
        '</div>' +
        '<div id="myChildrencontainer' + entId + '">' +
        '<nav>' +
        '<div class="nav nav-tabs" id="nav-tab" role="tablist">' +
        '<a class="nav-item nav-link active" id="nav-table-tab" data-toggle="tab" href="#nav-table' + entId + '" role="tab" aria-controls="nav-table' + entId + '" aria-selected="true">' + subLabel + '</a>' +
        '<a class="nav-item nav-link d-none" id="nav-pills-tab' + entId + '" data-toggle="tab" href="#nav-pills' + entId + '" role="tab" aria-controls="nav-pills' + entId + '" aria-selected="false">Simple</a>' +
        '<a class="nav-item nav-link d-none" id="nav-humanremains-tab" data-toggle="tab" href="#nav-humanremains" role="tab" aria-controls="nav-humanremains" aria-selected="false">Osteology</a>' +
        '<a class="nav-item nav-link" id="nav-catalogue-tab" data-toggle="tab" href="#nav-catalogue" role="tab" aria-controls="nav-catalogue" aria-selected="false">Catalogue</a>' +
        '</div>' +
        '</nav>' +
        '<div class="tab-content pl-2 pr-2 pt-4" id="nav-tabContent">' +
        '<div class="tab-pane fade show active" id="nav-table' + entId + '" role="tabpanel" aria-labelledby="nav-table-tab"></div>' +
        '<div class="tab-pane fade" id="nav-pills' + entId + '" role="tabpanel" aria-labelledby="nav-pills-tab' + entId + '"></div>' +
        '<div class="tab-pane fade" id="nav-humanremains" role="tabpanel" aria-labelledby="nav-humanremains-tab">' +
        '<div class="row">' +
        '<div class="col-md-8" id="svgContainer">' +
        '</div>' +
        '<div class="col-md-4">' +
        '<div id="hr_data">' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="tab-pane fade" id="nav-catalogue" role="tabpanel" aria-labelledby="nav-catalogue-tab' + entId + '"></div>' +
        '</div>' +
        '</div>' +
        '<div id="myMetadatacontainer' + entId + '" class="pt-5"></div>' +
        '</div>' +
        '</div>'
    )

    if (dateToInsert == '') {
        $('#mytimespan' + entId).attr("class", "");
    }


    setImages(entId, entfiles);

    $('#myTypescontainer' + entId).empty();
    $.each(currentfeature.properties.types, function (t, types) {
        if ($('#myTypescontainer' + entId).is(':empty')) {
            $('#myTypescontainer' + entId).append('<p><h6>Properties:</h6></p>');
        }

        var classification = types.name;
        var classtype = types.path;
        var typevalue = types.value;
        var typeunit = types.description;
        var typeid = types.id;

        //collect types for body height calculation
        if (typeof (currentfeature.humanremains) !== 'undefined') bodyheighttypes.push({
            'name': classification,
            'id': typeid,
            'value': parseFloat(typevalue),
            'unit': typeunit
        })

        if (typeof (typevalue) !== 'undefined') var classification = (types.name + ': ' + typevalue + ' ' + typeunit);
        $('#myTypescontainer' + entId).append(
            '<div type="button" data-value="' + typeid + '" + ' +

            'class="modalrowitem typebutton" ' +
            'data-toggle="popover">' + classification + '</div><span class="popover-wrapper"></span>');
    });

    if (typeof (currentfeature.humanremains) !== 'undefined') {
        $('#nav-humanremains-tab').removeClass('d-none')
        $('#svgContainer').append(skeleton)
        humanremains = currentfeature.humanremains;
        $.each(humanremains, function (i, hr) {
            hr.path = hr.properties.maintype.path
        })

        availableBones = [];
        $('g[inkscape\\:label]').each(function (i) {
            var currentBone = $(this).attr("inkscape:label");
            var boneid = parseInt(currentBone.replace(/[^0-9]/g, ''));
            if (isNaN(boneid) === false) {
                availableBones.push($(this).attr("inkscape:label"));
            }
        })

        humanremains = sortByProperty(humanremains, 'path')

        $.each(humanremains, function (i, hr) {
            hr_name = hr.properties.maintype.path.replace("Human Remains > ", "")
            svg_label = hr.properties.maintype.id;
            siding = ''
            if (hr.properties.types) {
                $.each(hr.properties.types, function (i, type) {

                    if (type.name === 'left' || type.name === 'right') {
                        hr_name = hr_name + ': ' + type.name;
                        siding = type.name;
                        svg_label += '_' + type.name.substr(0, 1);
                    } else {
                        siding = ''
                    }
                })
                $.each(hr.properties.types, function (i, type) {
                    if (siding !== '') siding = siding.substring(0, 1)
                    bodyheighttypes.push({
                        'siding': siding,
                        'name': siding + ' ' + type.name,
                        'id': type.id,
                        'value': parseFloat(type.value),
                        'unit': type.description
                    })
                })

            }
            highlightbones(svg_label);

            $('#hr_data').append(
                '<div class="bonediv" data-svglabel="' + svg_label + '">' +
                '<p><a class="boneheading" href="/entity/' + hr.id + '">' + hr.properties.name + '</a></p> ' +
                '<div type="button" data-value="' + hr.properties.maintype.id + '" + ' +
                'class="modalrowitem typebutton btn-xs bonebutton" ' +
                'data-toggle="popover">' + hr_name + '</div><span class="popover-wrapper"></span><br>' +
                (typeof (hr.properties.description) !== 'undefined' ? '<span class="bonetext text-muted">' + hr.properties.description + '</span><br>' : '')
            );
            if (hr.properties.types) {
                $(".bonediv:last-child").append('<div class="mt-2"></div>')
                $.each(hr.properties.types, function (i, type) {

                    if (type.name !== 'left' && type.name !== 'right') {
                        var labeltext = type.name;
                        if (type.value) labeltext += ': ' + type.value + ' ' + type.description

                        $(".bonediv:last-child").append(
                            '<div type="button" data-value="' + type.id + '" + ' +

                            'class="modalrowitem typebutton hr-button btn-xs" ' +
                            'data-toggle="popover">' + labeltext + '</div><span class="popover-wrapper"></span>'
                        );
                    }
                })
            }
        })


        $('.bonediv').hover(function (i) {
            svg_label = $(this).data('svglabel')
            var bonegroup = $('g[inkscape\\:label="' + svg_label + '"]');
            $(bonegroup).find('path').toggleClass('hoverbone');
        })

        $('#myTypescontainer' + entId).append(bodyheight().btn);

    }

    $('#myDimensionscontainer' + entId).empty();
    $.each(currentfeature.properties.dimensions, function (d, dimensions) {
        if ($('#myDimensionscontainer' + entId).is(':empty')) {
            $('#myDimensionscontainer' + entId).append('<p><h6>Dimensions:</h6></p>');
        }

        var dimension = dimensions.name;
        var dimvalue = dimensions.value;
        var dimunit = dimensions.unit;
        var typeid = dimensions.id;

        $('#myDimensionscontainer' + entId).append(
            '<div type="button" data-value="' + typeid + '" ' +

            'class="modalrowitem typebutton" "data-toggle="popover">' + dimension + ': ' + dimvalue + ' ' + dimunit + '</div><span class="popover-wrapper"></span>');

    });

    $('#myMaterialcontainer' + entId).empty();
    $.each(currentfeature.properties.material, function (d, material) {
        if ($('#myMaterialcontainer' + entId).is(':empty')) {
            $('#myMaterialcontainer' + entId).append('<p><h6>Material:</h6></p>');
        }

        var materialname = material.name;
        var matvalue = material.value;
        var matpath = material.path;
        var typeid = material.id;
        if (matvalue > 0) {
            $('#myMaterialcontainer' + entId).append(
                '<div type="button" data-value="' + typeid + '" ' +

                'class="modalrowitem typebutton" data-toggle="popover">' + materialname + ': ' + matvalue + '%</div><span class="popover-wrapper"></span>');
        }

        if (matvalue == 0) {
            $('#myMaterialcontainer' + entId).append(
                '<div type="button" data-value="' + typeid + '" ' +

                'class="modalrowitem typebutton" data-toggle="popover">' + materialname + '</div><span class="popover-wrapper"></span>');
        }

    });


    $('#myMetadatacontainer' + entId).empty();
    $('#myMetadatacontainer' + entId).append(
        '<div id="mainRef" class="mt-5"><p><h6>Data source</h6></p>' +
        '<table class="table table-sm table-hover">' +
        '<thead class="thead-light">' +
        '<tr>' +
        '<th scope="col">Title</th>' +
        '<th scope="col">Page</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody id="mytablebody"></tbody></table></div>' +

        '<div id="furtherRefs" class="mt-5"><p><h6>Bibliography</h6></p>' +
        '<table class="table table-sm table-hover">' +
        '<thead class="thead-light">' +
        '<tr>' +
        '<th scope="col">Title</th>' +
        '<th scope="col">Page</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody id="mybibbody"></tbody></table></div>'
    );

    furtherRefs = 0;
    singleref = false;
    mainref = false;
    mainrefthere = false;
    bibfeature = JSON.parse(JSON.stringify(currentfeature))

    if (typeof (currentfeature.properties.references) !== 'undefined') {
        bibfeature = JSON.parse(JSON.stringify(currentfeature))
    } else {
        bibfeature.properties = jsonmysite.properties
    }

    singleref = false;

    if (typeof (bibfeature.properties.references) !== 'undefined' && bibfeature.properties.references.length === 1) singleref = true;

    $.each(bibfeature.properties.references, function (t, ref) {
        if (typeof (ref.title) !== 'undefined') {
            title = ref.title;
            citeme = title;
        } else {
            title = '';
            citeme = 'unknown source';
        }
        if (typeof (ref.reference) !== 'undefined') {
            page = ref.reference.replace("##main", "");
            citeme = citeme + ' ' + page + '.';
        } else
            page = '';
        mainref = false;
        if (typeof (ref.reference) !== 'undefined' && ref.reference.includes('##main') || singleref) {
            mainref = true;
            mainrefthere = true;
        }

        if (mainref) {
            $('#mytablebody').append(
                '<tr>' +
                '<td>' + title + '</td>' +
                '<td>' + page + '</td>' +
                '</tr>');
            if (typeof (mycitation2) == 'undefined') {
                mycitation2 = citeme
            } else {
                mycitation2 += '. ' + citeme
            }
        } else {
            $('#mybibbody').append(
                '<tr>' +
                '<td>' + title + '</td>' +
                '<td>' + page + '</td>' +
                '</tr>');
            furtherRefs += 1;
        }
    })

    if (furtherRefs === 0) $('#furtherRefs').toggle();
    if (singleref === false && mainrefthere === false) $('#mainRef').toggle();


    if (typeof (currentfeature.properties.externalreference) !== 'undefined') {
        $('#myMetadatacontainer' + entId).append(
            '<p><h6 class="mt-5">External references</h6></p>' +
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
            '<td><a style="word-break: break-all;" href="' + url + '">' + url + '</a></td>' +
            '<td>' + name + '</td>' +
            '<td>' + description + '</td>' +
            '</tr>');
    });

    if (systemtype == 'place') {
        files = currentfeature.properties.files
    } else {
        files = currentfeature.files
    }

    if (typeof (files) !== 'undefined') {
        $('#myMetadatacontainer' + entId).append(
            '<p><h6 class="mt-5">Files</h6></p>' +
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
            '<td><a style="word-break: break-all;" href="' + file.file_name + '">' + file.name + '</a></td>' +
            '<td>' + source + '</td>' +
            '<td>' + reference + '</td>' +
            '<td>' + license + '</td>' +
            '</tr>');
    });

    if (children != '' && children[0].id !== 0) {
        mychildrenlist = [];
        $.each(children, function (c, child) {
            if ($('#nav-pills' + entId).is(':empty')) {
                $('#nav-pills' + entId).append(
                    '<p>' +
                    '<div class="d-inline">' +
                    '<h6>' + children.length + ' Subunit(s)</h6>' +
                    '</div>' +
                    '</p>');
            }


            $('#nav-pills' + entId).append(
                '<a class="modalrowitem subunits" href="/entity/' + child.id + '" title="' + child.properties.maintype.name + '">' + child.properties.name + '</a>'
            );

            if ($('#nav-table' + entId).is(':empty')) {
                $('#nav-table' + entId).append(
                    '<table id="childrenlist" class="display table table-striped table-bordered" width="100%">' +
                    '<thead>' +
                    '<tr>' +
                    '<th>Name</th>' +
                    '<th>Type</th>' +
                    '<th>Begin</th>' +
                    '<th>End</th>' +
                    '<th>Finds</th>' +
                    '</tr>' +
                    '</thead>' +
                    '</table>');
            }


            myentity = [];
            if (typeof (child.id) != 'undefined') myentity.id = child.id;
            if (typeof (child.properties.description) != 'undefined') myentity.description = child.properties.description;
            if (typeof (child.properties.name) != 'undefined') myentity.name = child.properties.name;
            if (typeof (child.properties.maintype.name) != 'undefined') myentity.type = child.properties.maintype.name;
            if (typeof (child.properties.maintype.path) != 'undefined') myentity.path = child.properties.maintype.path;
            if (typeof (child.properties.timespan) != 'undefined') {
                if (typeof (child.properties.timespan.begin_from) != 'undefined') myentity.begin = child.properties.timespan.begin_from;
                if (typeof (child.properties.timespan.end_to) != 'undefined') myentity.end = child.properties.timespan.end_to;
            } else {
                myentity.begin = '';
                myentity.end = '';
            }

            findCount = 0;
            if (typeof (child.finds) != 'undefined') findCount += (child.finds.length);
            if (typeof (child.burials) != 'undefined') {
                $.each(child.burials, function (c, burial) {
                    if (typeof (burial.finds) != 'undefined') findCount += (burial.finds.length);
                })
            }
            myentity.findCount = findCount;
            mychildrenlist.push(myentity);

        });
        //set datatable
        table = $('#childrenlist').DataTable({
            data: mychildrenlist,
            "pagingType": "numbers",
            "scrollX": true,
            drawCallback: function () {
                if (loginTrue) $('.backendlink').removeClass('d-none')
            },
            columns: [
                {
                    data: "name",
                    "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                        $(nTd).html("<a href='/entity/" + oData.id + "' title='" + oData.description + "'>" + oData.name + "</a>" +
                            '<a title="Link to backend" class="backendlink d-none" href="' + openAtlasUrl + oData.id + '" target="_blank""><i class="float-right text-secondary fas fa-database"></i></a>'); //create links in rows
                    }
                },
                {
                    data: 'type',
                    "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                        $(nTd).html("<div title='" + oData.path + "'>" + oData.type + "</div> ");
                    }
                },
                {data: 'begin'},
                {data: 'end'},
                {data: 'findCount'}
            ]
        });

        if (systemtype == "stratigraphic unit") table.column(4).visible(false);
    } else {
        if (typeof (currentfeature.humanremains) === 'undefined') {
            $('#nav-tab').toggle();
        } else {
            if (currentfeature.humanremains) {
                $('#nav-table-tab').toggle();
                $('#nav-catalogue-tab').toggle();
                $('#nav-humanremains-tab').tab('show')
                //$('#nav-humanremains-tab').addClass('active');
                //$('#nav-humanremains-tab').removeClass('d-none');
            } else {
                if (systemtype == "human remains") {
                    $('#nav-tab').toggle();
                }
            }
        }
    }
    if (loginTrue) {
        $('.backendlink').removeClass('d-none')
    }


//$('.subunits').hide()
    $('#childrenlist_wrapper').show();


    if (currentfeature.type !== "FeatureCollection") {
        if ($('#myParentcontainer' + entId).is(':empty')) {
            $('#myParentcontainer' + entId).append('<p><h6>Parent</h6></p>');
        }

        $('#myParentcontainer' + entId).append(
            '<a class="modalrowitem" href="/entity/' + parentId + '">' + parentName + '</a>'
        );
    }


    myStyle = {
        "color": "#007BD9",
        "weight": 1,
        "fillOpacity": 0.8
    };

    myStyleSquare = {
        "color": "#007BD9",
        "weight": 1,
        "fillOpacity": 0.5,
        "dashArray": [4, 4]
    };


    map = L.map('myMapcontainer', {
        zoom: 16,
        keyboard: false,
        dragging: false,
        zoomControl: false,
        boxZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        tap: false,
        touchZoom: false,
        layers: [OpenStreetMap_HOT, Esri_WorldHillshade]
    });
    L.control.scale({imperial: false}).addTo(map);
    loadingControl.addTo(map);


//add graves
    if (jsonmysite.features[0].id !== 0) {
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

        graves.addTo(map);

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
                //point = L.marker(latlng).addTo(map)
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

        if (setJson(jsonmysite)) {
            map.fitBounds(graves.getBounds());
            if ((map.getZoom()) > 18) map.setZoom(18);
        } else {
            var latlng = [jsonmysite.properties.center.coordinates[1], jsonmysite.properties.center.coordinates[0]];
            var marker = L.marker(latlng).addTo(map);
            centerpoint = latlng;
            map.setZoom(18);
            map.panTo(centerpoint);
        }


        if (currentfeature.type !== "FeatureCollection") {
            polys = L.geoJSON(mypolyjson, {
                onEachFeature: function (feature, layer) {
                    if (graveId == feature.id) {
                        polyPoints = layer.getLatLngs();
                        selectedpoly = L.polygon(polyPoints, {color: 'red'}).addTo(map);
                        boundscenter = (selectedpoly.getBounds()).getCenter();
                    }

                }
            })
        }

    }


    if (children !== '') {
        if (children[0].id == 0) {
            graves = L.marker([jsonmysite.properties.center.coordinates[1], jsonmysite.properties.center.coordinates[0]]).addTo(map);

        }
    }


    maximumHeight = (($(window).height() - $('#mynavbar').height()) - $('#mybreadcrumb').height());
    $('#mycontent').css('max-height', (maximumHeight - 17) + 'px');

    $(window).resize(function () {
        maximumHeight = (($(window).height() - $('#mynavbar').height()) - $('#mybreadcrumb').height());
        $('#mycontent').css('max-height', (maximumHeight - 17) + 'px');
    });

    var osm2 = miniBaseMap;
    var rect1 = {color: "#ff1100", weight: 15};

    if (setJson(jsonmysite)) {
        mapcenter = map.getCenter();
    } else {
        mapcenter = [jsonmysite.properties.center.coordinates[1], jsonmysite.properties.center.coordinates[0]]
    }
    map.panTo(mapcenter);
    if ((map.getZoom()) > 20) map.setZoom(20);



    var miniMap = new L.Control.MiniMap(osm2,
        {
            centerFixed: mapcenter,
            zoomLevelFixed: 6,
            toggleDisplay: true,
            collapsedWidth: 24,
            collapsedHeight: 24,
            aimingRectOptions: rect1
        }).addTo(map);


    $('.leaflet-control-attribution').html('&copy; OpenStreetMap')

}


function setImages(entId, entfiles) {
    if (entfiles !== undefined) {

        //append one image without slides
        if (entfiles.length == 1) {
            $('#myImagecontainer' + entId).empty();
            $('#myImagecontainer' + entId).append(
                getImageHtml(entfiles[0])
            )
        }


        //append more than one image with slides
        if (entfiles.length !== 1) {
            $('#myImagecontainer' + entId).empty();
            firstimage = entfiles[0];
            secondimage = entfiles[1];
            $('#myImagecontainer' + entId).append(
                '<div id="carouselExampleIndicators' + entId + '" class="cat-image-container carousel slide" data-ride="carousel" data-interval="false">' +
                '<ol id="mymodalimageindicators' + entId + '" class="carousel-indicators">' +
                '<li data-target="#carouselExampleIndicators' + entId + '" data-slide-to="0" class="active"></li>' +
                '<li data-target="#carouselExampleIndicators' + entId + '" data-slide-to="1"></li>' +
                '</ol>' +
                '<div id="mycarouselimages' + entId + '" class="carousel-inner">' +
                '<div class="carousel-item active">' +
                getImageHtml(firstimage) +
                '</div>' +
                '<div class="carousel-item">' +
                getImageHtml(secondimage) +
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
            $.each(entfiles, function (f, file) {
                    if (f > 1) {

                        $('#mycarouselimages' + entId).append(
                            '<div class="carousel-item">' +
                            getImageHtml(file) +
                            '</div>'
                        );

                        $('#mymodalimageindicators' + entId).append(
                            '<li data-target="#carouselExampleIndicators' + entId + '" data-slide-to="' + f + '"></li>'
                        );
                    }
                }
            );
        }

    } else {
        $('#myImagecontainer' + entId).remove()
    }
    var lazyLoadInstance = new LazyLoad({
        elements_selector: ".lazy"
    });
    lazyLoadInstance.update();
}

function toggleSubunits() {
    down = ($('#subbtn').hasClass("fa-ellipsis-h"));
    if (down) {
        $('#subbtn').removeClass('fa-ellipsis-h').addClass('fa-list');
    }
    if (down === false) {
        $('#subbtn').removeClass('fa-list').addClass('fa-ellipsis-h');

    }
    $('#childrenlist_wrapper').toggle();
    $('.subunits').toggle();
}

today = today();

if (typeof (mycitation2) == 'undefined') {
    mycitation2 = '';
    mycitation1 = mycitation1.substring(0, mycitation1.length - 8);
}

mysource = (mycitation + mycitation1 + mycitation2);
mysource = mysource.replace(/(\r\n|\n|\r)/gm, "");
$('#mycitation').append('<div style="border: 1px solid #dee2e6; border-radius: 5px; padding: 0.5em; color: #495057; font-size: 0.9em;" id="Textarea1">' + mysource + '</div>');
L.extend(myjson, {//add necessary properties from json
    source: mysource
});

//add title to breadcrumb items
$('.breadcrumb-item').prop('title', 'Path of the entity. Click to navigate');

//create recursive catalogue of all subunits
function setcatalogue(currentchildren, parentDiv, iter) {
    if (iter == 1) $('#nav-catalogue').append('<div id="mycatalogue"></div>');
    iter += 1;
    $.each(currentchildren, function (i, currentfeature) {
        var entId = currentfeature.id;
        var entName =
            '<a href="../entity/' + entId + '" title="Permalink to this entity">' + currentfeature.properties.name + '</a>' +
            '<a title="Link to backend" class="backendlink d-none" href="' + openAtlasUrl + entId + '" target="_blank""><i class="ml-4 text-secondary fas fa-database"></i></a>';
        var entDesc = currentfeature.properties.description;
        if (typeof entDesc == 'undefined') {
            var entDesc = '';
        }

        var entType = currentfeature.properties.maintype.name;
        var typeId = currentfeature.properties.maintype.id;

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


        if (currentfeature.type == 'Feature' && i > 0) $('#' + parentDiv).append('<h4 class="border-top pt-4 mt-4">' + entName + '</h4>');
        if (currentfeature.type == 'Feature' && i === 0) $('#' + parentDiv).append('<h4 class="pt-4 mt-4">' + entName + '</h4>');
        if (currentfeature.type != 'Feature') $('#' + parentDiv).append('<h5 class="pt-4">' + entName + '</h5>');
        $('#' + parentDiv).append(
            '<div class="container-fluid">' +
            '<div class="row">' +
            '<div id="myModalData_' + entId + '">' +
            '<div ' +
            'class="modalrowitem typebutton" ' +
            'type="button" ' +
            'data-toggle="popover" ' +
            'data-value="' + typeId + '">' + entType + '</div><span class="popover-wrapper"></span>' +
            '<div id="myModaltimespan' + entId + '" class="modalrowitem">' + dateToInsert + '</div>' +
            '<div id="myModalImagecontainer' + entId + '" class="row mb-2"></div>' +
            '<div id="myModalDescr' + entId + '">' + entDesc + '</div>' +
            '<div id="myModalTypescontainer' + entId + '"></div>' +
            '<div id="myModalDimensionscontainer' + entId + '"></div>' +
            '<div id="myModalMaterialcontainer' + entId + '"></div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="ml-4" id="' + parentDiv + '_' + entId + '"></div>'
        );
        if ($('#myModaltimespan' + entId).html() == '') $('#myModaltimespan' + entId).toggle();

        $('#myModalTypescontainer' + entId).empty();
        $.each(currentfeature.properties.types, function (t, types) {
            if ($('#myModalTypescontainer' + entId).is(':empty')) {
                $('#myModalTypescontainer' + entId).append('<p><h6>Properties:</h6></p>');
            }

            var classification = types.name;
            var classtype = types.path;
            var typevalue = types.value;
            var typeunit = types.description;
            var typeId = types.id;
            if (typeof (typevalue) !== 'undefined') var classification = (types.name + ': ' + typevalue + ' ' + typeunit);
            $('#myModalTypescontainer' + entId).append(
                '<div ' +
                'class="modalrowitem typebutton" ' +
                'type="button" ' +
                'data-toggle="popover" ' +
                'data-value="' + typeId + '">' + classification + '</div><span class="popover-wrapper"></span>');
        });

        $('#myModalDimensionscontainer' + entId).empty();
        $.each(currentfeature.properties.dimensions, function (d, dimensions) {
            if ($('#myModalDimensionscontainer' + entId).is(':empty')) {
                $('#myModalDimensionscontainer' + entId).append('<p><h6>Dimensions:</h6></p>');
            }

            var dimension = dimensions.name;
            var dimvalue = dimensions.value;
            var dimunit = dimensions.unit;
            var typeId = dimensions.id;

            $('#myModalDimensionscontainer' + entId).append(
                '<div ' +
                'class="modalrowitem typebutton" ' +
                'type="button" ' +
                'data-toggle="popover" ' +
                'data-value="' + typeId + '">' + dimension + ': ' + dimvalue + ' ' + dimunit + '</div><span class="popover-wrapper"></span>');

        });

        $('#myModalMaterialcontainer' + entId).empty();
        $.each(currentfeature.properties.material, function (d, material) {
            if ($('#myModalMaterialcontainer' + entId).is(':empty')) {
                $('#myModalMaterialcontainer' + entId).append('<p><h6>Material:</h6></p>');
            }

            var materialname = material.name;
            var matvalue = material.value;
            var matpath = material.path;
            typeId = material.id;

            if (matvalue > 0) {
                $('#myModalMaterialcontainer' + entId).append(
                    '<div ' +
                    'class="modalrowitem typebutton" ' +
                    'type="button" ' +
                    'data-toggle="popover" ' +
                    'data-value="' + typeId + '">' + materialname + ': ' + matvalue + '%</div><span class="popover-wrapper"></span>');
            }

            if (matvalue == 0) {
                $('#myModalMaterialcontainer' + entId).append(
                    '<div ' +
                    'class="modalrowitem typebutton" ' +
                    'type="button" ' +
                    'data-toggle="popover" ' +
                    'data-value="' + typeId + '">' + materialname + '</div><span class="popover-wrapper"></span>');
            }

        });
        $.each(currentfeature.files, function (f, file) {
            var myImgSource = '';
            if (typeof (file.source) != 'undefined') myImgSource = file.source;
            if (typeof (file.source) == 'undefined') myImgSource = "unknown source";
            if ((typeof (file.source) != 'undefined') && (typeof (file.reference) != 'undefined')) myImgSource = file.source + ' ' + file.reference;
            $('#myModalImagecontainer' + entId).append('<div class="cat-image-container col-lg-4 mt-2">' + getImageHtml(file) + '</div>');
        });

        if (typeof (currentfeature.burials) != 'undefined') {
            setcatalogue(currentfeature.burials, parentDiv + '_' + entId, iter);
        }


        if (typeof (currentfeature.finds) != 'undefined') {
            setcatalogue(currentfeature.finds, parentDiv + '_' + entId, iter);
        }

    });
    if (loginTrue) {
        $('.backendlink').removeClass('d-none')
    }
}

cataloguetrue = false;

$('#nav-catalogue-tab').click(function (e) {
    if (cataloguetrue == false) {
        setcatalogue(children, 'mycatalogue', 1);
        var myLazyLoad = new LazyLoad({
            container: document.getElementById('mycontent')
        });
    }
    cataloguetrue = true;
    initPopovers();
})

$('#myattr').toggle();

eval('DescSummary = $(\'#myDescr' + jsonmysite.site_id + '\')')
$(DescSummary).prepend(
    '<div style="margin-top: 0.5em;">' +
    '<b>Graves/Features:</b> ' + descriptionSummary.graves + '<br>' +
    '<b>Burials/Stratigraphic Units: </b>' + descriptionSummary.burials + '<br>' +
    '<b>Finds:</b> ' + descriptionSummary.finds + '<br><br>' +
    '</div>'
);
