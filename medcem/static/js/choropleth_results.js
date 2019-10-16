$(".visbutton").click(startvis);

function startvis() {
    $('#myvisform').empty();
    appendSearch(1);
    $("#visdialog").dialog({
        width: 500,
        height: 450
    });
    visproperty = 'myprop';
    colorstart = "#ffffff";
    colorend = "#ff0000";
    appendvis('vis');
}

function appendvis(iter) { //append vis form to dialog
    $('#myvisform').append(
        //selection for vis level: grave, burial or find
        '<div id="VisSelect_' + iter + '_parent" class="input-group input-group-sm mb-3">' +
        '<div class="input-group-prepend">' +
        '<label class="input-group-text" for="VisSelect_' + iter + '">1. </label>' +
        '</div>' +
        '<select class="custom-select empty" id="VisSelect_' + iter + '">' +
        '<option selected disabled>Select Level...</option>' +
        '<option value="gravedim">Graves</option>' +
        '<option value="burialdim">Burials</option>' +
        '<option value="findcount">No. of finds per grave</option>' +
        '<option value="sex">Sex</option>' +
        '<option value="age">Age</option>' +
        '</select>' +
        '</div>');
    //after main level is selected:
    $('#VisSelect_' + iter).on('change', function () {
        visappendLevel = $('#VisSelect_' + iter + ' option:selected').val(); //set level as variable
        $('#VisSelect_' + iter).prop('disabled', true); //disble former selection field
        $('#VisSelect_' + iter + '_parent').append(//add reset button on first iteration
            '<div class="input-group-append">' +
            '<button class="btn btn-secondary btn-sm" type="button" id="resetvisbutton" onclick="startvis()" title="Reset">' +
            '<i class="fas fa-sync-alt"></i>' +
            '</button>' +
            '</div>'
        );
        if (visappendLevel !== 'findcount' && visappendLevel !== 'sex' && visappendLevel !== 'age') {
            $('#myvisform').append(
                //selection for property to choose: maintype, types, dimensions, material or timespan
                '<div id="PropSelect_' + iter + '_parent" class="input-group input-group-sm mb-3">' +
                '<div class="input-group-prepend">' +
                '<label class="input-group-text" for="PropSelect_' + iter + '">2. </label>' +
                '</div>' +
                '<select class="custom-select empty" id="PropSelect_' + iter + '">' +
                '<option selected disabled>Select property...</option>' +
                '<option value="Height">Depth</option>' +
                '<option value="Length">Length</option>' +
                '<option value="Width">Width</option>' +
                '<option value="Degrees">Orientation</option>' +
                '</select>' +
                '</div>'
            );
        }
        if (visappendLevel == 'age') {
            $('#myvisform').append(
                //selection for property to choose: maintype, types, dimensions, material or timespan
                '<div id="PropSelect_' + iter + '_parent" class="input-group input-group-sm mb-3">' +
                '<div class="input-group-prepend">' +
                '<label class="input-group-text" for="PropSelect_' + iter + '">2. </label>' +
                '</div>' +
                '<select class="custom-select empty" id="PropSelect_' + iter + '">' +
                '<option selected disabled>Select property...</option>' +
                '<option value="min">Minimum</option>' +
                '<option value="max">Maximum</option>' +
                '<option value="average">Average</option>' +
                '</select>' +
                '</div>'
            );
        }
        $('#PropSelect_' + iter).on('change', function () {
            $('#PropSelect_' + iter).prop('disabled', true);
            visproperty = $('#PropSelect_' + iter + ' option:selected').val(); //set property as variable
            mylegendtitle = $('#PropSelect_' + iter + ' option:selected').text(); //set property as variable
            appendvisbuttons();
        });
        switch (visappendLevel) {
            case 'findcount':
                mylegendtitle = "No. of finds in grave";
                appendvisbuttons();
                break;
            case 'sex':
                mylegendtitle = "Sex of buried individuals";
                appendsexbuttons();
                break;
            case 'age':
                mylegendtitle = "Age at death estimation";
                break;
        }
    });
}

