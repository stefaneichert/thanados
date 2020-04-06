function startvis(search) {
    //appendSearch(1);
    $('#myvisformCSV').empty();
    $('#myvisform').empty();
    if ($('#dialog').hasClass("ui-dialog-content")) {
        if (search !== true && ($('#dialog').dialog('isOpen') === true)) $("#dialog").dialog('close');
    }

    if (search) {
        visform = $('#myvisformCSV');
    }

    if (search !== true) {

        visform = $('#myvisform');

        $("#visdialog").dialog({
            width: mymodalwith,
            height: 450,
            open: function () {
                // Destroy Close Button (for subsequent opens)
                $('#visdialog-close').remove();
                // Create the Close Button (this can be a link, an image etc.)
                var link = '<btn id="visdialog-close" title="close" class="btn btn-sm btn-secondary d-inline-block" style="float:right;text-decoration:none;"><i class="fas fa-times"></i></btn>';
                // Create Close Button
                $(".ui-dialog-title").css({'width': ''});
                $(this).parent().find(".ui-dialog-titlebar").append(link);
                // Add close event handler to link
                $('#visdialog-close').on('click', function () {
                    $("#visdialog").dialog('close');
                });
            }
        });
    }
    visproperty = 'myprop';
    colorstart = "#ffffff";
    colorend = "#ff0000";
    appendvis('vis', search);
}

function appendvis(iter, search) { //append vis form to dialog
    if (search !== true) {
        visform.append(
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
                '<button class="btn btn-secondary btn-sm" type="button" id="resetvisbutton" onclick="startvis(false)" title="Reset">' +
                '<i class="fas fa-sync-alt"></i>' +
                '</button>' +
                '</div>'
            );
            if (visappendLevel !== 'findcount' && visappendLevel !== 'sex' && visappendLevel !== 'age') {
                visform.append(
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
                    '<option value="Azimuth">Azimuth</option>' +
                    '</select>' +
                    '</div>'
                );
            }
            if (visappendLevel == 'age') {
                visform.append(
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
                currentCreateLegend = mylegendtitle;
                appendvisbuttons();
            });
            switch (visappendLevel) {
                case 'findcount':
                    currentCreateLegend = "No. of finds in grave";
                    appendvisbuttons();
                    break;
                case 'sex':
                    currentCreateLegend = "Sex of buried individuals";
                    appendsexbuttons();
                    break;
                case 'age':
                    currentCreateLegend = "Age at death estimation";
                    break;
            }
        })
    }
    if (search) {
        visappendLevel = 'value';
        mylegendtitle = '';
        currentCreateLegend = mylegendtitle;
        appendvisbuttons();
    }
}

