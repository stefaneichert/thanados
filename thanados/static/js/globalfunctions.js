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
        $('#mycontent').animate({
            scrollTop: 0
        }, 200);
        return false;
    });

    $(document).on('show.bs.modal', '.modal', function (event) {
        var zIndex = 1040 + (10 * $('.modal:visible').length);
        $(this).css('z-index', zIndex);
        setTimeout(function () {
            $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
        }, 0);
        $('#back-to-top').css("display", "none")
    });
})

$(document).on('change', "input[type|=\'text\']", function () {
    if ($(this).hasClass('legendtext')) {
        currentLegend = this.value;
        currentCreateLegend = currentLegend;
        //console.log(currentLegend);
    }

});


function setJson(data) {
    countGeom = 0
    $.each(data.features, function (i, feature) {
        if (typeof (feature.geometry) !== 'undefined' && feature.id !== 0) {
            countGeom += 1;
        }
    })
    if (countGeom === 0) {
        markerset = true;
        return false;
    }
    if (countGeom > 0) return true;
}

/**
 * When searching a table with accented characters, it can be frustrating to have
 * an input such as _Zurich_ not match _Zürich_ in the table (`u !== ü`). This
 * type based search plug-in replaces the built-in string formatter in
 * DataTables with a function that will replace the accented characters
 * with their unaccented counterparts for fast and easy filtering.
 *
 * Note that this plug-in uses the Javascript I18n API that was introduced in
 * ES6. For older browser's this plug-in will have no effect.
 *
 *  @summary Replace accented characters with unaccented counterparts
 *  @name Accent neutralise
 *  @author Allan Jardine
 *
 *  @example
 *    $(document).ready(function() {
 *        $('#example').dataTable();
 *    } );
 */

function AccRemove() {

    (function () {

        function removeAccents(data) {
            if (data.normalize) {
                // Use I18n API if avaiable to split characters and accents, then remove
                // the accents wholesale. Note that we use the original data as well as
                // the new to allow for searching of either form.
                return data + ' ' + data
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '');
            }

            return data;
        }

        var searchType = jQuery.fn.DataTable.ext.type.search;

        searchType.string = function (data) {
            return !data ?
                '' :
                typeof data === 'string' ?
                    removeAccents(data) :
                    data;
        };

        searchType.html = function (data) {
            return !data ?
                '' :
                typeof data === 'string' ?
                    removeAccents(data.replace(/<.*?>/g, '')) :
                    data;
        };

    }());
}