function appendvisbuttons(iter) {
    $('#myvisform').append(
        '<div class="myoptions input-group input-group-sm mb-3">' +
        '<div class="input-group-prepend">' +
        '<label class="input-group-text" for="colorrange">Color range</label>' +
        '</div>' +
        '<input class="form-control" id="colorstart" style="max-width: 70px" type="color" value="#ffffff">' +
        '<input class="form-control" id="colorend" style="max-width: 70px" type="color" value="#ff0000">' +
        '<span class="input-group-text input-group-middle">Steps: </span>' +
        '<input class="form-control" id="steps" type="number" value="5" min="2" max="100">' +
        '</div>' +
        '<div class="myoptions input-group input-group-sm mb-3">' +
        '<div class="input-group-prepend">' +
        '<label class="input-group-text" for="legendtitle">Legend title: </label>' +
        '</div>' +
        '<input class="form-control" id="legendtitle" type="text" value="' + mylegendtitle + '">' +
        '<div class="input-group-append">' +
        '<div class="input-group-text" title="Show legend">' +
        '<input id="showlegend" type="checkbox" aria-label="Checkbox for showing map" checked>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="myoptions input-group input-group-sm mb-3">' +
        '<div class="input-group-prepend">' +
        '<label class="input-group-text" for="opacity">Opacity (%): </label>' +
        '</div>' +
        '<input class="form-control" id="opacity" type="range" value="10" min="0" max="100">' +
        '<input class="form-control" id="opacityvalue" type="number" value="10" min="0" max="100" style="max-width: 60px">' +
        '</div>' +
        '<div class="myoptions input-group input-group-sm mb-3">' +
        '<div class="input-group-prepend">' +
        '<label class="input-group-text" for="bordercolor">Border color: </label>' +
        '</div>' +
        '<input class="form-control" id="colorborder" style="max-width: 70px" type="color" value="#000000">' +
        '<span class="input-group-text input-group-middle">Border width: </span>' +
        '<input class="form-control" id="borderwidth" type="number" value="0" min="0">' +
        '</div>' +
        '<div id="MethodSelect_' + iter + '_parent" class="myoptions input-group input-group-sm mb-3">' +
        '<div class="input-group-prepend">' +
        '<label class="input-group-text" for="MethodSelect_' + iter + '">Method: </label>' +
        '</div>' +
        '<select class="custom-select empty" id="MethodSelect_' + iter + '">' +
        '<option selected value="e">equidistant</option>' +
        '<option value="q">quantile</option>' +
        '<option value="k">k-means</option>' +
        '</select>' +
        '</div>' +
        '<button class="btn btn-secondary btn-sm visbutton" type="button" id="AdvOptBtn" onclick="toggleOpt()" title="Advanced Options">' +
        '<i class="fas fa-ellipsis-h"></i>' +
        '</button>' +
        '<button class="btn btn-secondary btn-sm visbutton" type="button" id="VisResultBtn" onclick="finishvis()" title="Show on map">' +
        '<i class="fas fa-map-marked-alt"></i>' +
        '</button>'
    );
    toggleOpt();

    var firstInput = document.getElementById("colorstart");
    var firstColor = firstInput.value;
    firstInput.addEventListener("input", function () {
        colorstart = firstInput.value;
    }, false);

    var lastInput = document.getElementById("colorend");
    var lastColor = lastInput.value;
    lastInput.addEventListener("input", function () {
        colorend = lastInput.value;
    }, false);
    mysteps = $('#steps').val();
    $('#steps').on('input change', function () {
        mysteps = $('#steps').val();
        if (mysteps < 2)
            $('#steps').val(2);
    });
    $('#legendtitle').on('input change', function () {
        mylegendtitle = $('#legendtitle').val();
    });
    myopacity = 10;
    $('#opacity').on('input change', function () {
        myopacity = $('#opacity').val();
        $('#opacityvalue').val(myopacity);
    });
    $('#opacityvalue').on('input change', function () {
        myopacity = $('#opacityvalue').val();
        if (myopacity > 100)
            $('#opacityvalue').val(100);
        if (myopacity < 0)
            $('#opacityvalue').val(0);
        $('#opacity').val(myopacity);
    });
    mybordercolor = "#000000";
    var borderColorInput = document.getElementById("colorborder");
    var borderColor = borderColorInput.value;
    borderColorInput.addEventListener("input", function () {
        mybordercolor = borderColorInput.value;
    }, false);

    myborderwidth = 0;
    $('#borderwidth').on('input change', function () {
        myborderwidth = $('#borderwidth').val();
        if (myborderwidth < 0)
            $('#borderwidth').val(0);
    });

    mymode = 'e';
    $('#MethodSelect_' + iter).on('change', function () {
        mymode = $('#MethodSelect_' + iter + ' option:selected').val();
    });
}