function appendvisbuttons(iter) {
    visform.append(
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
        '<input class="form-control legendtext" id="legendtitle" type="text" value="' + currentCreateLegend + '">' +
        //'<div class="input-group-append">' +
        //'<div class="input-group-text" title="Show legend">' +
        //'<input id="showlegend" type="checkbox" aria-label="Checkbox for showing map" checked>' +
        //'</div>' +
        //'</div>' +
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
        '<button class="btn btn-secondary btn-sm visbutton" type="button" id="AdvOptBtn" onclick="toggleOpt()" title="Advanced options for gradient color">' +
        '<i class="fas fa-ellipsis-h"></i>' +
        '</button>' +
        '<button class="btn btn-secondary btn-sm visbutton" type="button" id="VisResultBtn" onclick="finishvis()" title="Show on map with gradient color">' +
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
        currentCreateLegend = $('#legendtitle').val();
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
    visform.append(
        '<div class="myoptions input-group input-group-sm mb-3">' +
        '<div class="myoptions input-group input-group-sm mb-3">' +
        '<div class="input-group-prepend">' +
        '<label class="input-group-text" for="legendtitle">Legend title: </label>' +
        '</div>' +
        '<input class="form-control legendtext" id="legendtitle" type="text" value="' + currentCreateLegend + '">' +
        //'<div class="input-group-append">' +
        //'<div class="input-group-text" title="Show legend">' +
        //'<input id="showlegend" type="checkbox" aria-label="Checkbox for showing map" checked>' +
        //'</div>' +
        //'</div>' +
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
        '<button class="btn btn-secondary btn-sm visbutton toremovebtn" type="button" id="AdvOptBtn" onclick="toggleOpt()" title="Advanced styling options">' +
        '<i class="fas fa-ellipsis-h"></i>' +
        '</button>' +
        '<button class="btn btn-secondary btn-sm visbutton toremovebtn" type="button" id="VisResultBtn" onclick="finishvis()" title="Show on map">' +
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
        currentCreateLegend = $('#legendtitle').val();
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
    mylegend = true; //!!document.getElementById('showlegend').checked;


    myfinalopacity = (100 - myopacity) / 100;
    if (visappendLevel !== 'sex') getChoroplethJson(visproperty, visappendLevel, currentCreateLegend, mysteps, mymode, [colorstart, colorend], mybordercolor, myborderwidth, myfinalopacity, mylegend);
    if (visappendLevel == 'sex') getChoroplethJson(visproperty, visappendLevel, currentCreateLegend, 0, 'na', [colorstart, colorend], mybordercolor, myborderwidth, myfinalopacity, mylegend);
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

                });
            }
        })
    }


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

    if (visappendLevel == 'value') {
        var CSVresultIds = ValueResultsChoropleth(CSVresultJSON);
        $.each(mypolyjson.features, function (i, feature) {
            var currentId = feature.id;
            insertfeature = feature;
            $.each(CSVresultIds, function (i, dataset) {
                if (dataset.id === currentId) {
                    jQuery.extend(insertfeature.properties, {chorovalue: dataset.value});
                    mychorojson.features.push(insertfeature);
                }
            })
        });
        currentCreateLegend = GlobalSelectedNodeName;
    }

    mychorojson = JSON.parse(JSON.stringify(mychorojson).replace(/'/g, ""));
    if (visappendLevel !== 'sex') setChoropleth(currentCreateLegend, mysteps, mymode, mycolor, myborder, myborderwidth, myfinalopacity, mylegend);
    if (visappendLevel == 'sex') setSexJson(currentCreateLegend, colorstart, colorend, myborder, myborderwidth, myfinalopacity, mylegend);
}

//get only one value if search result is displayed as choropleth
function ValueResultsChoropleth(data) {
    graveList = [];
    $.each(data, function (i, feature) {
        //console.log(feature);
        var insertValue = {
            'id': feature.graveID,
            'value': feature.value,
            'category': feature.searchResult
        }
        graveList.push(insertValue);
    })

    var flags = [], output = [], l = graveList.length, i;
    for (i = 0; i < l; i++) {
        if (flags[graveList[i].id]) continue;
        flags[graveList[i].id] = true;
        output.push({
            'id': graveList[i].id,
            'value': parseFloat(graveList[i].value),
            'category': graveList[i].category
        });
    }
    //console.log(graveList.length); console.log (output.length);
    /*if (graveList.length !== output.length) console.log(
        'Please not that there are ' + graveList.length + ' results in ' + output.length + ' graves. ' +
        'For each grave only one value of these is considered for the gradient color mapping. ' +
        'If the mapping result is not sufficient you can narrow your search to get one unique value for each grave.');
    return (output)*/
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
        shapetype: 'colorPoly',
        legendTitle: title,
        layername: 'choroplethLayer',
        style: style
    }).addTo(map);

    var currentColorpoly = '<ul><li style="padding-top: 8px">Male:</li><li onclick="InfoAlert()" style="cursor: pointer; max-height: 20px; margin-top: 4px; display: block; float: right; min-width: 60px; background-color: ' + hexToRgbA(colorstart, myfinalopacity) + '; border: ' + myborderwidth + 'px solid ' + myborder + '">&nbsp;</li></ul>' +
        '<ul><li style="padding-top: 8px">Female:</li><li onclick="InfoAlert()" style="cursor: pointer; max-height: 20px; margin-top: 4px; display: block; float: right; min-width: 60px; background-color: ' + hexToRgbA(colorend, myfinalopacity) + '; border: ' + myborderwidth + 'px solid ' + myborder + '">&nbsp;</li></ul>';

    createLegend(map, choroplethLayer, currentColorpoly);
    orderlayer(myselector);
}