function exportToJsonFile(data) {
    if (typeof (myjson) != 'undefined') {
        L.extend(data, {
            name: myjson.name,
            properties: myjson.properties,
            site_id: myjson.site_id
        });
    }

    var mydata = JSON.stringify(data).replace('\u2028', '\\u2028').replace('\u2029', '\\u2029');
    var file = new Blob([mydata]);
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = 'export.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

function exportChartToImg(canvas, filetype) {

    //create a dummy CANVAS
    if (filetype === 'png') {
        destinationCanvas = document.getElementById(canvas);
        var url = destinationCanvas.toDataURL("image/png");

    } else {
        var srcCanvas = document.getElementById(canvas);
        destinationCanvas = document.createElement("canvas");
        destinationCanvas.width = srcCanvas.width;
        destinationCanvas.height = srcCanvas.height;

        destCtx = destinationCanvas.getContext('2d');

//create a rectangle with the desired color
        destCtx.fillStyle = "#FFFFFF";
        destCtx.fillRect(0, 0, srcCanvas.width, srcCanvas.height);

//draw the original canvas onto the destination canvas
        destCtx.drawImage(srcCanvas, 0, 0);
        var url = destinationCanvas.toDataURL("image/jpeg", 1.0);

    }

    var a = document.createElement("a");
    a.href = url;
    a.download = 'ThanadosChart.' + filetype;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

function toCSV(json) {
    //console.log('toCSV')
    var csv = "";
    var keys = (json[0] && Object.keys(json[0])) || [];
    csv += '"' + keys.join('\",\"') + '"\n';
    for (var line of json) {
        csv += '"' + (keys.map(key => line[key]).join('\",\"') + '"\n');
    }
    return csv;
}

function exportToCSV(data) {
    var file = new Blob([data]);
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = 'export.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

function openInNewTab(url) {
    var win = window.open(url, '_self'); //change to _blank for new tabs.
    win.focus();
}

$(document).ready(function () {
    $('#show_passwords').show();
    $('#show_passwords').change(function () {
        $('#password')[0].type = this.checked ? 'text' : 'password';
    });
    $("form").each(function () {
        $(this).validate();
    });
    setlogo()
})

function setlogo() {
    if (($(window).width()) > 767) {
        $('#nav-logo').attr("src", "/static/images/icons/logo_big.png");
    } else {
        $('#nav-logo').attr("src", "/static/images/icons/logo_small.png");
    }
}

$(window).resize(function () {
    setlogo()
})


function groundTypes(data, length) {
    var oldlength = AvailableNodes.length;
    if (AvailableNodes.length !== length) {
        $.each(jsontypes, function (i, type) {
            if (data.includes(type.id)) {
                if (AvailableNodes.includes(type.parent) === false) {
                    AvailableNodes.push(type.parent);
                }
            }
        })
        groundTypes(AvailableNodes, oldlength)
    } else {
        AvailableNodes = (AvailableNodes.concat(availables))
    }
    // console.log(parentlist);
}


//build jstree after criteria and level for search in Map and Global search
function checkAvailable(appendLevel, type) {
    var form;
    AvailableNodes = [];
    switch (appendLevel) {
        case "burial_site":
            form = "place";
            break;
        case "feature":
            form = "feature";
            if (mapsearch) availables = availableTypes.gravetypes;
            break;
        case "strat":
            form = "stratigraphic_unit";
            if (mapsearch) availables = availableTypes.burialtypes;
            break;
        case "find":
            form = "artifact";
            if (mapsearch) availables = availableTypes.findtypes;
            break;
        case "osteology":
            form = "human_remains"
            if (mapsearch) availables = availableTypes.bonetypes;
            break;
        default:
            alert('notype')
    }
    if (mapsearch) groundTypes(availables, 1, form);
    var availableFormTypes = [];
    $.each(jsontypes, function (j, entry) {


        //console.log(entry.forms);
        if (entry.forms) {
            if (mapsearch) {
                if (entry.forms.includes(form) && AvailableNodes.includes(entry.id)) {
                    if (availableFormTypes.includes(entry.level) === false)
                        availableFormTypes.push(entry.level);
                }
            } else {
                if (entry.forms.includes(form)) {
                    if (availableFormTypes.includes(entry.level) === false)
                        availableFormTypes.push(entry.level);
                }
            }
        }
    });
    return availableFormTypes.includes(type);

}


function initiateTree(Iter, appendLevel, criteria, targetField) {
    var form;
    switch (appendLevel) {
        case "burial_site":
            form = "place";
            break;
        case "feature":
            form = "feature";
            if (mapsearch) availables = availableTypes.gravetypes;
            break;
        case "strat":
            form = "stratigraphic_unit";
            if (mapsearch) availables = availableTypes.burialtypes;
            break;
        case "find":
            form = "artifact";
            if (mapsearch) availables = availableTypes.findtypes;
            break;
        case "osteology":
            form = "human_remains"
            if (mapsearch) availables = availableTypes.bonetypes;
            break;
        default:
            alert('notype')
    }
    $('#mytreeModal').removeClass('d-none');
    UnsetGlobalVars(); //reset vars
    //define search criteria
    treecriteria = criteria;
    if (criteria === 'maintype') treecriteria = appendLevel;
    //build tree after selected criteria
    selectedtypes = [];
    if (mapsearch) groundTypes(availables, 1, form);
    $.each(jsontypes, function (j, entry) {
        if (entry.forms) {
            if (mapsearch) {
                if (entry.level === treecriteria && entry.forms.includes(form) && AvailableNodes.includes(entry.id)) {
                    selectedtypes.push(entry);
                }
            } else {
                if (entry.level === treecriteria && entry.forms.includes(form)) {
                    selectedtypes.push(entry);
                }
            }
        }
    });

    $(function () {
        $('#jstree').jstree({
                'core': {
                    "data": selectedtypes,
                    "themes": {
                        "icons": false,
                        "dots": false
                    }
                },
                "search": {
                    "show_only_matches": true, //filtering
                    "show_only_matches_children": true

                },
                "plugins": ["search"]
            }
        )

        //add search functionality
        to = false;
        $('#jstree_q').keyup(function () {
            if (to) {
                clearTimeout(to);
            }
            to = setTimeout(function () {
                v = $('#jstree_q').val();
                $('#jstree').jstree(true).search(v);
            }, 250);
        });
    });

    //retrieve values of selected node
    $('#jstree').on("changed.jstree", function (e, data) {
        NodeSelected = parseInt(data.selected);
        node = $('#jstree').jstree().get_node(NodeSelected);
        SelectedNodeName = node.text;
        //make variables global
        GlobaltargetField = targetField;
        GlobalNodeSelected = NodeSelected;
        GlobalSelectedNodeName = SelectedNodeName;
        Globalcriteria = criteria;
        GlobalappendLevel = appendLevel;
        Globaliter = Iter;
        $('#jstree_q').val(GlobalSelectedNodeName);
    });

//show tree in modal
    $("#mytreeModal").dialog({
        modal: true,
        closeOnEscape: false,
        open: function (event, ui) {
            if (local === false) $(".ui-dialog-titlebar-close").hide();
        },
        classes: {
            "ui-dialog": "custom-tree"
        }
    });

    windowheight = ($(window).height());
    $('.custom-tree').css('max-height', windowheight - 100 + 'px');
    $('#jstree').css('max-height', windowheight - 250 + 'px')

    $(window).resize(function () {
        windowheight = ($(window).height());
        $('.custom-tree').css('max-height', windowheight - 100 + 'px');
        $('#jstree').css('max-height', windowheight - 250 + 'px')
    });

//refresh tree if new search
    if ((typeof ($('#jstree').jstree(true).settings)) !== 'undefined') {
        $('#jstree').jstree(true).settings.core.data = selectedtypes;
        $('#jstree').jstree(true).refresh();

    }
}

function transferNode(targetField, NodeSelected, SelectedNodeName, criteria, appendLevel, Iter, val1, val2) {
    if (GlobalNodeSelected == '' || isNaN(GlobalNodeSelected)) {
        alert('select property first');
        return;
    }
    if (local) {
        currentLegendTitle = currentLegendTitle + ' > ' + GlobalSelectedNodeName;
        currentCreateLegend = GlobalSelectedNodeName;
    }

    if (GlobalNodeSelected !== '' && Globalcriteria !== 'material' && Globalcriteria !== 'value') {

        $(function () {
            $('#' + targetField).val(SelectedNodeName);
            $('#' + targetField).prop('disabled', true);
        });

        setNodes(NodeSelected);
        if (typeof (val1) == 'undefined')
            val1 = '';
        if (typeof (val2) == 'undefined')
            val2 = '';
        if (local) {
            jsonquery(nodeIds, appendLevel, criteria, val1, val2);
            $('#' + targetField + '_Result').val(uniqueSearchResult.length + ' matches in ' + searchResult.length + ' graves');
            $('#mytreeModal').dialog("close");
            appendPlus(Iter);
        } else {
            $('#SQL' + Iter).val($('#SQL' + Iter).val() + ' is "' + GlobalSelectedNodeName + '"');
            $("#Heading" + Iter).html($('#SQL' + Iter).val());
            $('#type' + Iter).val(nodeIds);
            $('#mytreeModal').dialog("close");
            if (criteria === 'type' || criteria === 'maintype') returnQuerystring();
        }
    }

    if (GlobalNodeSelected) {
        if (Globalcriteria === 'material' && GlobalNodeSelected !== '' || Globalcriteria === 'value' && GlobalNodeSelected !== '') {
            $('#SQL' + Iter).val($('#SQL' + Iter).val() + ' is "' + GlobalSelectedNodeName + '"');
            $("#Heading" + Iter).html($('#SQL' + Iter).val());
            $('#' + targetField).text(SelectedNodeName);
            $('#' + targetField).prop('disabled', true);
            setNodes(NodeSelected);
            $('#type' + Iter).val(nodeIds);
            $('#mytreeModal').dialog("close");
            appendMaterial(Iter);
        }
    }
}

function setNodes(state) {
    nodes = [];
    nodeIds = [];
    traverse(state);
    getNodeIds(nodes);
}

function traverse(state) {

    // Get the actual node
    node = $('#jstree').jstree().get_node(state);

    // Add it to the results
    nodes.push(node);

    // Attempt to traverse if the node has children
    if ($('#jstree').jstree().is_parent(node)) {
        $.each(node.children, function (index, child) {
            traverse(child);
        });
    }
}

function getNodeIds(nodes) {
    $.each(nodes, function (i, mynode) {
        nodeIds.push(parseInt(mynode.id))
    });
}

function UnsetGlobalVars() { //global vars needed for appended buttons in search
    // unset global variables
    GlobaltargetField = '';
    GlobalNodeSelected = '';
    GlobalSelectedNodeName = '';
    Globalcriteria = '';
    GlobalappendLevel = '';
    Globaliter = '';
    Globalval = '';
    Globalval2 = '';
}

function validateNumbers(val1, val2, criteria) { //validate numbers and continue of valid or resume with alert if invalid
    //debug // console.log(criteria + '- 1: ' + val1 + ' - 2: ' + val2);

    if (criteria === 'timespan' && val1 === '') {
        alert('Please enter valid timerange');
        return false;
    }

    if (criteria === 'timespan' && val2 === '') {
        alert('Please enter valid timerange');
        return false;
    }

    if (criteria === 'value' || criteria === 'dimension') {
        if (val1 === '' || val2 === '') {
            alert('Please enter valid range');
            return false;
        }
    }

    if (isNaN(val1) || isNaN(val2)) {
        alert('Please enter valid numbers');
        return false;
    }

    if (parseFloat(val1) > parseFloat(val2) && val2 !== '') {
        //debug //     console.log('1: ' + val1 + ' - 2: ' + val2);
        alert('First value must be lower than second value');
        return false;
    }

    if (criteria === 'material') {
        if (val1 < 0 || val2 < 0 || val1 > 100 || val2 > 100) {
            alert('Values must be between 0 and 100 (%)')
            return false;
        }
    }

    return true;
}

$.ajaxSetup({
    beforeSend: function (xhr, settings) {
        if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", test_csrf_token);
        }
    }
});


function openStyleDialog(layerType) {
    //console.log('stylestart');
    if ($('#dialog').hasClass("ui-dialog-content")) {
        if ($('#dialog').dialog('isOpen') === true) $("#dialog").dialog('close');
    }
    if ($('#visdialog').hasClass("ui-dialog-content")) {
        if ($('#visdialog').dialog('isOpen') === true) $("#visdialog").dialog('close');
    }
    if ($('#styledialog').hasClass("ui-dialog-content")) {
        if ($('#styledialog').dialog('isOpen') === true) $("#styledialog").dialog('close');
    }

    $("#styledialog").removeClass('d-none');

    mapdiv = document.getElementById('map');
    $("#styledialog").dialog({
        dialogClass: 'layerdialog',
        width: mymodalwith,
        minHeight: 450,
        position: dialogPosition, //$('#container')},
        //height: 450,
        open: function () {
            // Destroy Close Button (for subsequent opens)
            $('#styledialog-close').remove();
            // Create the Close Button (this can be a link, an image etc.)
            var link = '<btn id="styledialog-close" title="close" class="btn btn-sm btn-secondary d-inline-block" style="float:right;text-decoration:none;"><i class="fas fa-times"></i></btn>';
            // Create Close Button
            $(".ui-dialog-title").css({'width': ''});
            $(this).parent().find(".ui-dialog-titlebar").append(link);
            // Add close event handler to link
            $('#styledialog-close').on('click', function () {
                $("#styledialog").dialog('close');
            });
        }
    });

    if (layerType !== 'single') {

        $('.nav-display').removeClass('d-none');

        if (layertypes.multicolor) {
            if (layertypes.multicolorNoOverlaps) {
                var multibadge = '<span title="Multiple colors for sub categories of your search parameters are possible without overlaps" class="ms-1 badge float-end badge-success badge-pill"><i class="fas fa-check"></i></span>'
            } else {
                var multibadge = '<span title="Multiple colors for sub categories of your search parameters are possible but there are overlapping results. This results from multiple matches in one grave. For one grave only one category can be displayed. You can narrow the results by selecting more detailed categories in the search." class="ms-1 badge float-end badge-success badge-pill">Overlaps &nbsp;<i class="fas fa-info"></i></span>\n'
            }
        } else {
            $('#colorPoly').addClass('d-none');
            var multibadge = '<span title="There are no distinctive categories in this search. No multiple color display is possible." class="ms-1 badge float-end badge-secondary badge-pill"><i class="fas fa-exclamation-triangle"></i></span>';

        }

        if (layertypes.gradientcolor || layertypes.gradientcolorTimespan) {
            if (layertypes.gradientcolorNoOverlaps) {
                var gradibadge = '<span title="Gradient colors for values of your search parameters are possible without overlaps" class="ms-1 badge float-end badge-success badge-pill">Values &nbsp;<i class="fas fa-check"></i></span>\n'
            } else {
                var gradibadge = '<span title="Gradient colors for values of your search parameters are possible but there are overlapping results. This results from multiple matches in one grave. For one grave only one category can be displayed. You can narrow the results by selecting more detailed categories in the search." class="ms-1 badge float-end badge-success badge-pill">Values overlaps &nbsp;<i class="fas fa-info"></i></span>\n'
            }
        } else {
            var gradibadge = '<span title="There are no values to be displayed as gradient colors." class="ms-1 badge float-end badge-secondary badge-pill">Values &nbsp;<i class="fas fa-exclamation-triangle"></i></span>'
        }

        if (layertypes.gradientcount) {
            var gradicountbadge = '<span title="Gradient colors for the count of your search parameters for each grave are possible" class="ms-1 badge float-end badge-success badge-pill">Count &nbsp;<i class="fas fa-check"></i></span>\n'
        } else var gradicountbadge = '<span title="There are no varying counts to be displayed as gradient colors." class="ms-1 badge float-end badge-secondary badge-pill">Count &nbsp;<i class="fas fa-exclamation-triangle"></i></span>\n'

        if (layertypes.gradientcount === false && layertypes.gradientcolor === false && layertypes.gradientcolorTimespan === false) $('#choropoly').addClass('d-none')

        if (layertypes.charts) {
            var chartcountbadge = '<span title="Chart markers for the count of your search parameters for each grave are possible" class="ms-1 badge float-end badge-success badge-pill"><i class="fas fa-check"></i></span>\n'
        } else {
            $('#chart').addClass('d-none');
            var chartcountbadge = '<span title="There are no multiple counts of your search results per grave to be displayed as chart markers." class="ms-1 badge float-end badge-secondary badge-pill"><i class="fas fa-exclamation-triangle"></i></span>'
        }
    }
// multicolorNoOverlaps: true,
// gradientcount: false,
// gradientcolor: false,
// gradientcolorNoOverlaps: true,
// charts: false,
// chartsNoOverlaps: true

    $("#styleContent").css('max-height', (containerheight - 110) + 'px');
    $("#styleContent").css('overflow-y', 'auto');

    $('.LayerOptionSelect').removeClass('d-none');

    switch (layerType) {
        case 'single':
            $('.LayerOptionSelect').addClass('d-none');
            var styledialog = '<form id="mystyleform">\n' +
                '<h5 class="mt-1 mb-3"> Layer options for graves </h5>' +
                '        <div class="mystyleoptions input-group input-group-sm mb-3">\n' +
                '            <span class="input-group-text" for="stylecolor">Fill color: </span>\n' +
                '            <input class="form-control form-control-sm" id="stylecolor" style="max-width: 70px" type="color"\n' +
                '                   value="' + myStyle.fillColor + '">\n' +
                '            <span class="input-group-text">Opacity (%): </span>\n' +
                '            <input class="form-control form-control-sm form-range"\n' +
                '                                                       id="mystyleopacity" type="range"\n' +
                '                                                       value="' + (100 - (myStyle.fillOpacity * 100)) + '" min="0" max="100">\n' +
                '            <input class="form-control form-control-sm"\n' +
                '                                                            id="mystyleopacityvalue"\n' +
                '                                                            type="number" value="10" min="0"\n' +
                '                                                            max="100"\n' +
                '                                                            style="max-width: 60px">\n' +
                '        </div>\n' +
                '        <div class="mystyleoptions input-group input-group-sm mb-3">\n' +
                '            <span class="input-group-text">Border\n' +
                '                    color: </span>\n' +
                '            <input class="form-control form-control-sm"\n' +
                '                                                         id="stylecolorborder"\n' +
                '                                                         style="max-width: 70px"\n' +
                '                                                         type="color"\n' +
                '                                                         value="' + myStyle.color + '">\n' +
                '            <span class="input-group-text">Border width: </span>\n' +
                '            <input class="form-control form-control-sm"\n' +
                '                                                         id="styleborderwidth" type="number"\n' +
                '                                                         value="' + myStyle.color + '" min="0">\n' +
                '        </div>\n' +
                '        <button class="btn btn-sm btn-secondary btn-sm float-end" type="button"\n' +
                '                id="applyStyle"\n' +
                '                onclick="applyButton(\'graves\')" title="Apply">Apply\n' +
                '        </button>\n' +
                '    </form>';
            $("#styleContent").empty();
            $("#styleContent").html(styledialog);
            setStyleValues();

            break;
        case 'poly':
            var styledialog = '<form id="mystyleform">\n' +
                '<h5 class="mt-1 mb-3"> Single color layer options</h5>' +
                '<div class="mysearchoptions input-group input-group-sm mb-3">' +
                '<span class="input-group-text">Legend title: </span>' +
                '<input class="form-control form-control-sm legendtext" id="legendtitle" type="text" value="' + currentLegend + '">' +
                '</div>' +
                '</div>' +
                '<div class="mysearchoptions input-group input-group-sm mb-3">' +
                '<span class="input-group-text">Fill color: </span>' +
                '<input class="form-control form-control-sm" id="Searchfillcolor" style="max-width: 70px" type="color" value="' + searchStyle.fillColor + '">' +
                '<span class="input-group-text">Opacity (%): </span>' +
                '<input class="form-control form-control-sm form-range" id="Searchmysearchopacity" type="range" value="' + (100 - ((searchStyle.fillOpacity) * 100)) + '" min="0" max="100">' +
                '<input class="form-control form-control-sm" id="Searchmysearchopacityvalue" type="number" value="' + (100 - ((searchStyle.fillOpacity) * 100)) + '" min="0" max="100" style="max-width: 60px">' +
                '</div>' +
                '<div class="mysearchoptions input-group input-group-sm mb-3">' +
                '<span class="input-group-text" for="searchbordercolor">Border color: </span>' +
                '<input class="form-control form-control-sm" id="Searchcolorborder" style="max-width: 70px" type="color" value="' + searchStyle.color + '">' +
                '<span class="input-group-text ">Border width: </span>' +
                '<input class="form-control" id="Searchsearchborderwidth" type="number" value="' + searchStyle.weight + '" min="0">' +
                '<span title="Radius for point result" class="pointBtn input-group-text input-group-middle">Radius: </span>' +
                '<input title="Radius for point result" class="pointBtn form-control" id="Searchsearchpointradius" type="number" value="8" min="1">' +
                '</div>' +
                '<button class="polyBtn btn btn-secondary btn-sm toremovebtn" onclick="finishQuery(\'poly\', finalSearchResultIds, CSVresult, false, currentLayerId)" title="Apply as polygon layer" type="button">' +
                '<i class="fas fa-draw-polygon"></i>' +
                '</button>' +
                '<button class="pointBtn btn btn-secondary btn-sm toremovebtn" onclick="finishQuery(\'point\', finalSearchResultIds, CSVresult, false, currentLayerId)" title="Apply as point layer" type="button">' +
                '<i class="fas fa-map-marker"></i>' +
                '</button>' +
                '<button onclick="removeLayer(currentLayerId, \'map\')" id="RemoveLayerBtn" class="pointBtn btn btn-secondary btn-sm toremovebtn" title="Delete layer" type="button">' +
                '<i class="fas fa-trash-alt"></i>' +
                '</button>' +
                '<button onclick="copyLayer()" id="CopyLayerBtn" class="pointBtn btn btn-secondary btn-sm toremovebtn" title="Duplicate layer and add to map" type="button">' +
                '<i class="fas fa-clone"></i>' +
                '</button>' +
                '<div class="dropdown">' +
                '<button class="btn btn-secondary btn-sm dropdown-toggle toremovebtn" type="button" id="dropdownMenuButtonDL" title="Download search result geodata" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                '<i class="far fa-save"></i>' +
                '</button>' +
                '<div class="dropdown-menu" aria-labelledby="dropdownMenuButtonDL">' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresult)" title="Download as GEOJson polygons" href="#">Polygons</a>' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresultPoints)" title="Download as GEOJson points" href="#">Points</a>' +
                '</div>' +
                '</div>' +
                '<button class="btn btn-secondary btn-sm toremovebtn" onclick="finishQuery(\'table\', finalSearchResultIds, CSVresult, false, currentLayerId)" type="button" id="SearchShowListButton" title="Show/Export result list" data-bs-toggle="modal" data-bs-target="#CSVmodal">' +
                '<i class="fas fa-list"></i>' +
                '</button>' +
                '</form>'

            $("#styleContent").empty();
            $("#styleContent").html(styledialog);

            $('#Searchsearchpointradius').val(searchStyle.radius);

            fillInput = document.getElementById("Searchfillcolor");
            fillcolor = fillInput.value;
            fillInput.addEventListener("input", function () {
                fillcolor = fillInput.value;
            }, false);

            mysearchopacity = (100 - searchStyle.fillOpacity * 100);
            $('#Searchmysearchopacity').on('input change', function () {
                mysearchopacity = $('#Searchmysearchopacity').val();
                $('#Searchmysearchopacityvalue').val(mysearchopacity);
            });
            $('#Searchmysearchopacityvalue').on('input change', function () {
                mysearchopacity = $('#Searchmysearchopacityvalue').val();
                if (mysearchopacity > 100)
                    $('#Searchmysearchopacityvalue').val(100);
                if (mysearchopacity < 0)
                    $('#Searchmysearchopacityvalue').val(0);
                $('#Searchmysearchopacity').val(mysearchopacity);
            });
            mysearchbordercolor = searchStyle.color;
            searchbordercolorInput = document.getElementById("Searchcolorborder");
            searchbordercolor = searchbordercolorInput.value;
            searchbordercolorInput.addEventListener("input", function () {
                mysearchbordercolor = searchbordercolorInput.value;
            }, false);

            mysearchborderwidth = searchStyle.weight;
            $('#Searchsearchborderwidth').on('input change', function () {
                mysearchborderwidth = $('#Searchsearchborderwidth').val();
                if (mysearchborderwidth < 0)
                    $('#Searchsearchborderwidth').val(0);
            });

            mysearchpointradius = $('#Searchsearchpointradius').val()
            if (mysearchpointradius == '') {
                mysearchpointradius = 8;
                $('#Searchsearchpointradius').val(8);
            }
            $('#Searchsearchpointradius').on('input change', function () {
                mysearchpointradius = $('#Searchsearchpointradius').val();
                if (mysearchpointradius < 0)
                    $('#Searchsearchpointradius').val(0);
            });


            break;
        case 'choropoly':

            myChorolegendtitle = currentLegend;
            myChorosteps = choroOptions.steps;
            mysearchpointradius = parseInt(choroOptions.radius);
            mysearchpointminradius = parseInt(choroOptions.minradius);
            myChoromode = choroOptions.mode;
            myValueMode = choroOptions.valuemode;
            myChorocolor = choroOptions.scale;
            myChoroborder = choroOptions.polygonstyle.color;
            myChoroborderwidth = choroOptions.polygonstyle.weight;
            myChoroopacity = 100 - choroOptions.polygonstyle.fillOpacity * 100;
            myChorolegendvar = true;
            myChorolegend = false;
            myChoroPntMode = choroOptions.choroPntMode;

            var styledialog = '<form id="mystyleform">\n' +
                '<h5 class="mt-1 mb-3"> Gradient color layer options</h5>' +
                '<div class="myoptions input-group input-group-sm mb-3">' +
                '<span class="input-group-text">Color range</span>' +
                '<input class="form-control form-control-sm" id="colorstart" style="max-width: 70px" type="color" value="' + myChorocolor[0] + '">' +
                '<input class="form-control form-control-sm" id="colorend" style="max-width: 70px" type="color" value="' + myChorocolor[1] + '">' +
                '<span class="input-group-text">Steps: </span>' +
                '<input class="form-control form-control-sm" id="chorosteps" type="number" value="' + myChorosteps + '" min="2" max="100">' +
                '</div>' +
                '<div class="myoptions input-group input-group-sm mb-3">' +
                '<span class="input-group-text">Legend title: </span>' +
                '<input class="form-control form-control-sm legendtext" id="legendtitle" type="text" value="' + myChorolegendtitle + '">' +
                '</div>' +
                '<div class="myoptions input-group input-group-sm mb-3">' +
                '<span class="input-group-text">Opacity (%): </span>' +
                '<input class="form-control form-control-sm form-range" id="ChoroOpacity" type="range" value="' + myChoroopacity + '" min="0" max="100">' +
                '<input class="form-control form-control-sm" id="ChoroOpacityvalue" type="number" value="' + myChoroopacity + '" min="0" max="100" style="max-width: 60px">' +
                '</div>' +
                '<div class="myoptions input-group input-group-sm mb-3">' +
                '<span class="input-group-text">Border color: </span>' +
                '<input class="form-control form-control-sm" id="ChoroColorborder" style="max-width: 70px" type="color" value="' + myChoroborder + '">' +
                '<span class="input-group-text">Border width: </span>' +
                '<input class="form-control form-control-sm" id="ChoroBorderwidth" type="number" value="' + myChoroborderwidth + '" min="0">' +
                '</div>' +

                '<div class="myoptions input-group input-group-sm mb-3">' +
                '<span class="input-group-text">Point:</span>' +
                '<select class="form-select form-select-sm empty" id="gradselect">' +
                '<option value="0">single size</option>' +
                '<option value="1">gradient size</option>' +
                '</select>' +
                '<span id="radius" class="input-group-text">Radius: </span>' +
                '<input class="d-none pointBtn form-control form-control-sm" id="minRadius" type="number" value="' + mysearchpointminradius + '" min="1">' +
                '<input class="input-group pointBtn form-control form-control-sm" id="Searchsearchpointradius" type="number" value="' + mysearchpointradius + '" min="1">' +

                '</div>' +
                '<div id="MethodSelect_parent" class="myoptions input-group input-group-sm mb-3">' +
                '<span class="input-group-text">Method: </span>' +
                '<select class="form-select form-select-sm empty" id="MethodSelect">' +
                '<option value="e">equidistant</option>' +
                '<option value="q">quantile</option>' +
                '<option value="k">k-means</option>' +
                '</select>' +
                '<span class="input-group-text">Color value: </span>' +
                '       <select class="form-select form-select-sm empty"\n' +
                '                title="Select what value the color intensity is calculated from." \n' +
                '                id="ValueSelect">\n' +
                '            <option id="valueOption" class="d-none" title="The value associated with the search result. E.g. the depth of a grave" value="value">Value</option>\n' +
                '            <option id="countOption" title="The total count of search results per grave. E.g. the number of finds" value="count">Count</option>\n' +
                '            <option id="beginOption" class="d-none timeOption" title="Display the begin value in gradient colors" value="begin">Begin</option>\n' +
                '            <option id="middleOption" class="d-none timeOption" title="Display the average value between begin and end in gradient colors" value="middle">Middle</option>\n' +
                '            <option id="endOption" class="d-none timeOption" title="Display the end value in gradient colors" value="end">End</option>\n' +
                '        </select>' +
                '</div>' +
                '<button id="ChoroStyleBtn" class="polyBtn btn btn-secondary btn-sm toremovebtn" title="Apply as polygon layer" type="button">' +
                '<i class="fas fa-draw-polygon"></i>' +
                '</button>' +
                '<button id="ChoroStylePntBtn" class="pointBtn btn btn-secondary btn-sm toremovebtn" title="Apply as point layer" type="button">' +
                '<i class="fas fa-map-marker"></i>' +
                '</button>' +
                '<button onclick="removeLayer(currentLayerId, \'map\')" id="RemoveLayerBtn" class="pointBtn btn btn-secondary btn-sm toremovebtn" title="Delete layer" type="button">' +
                '<i class="fas fa-trash-alt"></i>' +
                '</button>' +
                '<button onclick="copyLayer()" id="CopyLayerBtn" class="pointBtn btn btn-secondary btn-sm toremovebtn" title="Duplicate layer and add to map" type="button">' +
                '<i class="fas fa-clone"></i>' +
                '</button>' +
                '<div class="dropdown">' +
                '<button class="btn btn-secondary btn-sm dropdown-toggle toremovebtn" type="button" id="dropdownMenuButtonDL" title="Download search result geodata" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                '<i class="far fa-save"></i>' +
                '</button>' +
                '<div class="dropdown-menu" aria-labelledby="dropdownMenuButtonDL">' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresult)" title="Download as GEOJson polygons" href="#">Polygons</a>' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresultPoints)" title="Download as GEOJson points" href="#">Points</a>' +
                '</div>' +
                '</div>' +
                '<button class="btn btn-secondary btn-sm toremovebtn" onclick="finishQuery(\'table\', finalSearchResultIds, CSVresult, false, currentLayerId)" type="button" id="SearchShowListButton" title="Show/Export result list" data-bs-toggle="modal" data-bs-target="#CSVmodal">' +
                '<i class="fas fa-list"></i>' +
                '</button>' +
                '</form>';

            $("#styleContent").empty();
            $("#styleContent").html(styledialog);
            $('#MethodSelect').val(myChoromode);
            $('#gradselect').val(myChoroPntMode);
            if (myChoroPntMode == 1) {
                $('#minRadius').removeClass('d-none');
                $('#radius').html('Radius min/max:')
            } else {
                $('#minRadius').addClass('d-none');
                $('#radius').html('Radius:')
            }

            if (layertypes.gradientcolor) {
                $('#valueOption').removeClass('d-none');
                $('#ValueSelect').val('value');
                //$('#ValueSelect').val(myValueMode);
            } else if (layertypes.gradientcolorTimespan) {
                $('.timeOption').removeClass('d-none');
                $('#ValueSelect').val('begin');
                //$('#ValueSelect').val(myValueMode);
            } else if (layertypes.gradientcount) {
                $('#ValueSelect').val('count')
            }
            if (layertypes.gradientcount === false) $('#countOption').addClass('d-none');


            colorstart = myChorocolor[0];
            colorend = myChorocolor[1];
            var firstInput = document.getElementById("colorstart");
            var firstColor = firstInput.value;
            firstInput.addEventListener("input", function () {
                colorstart = firstInput.value;
                myChorocolor[0] = colorstart;
            }, false);

            var lastInput = document.getElementById("colorend");
            var lastColor = lastInput.value;
            lastInput.addEventListener("input", function () {
                colorend = lastInput.value;
                myChorocolor[1] = colorend;
            }, false);
            myChorosteps = $('#chorosteps').val();
            $('#chorosteps').on('input change', function () {
                myChorosteps = $('#chorosteps').val();
                if (myChorosteps < 2)
                    $('#chorosteps').val(2);
            });
            $('#legendtitle').on('input change', function () {
                myChorolegendtitle = $('#legendtitle').val();
            });
            myChoroopacity = $('#ChoroOpacity').val();
            $('#ChoroOpacity').on('input change', function () {
                myChoroopacity = $('#ChoroOpacity').val();
                $('#ChoroOpacityvalue').val(myChoroopacity);
            });
            $('#ChoroOpacityvalue').on('input change', function () {
                myChoroopacity = $('#ChoroOpacityvalue').val();
                if (myChoroopacity > 100)
                    $('#ChoroOpacityvalue').val(100);
                if (myChoroopacity < 0)
                    $('#ChoroOpacityvalue').val(0);
                $('#ChoroOpacity').val(myChoroopacity);
            });
            var borderColorInput = document.getElementById("ChoroColorborder");
            myChoroborder = borderColorInput.value;
            var borderColor = borderColorInput.value;
            borderColorInput.addEventListener("input", function () {
                myChoroborder = borderColorInput.value;
                //console.log(myChoroborder);
            }, false);

            $('#ChoroBorderwidth').on('input change', function () {
                myChoroborderwidth = $('#ChoroBorderwidth').val();
                if (myChoroborderwidth < 0)
                    $('#ChoroBorderwidth').val(0);
            });

            $('#Searchsearchpointradius').on('input change', function () {
                mysearchpointradius = $('#Searchsearchpointradius').val();
                if (parseInt(mysearchpointradius) < 1) $('#Searchsearchpointradius').val(1);
                if (parseInt(mysearchpointradius) <= parseInt(mysearchpointminradius) && myChoroPntMode == 1) $('#Searchsearchpointradius').val(parseInt(parseInt(mysearchpointminradius)) + 1);
            });

            $('#minRadius').on('input change', function () {
                mysearchpointminradius = $('#minRadius').val();
                if (parseInt(mysearchpointminradius) < 1) $('#minRadius').val(1);
                if (parseInt(mysearchpointminradius) >= parseInt(mysearchpointradius)) $('#minRadius').val(parseInt(parseInt(mysearchpointradius) - 1));
            });

            $('#MethodSelect').on('change', function () {
                myChoromode = $('#MethodSelect option:selected').val();
            });

            $('#gradselect').on('change', function () {
                myChoroPntMode = $('#gradselect option:selected').val();
                if (myChoroPntMode == 1) {
                    $('#minRadius').removeClass('d-none');
                    $('#radius').html('Radius min/max:')
                } else {
                    $('#minRadius').addClass('d-none');
                    $('#radius').html('Radius:')
                }
            });

            $('#ValueSelect').on('change', function () {
                myValueMode = $('#ValueSelect option:selected').val();
            });

            myValueMode = $('#ValueSelect').val();

            $('#ChoroStyleBtn').click(function () {
                myChorofinalopacity = ((100 - myChoroopacity) / 100);

                finishQuery('choropoly', finalSearchResultIds, CSVresultJSON, false, currentLayerId)
            });
            $('#ChoroStylePntBtn').click(function () {
                myChorofinalopacity = ((100 - myChoroopacity) / 100);
                finishQuery('choropoint', finalSearchResultIds, CSVresultJSON, false, currentLayerId)
            });

            break;
        case 'colorPoly':

            var styledialog = '<form id="mystyleform">\n' +
                '<h5 class="mt-1 mb-3"> Multiple color layer options</h5>' +
                '<div class="mysearchoptions input-group input-group-sm mb-3">' +
                '<span class="input-group-text">Legend title: </span>' +
                '<input class="form-control form-control-sm legendtext" id="legendtitle" type="text" value="' + currentLegend + '">' +
                '</div>' +
                '<div class="mysearchoptions input-group input-group-sm mb-3">' +
                '<span class="input-group-text">Border color: </span>' +
                '<input class="form-control form-control-sm" id="Searchcolorborder" style="max-width: 70px" type="color" value="' + MultiColorSearchStyle.color + '">' +
                '<span class="input-group-text">Border width: </span>' +
                '<input class="form-control form-control-sm input-group-middle" id="Searchsearchborderwidth" type="number" value="' + MultiColorSearchStyle.weight + '" min="0">' +
                '<span title="Radius for point result" class="pointBtn input-group-text">Radius: </span>' +
                '<input title="Radius for point result" class="pointBtn form-control form-control-sm" id="Searchsearchpointradius" type="number" value="' + MultiColorSearchStyle.radius + '" min="1">' +
                '</div>' +
                '<div class="mysearchoptions input-group input-group-sm mb-3">' +
                '<span class="input-group-text">Opacity (%): </span>' +
                '<input class="form-control form-control-sm form-range" id="Searchmysearchopacity" type="range" value="' + (100 - ((MultiColorSearchStyle.fillOpacity) * 100)) + '" min="0" max="100">' +
                '<input class="form-control form-control-sm" id="Searchmysearchopacityvalue" type="number" value="' + (100 - ((MultiColorSearchStyle.fillOpacity) * 100)) + '" min="0" max="100" style="max-width: 60px">' +
                '</div>' +

                '<div id="mytable" class="mt-2 mb-2 border" style="line-height: 1.3em; max-height: 284px; font-size: 0.9em; overflow-y: auto; overflow-x: hidden; border-collapse: collapse;">' +
                '<table id="layerlist" class="display table table-striped table-bordered"\n' +
                '                       style="width: 100%; border-collapse: collapse !important;">\n' +
                '                    <thead>\n' +
                '                    <tr>\n' +
                '                        <th>Categories: ' + jsonresult.properties.statistics.length + ' </th>\n' +
                '                        <th>No.</th>\n' +
                '                    </tr>\n' +
                '                    </thead>\n' +
                '</table>' +
                '</div>' +

                '<button class="polyBtn btn btn-secondary btn-sm toremovebtn" onclick="finishQuery(\'colorpoly\', finalSearchResultIds, CSVresult, false, currentLayerId)" title="Apply as polygon layer" type="button">' +
                '<i class="fas fa-draw-polygon"></i>' +
                '</button>' +
                '<button class="pointBtn btn btn-secondary btn-sm toremovebtn" onclick="finishQuery(\'colorpoint\', finalSearchResultIds, CSVresult, false, currentLayerId)" title="Apply as point layer" type="button">' +
                '<i class="fas fa-map-marker"></i>' +
                '</button>' +
                '<button onclick="removeLayer(currentLayerId, \'map\')" id="RemoveLayerBtn" class="pointBtn btn btn-secondary btn-sm toremovebtn" title="Delete layer" type="button">' +
                '<i class="fas fa-trash-alt"></i>' +
                '</button>' +
                '<button onclick="copyLayer()" id="CopyLayerBtn" class="pointBtn btn btn-secondary btn-sm toremovebtn" title="Duplicate layer and add to map" type="button">' +
                '<i class="fas fa-clone"></i>' +
                '</button>' +
                '<div class="dropdown">' +
                '<button class="btn btn-secondary btn-sm dropdown-toggle toremovebtn" type="button" id="dropdownMenuButtonDL" title="Download search result geodata" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                '<i class="far fa-save"></i>' +
                '</button>' +
                '<div class="dropdown-menu" aria-labelledby="dropdownMenuButtonDL">' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresult)" title="Download as GEOJson polygons" href="#">Polygons</a>' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresultPoints)" title="Download as GEOJson points" href="#">Points</a>' +
                '</div>' +
                '</div>' +
                '<button class="btn btn-secondary btn-sm toremovebtn" onclick="finishQuery(\'table\', finalSearchResultIds, CSVresult, false, currentLayerId)" type="button" id="SearchShowListButton" title="Show/Export result list" data-bs-toggle="modal" data-bs-target="#CSVmodal">' +
                '<i class="fas fa-list"></i>' +
                '</button>' +
                '</form>'
            $("#styleContent").empty();
            $("#styleContent").html(styledialog);
            table = $('#layerlist').DataTable({
                data: jsonresult.properties.statistics,
                "paging": false,
                "searching": false,
                "bInfo": false,
                columns: [
                    {
                        data: "SearchKey",
                        "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                            $(nTd).html("<span>" + oData.SearchKey + "</span>" +
                                "<input class='MultiColorPicker float-end' id='" + oData.SearchKey + "' style='cursor: pointer; border: none; min-width: 60px; padding: 0;' type='color' value='" + oData.FillColor + "'>");
                        }
                    },
                    {data: 'Count'},
                ],
            });

            $('.MultiColorPicker').on('change', function () {
                currentStatId = this.id;
                currentStatColor = this.value;
                $.each(currentStatistics, function (i, stat) {
                    if (stat.SearchKey === currentStatId) {
                        stat.FillColor = currentStatColor;
                    }
                });
                jsonresult.properties.statistics = currentStatistics;
                jsonresultPoints.properties.statistics = currentStatistics;
            });

            mysearchopacity = (100 - MultiColorSearchStyle.fillOpacity * 100);
            $('#Searchmysearchopacity').on('input change', function () {
                mysearchopacity = $('#Searchmysearchopacity').val();
                $('#Searchmysearchopacityvalue').val(mysearchopacity);
            });
            $('#Searchmysearchopacityvalue').on('input change', function () {
                mysearchopacity = $('#Searchmysearchopacityvalue').val();
                if (mysearchopacity > 100)
                    $('#Searchmysearchopacityvalue').val(100);
                if (mysearchopacity < 0)
                    $('#Searchmysearchopacityvalue').val(0);
                $('#Searchmysearchopacity').val(mysearchopacity);
            });
            mysearchbordercolor = MultiColorSearchStyle.color;
            searchbordercolorInput = document.getElementById("Searchcolorborder");
            mysearchbordercolor = searchbordercolorInput.value;
            searchbordercolorInput.addEventListener("input", function () {
                mysearchbordercolor = searchbordercolorInput.value;
            }, false);

            mysearchborderwidth = MultiColorSearchStyle.weight;
            $('#Searchsearchborderwidth').on('input change', function () {
                mysearchborderwidth = $('#Searchsearchborderwidth').val();
                if (mysearchborderwidth < 0)
                    $('#Searchsearchborderwidth').val(0);
            });

            mysearchpointradius = $('#Searchsearchpointradius').val()
            if (mysearchpointradius == '') {
                mysearchpointradius = 8;
                $('#Searchsearchpointradius').val(8);
            }
            $('#Searchsearchpointradius').on('input change', function () {
                mysearchpointradius = $('#Searchsearchpointradius').val();
                if (mysearchpointradius < 0)
                    $('#Searchsearchpointradius').val(0);
            });


            $('#layerlist_wrapper').css('margin-top', '-6px');
            table.draw();
            $('.table, #layerlist').css('color', '#495057!important');
            $('.table, #layerlist').css('font-size', '0.875rem!important;');
            currentStatistics = $.extend(true, {}, jsonresult.properties.statistics);


            break;
        case 'chart':

            var styledialog = '<form id="mystyleform">\n' +
                '<h5 class="mt-1 mb-3"> Chart Markers layer options</h5>' +
                '<div class="mysearchoptions input-group input-group-sm mb-3">' +
                '<span class="input-group-text">Legend title: </span>' +
                '<input class="form-control form-control-sm legendtext" id="legendtitle" type="text" value="' + currentLegend + '">' +
                '</div>' +
                '<div class="mysearchoptions input-group input-group-sm mb-3">' +
                '<span class="input-group-text">Bar thickness: </span>' +
                '<input class="form-control form-control-sm" id="Searchsearchbarwidth" type="number" value="' + ChartStyle.barthickness + '" min="0">' +
                '<span title="Radius chart marker" class="pointBtn input-group-text">Radius: </span>' +
                '<input title="Radius chart marker" class="pointBtn form-control form-control-sm" id="Searchsearchpointradius" type="number" value="' + ChartStyle.radius + '" min="1">' +
                '</div>' +
                '<div class="mysearchoptions input-group input-group-sm mb-3">' +
                '<span class="input-group-text" for="Opacity">Opacity (%): </span>' +
                '<input class="form-control form-control-sm form-range" id="Searchmysearchopacity" type="range" value="' + (100 - ((ChartStyle.fillOpacity) * 100)) + '" min="0" max="100">' +
                '<input class="form-control form-control-sm" id="Searchmysearchopacityvalue" type="number" value="' + (100 - ((ChartStyle.fillOpacity) * 100)) + '" min="0" max="100" style="max-width: 60px">' +
                '<span class="input-group-text">Border width: </span>' +
                '<input class="form-control form-control-sm" id="Searchsearchborderwidth" style="max-width: 60px" type="number" value="' + ChartStyle.weight + '" min="0">' +
                '</div>' +


                '<div id="mytable" class="mt-2 mb-2 border" style="line-height: 1.3em; max-height: 313px; font-size: 0.9em; overflow-y: auto; overflow-x: hidden; border-collapse: collapse;">' +
                '<table id="layerlist" class="display table table-striped table-bordered"\n' +
                '                       style="width: 100%; border-collapse: collapse !important;">\n' +
                '                    <thead>\n' +
                '                    <tr>\n' +
                '                        <th>Categories: ' + jsonresult.properties.statistics.length + ' </th>\n' +
                '                        <th>No.</th>\n' +
                '                    </tr>\n' +
                '                    </thead>\n' +
                '</table>' +
                '</div>' +

                '<button class="pointBtn btn btn-secondary btn-sm toremovebtn" onclick="finishQuery(\'chart\', finalSearchResultIds, CSVresult, false, currentLayerId)" title="Apply as chart-marker layer" type="button">' +
                '<i class="fas fa-chart-pie"></i>' +
                '</button>' +
                '<button onclick="removeLayer(currentLayerId, \'map\')" id="RemoveLayerBtn" class="pointBtn btn btn-secondary btn-sm toremovebtn" title="Delete layer" type="button">' +
                '<i class="fas fa-trash-alt"></i>' +
                '</button>' +
                '<button onclick="copyLayer()" id="CopyLayerBtn" class="pointBtn btn btn-secondary btn-sm toremovebtn" title="Duplicate layer and add to map" type="button">' +
                '<i class="fas fa-clone"></i>' +
                '</button>' +
                '<div class="dropdown">' +
                '<button class="btn btn-secondary btn-sm dropdown-toggle toremovebtn" type="button" id="dropdownMenuButtonDL" title="Download search result geodata" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                '<i class="far fa-save"></i>' +
                '</button>' +
                '<div class="dropdown-menu" aria-labelledby="dropdownMenuButtonDL">' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresult)" title="Download as GEOJson polygons" href="#">Polygons</a>' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresultPoints)" title="Download as GEOJson points" href="#">Points</a>' +
                '</div>' +
                '</div>' +
                '<button class="btn btn-secondary btn-sm toremovebtn" onclick="finishQuery(\'table\', finalSearchResultIds, CSVresult, false, currentLayerId)" type="button" id="SearchShowListButton" title="Show/Export result list" data-bs-toggle="modal" data-bs-target="#CSVmodal">' +
                '<i class="fas fa-list"></i>' +
                '</button>' +
                '</form>'
            $("#styleContent").empty();
            $("#styleContent").html(styledialog);
            table = $('#layerlist').DataTable({
                data: jsonresult.properties.statistics,
                "paging": false,
                "searching": false,
                "bInfo": false,
                columns: [
                    {
                        data: "SearchKey",
                        "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                            $(nTd).html("<span>" + oData.SearchKey + "</span>" +
                                "<input class='MultiColorPicker float-end' id='" + oData.SearchKey + "' style='cursor: pointer; border: none; min-width: 60px; padding: 0;' type='color' value='" + oData.FillColor + "'>");
                        }
                    },
                    {data: 'Count'},
                ],
            });

            $('.MultiColorPicker').on('change', function () {
                currentStatId = this.id;
                currentStatColor = this.value;
                $.each(currentStatistics, function (i, stat) {
                    if (stat.SearchKey === currentStatId) {
                        stat.FillColor = currentStatColor;
                    }
                });
                jsonresult.properties.statistics = currentStatistics;
                jsonresultPoints.properties.statistics = currentStatistics;
            });

            mysearchopacity = (100 - ChartStyle.fillOpacity * 100);
            $('#Searchmysearchopacity').on('input change', function () {
                mysearchopacity = $('#Searchmysearchopacity').val();
                $('#Searchmysearchopacityvalue').val(mysearchopacity);
            });
            $('#Searchmysearchopacityvalue').on('input change', function () {
                mysearchopacity = $('#Searchmysearchopacityvalue').val();
                if (mysearchopacity > 100)
                    $('#Searchmysearchopacityvalue').val(100);
                if (mysearchopacity < 0)
                    $('#Searchmysearchopacityvalue').val(0);
                $('#Searchmysearchopacity').val(mysearchopacity);
            });
            mysearchbordercolor = "#000000";

            mysearchborderwidth = ChartStyle.weight;
            $('#Searchsearchborderwidth').on('input change', function () {
                mysearchborderwidth = $('#Searchsearchborderwidth').val();
                if (mysearchborderwidth < 0)
                    $('#Searchsearchborderwidth').val(0);
            });

            mysearchbarthickness = ChartStyle.barthickness;
            $('#Searchsearchbarwidth').on('input change', function () {
                mysearchbarthickness = $('#Searchsearchbarwidth').val();
                if (mysearchbarthickness < 0)
                    $('#Searchsearchbarwidth').val(0);
            });

            mysearchpointradius = $('#Searchsearchpointradius').val()
            if (mysearchpointradius == '') {
                mysearchpointradius = 8;
                $('#Searchsearchpointradius').val(8);
            }
            $('#Searchsearchpointradius').on('input change', function () {
                mysearchpointradius = $('#Searchsearchpointradius').val();
                if (mysearchpointradius < 0)
                    $('#Searchsearchpointradius').val(0);
            });


            $('#layerlist_wrapper').css('margin-top', '-6px');
            table.draw();
            $('.table, #layerlist').css('color', '#495057!important');
            $('.table, #layerlist').css('font-size', '0.875rem!important;');
            currentStatistics = $.extend(true, {}, jsonresult.properties.statistics);

            break;
        case 'info':
            $('#styledialog').find('.active').removeClass('active');
            $('#info').addClass('active');
            var styledialog = '<form id="mystyleform">\n' +
                '<h5 class="mt-1 mb-3">Layer overview</h5>' +
                '  <div class="card card-first">\n' +
                '    <div class="card-header" id="InfoLayername">\n' +
                '      <h6 class="mb-0">\n' +
                '        <a href="#" class="btn infobtns btn-link" onclick="this.blur()" data-bs-toggle="collapse" data-bs-target="#collapseInfoOne" aria-expanded="true" aria-controls="collapseInfoOne">\n' +
                '        <i class="fas fa-chevron-down me-2"></i>Info\n' +
                '        </a>\n' +
                '      </h6>\n' +
                '    </div>\n' +
                '    <div id="collapseInfoOne" class="collapse show" aria-labelledby="headingOne">\n' +
                '      <div class="card-body" style="padding: 1.5em 0.7em 1.5em 0.7em;\n' +
                '    font-size: 0.9em;">\n' +
                '        <b>Legend title: </b>' + currentLegend + '<br> \n' +
                '        <b>Parameters: </b>' + currentInfoHeadline + '<br> \n' +
                '        <b>Results: </b>' + CSVresult.length + ' matches in ' + jsonresult.features.length + ' graves. \n' +
                '      </div>\n' +
                '    </div>\n' +
                '  </div>\n' +
                '  <div class="card card-middle">\n' +
                '    <div class="card-header" id="headingTwo">\n' +
                '      <h6 class="mb-0">\n' +
                '        <a href="#" class="btn infobtns btn-link" onclick="this.blur()" data-bs-toggle="collapse" data-bs-target="#collapseInfoTwo" aria-expanded="false" aria-controls="collapseInfoTwo">\n' +
                '        <i class="fas fa-chevron-right me-2"></i>Results\n' +
                '        </a>\n' +
                '      </h6>\n' +
                '    </div>\n' +
                '    <div id="collapseInfoTwo" class="collapse" aria-labelledby="headingTwo">\n' +
                '      <div class="card-body card-table" style="padding: 0 !important;\n' +
                '    border: none !important; font-size: 0.9em; line-height: 1.3em;">\n' +
                '<div id="mytable" class="border" style="max-height: 295px; overflow-y: auto; overflow-x: hidden">' +
                '<table id="layerlistOv" class="display table table-striped table-bordered"\n' +
                '                       style="width: 100%; margin-top: -1px !important; margin-bottom: -1px !important;">\n' +
                '                    <thead>\n' +
                '                    <tr>\n' +
                '                        <th>Categories: ' + jsonresult.properties.statistics.length + ' </th>\n' +
                '                        <th>No.</th>\n' +
                '                    </tr>\n' +
                '                    </thead>\n' +
                '</table>' +
                '</div>' +
                '      </div>\n' +
                '    </div>\n' +
                '  </div>\n' +
                '  <div class="card card-last">\n' +
                '    <div class="card-header" id="headingThree">\n' +
                '      <h6 class="mb-0">\n' +
                '        <a href="#" class="btn infobtns btn-link" onclick="this.blur()" data-bs-toggle="collapse" data-bs-target="#collapseInfoThree" aria-expanded="false" aria-controls="collapseInfoThree">\n' +
                '           <i class="fas fa-chevron-right me-2"></i>Display possibilities' +
                '        </a>\n' +
                '      </h6>\n' +
                '    </div>\n' +
                '    <div id="collapseInfoThree" class="collapse" aria-labelledby="headingThree">\n' +
                '      <div class="card-body" style="padding: 1.5em 0.7em 1.5em 0.7em;\n' +
                '    font-size: 0.9em;">\n' +
                '<ul class="list-group">\n' +
                '  <li style="padding: 0.6em; font-size: 0.9em;" class="list-group-item h6 align-items-center">\n' +
                '    Single color\n' +
                '    <span class="ms-1 badge float-end badge-success badge-pill"><i class="fas fa-check"></i></span>\n' +
                '  </li>\n' +
                '  <li style="padding: 0.6em; font-size: 0.9em;" class="list-group-item h6 align-items-center">\n' +
                '    <span> Multiple color </span>' + multibadge +
                '  </li>\n' +
                '  <li style="padding: 0.6em; font-size: 0.9em;" class="list-group-item h6 align-items-center">\n' +
                '    <span> Gradient color </span>' + gradibadge + gradicountbadge +
                '  </li>\n' +
                '  <li style="padding: 0.6em; font-size: 0.9em;" class="list-group-item h6 align-items-center">\n' +
                '    <span> Chart markers </span>' + chartcountbadge +
                '  </li>\n' +
                '</ul>' +
                '      </div>\n' +
                '    </div>\n' +
                '</div>' +
                '<button onclick="removeLayer(currentLayerId, \'map\')" id="RemoveLayerBtn" class="pointBtn btn btn-secondary btn-sm toremovebtn" title="Delete layer" type="button">' +
                '<i class="fas fa-trash-alt"></i>' +
                '</button>' +
                '<button onclick="copyLayer()" id="CopyLayerBtn" class="pointBtn btn btn-secondary btn-sm toremovebtn" title="Duplicate layer and add to map" type="button">' +
                '<i class="fas fa-clone"></i>' +
                '</button>' +
                '<div class="dropdown">' +
                '<button class="btn btn-secondary btn-sm dropdown-toggle toremovebtn" type="button" id="dropdownMenuButtonDL" title="Download search result geodata" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                '<i class="far fa-save"></i>' +
                '</button>' +
                '<div class="dropdown-menu" aria-labelledby="dropdownMenuButtonDL">' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresult)" title="Download as GEOJson polygons" href="#">Polygons</a>' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresultPoints)" title="Download as GEOJson points" href="#">Points</a>' +
                '</div>' +
                '</div>' +
                '<button class="btn btn-secondary btn-sm toremovebtn" onclick="finishQuery(\'table\', finalSearchResultIds, CSVresult, false, currentLayerId)" type="button" id="SearchShowListButton" title="Show/Export result list" data-bs-toggle="modal" data-bs-target="#CSVmodal">' +
                '<i class="fas fa-list"></i>' +
                '</button>' +
                '    </form>';
            $("#styleContent").empty();
            $("#styleContent").html(styledialog);

            $('.infobtns').click(function () {
                if ($(this).find('i').hasClass('fa-chevron-right')) {
                    $(this).find('i').removeClass('fa-chevron-right');
                    $(this).find('i').addClass('fa-chevron-down');
                } else {
                    $(this).find('i').removeClass('fa-chevron-down');
                    $(this).find('i').addClass('fa-chevron-right');
                }
            })

            table = $('#layerlistOv').DataTable({
                data: jsonresult.properties.statistics,
                "paging": false,
                "searching": false,
                "bInfo": false,
                columns: [
                    {data: "SearchKey"},
                    {data: 'Count'},
                ],
            });

            break;
        default:
            return
    }
}