function appendsexbuttons(iter) {
    $('#myvisform').append(
        '<div class="myoptions input-group input-group-sm mb-3">' +
        '<div class="myoptions input-group input-group-sm mb-3">' +
        '<div class="input-group-prepend">' +
        '<label class="input-group-text" for="legendtitle">Legend title: </label>' +
        '</div>' +
        '<input class="form-control" id="legendtitle" type="text" value="' + mylegendtitle + '">' +
        '<div class="input-group-append">' +
        '<div class="input-group-text" title="Show legend">' +
        '<input id="showlegend" type="checkbox" aria-label="Checkbox for showing map" checked>' +
        '</div>' +
        '</div>' +
        '</div>' +

        '<div class="input-group-prepend">' +
        '<label class="input-group-text" for="male">Male:</label>' +
        '</div>' +
        '<input class="form-control" id="male" style="max-width: 70px" type="color" value="#ff0000">' +
        '<span class="input-group-text input-group-middle">Female:</span>' +
        '<input class="form-control" id="female" style="max-width: 70px" type="color" value="#0000FF">' +
        '<span class="input-group-text input-group-middle">Opacity (%): </span>' +
        '<input class="form-control" id="opacity" type="range" value="10" min="0" max="100">' +
        '<input class="form-control" id="opacityvalue" type="number" value="10" min="0" max="100" style="max-width: 60px">' +
        '</div>' +
        '<div class="myoptions input-group input-group-sm mb-3">' +
        '<label class="input-group-text" for="bordercolor">Border color: </label>' +
        '<input class="form-control" id="colorborder" style="max-width: 70px" type="color" value="#000000">' +
        '<span class="input-group-text input-group-middle">Border width: </span>' +
        '<input class="form-control" id="borderwidth" type="number" value="0" min="0">' +
        '</div>' +
        '<button class="btn btn-secondary btn-sm visbutton" type="button" id="AdvOptBtn" onclick="toggleOpt()" title="Advanced Options">' +
        '<i class="fas fa-ellipsis-h"></i>' +
        '</button>' +
        '<button class="btn btn-secondary btn-sm visbutton" type="button" id="VisResultBtn" onclick="finishvis()" title="Show on map">' +
        '<i class="fas fa-map-marked-alt"></i>' +
        '</button>'
    );
    toggleOpt();

    var firstInput = document.getElementById("male");
    var firstColor = firstInput.value;
    colorstart = firstColor;
    firstInput.addEventListener("input", function () {
        colorstart = firstInput.value;
    }, false);

    var lastInput = document.getElementById("female");
    var lastColor = lastInput.value;
    colorend = lastColor;
    lastInput.addEventListener("input", function () {
        colorend = lastInput.value;
    }, false);
    $('#legendtitle').on('input change', function () {
        mylegendtitle = $('#legendtitle').val();
    });
    myopacity = 10;
    $('#opacity').on('input change', function () {
        myopacity = $('#opacity').val();
        $('#opacityvalue').val(myopacity);
    });
    $('#opacityvalue').on('input change', function () {
        myopacity = $('#opacityvalue').val();
        if (myopacity > 100)
            $('#opacityvalue').val(100);
        if (myopacity < 0)
            $('#opacityvalue').val(0);
        $('#opacity').val(myopacity);
    });
    mybordercolor = "#000000";
    var borderColorInput = document.getElementById("colorborder");
    var borderColor = borderColorInput.value;
    borderColorInput.addEventListener("input", function () {
        mybordercolor = borderColorInput.value;
    }, false);

    myborderwidth = 0;
    $('#borderwidth').on('input change', function () {
        myborderwidth = $('#borderwidth').val();
        if (myborderwidth < 0)
            $('#borderwidth').val(0);
    });
}

function toggleOpt() {
    $('.myoptions').toggle();
}

function finishvis() {
    if (document.getElementById('showlegend').checked) {
        mylegend = true;
    } else {
        mylegend = false;
    }
    ;

    myfinalopacity = (100 - myopacity) / 100;
    if (visappendLevel !== 'sex') getChoroplethJson(visproperty, visappendLevel, mylegendtitle, mysteps, mymode, [colorstart, colorend], mybordercolor, myborderwidth, myfinalopacity, mylegend);
    if (visappendLevel == 'sex') getChoroplethJson(visproperty, visappendLevel, mylegendtitle, 0, 'na', [colorstart, colorend], mybordercolor, myborderwidth, myfinalopacity, mylegend);
}