function setChoropleth(title, mysteps, mymode, mycolor, myborder, myborderwidth, myfinalopacity, mylegend) {
    if (mylegend) {
        currentLegend = currentCreateLegend;
        //console.log('first creation')
    }
    if (typeof (choroplethLayer) !== 'undefined') map.removeLayer(choroplethLayer);
    choroplethLayer = L.choropleth(mychorojson, {
        shapetype: 'choropoly',
        legendTitle: title,
        layername: 'choroplethLayer',
        valueProperty: 'chorovalue', // which property in the features to use
        scale: mycolor, // chroma.js scale - include as many as you like
        steps: mysteps, // number of breaks or steps in range
        mode: mymode, // q for quantile, e for equidistant, k for k-means
        polygonstyle: {
            color: myborder, // border color
            weight: myborderwidth,
            fillOpacity: myfinalopacity
        },
        style: {
            color: myborder, // border color
            weight: myborderwidth,
            fillOpacity: myfinalopacity
        },
    }).addTo(map);


    var div = document.createElement('div');
    var limits = choroplethLayer.options.limits
    var colors = choroplethLayer.options.colors
    var labels = []

    // Add min & max
    //div.innerHTML = '<div class="labels"></div>'

    limits.forEach(function (limit, index) {
        labels.push('<li style="background-color: ' + colors[index] + '"></li>')
    })

    div.innerHTML += '<ul class="mt-2" onclick="InfoAlert()"><span style="display: table; margin: auto; cursor: pointer;"><li style="width: auto; margin-right: 9px">' + limits[0] + '</li>' + labels.join('') + '<li style="width: auto; margin-left: 9px">' + limits[limits.length - 1] + '</li></span></ul>'
    //return div
    createLegend(map, choroplethLayer, div);
    orderlayer(myselector);
}

function InfoAlert(text) {
    /*$('#map').append('<div style="z-index: 50000; font-size: 1.3em;" class="alert alert-primary alert-dismissible fade show" role="alert">\n' +
        '' + text + '\n' +
        '  <button type="button" class="close" data-dismiss="alert" aria-label="Close">\n' +
        '    <span aria-hidden="true">&times;</span>\n' +
        '  </button>\n' +
        '</div>')*/
    $('.toast').remove();
    $('#map').append('<div class="toast" style="position: absolute; bottom: 50%; left: 40%; z-index: 50000; background-color: rgb(255, 255, 255);"\n' +
        'data-autohide="false" role="alert" aria-live="assertive" aria-atomic="true">\n' +
        '  <div class="ui-widget-header toast-header">\n' +
        '    <span class="mr-auto">Info</span>\n' +
        '    <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">\n' +
        '      <span aria-hidden="true">&times;</span>\n' +
        '    </button>\n' +
        '  </div>\n' +
        '  <div class="toast-body ui-dialog-content">\n' +
        ' This is a predefined visualisation that cannot be restyled after adding it to the map. You can style the layer on adding it. ' +
        'If you want to do more complex visualisations/stylings of your layers, you can use the <a style=\'cursor: pointer; color: blue\' onclick=\'startsearch(); removeToast()\'><b> filter/search </b></a> function and then ' +
        'style the search result via clicking the layer in the legend.' +
        '  </div>\n' +
        '</div>');

    $('.toast').toast('show');
}

function removeToast() {
    $('.toast').toast('hide');
}