function setStyleValues() {
    //console.log('setStyleValues');
    if (typeof (fillcolor) != "undefined") fillInput.value = fillcolor;
    fillInput = document.getElementById("stylecolor");
    fillcolor = fillInput.value;
    fillInput.addEventListener("input", function () {
        fillcolor = fillInput.value;
    }, false);

    if (typeof (MyStyleOpacityVar) != "undefined") {
        $('#mystyleopacity').val(MyStyleOpacityVar);
        $('#mystyleopacityvalue').val(MyStyleOpacityVar);
    } else {
        MyStyleOpacityVar = (100 - (myStyle.fillOpacity) * 100);
        $('#mystyleopacity').val(MyStyleOpacityVar);
        $('#mystyleopacityvalue').val(MyStyleOpacityVar);
    }
    $('#mystyleopacity').on('input change', function () {
        MyStyleOpacityVar = $('#mystyleopacity').val();
        $('#mystyleopacityvalue').val(MyStyleOpacityVar);
    });
    $('#mystyleopacityvalue').on('input change', function () {
        MyStyleOpacityVar = $('#mystyleopacityvalue').val();
        if (MyStyleOpacityVar > 100)
            $('#mystyleopacityvalue').val(100);
        if (MyStyleOpacityVar < 0)
            $('#mystyleopacityvalue').val(0);
        $('#mystyleopacity').val(MyStyleOpacityVar);
    });
    if (typeof (mystylebordercolor) != "undefined") {
        stylebordercolorInput = document.getElementById("stylecolorborder");
        stylebordercolor = stylebordercolorInput.value;
    } else {
        mystylebordercolor = myStyle.color;
    }
    stylebordercolorInput = document.getElementById("stylecolorborder");
    stylebordercolor = stylebordercolorInput.value;
    stylebordercolorInput.addEventListener("input", function () {
        mystylebordercolor = stylebordercolorInput.value;
    }, false);

    if (typeof (mystyleborderwidth) == "undefined") mystyleborderwidth = myStyle.weight;
    $('#styleborderwidth').val(mystyleborderwidth);
    $('#styleborderwidth').on('input change', function () {
        mystyleborderwidth = $('#styleborderwidth').val();
        if (mystyleborderwidth < 0)
            $('#styleborderwidth').val(0);
    });

}