function getChoroplethJson(visproperty, visappendLevel, title, mysteps, mymode, mycolor, myborder, myborderwidth, myfinalopacity, mylegend) {
    mychorojson = {
        "type": "FeatureCollection", //prepare geojson
        "features": []
    };

    //dimensions of graves:
    if (visappendLevel == 'gravedim') {
        $.each(mypolyjson.features, function (i, feature) {
            if (typeof (feature.properties.dimensions) !== 'undefined') {
                insertfeature = feature;
                $.each(feature.properties.dimensions, function (i, dimension) {
                    if (dimension.name == visproperty) {
                        jQuery.extend(insertfeature.properties, {chorovalue: parseInt((dimension.value), 10)});
                        mychorojson.features.push(insertfeature);
                    }
                })
            }
        })
    }
    ;

    if (visappendLevel == 'age') {
        $.each(mypolyjson.features, function (i, feature) {
            if (typeof (feature.burials) !== 'undefined' && feature.burials.length == 1) {
                insertfeature = feature;
                $.each(feature.burials, function (i, burial) {
                    if (typeof (burial.properties.types) !== 'undefined') {
                        $.each(burial.properties.types, function (i, type) {
                            var age = type.path.startsWith("Anthropology > Age >");
                            if (age) {
                                switch (visproperty) {
                                    case 'min':
                                        myage = (JSON.parse(type.description))[0];
                                        break;
                                    case 'max':
                                        myage = (JSON.parse(type.description))[1];
                                        break;
                                    case 'average':
                                        myage = (((JSON.parse(type.description))[0]) + ((JSON.parse(type.description))[1])) / 2;
                                        break;
                                }
                                jQuery.extend(insertfeature.properties, {chorovalue: myage});
                                mychorojson.features.push(insertfeature);
                            }
                        })
                    }
                })
            }
        })
    }
    ;

    if (visappendLevel == 'findcount') {
        $.each(mypolyjson.features, function (i, feature) {
            insertfeature = feature;
            if (typeof (feature.burials) == 'undefined') {
                jQuery.extend(insertfeature.properties, {chorovalue: 0});
                mychorojson.features.push(insertfeature);
            }
            if (typeof (feature.burials) !== 'undefined') {
                $.each(feature.burials, function (i, burial) {
                    if (typeof (burial.finds) !== 'undefined') {
                        jQuery.extend(insertfeature.properties, {chorovalue: burial.finds.length});
                        mychorojson.features.push(insertfeature);
                    }
                    if (typeof (burial.finds) == 'undefined') {
                        jQuery.extend(insertfeature.properties, {chorovalue: 0});
                        mychorojson.features.push(insertfeature);
                    }
                })
            }
        })
    }
    ;

    if (visappendLevel == 'sex') {
        $.each(mypolyjson.features, function (i, feature) {
            insertfeature = feature;
            if (typeof (feature.burials) !== 'undefined') {
                $.each(feature.burials, function (i, burial) {
                    if (typeof (burial.properties.types) !== 'undefined') {
                        $.each(burial.properties.types, function (i, type) {
                            var sex = type.name.toLowerCase();
                            switch (sex) {
                                case 'male':
                                    myvalue = 'male';
                                    jQuery.extend(insertfeature.properties, {chorovalue: myvalue});
                                    mychorojson.features.push(insertfeature);
                                    break;
                                case 'male?':
                                    myvalue = 'male';
                                    jQuery.extend(insertfeature.properties, {chorovalue: myvalue});
                                    mychorojson.features.push(insertfeature);
                                    break;
                                case 'female':
                                    myvalue = 'female';
                                    jQuery.extend(insertfeature.properties, {chorovalue: myvalue});
                                    mychorojson.features.push(insertfeature);
                                    break;
                                case 'female?':
                                    myvalue = 'female';
                                    jQuery.extend(insertfeature.properties, {chorovalue: myvalue});
                                    mychorojson.features.push(insertfeature);
                                    break;
                            }
                        })
                    }
                    ;
                });
            }
        })
    }
    ;

    if (visappendLevel == 'burialdim') {
        $.each(mypolyjson.features, function (i, feature) {
            if (typeof (feature.burials) !== 'undefined') {
                insertfeature = feature;
                $.each(feature.burials, function (i, burial) {
                    if (typeof (burial.properties.dimensions) !== 'undefined') {
                        $.each(burial.properties.dimensions, function (i, dimension) {
                            if (dimension.name == visproperty) {
                                jQuery.extend(insertfeature.properties, {chorovalue: parseInt((dimension.value), 10)});
                                mychorojson.features.push(insertfeature);
                            }
                        })
                    }
                })
            }
        })
    }
    ;

    if (visappendLevel !== 'sex') setChoropleth(title, mysteps, mymode, mycolor, myborder, myborderwidth, myfinalopacity, mylegend);
    if (visappendLevel == 'sex') setSexJson(title, colorstart, colorend, myborder, myborderwidth, myfinalopacity, mylegend);
}