function applyStyle(fill, opacity, border, outline) {
    myStyle.fillColor = fill;
    myStyleSquare.fillColor = fill;
    myStyle.fillOpacity = opacity;
    myStyleSquare.fillOpacity = opacity;
    myStyle.weight = outline;
    myStyleSquare.weight = outline;
    myStyle.color = border;
    myStyleSquare.color = border;
}

function applyButton(styleLayer) {

    if (styleLayer === 'graves') {
        applyStyle(fillcolor, (1 - MyStyleOpacityVar / 100), mystylebordercolor, mystyleborderwidth);
        graves.eachLayer(function (layer) {
            if (layer.feature.derivedPoly === 'true') {
                layer.setStyle(myStyleSquare)
            } else {
                layer.setStyle(myStyle)
            }
        });
        var maxBorder = 8;
        if (myStyle.weight < 8) maxBorder = myStyle.weight;
        var currentGraves = '<div class="layerOptionsClick" onclick="openStyleDialog(\'single\')" style="background-color: ' + hexToRgbA(myStyle.fillColor, myStyle.fillOpacity) + '; border: ' + maxBorder + 'px solid ' + myStyle.color + '">&nbsp;</div>'
        createLegend(map, graves, currentGraves);
    }
}

function printMapbutton(id, position) {

    currentID = id;
    eval('L.easyPrint({position: "' + position + '", title: "Export map as image file", sizeModes: ["A4Landscape", "A4Portrait"], exportOnly: true, filename: "ThanadosMap"}).addTo(' + currentID + ');');
    $('.leaflet-control-easyPrint-button-export').html('<span class="fas fa-image"></span>');
    $('.leaflet-control-easyPrint-button-export').removeClass('leaflet-control-easyPrint-button-export');
    $('#leafletEasyPrint').css({
        'background-image': '',
        'background-size': '16px 16px',
        'cursor': 'pointer'
    });
    $('a.A4Landscape.page').css({'background-image': 'url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMS4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQ0NC44MzMgNDQ0LjgzMyIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDQ0LjgzMyA0NDQuODMzOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNNTUuMjUsNDQ0LjgzM2gzMzQuMzMzYzkuMzUsMCwxNy03LjY1LDE3LTE3VjEzOS4xMTdjMC00LjgxNy0xLjk4My05LjM1LTUuMzgzLTEyLjQ2N0wyNjkuNzMzLDQuNTMzICAgIEMyNjYuNjE3LDEuNywyNjIuMzY3LDAsMjU4LjExNywwSDU1LjI1Yy05LjM1LDAtMTcsNy42NS0xNywxN3Y0MTAuODMzQzM4LjI1LDQzNy4xODMsNDUuOSw0NDQuODMzLDU1LjI1LDQ0NC44MzN6ICAgICBNMzcyLjU4MywxNDYuNDgzdjAuODVIMjU2LjQxN3YtMTA4LjhMMzcyLjU4MywxNDYuNDgzeiBNNzIuMjUsMzRoMTUwLjE2N3YxMzAuMzMzYzAsOS4zNSw3LjY1LDE3LDE3LDE3aDEzMy4xNjd2MjI5LjVINzIuMjVWMzR6ICAgICIgZmlsbD0iI0ZGRkZGRiIvPgoJPC9nPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPg==)'});
    $('a.A4Portrait.page').css({'background-image': 'url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMS4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQ0NC44MzMgNDQ0LjgzMyIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDQ0LjgzMyA0NDQuODMzOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNNTUuMjUsNDQ0LjgzM2gzMzQuMzMzYzkuMzUsMCwxNy03LjY1LDE3LTE3VjEzOS4xMTdjMC00LjgxNy0xLjk4My05LjM1LTUuMzgzLTEyLjQ2N0wyNjkuNzMzLDQuNTMzICAgIEMyNjYuNjE3LDEuNywyNjIuMzY3LDAsMjU4LjExNywwSDU1LjI1Yy05LjM1LDAtMTcsNy42NS0xNywxN3Y0MTAuODMzQzM4LjI1LDQzNy4xODMsNDUuOSw0NDQuODMzLDU1LjI1LDQ0NC44MzN6ICAgICBNMzcyLjU4MywxNDYuNDgzdjAuODVIMjU2LjQxN3YtMTA4LjhMMzcyLjU4MywxNDYuNDgzeiBNNzIuMjUsMzRoMTUwLjE2N3YxMzAuMzMzYzAsOS4zNSw3LjY1LDE3LDE3LDE3aDEzMy4xNjd2MjI5LjVINzIuMjVWMzR6ICAgICIgZmlsbD0iI0ZGRkZGRiIvPgoJPC9nPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPg==)'});
}

//basemaps
//set attribution title
function getBasemaps() {
    mywindowtitle = 'THANADOS';
    if (typeof (myjson) != "undefined") mywindowtitle = 'THANADOS: ' + myjson.name;
    if (typeof (jsonmysite) != "undefined") mywindowtitle = 'THANADOS: ' + jsonmysite.name;


    OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        crossOrigin: "",
        maxZoom: 25,
        maxNativeZoom: 19,
        attribution: '<a href="#" style="display: inline-block" class="togglebtn" onclick="$( this ).next().toggle()">&copy; Info</a>' +
            '<div id="myattr" class="mapAttr" style="display: inline-block">&nbsp ' + mywindowtitle + '. Map Tiles: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors</div>'
    });

    OpenStreetMap_HOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        crossOrigin: "",
        maxZoom: 25,
        maxNativeZoom: 17,
        attribution: '<a href="#" style="display: inline-block" class="togglebtn" onclick="$( this ).next().toggle()">&copy; Info</a>' +
            '<div id="myattr" class="mapAttr" style="display: inline-block">&nbsp ' + mywindowtitle + '. Map Tiles: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a></div>'
    });

    /*Stamen_Terrain = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}', {
        attribution: 'Map Tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        crossOrigin: "anonymous",
        minZoom: 0,
        maxZoom: 25,
        maxNativeZoom: 16,
        ext: 'png'
    });*/

    Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        crossOrigin: "",
        attribution:
            '<a href="#" style="display: inline-block" class="togglebtn" onclick="$( this ).next().toggle()">&copy; Info</a>' +
            '<div id="myattr" class="mapAttr" style="display: inline-block">&nbsp ' + mywindowtitle + '. Map Tiles: &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community</div>',
        maxZoom: 25,
        maxNativeZoom: 19
    });

    Esri_WorldTopoMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        crossOrigin: "",
        attribution:
            '<a href="#" style="display: inline-block" class="togglebtn" onclick="$( this ).next().toggle()">&copy; Info</a>' +
            '<div id="myattr" class="mapAttr" style="display: inline-block">&nbsp ' + mywindowtitle + '. Map Tiles: &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community</div>',
        maxZoom: 25,
        maxNativeZoom: 19
    });

    thunderforestlandscape = L.tileLayer('https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=' + thunderforestAPIkey, {
        crossOrigin: "",
        attribution:
            '<a href="#" style="display: inline-block" class="togglebtn" onclick="$( this ).next().toggle()">&copy; Info</a>' +
            '<div id="myattr" class="mapAttr" style="display: inline-block">&nbsp ' + mywindowtitle + '. Map Tiles: &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a></div>',
        maxZoom: 25,
        maxNativeZoom: 21
    });

    //mapbox
    mapboxnatural = L.tileLayer(
        'https://api.mapbox.com/styles/v1/thanados/ck6cakwq308tr1ioi58wkddsx/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoidGhhbmFkb3MiLCJhIjoiY2s0NGFieHZxMDhqcjNubjA1bzJqMWFrdyJ9.JkTrwwm87S2yRFqRnMkpUw', {
            crossOrigin: "",
            tileSize: 512,
            zoomOffset: -1,
            attribution:
                '<a href="#" style="display: inline-block" class="togglebtn" onclick="$( this ).next().toggle()">&copy; Info</a>' +
                '<div id="myattr" class="mapAttr" style="display: inline-block">&nbsp ' + mywindowtitle + '. Map Tiles: &copy; <a href="https://apps.mapbox.com/feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a></div>',
            maxZoom: 25,
            maxNativeZoom: 22
        });

//czech basemap
    basemap_cz = L.tileLayer.wms('http://geoportal.cuzk.cz/WMS_ZM10_PUB/WMService.aspx', {
        layers: 'GR_ZM10',
        crossOrigin: "anonymous",
        maxZoom: 25
    })

    HikeBike_HillShading = L.tileLayer('https://tiles.wmflabs.org/hillshading/{z}/{x}/{y}.png', {
        crossOrigin: "",
        maxNativeZoom: 15,
        opacity: 0.3,
        //transparency: true,
        maxZoom: 25,
    });

    OpenStreetMap_HOT_ov = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        crossOrigin: "",
        maxZoom: 25,
        maxNativeZoom: 17,
        //transparency: 'true',
        //opacity: 1,
        attribution: ""
    });


    BasemapAT_grau = L.tileLayer('https://maps{s}.wien.gv.at/basemap/bmapgrau/{type}/google3857/{z}/{y}/{x}.{format}', {
        crossOrigin: "",
        maxZoom: 25,
        maxNativeZoom: 19,
        attribution: '<a href="#" style="display: inline-block" class="togglebtn" onclick="$( this ).next().toggle()">&copy; Info</a>' +
            '<div id="myattr" class="mapAttr" style="display: inline-block">&nbsp ' + mywindowtitle + '. Map Tiles: <a href="https://www.basemap.at">basemap.at</a> </div>',
        subdomains: ["", "1", "2", "3", "4"],
        type: 'normal',
        format: 'png',
        bounds: [[46.35877, 8.782379], [49.037872, 17.189532]]
    });

    BasemapAT_terrain = L.tileLayer('https://maps{s}.wien.gv.at/basemap/bmapgelaende/{type}/google3857/{z}/{y}/{x}.{format}', {
        crossOrigin: "",
        maxNativeZoom: 17,
        maxZoom: 25,
        attribution: '<a href="#" style="display: inline-block" class="togglebtn" onclick="$( this ).next().toggle()">&copy; Info</a>' +
            '<div id="myattr" class="mapAttr" style="display: inline-block">&nbsp ' + mywindowtitle + '. Map Tiles: <a href="https://www.basemap.at">basemap.at</a> </div>',
        subdomains: ["", "1", "2", "3", "4"],
        type: 'grau',
        format: 'jpeg',
        bounds: [[46.35877, 8.782379], [49.037872, 17.189532]],
        //opacity: 0.3,
    });


    Esri_WorldHillshade = L.tileLayer('https://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}', {
        crossOrigin: "",
        attribution: "",
        maxZoom: 25,
        maxNativeZoom: 15,
        opacity: 0.25
    });

    relief = new L.layerGroup([OpenStreetMap_HOT_ov, Esri_WorldHillshade], {
        attribution: '<a href="#" style="display: inline-block" class="togglebtn" onclick="$( this ).next().toggle()">&copy; Info</a>' +
            '<div id="myattr" class="mapAttr" style="display: inline-block">&nbsp ' + mywindowtitle + '. Map Tiles: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>. Hillshade Sources: Esri, Airbus DS, USGS, NGA, NASA, CGIAR, N Robinson, NCEAS, NLS, OS, NMA, Geodatastyrelsen, Rijkswaterstaat, GSA, Geoland, FEMA, Intermap, and the GIS user community</div>'
    });

    satellite = Esri_WorldImagery; //define aerial image layer
    landscape = relief; // define topography layer
    natural = BasemapAT_grau //mapboxnatural
    terrain = BasemapAT_terrain //mapboxnatural
    streets = OpenStreetMap_Mapnik // define streets Layer
    blank = L.tileLayer('', {
        crossOrigin: "anonymous",
        maxZoom: 25,
        attribution:
            '<a href="#" style="display: inline-block" class="togglebtn" onclick="$( this ).next().toggle()">&copy; Info</a>' +
            '<div id="myattr" class="mapAttr" style="display: inline-block">&nbsp ' + mywindowtitle + '</div>'
    })


    baseLayers = {
        "Landscape": landscape,
        "Satellite": satellite,
        "Streetmap": streets,
        "Basemap AT": natural,
        "Terrain AT": terrain,
        "Blank": blank
    };

    //define basemap for Minimap
    miniBaseMap = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            minZoom: 0,
            maxZoom: 20,
            attribution: '<a href="#" style="display: inline-block" class="togglebtn" onclick="$( this ).next().toggle()">&copy; Info</a>' +
                '<div id="myattr" class="mapAttr" style="display: inline-block">&nbsp ' + mywindowtitle + '. Map Tiles: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a></div>'
        }
    );

    loadingControl = L.Control.loading({
        separate: true,
        delayIndicator: 0,
        position: 'bottomleft'
    });
}

function attributionChange() {
    //$(".leaflet-control-attribution").find(':first-child').remove();
    var val = $(".leaflet-control-attribution").html();
    //console.log(val)
    $(".leaflet-control-attribution").html(val.substring(87, val.length));
    $('#myattr').toggle();
}

function MultAttributionChange(myMap, mydiv, attribution) {
    eval('$("' + mydiv + ' .leaflet-control-attribution").remove()');
    attr = L.control({position: 'bottomright'})
    attr.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'leaflet-control-attribution')
        div.innerHTML = attribution
        return div
    }
    attr.addTo(myMap)
    eval('$("' + mydiv + ' .togglebtn").next().toggle()');
}

function hexToRgbA(hex, opac) {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ', ' + opac + ' )';
    }
    throw new Error('Bad Hex');
}

function toggleLayers() {
    eval(this.dataset.map + '.removeLayer(' + this.dataset.layer + ')');
}

function createLegend(containerMap, currentLayer, legendContent) {
    //console.log('createLegend');
    //hide layers from layer control


    //1st: check layers and get data for legend
    //create options for legend layers
    var options = {};

    //check if it is a layer or layer group
    //layer
    if (currentLayer.options !== {} && typeof (currentLayer.options.shapetype) !== 'undefined') {
        options.style = currentLayer.options.style;
        options.type = currentLayer.options.shapetype;
        options.name = currentLayer.options.legendTitle;
        options.layername = currentLayer.options.layername;
    } else {
        //layerGroup with one layer
        currentLayer.eachLayer(function (layer) {
            options.style = layer.options.style;
            options.type = layer.options.shapetype;
            options.name = layer.options.legendTitle;
            options.layername = layer.options.layername;
        });
    }
    if (jQuery.isEmptyObject(options)) {
        //console.log('abort')
        return
    }

    //2nd: create legend
    var mapId = containerMap.getContainer().id; //get div id from map

    //check if legend is already on map
    var currentLegendDom = document.getElementById(mapId + '_legendtitle');
    var noLegend = (currentLegendDom === null);
    //console.log('currentLegend:');
    //console.log(currentLegend);
    //console.log('noLegend:');
    //console.log(noLegend);
    //create blank legend if it does not exist

    if (noLegend) {
        $(function () {
            $(".sortEntry").sortable({
                containment: "parent"
            });
            $(".sortEntry").disableSelection();
        });

        eval(mapId + '_legend = L.control({position: "bottomright"})');
        eval(mapId + '_legend').onAdd = function (containermap) {
            var div = L.DomUtil.create('div', 'info, legend')
            div.innerHTML =
                '<div id="' + mapId + '_legendtitle"></div>' +
                '<div class="sortEntry" id="' + mapId + '_legendentries"></div>'
            return div
        }
        eval(mapId + '_legend').addTo(containerMap);
        var currentLegendDom = document.getElementById(mapId + '_legendtitle');


        legendOn = 'Legend <a onclick="legendToggle(\'' + mapId + '\')" class="legendToggle" data-map=' + mapId + ' title="Hide legend"><i id="' + mapId + '_toggleLeg" style="color: #eeeeee; cursor: pointer; font-size: 1.3em;" class="legendBtn ms-2 float-end far fa-check-square"></a>'
        legendOff = '<a onclick="legendToggle(\'' + mapId + '\')" class="legendToggle" data-map=' + mapId + ' title="show legend"><i id="' + mapId + '_toggleLeg" style="color: #eeeeee; cursor: pointer; font-size: 1.3em;" class="legendBtn fas fa-list-ul"></a>'

        $(currentLegendDom).html(legendOn);


        var mylegendBtn = $(currentLegendDom).find(".legendToggle");
    }

    eval(mapId + '_legend').getContainer().addEventListener('mouseover', function () {
        eval(mapId + '.dragging.disable();');
        eval(mapId + '.doubleClickZoom.disable();');
        eval(mapId + '.scrollWheelZoom.disable();');
    });

    // Re-enable dragging when user's cursor leaves the element
    eval(mapId + '_legend').getContainer().addEventListener('mouseout', function () {
        eval(mapId + '.dragging.enable();');
        eval(mapId + '.doubleClickZoom.enable();');
        eval(mapId + '.scrollWheelZoom.enable();');
    });

    //set data for legend entries from layer
    var entrycontainer = document.getElementById(mapId + '_legendentries');
    var currentEntry =
        '<div class="legendEntry" id="' + mapId + '_' + options.layername + '" data-layer="' + options.layername + '"> \n' +
        options.name + '<a id="' + options.layername + '_toggleBtn" \n' +
        'onclick="toggleLayers(this.dataset.map, this.dataset.layer, this.dataset.show)" \n' +
        'data-show=true data-map="' + mapId + '" data-layer="' + options.layername + '"> \n' +
        '<i id="' + options.layername + '_toggleIcon" style="cursor: pointer; font-size: 1.3em;" class="ms-2 float-end far fa-check-square"></i></a></div>';

    var NoEntryYet = (document.getElementById(mapId + '_' + options.layername) === null);
    //console.log('No entry yet: ' +  NoEntryYet);
    var ExistingEntry = document.getElementById(mapId + '_' + options.layername);
    //console.log('ExistingEntry: ');
    //console.log(ExistingEntry);
    if (NoEntryYet) {
        $(entrycontainer).prepend(currentEntry)
    } else {
        $(ExistingEntry).replaceWith(currentEntry);
        //$(entrycontainer).prepend(currentEntry)
    }
    var ExistingEntry = document.getElementById(mapId + '_' + options.layername);
    $(ExistingEntry).append(legendContent);

    eval('if (' + mapId + '.hasLayer(' + options.layername + ') !== true) ' + options.layername + '.addTo(' + mapId + ');');

    myselector = eval('$("#' + mapId + '_legendentries")');

    $(myselector).on("sortstop", function (event, ui) {
        orderlayer(myselector)
    });
    containerheight = ($('#container').height());
    $('.legend').css('max-height', (containerheight - 159))

    $(function () {
        $('[data-toggle="popover"]').popover()
    })
}

function legendToggle(mapId) {
    var currentLegendDom = document.getElementById(mapId + '_legendtitle');
    var legendentries = document.getElementById(mapId + '_legendentries');
    if ($(currentLegendDom).find('.legendBtn').hasClass("fa-check-square")) {
        $(currentLegendDom).html(legendOff);
        eval(mapId + '.dragging.enable();');
        eval(mapId + '.doubleClickZoom.enable();');
        eval(mapId + '.scrollWheelZoom.enable();');
    } else {
        $(currentLegendDom).html(legendOn)
    }
    $(legendentries).toggle();
}

function orderlayer(myselector) {
    //console.log('orderlayer')
    var layerorder = ($(myselector).sortable("toArray", {
        attribute: "data-layer"
    }));

    $.each(layerorder, function (i, layer) {
        eval(layer).eachLayer(function (layer) {
            layer.bringToBack();
        })
    })
}

function toggleLayers(thismap, layer, show) {
    var thisIcon = eval('$("#' + layer + '_toggleIcon")');
    var thisButton = eval('$("#' + layer + '_toggleBtn")');
    var myselector = eval('$("#' + thismap + '_legendentries")');
    if (show === 'true') {
        $(thisIcon).removeClass('fa-check-square');
        $(thisIcon).addClass('fa-square');
        eval(thismap + '.removeLayer(' + layer + ')');
        $(thisButton).attr('data-show', false);
    } else {
        $(thisIcon).removeClass('fa-square');
        $(thisIcon).addClass('fa-check-square');
        eval(layer + '.addTo(' + thismap + ')');
        $(thisButton).attr('data-show', true);
    }
    orderlayer(myselector);
}

function makeid(length) {
    var result = 'Layer_';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

typeIdList = [];

function makeTypeId(length) {
    var result = 'type_';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    if (typeIdList.includes(result)) {
        var result = makeTypeId(5)
    }
    typeIdList.push(result);
    return result;
}

function setSearchInfo(data, CSV, first) {
    //console.log('setSearchInfo');

    data.properties.layertypes =
        {
            multicolor: false,
            multicolorNoOverlaps: true,
            gradientcount: false,
            gradientcolor: false,
            gradientcolorTimespan: false,
            gradientcolorNoOverlaps: true,
            charts: false,
        }

    var resultlist = [];
    var resultCount = [];

    $.each(CSVresultJSON, function (i, dataset) {
        resultlist.push(dataset.searchResult)
    });

    var distinctResultList = Array.from(new Set(resultlist))

    $.each(distinctResultList, function (i, result) {
        count = 0;
        resultName = result;
        $.each(CSVresultJSON, function (i, dataset) {
            if (dataset.searchResult === resultName) count += 1;
        })
        if (first === false) {
            $.each(currentStatistics, function (i, dataset) {
                if (dataset.SearchKey === resultName) randomColor = dataset.FillColor;
            })
        } else {
            randomColor = chroma.random().hex();
        }

        var tmpDataset = {
            SearchKey: result,
            Count: count,
            FillColor: randomColor
        }

        optionchain = '"' + result + '" : {"fillColor":  "' + randomColor + '"}';
        if (i === 0) oldoptionchain = optionchain
        if (i > 0) optionchain = oldoptionchain + ', ' + optionchain;
        oldoptionchain = optionchain;
        resultCount.push(tmpDataset);
    });

    ValueResult = {};
    ValueResult.search = CSVresultJSON[0].Search;
    ValueResult.count = resultCount;
    ValueResult.ChartOptions = JSON.parse('{' + optionchain + '}');

    data.properties.search = ValueResult.search;
    data.properties.statistics = ValueResult.count;
    data.properties.ChartOptions = ValueResult.ChartOptions;

    $.each(data.features, function (i, feature) {
        var currentId = feature.id;
        feature.search = {}
        feature.search.searchResults = [];
        feature.search.count = 0;
        feature.search.searchArray = [];

        $.each(CSV, function (i, dataset) {
            if (dataset.graveID === currentId) {
                if (dataset.value !== "") {
                    chorovalue = parseFloat(dataset.value);
                    data.properties.layertypes.gradientcolor = true;
                } else {
                    if (dataset.Search === "timespan") {
                        chorovalue = [dataset.earliestBegin, dataset.latestEnd];
                        data.properties.layertypes.gradientcolorTimespan = true;
                    } else {
                        chorovalue = null
                    }
                }
                searchResult = dataset.searchResult;
                $.each(data.properties.statistics, function (i, stat) {
                    if (searchResult === stat.SearchKey) randomColor = stat.FillColor;
                })
                searchObject = {
                    id: dataset.ObjectId,
                    result: dataset.searchResult,
                    value: chorovalue,
                    fillColor: randomColor
                }
                $.each(data.features, function (i, feature) {
                    if (currentId === feature.id) {
                        feature.search.searchResults.push(searchObject);
                        feature.search.count += 1;
                        feature.search.searchArray.push(searchObject.result)
                    }
                })
            }
        })
    });
    $.each(data.features, function (i, feature) {
        feature.search.uniqueCount = (Array.from(new Set(feature.search.searchArray))).length;
        chorocount = 0;
        res = {};
        feature.search.searchResults.forEach(function (v) {
            res[v.result] = (res[v.result] || 0) + 1;
        })
        feature.search.distinctCount = res;
        if (feature.search.count > 1) {
            if (feature.search.uniqueCount > 1) {
                data.properties.layertypes.multicolorNoOverlaps = false;
                data.properties.layertypes.charts = true;
            }
            data.properties.layertypes.gradientcount = true;
        }

        if (data.properties.layertypes.gradientcolor || data.properties.layertypes.gradientcolorTimespan) {
            $.each(feature.search.searchResults, function (i, dataset) {
                if (dataset.value !== null) {
                    chorocount += 1;
                }
            })
            if (chorocount > 1) data.properties.layertypes.gradientcolorNoOverlaps = false
        }
    })

    //data.properties.layertypes = setLayerTypes(data);
    if (data.properties.statistics.length > 1) data.properties.layertypes.multicolor = true;


    return data;
}

function setChoroplethJSON(data, value) {
    var numbers = [];
    $.each(data.features, function (i, feature) {
        if (value === 'value') {
            feature.properties.chorovalue = parseFloat(feature.search.searchResults[0].value);
        }
        if (value === 'count') {
            feature.properties.chorovalue = feature.search.count
        }
        if (value === 'begin') {
            feature.properties.chorovalue = parseFloat(feature.search.searchResults[0].value[0])
        }
        if (value === 'end') {
            feature.properties.chorovalue = parseFloat(feature.search.searchResults[0].value[1])
        }
        if (value === 'middle') {
            feature.properties.chorovalue = ((parseFloat(feature.search.searchResults[0].value[0]) + parseFloat(feature.search.searchResults[0].value[1])) / 2)
        }
        numbers.push(feature.properties.chorovalue)
        feature.properties.radius = feature.properties.chorovalue;
    });
    var numbers = numbers,
        ratio = Math.max.apply(Math, numbers) / parseInt(parseInt(mysearchpointradius) - parseInt(mysearchpointminradius)),
        l = numbers.length,
        i;

    for (i = 0; i < l; i++) {
        currentNumber = i;
        numbers[i] = Math.round(numbers[i] / ratio);
        numberValue = numbers[i]
        $.each(data.features, function (i, feature) {
            if (i === currentNumber) feature.properties.radius = parseInt(parseInt(numberValue) + parseInt(mysearchpointminradius));
        })
    }

    return data;
}

function minmaxLegend(div) {
    $(div).parent().find('.overflowlegend, .mt-2').animate({height: 'toggle'})
    if ($(div).find('.far').hasClass('fa-minus-square')) {
        $(div).find('.far').removeClass('fa-minus-square');
        $(div).find('.far').addClass('fa-plus-square');
        $(div).find('.far').prop('title', 'expand');
    } else {
        $(div).find('.far').removeClass('fa-plus-square');
        $(div).find('.far').addClass('fa-minus-square');
        $(div).find('.far').prop('title', 'collapse');
    }
}

function removeLayer(thislayer, thismap) {
    var thisLayer = eval('$("#' + thismap + '_' + thislayer + '")');
    eval(thismap + '.removeLayer(' + thislayer + ')');
    var myselector = eval('$("#' + thismap + '_legendentries")');
    $(thisLayer).remove();
    orderlayer(myselector);
}

function copyLayer() {
    currentLegend = currentLegend + ' (copy)';
    finishQuery('poly', finalSearchResultIds, CSVresult, true, null)
}

function hoverMarker(linkid, currentmap) {
    var thismap = eval(currentmap)
    var mythis = document.getElementById(linkid)
    var latlng = ($(mythis).data('latlng'))
    if (typeof (hovermarker) !== 'undefined') hovermarker.removeFrom(thismap);
    hovermarker = L.marker(latlng, {icon: hovericon}).addTo(thismap);
    if (window.location.href.indexOf("sites") > -1) {
        hovermarker.bindPopup('<a href="' + mythis.href + '" title="' + mythis.title + '"><b>' + mythis.innerHTML + '</b></a><br><br>' + $(mythis).data('type'));
    }
    hovermarker._bringToFront();
    if (thismap.getBounds().contains(latlng) === false) {
        thismap.flyTo(latlng, 9, {duration: 0.5});
    }
}

hovericon = L.icon({
    iconUrl: "/static/images/icons/marker-icon.png",
    shadowUrl: "/static/images/icons/marker-shadow.png",
    iconAnchor: [12, 41],
    popupAnchor: [0, -34]
});

function today() {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    today = yyyy + '/' + mm + '/' + dd;
    return (today)
}

//captions  for lightbox images
$.featherlight.prototype.afterContent = function () {
    var caption = this.$currentTarget.find('img').attr('title');
    if (caption) caption = "Image after: " + caption;
    this.$instance.find('.caption').remove();
    $('<div style="max-width: fit-content; font-size: 0.875em" class="caption text-muted">').text(caption).appendTo(this.$instance.find('.featherlight-content'));
}

thisUrl = window.location.href;
if (thisUrl.includes('#')) thisUrl = thisUrl.substring(0, thisUrl.indexOf('#'));

mycitation1 = ' From: <a href="/about" target="_blank">THANADOS:</a> <a' +
    ' href="' + thisUrl + '">' + thisUrl + '</a> [Accessed: ' + today() + ']<br>' +
    'Licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a><br> After: ';

//retrieve type data for popover
function getTypeData(id, div, hierarchy) {
    $.getJSON("/vocabulary/" + id + "/json", function (data) {
        returnHtml = '<a title="' + data.path + '" href="/vocabulary/' + id + '" target="_blank">' + data.name + '</a>';
        if (data.files) returnHtml = returnHtml + '<img class="logo-image mt-2 mb-2" src="' + data.files[0].file_name + '">';
        if (data.description) returnHtml = returnHtml + '<p class="mt-2 text-muted font-italic" >' + data.description + '</p>';
        if (data.parent) returnHtml = returnHtml + '<p class="mt-2"> Subcategory of:' +
            ' <a href="/vocabulary/' + data.parent + '" target="_blank">' + data.parent_name + '</a></p>';
        if (data.topparent.name) returnHtml = returnHtml + '<span class="mt-2"> Hierarchy:' +
            ' <a href="/vocabulary/' + data.topparent.id + '" target="_blank">' + data.topparent.name + '</a></span>';
        if (data.topparent.description) returnHtml = returnHtml + '<br><span><i' +
            ' class="text-muted">' + data.topparent.description + '</i></span>';
        if (data.gazetteers) {
            gazetteer = "<br><br>Identifiers:<br>"
            $.each(data.gazetteers, function (i, gaz) {
                if (typeof gaz.about === "undefined") gaz.about = gaz.domain;
                if (typeof gaz.favicon !== "undefined") {
                    gazetteer = gazetteer + '<a href="' + gaz.url + '" title="' + gaz.about + '" target="_blank"><img class="me-2" height="20px"src="' + gaz.favicon + '">' + gaz.domain + ': ' + gaz.identifier + '</a><br>'
                } else {
                    gazetteer = gazetteer + '<a href="' + gaz.url + '" title="' + gaz.about + '" target="_blank">' + gaz.domain + ': ' + gaz.identifier + '</a><br>'
                }
            })
            returnHtml = returnHtml + gazetteer
        }
        returnValue = returnHtml;
        if (hierarchy) {
            setHierarchyPopup(returnValue, div)
        } else {
            logHTML(returnValue, div)
        }

    });
}

function getCaseData(id, container) {
    $.getJSON("/vocabulary/" + id + "/json", function (data) {
        var sitecount = 0

        if (typeof (data.entities_recursive) !== 'undefined') {
            $.each(data.entities_recursive, function (i, ent) {
                if (ent.main_type.includes('Place > Burial Site')) {
                    sitecount += 1
                }
            })
        }

        if (sitecount > 0) {

            var title = data.name
            if (typeof (data.description) !== 'undefined') {
                var title = data.description
            }

            var projLink = ''

            if (title.includes('http')) {
                projLink = 'http' + title.slice(title.lastIndexOf('http') + 4);
                projLink = '<a class="float-end" title="Project website" target="_blank" href="'+ projLink+ '"><i class="logo-link fas fa-external-link-alt"></i></a>'

            }
            if (data.files) {
                title = "<img class='logo-image mb-2' src='" + data.files[0].file_name + "'>" + title
            }


            var outHtml = '<li style="display: flex"><a class="dropdown-item" data-bs-offset="55,8" data-bs-append-to-body="true" data-bs-toggle="popover" data-bs-trigger="hover focus" title="' + data.name + '" data-bs-content="' + title + '" href="#" onclick="removeHoverMarker, filterTable(' + data.id + ')">' + data.name + ' (' + sitecount + ')</a>'+ projLink + '</li>'
            $(container).append(outHtml)
            var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
            var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
                return new bootstrap.Popover(popoverTriggerEl, {trigger: 'hover focus', html: true})
            })
        }
    });

}