function style(feature) {
    if ("male" == feature.properties.chorovalue) {
        return {
            fillColor: colorstart,
            fillOpacity: myfinalopacity,
            weight: myborderwidth,
            color: mybordercolor
        };
    } else if ("female" == feature.properties.chorovalue) {
        return {
            fillColor: colorend,
            fillOpacity: myfinalopacity,
            weight: myborderwidth,
            color: mybordercolor
        };
    }
}

function setSexJson(title, colorstart, colorend, myborder, myborderwidth, myfinalopacity, mylegend) {
    if (typeof (choroplethLayer) !== 'undefined')
        map.removeLayer(choroplethLayer);

    choroplethLayer = L.geoJSON(mychorojson, {
        style: style
    }).addTo(map);

    if (typeof (legend) !== 'undefined')
        $('.legendtoremove').remove();
    legend = L.control({position: 'bottomright'})
    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend legendtoremove')

        // Add min & max
        div.innerHTML = '<div><div align="center">' + title + '</div>' +
            '<ul><li style="padding-top: 8px">Male:</li><li style="margin-top: 4px; display: block; float: right; min-width: 60px; background-color: ' + colorstart + '">&nbsp;</li></ul>' +
            '<ul><li style="padding-top: 8px">Female:</li><li style="margin-top: 4px; display: block; float: right; min-width: 60px; background-color: ' + colorend + '">&nbsp;</li></ul>';
        return div;
    }
    if (mylegend)
        legend.addTo(map)


    overlays = {
        "Graves": graves,
        "Search results": resultpolys,
        "Search result markers": resultpoints,
        "Visualisations": choroplethLayer
    };
    map.removeControl(baseControl);
    baseControl = L.control.layers(baseLayers, overlays).addTo(map);

    map.on('overlayadd', function (eventLayer) {
        if (eventLayer.name === 'choroplethLayer') {
            map.addControl(legend);
        }
    });

    map.on('overlayremove', function (eventLayer) {
        if (eventLayer.name === 'choroplethLayer') {
            map.removeControl(legend);
        }
    });
}


function setChoropleth(title, mysteps, mymode, mycolor, myborder, myborderwidth, myfinalopacity, mylegend) {
    if (typeof (choroplethLayer) !== 'undefined')
        map.removeLayer(choroplethLayer);
    choroplethLayer = L.choropleth(mychorojson, {
        valueProperty: 'chorovalue', // which property in the features to use
        scale: mycolor, // chroma.js scale - include as many as you like
        steps: mysteps, // number of breaks or steps in range
        mode: mymode, // q for quantile, e for equidistant, k for k-means
        style: {
            color: myborder, // border color
            weight: myborderwidth,
            fillOpacity: myfinalopacity
        },
    }).addTo(map);

    if (typeof (legend) !== 'undefined')
        $('.legendtoremove').remove();
    legend = L.control({position: 'bottomright'})
    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend legendtoremove')
        var limits = choroplethLayer.options.limits
        var colors = choroplethLayer.options.colors
        var labels = []

        // Add min & max
        div.innerHTML = '<div class="labels"><div align="center">' + title + '</div><div class="min">' + limits[0] + '</div> \
			<div class="max">' + limits[limits.length - 1] + '</div></div>'

        limits.forEach(function (limit, index) {
            labels.push('<li style="background-color: ' + colors[index] + '"></li>')
        })

        div.innerHTML += '<ul>' + labels.join('') + '</ul>'
        return div
    }
    if (mylegend)
        legend.addTo(map)

    overlays = {
        "Graves": graves,
        "Search results": resultpolys,
        "Search result markers": resultpoints,
        "Visualisations": choroplethLayer,
        "Cemetery map" : plot,
    };
    map.removeControl(baseControl);
    baseControl = L.control.layers(baseLayers, overlays).addTo(map);

    map.on('overlayadd', function (eventLayer) {
        if (eventLayer.name === 'choroplethLayer') {
            map.addControl(legend);
        }
    });

    map.on('overlayremove', function (eventLayer) {
        if (eventLayer.name === 'choroplethLayer') {
            map.removeControl(legend);
        }
    });

}