function logHTML(value, div) {

    div.popover({html: true, content: value, container: div.next(), offset: [80,8]});
    div.popover('show');
    var btn = '<div> <button class="closePopover btn btn-xs mb-2 mt-2 btn-secondary float-end" onclick="$(this).popover(\'dispose\')">close</button></div>'
    $(div).next().find('.popover-body').append(btn);
}

function setHierarchyPopup(value, div) {
    div.popover({html: true, content: value, container: div.parent().next(), placement: 'right', offset: [80,8]});
    div.popover('show');
    var btn = '<div> <button class="closePopover btn btn-xs mb-2 mt-2 btn-secondary float-end" onclick="$(this).popover(\'dispose\')">close</button></div>'
    $(div).parent().next().find('.popover-body').append(btn);
}

function initPopovers() {
    $('.typebutton').click(function () {
        popover_div = $(this);
        var id = popover_div.data('value');
        getTypeData(id, popover_div, false);
    })
    $('body').click(function () {
        $('.popover').popover('dispose')
    })
}

function initTreePopovers() {
    $('.popCont').click(function () {
        popover_div = $(this);
        var id = popover_div.data('id');
        getTypeData(id, popover_div, true);
    });
    $('body').click(function () {
        $('.popover').popover('dispose')
    })
}

function getHierarchyData(id, div) {
    $.getJSON("/vocabulary/" + id + "/json", function (data) {
        var content = '';
        var usage = '';
        if (data.topparent.forms) {
            $.each(data.topparent.forms, function (i, form) {
                if (i === 0) {
                    usage = form;
                } else {
                    usage += ', ' + form;
                }
            })
        }
        if (data.topparent.description) var content = '<p class="text-muted font-italic">' + data.topparent.description + '</p>';
        content = content + '<p>Relation: <span class="text-muted">' + data.topparent.selection + '</span></p>';
        if (usage !== '') content = content + '<p>Usage: <span class="text-muted">' + usage + '</span></p>';
        if (data.types_recursive) content = content + '<p>Subcategories: <span class="text-muted">' + data.types_recursive.length + '</span></p>';
        if (data.entities_recursive) content = content + '<p>Entities: <span class="text-muted">' + data.entities_recursive.length + '</span></p>';
        content = content + '<p><a href="/vocabulary/' + data.id + '" target="_blank">Permalink</a></p>';
        div.html(content)
    });
}

//set maintype to default if no one is given
function repairJson(data) {
    bonesthere = false;
    findsthere = false;
    burialsthere = false;
    gravesthere = false;

    $.each(data.features, function (i, feature) {
        if (feature.id !== 0) {
            gravesthere = true
        }
        if (typeof (feature.properties.maintype.id) === "undefined" && feature.id !== 0) {
            feature.properties.maintype = {
                "systemtype": "feature",
                "name": "Feature",
                "id": 13362,
                "parent_id": 13362,
                "path": "Feature"
            }
        }
        if (feature.burials) {
            burialsthere = true;
            $.each(feature.burials, function (i, burial) {
                if (typeof (burial.properties.maintype.id) === "undefined") {
                    burial.properties.maintype = {
                        "systemtype": "stratigraphic_unit",
                        "name": "Stratigraphic Unit",
                        "id": 13365,
                        "parent_id": 13365,
                        "path": "Stratigraphic Unit"
                    }
                }

                if (burial.finds) {
                    findsthere = true;
                    $.each(burial.finds, function (i, find) {
                        if (typeof (find.properties.maintype.id) === "undefined") {
                            find.properties.maintype = {
                                "systemtype": "artifact",
                                "name": "artifact",
                                "id": 157754,
                                "parent_id": 157754,
                                "path": "Find"
                            }
                        }
                    });
                }
                if (burial.humanremains) {
                    bonesthere = true;
                    $.each(burial.humanremains, function (i, bone) {
                        if (typeof (bone.properties.maintype.id) === "undefined") {
                            bone.properties.maintype = {
                                "systemtype": "human_remains",
                                "name": "Human Remains",
                                "id": 119334,
                                "parent_id": 119334,
                                "path": "Human Remains"
                            }
                        }
                    });
                }
            });
        }
    })
    return data
}

function sortByProperty(objArray, prop, direction) {
    if (arguments.length < 2) throw new Error("ARRAY, AND OBJECT PROPERTY MINIMUM ARGUMENTS, OPTIONAL DIRECTION");
    if (!Array.isArray(objArray)) throw new Error("FIRST ARGUMENT NOT AN ARRAY");
    const clone = objArray.slice(0);
    const direct = arguments.length > 2 ? arguments[2] : 1; //Default to ascending
    const propPath = (prop.constructor === Array) ? prop : prop.split(".");
    clone.sort(function (a, b) {
        for (let p in propPath) {
            if (a[propPath[p]] && b[propPath[p]]) {
                a = a[propPath[p]];
                b = b[propPath[p]];
            }
        }
        // convert numeric strings to integers
        a = a.match(/^\d+$/) ? +a : a;
        b = b.match(/^\d+$/) ? +b : b;
        return ((a < b) ? -1 * direct : ((a > b) ? 1 * direct : 0));
    });
    return clone;
}

function highlightbones(svg_label) {
    svg_label = svg_label.toString();
    if (availableBones.includes(svg_label)) {
        var bonegroup = $('g[inkscape\\:label="' + svg_label + '"]');
        $(bonegroup).find('path').css("fill", "rgba(255,0,0,0.29)");
    } else {
        if (svg_label !== '119334') {
            var siding = svg_label.toString().replace(/[0-9]/g, '')
            $.getJSON("/vocabulary/" + parseInt(svg_label.replace(/[^0-9]/g, '')) + "/json", function (data) {
                if (data.parent !== 119334) {
                    svg_label = (data.parent.toString()) + siding;
                    highlightbones(svg_label.toString())
                }
            })
        }
        return false
    }
}

function createFeatureCollection(ids) {
    $.ajax({
        type: 'POST',
        url: '/ajax/feature_collection',
        data: {
            'ids': ids
        },
        success: function (result) {
            eval('graves' + Iter + '= L.geoJSON(result, {onEachFeature: function (feature, layer){\n' +
                '                    layer.bindPopup(getPopUp(feature))\n' +
                '                },filter: polygonFilter,style: myStyle})')

            pointgraves = L.geoJSON(result, {
                onEachFeature: function (feature, layer) {
                    layer.bindPopup(getPopUp(feature))
                },
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
                            derivedPoly: "true",
                            site: feature.site
                        });
                        eval('graves' + Iter).addData(rect);
                    }
                },
            });


            var currentbtnHolder = eval('$("#btnHolder' + Iter + '")')
            $(currentbtnHolder).append(
                '<li class="d-inline-block"><a id="graveDnld' + Iter + '" class="graveDownload" title="Download search result (graves) as GeoJSON file" data-iter="' + Iter + '"><i class="fas fa-draw-polygon"></i></a></li>'
            )
            var currentbtn = eval('$("#graveDnld' + Iter + '")')
            var jsondownload = eval('graves' + Iter).toGeoJSON(13);
            $(currentbtn).data('json', JSON.stringify(jsondownload))
            $(currentbtn).click(function f() {
                var data = $(this).data('json');
                exportToJsonFile(JSON.parse(data));
            })
            getAllGraves()
        }
    });
}

//filter to get polygons from the geojson
function polygonFilter(feature) {
    if (feature.geometry) {
        if (feature.geometry.type === "Polygon")
            return true
    }
}

//filter to get points from the geojson
function pointFilter(feature) {
    if (feature.geometry) {
        if (feature.geometry.type === "Point")
            return true
    }
}

function getAllGraves() {
    $.ajax({
        type: 'POST',
        url: '/ajax/allgraves',
        success: function (result) {
            eval('allGraves' + Iter + '= L.geoJSON(result, {onEachFeature: function (feature, layer){\n' +
                '                    layer.bindPopup(getPopUp(feature))\n' +
                '                },filter: polygonFilter,style: myBackgroundStyle})')

            pointgraves = L.geoJSON(result, {
                onEachFeature: function (feature, layer) {
                    layer.bindPopup(getPopUp(feature))
                },
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
                            derivedPoly: "true",
                            site: feature.site
                        });
                        eval('allGraves' + Iter).addData(rect);
                    }
                },
            });

            var gravesexist = false;
            eval('if (typeof(graves' + Iter + ') !== "undefined") var gravesexist = true')

            if (gravesexist) {
                var groupedOverlays = {
                    "Search Results": {
                        "Clustered": clustermarkers,
                        "Single": eval('resultpoints' + Iter),
                        "Graves (results)": eval('graves' + Iter)
                    },
                    "Visualisations": {
                        "Density": heat,
                        "Graves (all)": eval('allGraves' + Iter)
                    }
                };
            } else {
                var groupedOverlays = {
                    "Search Results": {
                        "Clustered": clustermarkers,
                        "Single": eval('resultpoints' + Iter),
                        //"Graves (results)": eval('graves' + Iter)
                    },
                    "Visualisations": {
                        "Density": heat,
                        "Graves (all)": eval('allGraves' + Iter)
                    }
                }
            }
            var options = {
                groupCheckboxes: false
            };
            eval('map' + Iter + '.removeControl(layerControl' + Iter + ')');
            eval('layerControl' + Iter + ' = L.control.groupedLayers(MyBaseLayers' + Iter + ', groupedOverlays, options)');
            eval('map' + Iter + '.addControl(layerControl' + Iter + ')');

            eval

        }
    });
}

function getAllGraves() {
    $.ajax({
        type: 'POST',
        url: '/ajax/allgraves',
        success: function (result) {
            eval('allGraves' + Iter + '= L.geoJSON(result, {onEachFeature: function (feature, layer){\n' +
                '                    layer.bindPopup(getPopUp(feature))\n' +
                '                },filter: polygonFilter,style: myBackgroundStyle})')

            pointgraves = L.geoJSON(result, {
                onEachFeature: function (feature, layer) {
                    layer.bindPopup(getPopUp(feature))
                },
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
                            derivedPoly: "true",
                            site: feature.site
                        });
                        eval('allGraves' + Iter).addData(rect);
                    }
                },
            });

            var gravesexist = false;
            eval('if (typeof(graves' + Iter + ') !== "undefined") var gravesexist = true')

            if (gravesexist) {
                var groupedOverlays = {
                    "Search Results": {
                        "Clustered": clustermarkers,
                        "Single": eval('resultpoints' + Iter),
                        "Graves (results)": eval('graves' + Iter)
                    },
                    "Visualisations": {
                        "Density": heat,
                        "Graves (all)": eval('allGraves' + Iter)
                    }
                };
            } else {
                var groupedOverlays = {
                    "Search Results": {
                        "Clustered": clustermarkers,
                        "Single": eval('resultpoints' + Iter),
                        //"Graves (results)": eval('graves' + Iter)
                    },
                    "Visualisations": {
                        "Density": heat,
                        "Graves (all)": eval('allGraves' + Iter)
                    }
                }
            }
            var options = {
                groupCheckboxes: false
            };
            eval('map' + Iter + '.removeControl(layerControl' + Iter + ')');
            eval('layerControl' + Iter + ' = L.control.groupedLayers(MyBaseLayers' + Iter + ', groupedOverlays, options)');
            eval('map' + Iter + '.addControl(layerControl' + Iter + ')');

            eval

        }
    });
}

function getPopUp(feature) {
    var myPopup = '<a href="entity\/' + feature.id + '" title="' + feature.properties.path + '" target="_blank"><b>' + feature.properties.name + '</b></a>' +
        '<br>' + feature.site.name
    return myPopup
}

function set3D(file) {
    $('body').append(
        '<div class="modal modal-xxl fade bd-example-modal-lg" id="3DModal" tabindex="-1" role="dialog"\n' +
        '     aria-labelledby="3d-model" aria-hidden="true">\n' +
        '    <div class="modal-dialog" role="document">\n' +
        '        <div class="modal-content">\n' +
        '            <div class="modal-body">' +
        '               <model-viewer style="width: 100%; height: 80vh" src="' + file + '" alt="3d" auto-rotate camera-controls></model-viewer>' +
        '               <div class="modal-footer pt-2 pl-0 pr-0">\n' +
        '                   <div style="width: 100%">\n' +
        '                       <button type="button" title="show metadata" class="btn btn-primary float-start ms-2" onclick="$(\'#3dmetadata\').toggleClass(\'d-none\')"><i class="fas fa-info"></i></button>\n' +
        '                       <button type="button" class="btn btn-secondary float-end ms-2" data-bs-dismiss="modal"><i class="fas fa-times"></i></button>\n' +
        '                       <a type="button" href="' + file + '" class="btn btn-primary float-end"><i class="fas fa-download"></i></a>\n' +
        '                   </div>' +
        '                   <div id="3dmetadata" style="font-size: 0.875rem" class="w-100 pl-2 pr-2 pt-2 pb-0 text-muted float-start d-none"></div>\n' +
        '                   </div>\n' +
        '               </div>' +
        '            </div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '</div>'
    )

    if (typeof (current3dFile) === 'string') current3dFile = (JSON.parse(current3dFile.replace(/'/g, '"')));

    Object.keys(current3dFile).forEach(function (key) {
        $("#3dmetadata").append(key + ': ' + current3dFile[key] + '<br>')
    })


    $('#3DModal').on('hide.bs.modal', function () {
        $('#3DModal').remove();
    })

    $('#3DModal').modal('show')
    threeDfilename = file
}

function getImageHtml(files) {
    var filestring = JSON.stringify(files).replace(/'/g, '').replace(/"/g, '\'');
    files.file_name = loc_image + files.file_name;
    var myImgSource = '';
    if (typeof (files.source) != 'undefined') myImgSource = files.source;
    if (typeof (files.source) == 'undefined') myImgSource = "unknown source";
    if ((typeof (files.source) != 'undefined') && (typeof (files.reference) != 'undefined')) myImgSource = files.source + ' ' + files.reference;
    var imageHtml
    if (files.file_name.includes('.glb')) {
        //console.log(files.file_name);
        imageHtml = '<model-viewer class="modalimg" style="min-height: 400px;" src="' + files.file_name + '" alt="3d" auto-rotate camera-controls>' +
            '<div class="annotation" title="enlarge" data-file="' + filestring + '" onclick="current3dFile = $(this).data(\'file\'); set3D(\'' + files.file_name + '\')"><i class="fas fa-expand" style="margin-right: 3em""></i></div></model-viewer>'
    } else {
        imageHtml = '<a href="' + files.file_name + '" title="' + myImgSource + '" data-featherlight><img title="' + myImgSource + '" src="/static/images/icons/loading.gif" data-src="' + files.file_name + '" class="modalimg lazy" alt="' + myImgSource + '"></a>'
    }
    return imageHtml
}

function bodyheight() {
    var ageclassids = [22283, 22284, 117201, 22285, 22286, 22287, 22288] //ids to check if burial is grown up
    var ageminids = [118152, 118134, 117199] //ids to check if minimum age value is >= 18
    var maleids = [25, 22374] //ids to check if burial is of male sex
    var femaleids = [24, 22373] //ids to check if burial is of female sex
    var agecheck = false;
    var bhsex = 'undetermined';
    var h1there = false;
    var h2there = false;
    var f1there = false;
    var t1bthere = false;
    var r1there = false;

    var measurebones = []
    var measureids = [131911, 118169, 141363, 132017, 132033, 132004]

    $.each(bodyheighttypes, function (i, entry) {
        if (ageclassids.includes(entry.id)) agecheck = true;
        if (ageminids.includes(entry.id) && typeof (entry.value) !== "undefined") {
            if (entry.value >= 18) agecheck = true
        }
        if (maleids.includes(entry.id)) bhsex = 'male';
        if (femaleids.includes(entry.id)) bhsex = 'female';

        if (agecheck && measureids.includes(entry.id) && typeof (entry.value) !== "undefined") {
            if (entry.id === 118169) { //H1
                entry.height_breitinger = entry.value * 2.71 + 81.33;
                entry.height_bach = entry.value * 2.121 + 98.38;
                entry.height_pearson_m = entry.value * 2.894 + 70.641;
                entry.height_pearson_f = entry.value * 2.754 + 71.475;
                h1there = true;
                if (entry.siding === 'r') h1R = entry;
                if (entry.siding === 'l') h1L = entry;
                if (entry.siding === '') h1 = entry;
            }

            if (entry.id === 131911) { //H2
                entry.height_breitinger = entry.value * 2.715 + 83.21;
                entry.height_bach = entry.value * 2.121 + 99.44;
                h2there = true;
            }

            if (entry.id === 141363) { //R1b
                entry.height_breitinger = entry.value * 2.968 + 97.09;
                entry.height_bach = entry.value * 1.925 + 116.89;
            }

            if (entry.id === 132017) { //F1
                entry.height_breitinger = entry.value * 1.645 + 94.31;
                entry.height_bach = entry.value * 1.313 + 106.69;
                entry.height_pearson_m = entry.value * 1.880 + 81.306;
                entry.height_pearson_f = entry.value * 1.945 + 72.844;
                if (entry.siding === 'r') f1R = entry;
                if (entry.siding === 'l') f1L = entry;
                if (entry.siding === '') f1 = entry;
                f1there = true;
            }
            if (entry.id === 132033) { //T1b
                entry.height_breitinger = entry.value * 1.988 + 95.59;
                entry.height_bach = entry.value * 1.745 + 95.91;
                entry.height_pearson_m = entry.value * 2.376 + 78.664;
                entry.height_pearson_f = entry.value * 2.352 + 74.774;
                entry.height_TrotterGleser_fw = entry.value * 2.93 + 59.61;
                entry.height_TrotterGleser_mw = entry.value * 2.52 + 78.62;
                entry.height_TrotterGleser_fb = entry.value * 2.45 + 72.65;
                entry.height_TrotterGleser_mb = entry.value * 2.19 + 86.06;

                if (entry.siding === 'r') t1bR = entry;
                if (entry.siding === 'l') t1bL = entry;
                if (entry.siding === '') t1b = entry;
                t1bthere = true;
            }
            if (entry.id === 132004) { //R1
                entry.height_pearson_m = entry.value * 3.271 + 85.925;
                entry.height_pearson_f = entry.value * 3.343 + 81.224;
                r1there = true;
                if (entry.siding === 'r') r1R = entry;
                if (entry.siding === 'l') r1L = entry;
                if (entry.siding === '') r1 = entry;
            }

            measurebones.push(entry)

        }
    })

    //console.log(measurebones)
    var bones = {
        'BachBones': [],
        'BachAvg': 0,
        'BachArr': [],
        'BreitingerBones': [],
        'BreitingerAvg': 0,
        'BreitingerArr': [],
        'PearsonBonesM': [],
        'PearsonAvgM': 0,
        'PearsonArrM': [],
        'PearsonBonesF': [],
        'PearsonAvgF': 0,
        'PearsonArrF': [],
        'TrotterGleserBonesFW': [],
        'TrotterGleserBonesAvgFW': 0,
        'TrotterGleserBonesArrFW': [],
        'TrotterGleserBonesFB': [],
        'TrotterGleserBonesAvgFB': 0,
        'TrotterGleserBonesArrFB': [],
        'TrotterGleserBonesMW': [],
        'TrotterGleserBonesAvgMW': 0,
        'TrotterGleserBonesArrMW': [],
        'TrotterGleserBonesMB': [],
        'TrotterGleserBonesAvgMB': 0,
        'TrotterGleserBonesArrMB': [],
    }


    $.each(measurebones, function (i, entry) {
        if (entry.height_pearson_m) {
            bones.PearsonBonesM.push({
                'id': entry.id, 'siding': entry.siding,
                'name': entry.name,
                'value': parseFloat(entry.height_pearson_m.toFixed(1)),
                'length': entry.value
            });
            bones.PearsonArrM.push(parseFloat(entry.height_pearson_m.toFixed(1)));
        }
        if (entry.height_pearson_f) {
            bones.PearsonBonesF.push({
                'id': entry.id,
                'siding': entry.siding,
                'name': entry.name,
                'value': parseFloat(entry.height_pearson_f.toFixed(1)),
                'length': entry.value
            });
            bones.PearsonArrF.push(parseFloat(entry.height_pearson_f.toFixed(1)));
        }
        if (entry.height_breitinger && h2there === false) {
            bones.BreitingerBones.push({
                'id': entry.id,
                'siding': entry.siding,
                'name': entry.name,
                'value': parseFloat(entry.height_breitinger.toFixed(1)),
                'length': entry.value
            });
            bones.BreitingerArr.push(parseFloat(entry.height_breitinger.toFixed(1)));
        }
        if (entry.height_breitinger && h2there && entry.id !== 118169) {
            bones.BreitingerBones.push({
                'id': entry.id,
                'siding': entry.siding,
                'name': entry.name,
                'value': parseFloat(entry.height_breitinger.toFixed(1)),
                'length': entry.value
            });
            bones.BreitingerArr.push(parseFloat(entry.height_breitinger.toFixed(1)));
        }
        if (entry.height_bach && h2there === false) {
            bones.BachBones.push({
                'id': entry.id,
                'siding': entry.siding,
                'name': entry.name,
                'value': parseFloat(entry.height_bach.toFixed(1)),
                'length': entry.value
            });
            bones.BachArr.push(parseFloat(entry.height_bach.toFixed(1)));
        }
        if (entry.height_bach && h2there && entry.id !== 118169) {
            bones.BachBones.push({
                'id': entry.id,
                'siding': entry.siding,
                'name': entry.name,
                'value': parseFloat(entry.height_bach.toFixed(1)),
                'length': entry.value
            });
            bones.BachArr.push(parseFloat(entry.height_bach.toFixed(1)));
        }
        if (entry.height_TrotterGleser_fw) {
            bones.TrotterGleserBonesFW.push({
                'id': entry.id,
                'siding': entry.siding,
                'name': entry.name,
                'value': parseFloat(entry.height_TrotterGleser_fw.toFixed(1)),
                'length': entry.value
            });
            bones.TrotterGleserBonesArrFW.push(parseFloat(entry.height_TrotterGleser_fw.toFixed(1)));
        }
        if (entry.height_TrotterGleser_fb) {
            bones.TrotterGleserBonesFB.push({
                'id': entry.id,
                'siding': entry.siding,
                'name': entry.name,
                'value': parseFloat(entry.height_TrotterGleser_fb.toFixed(1)),
                'length': entry.value
            });
            bones.TrotterGleserBonesArrFB.push(parseFloat(entry.height_TrotterGleser_fb.toFixed(1)));
        }
        if (entry.height_TrotterGleser_mw) {
            bones.TrotterGleserBonesMW.push({
                'id': entry.id,
                'siding': entry.siding,
                'name': entry.name,
                'value': parseFloat(entry.height_TrotterGleser_mw.toFixed(1)),
                'length': entry.value
            });
            bones.TrotterGleserBonesArrMW.push(parseFloat(entry.height_TrotterGleser_mw.toFixed(1)));
        }
        if (entry.height_TrotterGleser_mb) {
            bones.TrotterGleserBonesMB.push({
                'id': entry.id,
                'siding': entry.siding,
                'name': entry.name,
                'value': parseFloat(entry.height_TrotterGleser_mb.toFixed(1)),
                'length': entry.value
            });
            bones.TrotterGleserBonesArrMB.push(parseFloat(entry.height_TrotterGleser_mb.toFixed(1)));
        }
    })
    //console.log(bones);
    bones.methods = [];

    //Trotter & Gleser 1952

    //Pearson Combinations
    //Pearson 5 and 6 for each siding and undetermined siding
    if (typeof (f1) !== 'undefined' && typeof (t1b) !== 'undefined') {
        var bone = {
            'id': 0,
            'siding': '',
            'name': 'Pearson 5 (F1 + T1b)',
            'valuef': parseFloat(((f1.value + t1b.value) * 1.126 + 69.154).toFixed(1)),
            'valuem': parseFloat(((f1.value + t1b.value) * 1.159 + 71.272).toFixed(1)),
            'length': f1.value + t1b.value
        }
        bones.PearsonBonesF.push(PearsonSelect(bone, 'female'));
        bones.PearsonBonesM.push(PearsonSelect(bone, 'male'));
        bones.PearsonArrF.push(bone.valuef);
        bones.PearsonArrM.push(bone.valuem);

        var bone = {
            'id': 0,
            'siding': '',
            'name': 'Pearson 6 (F1 + T1b)',
            'valuef': parseFloat(((f1.value * 1.117) + (t1b.value * 1.125) + 69.561).toFixed(1)),
            'valuem': parseFloat(((f1.value * 1.220) + (t1b.value * 1.080) + 71.443).toFixed(1)),
            'length': f1.value + t1b.value
        }
        bones.PearsonBonesF.push(PearsonSelect(bone, 'female'));
        bones.PearsonBonesM.push(PearsonSelect(bone, 'male'));
        bones.PearsonArrF.push(bone.valuef);
        bones.PearsonArrM.push(bone.valuem);

    }


    if (typeof (f1R) !== 'undefined' && typeof (t1bR) !== 'undefined') {
        var bone = {
            'id': 0,
            'siding': 'r',
            'name': 'r Pearson 5 (F1 + T1b)',
            'valuef': parseFloat(((f1R.value + t1bR.value) * 1.126 + 69.154).toFixed(1)),
            'valuem': parseFloat(((f1R.value + t1bR.value) * 1.159 + 71.272).toFixed(1)),
            'length': f1R.value + t1bR.value
        }
        bones.PearsonBonesF.push(PearsonSelect(bone, 'female'));
        bones.PearsonBonesM.push(PearsonSelect(bone, 'male'));
        bones.PearsonArrF.push(bone.valuef);
        bones.PearsonArrM.push(bone.valuem);
        var bone = {
            'id': 0,
            'siding': 'r',
            'name': 'r Pearson 6 (F1 + T1b)',
            'valuef': parseFloat(((f1R.value * 1.117) + (t1bR.value * 1.125) + 69.561).toFixed(1)),
            'valuem': parseFloat(((f1R.value * 1.220) + (t1bR.value * 1.080) + 71.443).toFixed(1)),
            'length': f1R.value + t1bR.value
        }
        bones.PearsonBonesF.push(PearsonSelect(bone, 'female'));
        bones.PearsonBonesM.push(PearsonSelect(bone, 'male'));
        bones.PearsonArrF.push(bone.valuef);
        bones.PearsonArrM.push(bone.valuem);

    }

    if (typeof (f1L) !== 'undefined' && typeof (t1bL) !== 'undefined') {
        var bone = {
            'id': 0,
            'siding': 'l',
            'name': 'l Pearson 5 (F1 + T1b)',
            'valuef': parseFloat(((f1L.value + t1bL.value) * 1.126 + 69.154).toFixed(1)),
            'valuem': parseFloat(((f1L.value + t1bL.value) * 1.159 + 71.272).toFixed(1)),
            'length': f1L.value + t1bL.value
        }
        bones.PearsonBonesF.push(PearsonSelect(bone, 'female'));
        bones.PearsonBonesM.push(PearsonSelect(bone, 'male'));
        bones.PearsonArrF.push(bone.valuef);
        bones.PearsonArrM.push(bone.valuem);
        var bone = {
            'id': 0,
            'siding': 'l',
            'name': 'l Pearson 6 (F1 + T1b)',
            'valuef': parseFloat(((f1L.value * 1.117) + (t1bL.value * 1.125) + 69.561).toFixed(1)),
            'valuem': parseFloat(((f1L.value * 1.220) + (t1bL.value * 1.080) + 71.443).toFixed(1)),
            'length': f1L.value + t1bL.value
        }
        bones.PearsonBonesF.push(PearsonSelect(bone, 'female'));
        bones.PearsonBonesM.push(PearsonSelect(bone, 'male'));
        bones.PearsonArrF.push(bone.valuef);
        bones.PearsonArrM.push(bone.valuem);

    }

    //Pearson 7 and 8 for each siding and undetermined siding
    if (typeof (h1) !== 'undefined' && typeof (r1) !== 'undefined') {
        var bone = {
            'id': 0,
            'siding': '',
            'name': 'Pearson 7 (H1 + R1)',
            'valuef': parseFloat(((h1.value + r1.value) * 1.628 + 69.911).toFixed(1)),
            'valuem': parseFloat(((h1.value + r1.value) * 1.730 + 66.855).toFixed(1)),
            'length': h1.value + r1.value
        }
        bones.PearsonBonesF.push(PearsonSelect(bone, 'female'));
        bones.PearsonBonesM.push(PearsonSelect(bone, 'male'));
        bones.PearsonArrF.push(bone.valuef);
        bones.PearsonArrM.push(bone.valuem);
        var bone = {
            'id': 0,
            'siding': '',
            'name': 'Pearson 8 (H1 + R1)',
            'valuef': parseFloat(((h1.value * 2.582) + (r1.value * 0.281) + 70.542).toFixed(1)),
            'valuem': parseFloat(((h1.value * 2.769) + (r1.value * 0.195) + 69.788).toFixed(1)),
            'length': h1.value + r1.value
        }
        bones.PearsonBonesF.push(PearsonSelect(bone, 'female'));
        bones.PearsonBonesM.push(PearsonSelect(bone, 'male'));
        bones.PearsonArrF.push(bone.valuef);
        bones.PearsonArrM.push(bone.valuem);

    }
    if (typeof (h1L) !== 'undefined' && typeof (r1L) !== 'undefined') {
        var bone = {
            'id': 0,
            'siding': 'l',
            'name': 'l Pearson 7 (H1 + R1)',
            'valuef': parseFloat(((h1L.value + r1L.value) * 1.628 + 69.911).toFixed(1)),
            'valuem': parseFloat(((h1L.value + r1L.value) * 1.730 + 66.855).toFixed(1)),
            'length': h1L.value + r1L.value
        }
        bones.PearsonBonesF.push(PearsonSelect(bone, 'female'));
        bones.PearsonBonesM.push(PearsonSelect(bone, 'male'));
        bones.PearsonArrF.push(bone.valuef);
        bones.PearsonArrM.push(bone.valuem);
        var bone = {
            'id': 0,
            'siding': 'l',
            'name': 'l Pearson 8 (H1 + R1)',
            'valuef': parseFloat(((h1L.value * 2.582) + (r1L.value * 0.281) + 70.542).toFixed(1)),
            'valuem': parseFloat(((h1L.value * 2.769) + (r1L.value * 0.195) + 69.788).toFixed(1)),
            'length': h1L.value + r1L.value
        }
        bones.PearsonBonesF.push(PearsonSelect(bone, 'female'));
        bones.PearsonBonesM.push(PearsonSelect(bone, 'male'));
        bones.PearsonArrF.push(bone.valuef);
        bones.PearsonArrM.push(bone.valuem);

    }

    if (typeof (h1R) !== 'undefined' && typeof (r1R) !== 'undefined') {
        var bone = {
            'id': 0,
            'siding': 'r',
            'name': 'r Pearson 7 (H1 + R1)',
            'valuef': parseFloat(((h1R.value + r1R.value) * 1.628 + 69.911).toFixed(1)),
            'valuem': parseFloat(((h1R.value + r1R.value) * 1.730 + 66.855).toFixed(1)),
            'length': h1R.value + r1R.value
        }
        bones.PearsonBonesF.push(PearsonSelect(bone, 'female'));
        bones.PearsonBonesM.push(PearsonSelect(bone, 'male'));
        bones.PearsonArrF.push(bone.valuef);
        bones.PearsonArrM.push(bone.valuem);
        var bone = {
            'id': 0,
            'siding': 'r',
            'name': 'r Pearson 8 (H1 + R1)',
            'valuef': parseFloat(((h1R.value * 2.582) + (r1R.value * 0.281) + 70.542).toFixed(1)),
            'valuem': parseFloat(((h1R.value * 2.769) + (r1R.value * 0.195) + 69.788).toFixed(1)),
            'length': h1R.value + r1R.value
        }
        bones.PearsonBonesF.push(PearsonSelect(bone, 'female'));
        bones.PearsonBonesM.push(PearsonSelect(bone, 'male'));
        bones.PearsonArrF.push(bone.valuef);
        bones.PearsonArrM.push(bone.valuem);

    }

    //Pearson 9 for each siding and undetermined siding
    if (typeof (h1) !== 'undefined' && typeof (f1) !== 'undefined') {
        var bone = {
            'id': 0,
            'siding': '',
            'name': 'Pearson 9 (H1 + F1)',
            'valuef': parseFloat(((h1.value * 1.027) + (f1.value * 1.339) + 67.435).toFixed(1)),
            'valuem': parseFloat(((h1.value * 1.557) + (f1.value * 1.030) + 68.397).toFixed(1)),
            'length': h1.value + f1.value
        }
        bones.PearsonBonesF.push(PearsonSelect(bone, 'female'));
        bones.PearsonBonesM.push(PearsonSelect(bone, 'male'));
        bones.PearsonArrF.push(bone.valuef);
        bones.PearsonArrM.push(bone.valuem);
    }

    if (typeof (h1L) !== 'undefined' && typeof (f1L) !== 'undefined') {
        var bone = {
            'id': 0,
            'siding': 'l',
            'name': 'l Pearson 9 (H1 + F1)',
            'valuef': parseFloat(((h1L.value * 1.027) + (f1L.value * 1.339) + 67.435).toFixed(1)),
            'valuem': parseFloat(((h1L.value * 1.557) + (f1L.value * 1.030) + 68.397).toFixed(1)),
            'length': h1L.value + f1L.value
        }
        bones.PearsonBonesF.push(PearsonSelect(bone, 'female'));
        bones.PearsonBonesM.push(PearsonSelect(bone, 'male'));
        bones.PearsonArrF.push(bone.valuef);
        bones.PearsonArrM.push(bone.valuem);

    }

    if (typeof (h1R) !== 'undefined' && typeof (f1R) !== 'undefined') {
        var bone = {
            'id': 0,
            'siding': 'r',
            'name': 'r Pearson 9 (H1 + F1)',
            'valuef': parseFloat(((h1R.value * 1.027) + (f1R.value * 1.339) + 67.435).toFixed(1)),
            'valuem': parseFloat(((h1R.value * 1.557) + (f1R.value * 1.030) + 68.397).toFixed(1)),
            'length': h1R.value + f1R.value
        }
        bones.PearsonBonesF.push(PearsonSelect(bone, 'female'));
        bones.PearsonBonesM.push(PearsonSelect(bone, 'male'));
        bones.PearsonArrF.push(bone.valuef);
        bones.PearsonArrM.push(bone.valuem);
    }

    //Pearson 10 for each siding and undetermined siding
    if (typeof (f1) !== 'undefined' && typeof (t1b) !== 'undefined' && typeof (h1) !== 'undefined' && typeof (r1) !== 'undefined') {
        var bone = {
            'id': 0,
            'siding': '',
            'name': 'Pearson 10 (F1, T1b, H1, R1)',
            'valuef': parseFloat((f1.value * 0.782) + (t1b.value * 1.120) + (h1.value * 1.059) - (r1.value * 0.711) + 67.469).toFixed(1),
            'valuem': parseFloat((f1.value * 0.913) + (t1b.value * 0.600) + (h1.value * 1.225) - (r1.value * 0.187) + 67.049).toFixed(1),
            'length': (h1.value + f1.value + t1b.value - r1.value).toFixed(1)
        }
        bones.PearsonBonesF.push(PearsonSelect(bone, 'female'));
        bones.PearsonBonesM.push(PearsonSelect(bone, 'male'));
        bones.PearsonArrF.push(parseFloat(bone.valuef));
        bones.PearsonArrM.push(parseFloat(bone.valuem));
    }

    if (typeof (f1L) !== 'undefined' && typeof (t1bL) !== 'undefined' && typeof (h1L) !== 'undefined' && typeof (r1L) !== 'undefined') {
        var bone = {
            'id': 0,
            'siding': 'l',
            'name': 'l Pearson 10 (F1, T1b, H1, R1)',
            'valuef': parseFloat((f1L.value * 0.782) + (t1bL.value * 1.120) + (h1L.value * 1.059) - (r1L.value * 0.711) + 67.469).toFixed(1),
            'valuem': parseFloat((f1L.value * 0.913) + (t1bL.value * 0.600) + (h1L.value * 1.225) - (r1L.value * 0.187) + 67.049).toFixed(1),
            'length': (h1L.value + f1L.value + t1bL.value - r1L.value).toFixed(1)
        }
        bones.PearsonBonesF.push(PearsonSelect(bone, 'female'));
        bones.PearsonBonesM.push(PearsonSelect(bone, 'male'));
        bones.PearsonArrF.push(parseFloat(bone.valuef));
        bones.PearsonArrM.push(parseFloat(bone.valuem));
    }

    if (typeof (f1R) !== 'undefined' && typeof (t1bR) !== 'undefined' && typeof (h1R) !== 'undefined' && typeof (r1R) !== 'undefined') {
        var bone = {
            'id': 0,
            'siding': 'r',
            'name': 'r Pearson 10 (F1, T1b, H1, R1)',
            'valuef': parseFloat((f1R.value * 0.782) + (t1bR.value * 1.120) + (h1R.value * 1.059) - (r1R.value * 0.711) + 67.469).toFixed(1),
            'valuem': parseFloat((f1R.value * 0.913) + (t1bR.value * 0.600) + (h1R.value * 1.225) - (r1R.value * 0.187) + 67.049).toFixed(1),
            'length': (h1R.value + f1R.value + t1bR.value - r1R.value).toFixed(1)
        }
        bones.PearsonBonesF.push(PearsonSelect(bone, 'female'));
        bones.PearsonBonesM.push(PearsonSelect(bone, 'male'));
        bones.PearsonArrF.push(parseFloat(bone.valuef));
        bones.PearsonArrM.push(parseFloat(bone.valuem));
    }


    if (bhsex === 'female' && agecheck && bones.BachArr.length > 0) {
        var weiter = true;
        bones.methods.push({'name': 'Bach 1965', 'method': 'Bach'});
    }
    if (bhsex === 'female' && agecheck && t1bthere) {
        var weiter = true;
        bones.methods.push({
            'name': 'Trotter & Gleser 1952 (fw)',
            'method': 'TGfw'
        }, {'name': 'Trotter & Gleser 1952 (fb)', 'method': 'TGfb'});
    }
    if (bhsex === 'male' && agecheck && t1bthere) {
        var weiter = true;
        bones.methods.push({
            'name': 'Trotter & Gleser 1952 (mw)',
            'method': 'TGmw'
        }, {'name': 'Trotter & Gleser 1952 (mb)', 'method': 'TGmb'});
    }
    if (bhsex === 'male' && agecheck && bones.BreitingerArr.length > 0) {
        var weiter = true;
        bones.methods.push({'name': 'Breitinger 1938', 'method': 'Breitinger'});
    }
    if (bhsex === 'male' && agecheck && bones.PearsonArrM.length > 0) {
        var weiter = true;
        bones.methods.push({'name': 'Pearson 1898', 'method': 'PearsonM'});
    }
    if (bhsex === 'female' && agecheck && bones.PearsonArrF.length > 0) {
        var weiter = true;
        bones.methods.push({'name': 'Pearson 1898', 'method': 'PearsonF'});
    }

    if (weiter) {

        const arrAvg = arr => arr.reduce((a, b) => a + b, 0) / arr.length
        if (bones.BreitingerArr.length > 0) bones.BreitingerAvg = parseFloat(arrAvg(bones.BreitingerArr).toFixed(1));
        if (bones.PearsonBonesM.length > 0) bones.PearsonAvgM = parseFloat(arrAvg(bones.PearsonArrM).toFixed(1));
        if (bones.BachArr.length > 0) bones.BachAvg = parseFloat(arrAvg(bones.BachArr).toFixed(1));
        if (bones.PearsonArrF.length > 0) bones.PearsonAvgF = parseFloat(arrAvg(bones.PearsonArrF).toFixed(1));
        if (bones.TrotterGleserBonesArrFB.length > 0) bones.TrotterGleserBonesAvgFB = parseFloat(arrAvg(bones.TrotterGleserBonesArrFB).toFixed(1));
        if (bones.TrotterGleserBonesArrFW.length > 0) bones.TrotterGleserBonesAvgFW = parseFloat(arrAvg(bones.TrotterGleserBonesArrFW).toFixed(1));
        if (bones.TrotterGleserBonesArrMB.length > 0) bones.TrotterGleserBonesAvgMB = parseFloat(arrAvg(bones.TrotterGleserBonesArrMB).toFixed(1));
        if (bones.TrotterGleserBonesArrMW.length > 0) bones.TrotterGleserBonesAvgMW = parseFloat(arrAvg(bones.TrotterGleserBonesArrMW).toFixed(1));

        if (bhsex === 'male') {
            var bodyheight_avg = bones.BreitingerAvg;
            bones.method = 'Breitinger'
            if (bodyheight_avg === 0) {
                bodyheight_avg = bones.PearsonAvgM;
                bones.method = 'PearsonM'
            }
        }
        if (bhsex === 'female') {
            var bodyheight_avg = bones.BachAvg;
            bones.method = 'Bach'
            if (bodyheight_avg === 0) {
                bodyheight_avg = bones.PearsonAvgF;
                bones.method = 'PearsonF'
            }
        }
        //if (sex === 'undetermined') var bodyheight_avg = [arrAvg(BachHeight).toFixed(2), arrAvg(BachHeight).toFixed(2)]
        var bodyheightBtn = '<div type="button" onclick="bodyheightmodal(\'' + bones.method + '\')" title="Average body height calculated after: ' + bones.method + '" class="modalrowitem heigthbtn">Body height: ' + bodyheight_avg + ' cm</div>'

        bones.sex = bhsex;
        bones.btn = bodyheightBtn;
        bones.avg = bodyheight_avg;

        return bones
    } else return false
}


function bodyheightmodal(method) {
    $('#bodyheight').empty();
    $('#HeightModal').modal('show')


    bhLabels = []
    bhData = []
    bhAvg = []

    if (method === 'Bach') {
        bonesToUse = bodyheight().BachBones;
        citeUrl = 'https://www.jstor.org/stable/29537886';
        citeName = 'Bach 1965';
        bonesToUse.avg = bodyheight().BachAvg;

    }
    if (method === 'Breitinger') {
        bonesToUse = bodyheight().BreitingerBones;
        citeUrl = 'https://www.jstor.org/stable/29536541';
        citeName = 'Breitinger 1938';
        bonesToUse.avg = bodyheight().BreitingerAvg;

    }
    if (method === 'PearsonM') {
        bonesToUse = bodyheight().PearsonBonesM;
        citeUrl = 'https://www.jstor.org/stable/116008';
        citeName = 'Pearson 1898';
        bonesToUse.avg = bodyheight().PearsonAvgM;

    }
    if (method === 'PearsonF') {
        bonesToUse = bodyheight().PearsonBonesF;
        citeUrl = 'https://www.jstor.org/stable/116008';
        citeName = 'Pearson 1898';
        bonesToUse.avg = bodyheight().PearsonAvgF;

    }
    if (method === 'TGmw') {
        bonesToUse = bodyheight().TrotterGleserBonesMW;
        citeUrl = ' https://doi.org/10.1002/ajpa.1330100407';
        citeName = 'Trotter & Gleser 1952';
        bonesToUse.avg = bodyheight().TrotterGleserBonesAvgMW;

    }
    if (method === 'TGmb') {
        bonesToUse = bodyheight().TrotterGleserBonesMB;
        citeUrl = ' https://doi.org/10.1002/ajpa.1330100407';
        citeName = 'Trotter & Gleser 1952';
        bonesToUse.avg = bodyheight().TrotterGleserBonesAvgMB;

    }
    if (method === 'TGfw') {
        bonesToUse = bodyheight().TrotterGleserBonesFW;
        citeUrl = ' https://doi.org/10.1002/ajpa.1330100407';
        citeName = 'Trotter & Gleser 1952';
        bonesToUse.avg = bodyheight().TrotterGleserBonesAvgFW;

    }
    if (method === 'TGfb') {
        bonesToUse = bodyheight().TrotterGleserBonesFB;
        citeUrl = ' https://doi.org/10.1002/ajpa.1330100407';
        citeName = 'Trotter & Gleser 1952';
        bonesToUse.avg = bodyheight().TrotterGleserBonesAvgFB;

    }

    var avg = bonesToUse.avg;
    $('#bodyheight').append('<div>Average body height: ' + avg + ' cm</div>')


    $('#bodyheight').append(
        '<div class="mb-3 mt-3 text-muted">Calculation after: <a href="' + citeUrl + '" target="_blank">' + citeName + '</a></div>' +
        '<div class="mb-2 p-2 border rounded" id="chartwrapper"><canvas id="bhChart">' +
        '</canvas><div class="text-center text-muted" id="avgLegend"><b class="me-2">- - - - - - - -</b> Average: ' + avg + ' cm.</div></div>' +
        '<div class="input-group input-group-sm mt-2 mb-2">\n' +
        '  <span class="input-group-text" for="inputGroupSelect01">Method</span>\n' +
        '  <select class="form-select form-select-sm" id="inputGroupSelect01">\n' +
        '  </select>\n' +
        '</div>' +
        '<div id="accordion">\n' +
        '  <div class="card">\n' +
        '    <div class="card-header p-0" id="boneData">\n' +
        '      <span class="mb-0">\n' +
        '        <a class="btn btn-sm btn-link" data-bs-toggle="collapse" data-bs-target="#bonetable" aria-expanded="true" aria-controls="bonetable">\n' +
        '          Data' +
        '        </a>\n' +
        '      </span>\n' +
        '    </div>' +
        '<ul id="bonetable" class="collapse show text-muted list-group list-group-flush">\n' +
        '</ul>' +
        '</div>'
    )

    $.each(bonesToUse, function (i, bone) {
        $('#bonetable').append('<li class="list-group-item">' + bone.name + ': ' + bone.length + ' cm. <i class="me-2 fas fa-arrow-right"></i>calculated: ' + bone.value + ' cm. </li>')
        bhLabels.push('Estimated after: ' + bone.name);
        bhData.push(bone.value.toFixed(1));
        bhAvg.push(avg);
    })


    var ctx = document.getElementById('bhChart').getContext('2d');

    var avgLabel = 'Average: ' + avg + ' cm.'

    var config = {
        // The type of chart we want to create
        type: 'bar',

        // The data for our dataset
        data: {
            labels: JSON.parse(JSON.stringify(bhLabels)),
            datasets: [

                {
                    type: 'bar',
                    label: 'cm',
                    backgroundColor: 'rgb(99,133,255)',
                    borderColor: 'rgb(99,125,255)',
                    data: JSON.parse(JSON.stringify(bhData))
                }
            ]
        },

        // Configuration options go here
        options: {
            legend: {
                display: false,
            },
            scales: {
                xAxes: [{
                    ticks: {
                        display: false //this will remove only the label
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            annotation: {
                annotations: [{
                    type: 'line',
                    mode: 'horizontal',
                    scaleID: 'y-axis-0',
                    value: avg,
                    borderColor: 'rgb(90,90,90)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    label: {
                        enabled: false,
                        //content: avgLabel,

                    }
                }]
            }

        }
    };

    var chart = new Chart(ctx, config)

    usedMethod = method;


    $.each(bodyheight().methods, function (i, method) {

        if (method.method === usedMethod) {
            $('#inputGroupSelect01').append(
                '<option selected value="' + method.method + '">' + method.name + '</option>'
            )
        } else {
            $('#inputGroupSelect01').append(
                '<option value="' + method.method + '">' + method.name + '</option>'
            )
        }
    })

    $('#inputGroupSelect01').change(function () {
        var data = $(this).val();
        bodyheightmodal(data)
    });

}

function PearsonSelect(bone, sex) {
    if (sex === 'male') {
        var returnBone = JSON.parse(JSON.stringify({
            'id': bone.id,
            'siding': bone.siding,
            'name': bone.name,
            'value': parseFloat(bone.valuem),
            'length': parseFloat(bone.length)
        }))
    }

    if (sex === 'female') {
        var returnBone = JSON.parse(JSON.stringify({
            'id': bone.id,
            'siding': bone.siding,
            'name': bone.name,
            'value': parseFloat(bone.valuef),
            'length': parseFloat(bone.length)
        }))
    }
    return returnBone
}

//chart preparation

function getMinMax(array) {
    range = [Math.min.apply(Math, array), Math.max.apply(Math, array)];
    return range
}


//remove trailing zeros from data with intervals after highest values of site with highest values
function removeZeros(data) {
    Zeros = [];
    $.each(data.datasets, function (i, dataset) {
        $.each(dataset.data, function (i, number) {
            if (number > 0) Zeros.push(i);
        })
    })
    data.labels = data.labels.slice(getMinMax(Zeros)[0], getMinMax(Zeros)[1] + 1)

    $.each(data.datasets, function (i, dataset) {
        $.each(dataset.data, function (i, number) {
            newdata = (dataset.data.slice(getMinMax(Zeros)[0], (getMinMax(Zeros)[1] + 1)));
        })
        dataset.data = newdata
    })
    return data;

}

function removeDashboardZeros(data) {
    Zeros = [];
    $.each(data.datasets, function (i, number) {
        if (number > 0) Zeros.push(i);
    })

    var newdata = (data.datasets.slice(getMinMax(Zeros)[0], (getMinMax(Zeros)[1] + 1)));
    data.datasets = newdata;

    data.labels = data.labels.slice(getMinMax(Zeros)[0], (getMinMax(Zeros)[1] + 1))
    return data;
}

function removeStackedZeros(data) {
    Zeros = [];
    $.each(data.datasets, function (i, dataset) {
        $.each(dataset.data, function (i, number) {
            if (number > 0) Zeros.push(i);
        })

    })
    data.labels = data.labels.slice(getMinMax(Zeros)[0], (getMinMax(Zeros)[1] + 1))
    $.each(data.datasets, function (i, dataset) {
        dataset.data = dataset.data.slice(getMinMax(Zeros)[0], (getMinMax(Zeros)[1] + 1))
    })

    return data;
    //console.log(data)
}

//switch axes of data
function switchaxes(datatoswitch) {
    newdata = {
        "datasets": [],
        "labels": []
    };

    $.each(datatoswitch.datasets, function (i, dataset) {
        newdata.labels.push(dataset.label);

    });

    $.each(datatoswitch.labels, function (i, label) {
        data1 = {};
        data1.label = datatoswitch.labels[i];
        data1.data = [];
        index = i;
        $.each(datatoswitch.datasets, function (i, dataset) {
            data2 = dataset.data;
            $.each(data2, function (i, value) {
                if (index === i) {
                    data1.data.push(value);
                }
            })
        })
        newdata.datasets.push(data1);
    });
    return newdata;
}

//convert values of data to percentage
function getPercentage(datatoswitch) {
    $.each(datatoswitch.datasets, function (i, dataset) {
        sum = dataset.data.reduce(
            function (total, num) {
                return total + num
            }
            , 0);
        newArray = [];
        $.each(dataset.data, function (i, value) {
            var perValue = parseFloat(Math.round((value / sum * 100) * 100) / 100);
            newArray.push(perValue)
        });
        dataset.data = newArray;
    })
    return datatoswitch;
}

//prepare typedata as chartdata
function prepareTypedata(mytypedata) {
    typelabels = [];
    $.each(mytypedata.types, function (i, types) {
        typelabels.push(types.type)
    });
    typelabels = Array.from(new Set(typelabels));
    typedata = {
        'labels': typelabels,
        'datasets': []
    };
    datalabels = [];
    $.each(mytypedata.types, function (i, types) {
        datalabels.push(types.site)
    });
    datalabels = Array.from(new Set(datalabels));
    $.each(datalabels, function (i, label) {
        var typedatasets = {
            "data": [],
            "label": label
        };
        typedata.datasets.push(typedatasets);
    });
    $.each(typedata.datasets, function (i, dataset) {
        $.each(typedata.labels, function (i, label) {
            dataset.data.push(0)
        });
    });
    $.each(mytypedata.types, function (i, type) {
        mysite = type.site;
        mysiteid = type.site_id;
        mytype = type.type;
        mycount = type.count;
        $.each(typedata.labels, function (i, label) {
            if (mytype === label) {
                myindex = i;
                $.each(typedata.datasets, function (i, dataset) {
                    if (dataset.label === mysite) {
                        $.each(dataset.data, function (e, data) {
                            if (e === myindex) {
                                dataset.data[myindex] = mycount;
                                dataset.site_id = mysiteid;
                            }
                        });
                    }
                });
            }
        })
    });
    return typedata;
}

function setChartData(originalData, axesswitch, percentageset, zeroslice, preparetypes) {
    dataToWorkWith = JSON.parse(JSON.stringify(originalData));
    if (preparetypes) dataToWorkWith = prepareTypedata(dataToWorkWith);
    dataToWorkWith = filtersites(dataToWorkWith);
    if (zeroslice) dataToWorkWith = removeZeros(dataToWorkWith);
    if (percentageset) dataToWorkWith = getPercentage(dataToWorkWith);
    if (axesswitch) dataToWorkWith = switchaxes(dataToWorkWith);
    return dataToWorkWith;
}

mobileMap = false
if ($(window).width() <=990) mobileMap = true

function removeHoverMarker() {
    if (typeof (hovermarker) !== 'undefined') hovermarker.removeFrom(map);
}
