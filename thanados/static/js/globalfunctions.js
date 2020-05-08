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

    $(document).on('show.bs.modal', '.modal', function (event) {
        var zIndex = 1040 + (10 * $('.modal:visible').length);
        $(this).css('z-index', zIndex);
        setTimeout(function () {
            $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
        }, 0);
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

//build jstree after criteria and level for search in Map and Global search

function initiateTree(Iter, appendLevel, criteria, targetField) {
    $('#mytreeModal').removeClass('d-none');
    UnsetGlobalVars(); //reset vars
    //define search criteria
    treecriteria = criteria;
    if (criteria === 'maintype') treecriteria = appendLevel;

    //build tree after selected criteria
    selectedtypes = [];
    $.each(jsontypes, function (j, entry) {
        if (entry.level === treecriteria) {
            selectedtypes.push(entry);
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

    if (val1 > val2 && val2 !== '') {
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
                var multibadge = '<span title="Multiple colors for sub categories of your search parameters are possible without overlaps" class="ml-1 badge float-right badge-success badge-pill"><i class="fas fa-check"></i></span>'
            } else {
                var multibadge = '<span title="Multiple colors for sub categories of your search parameters are possible but there are overlapping results. This results from multiple matches in one grave. For one grave only one category can be displayed. You can narrow the results by selecting more detailed categories in the search." class="ml-1 badge float-right badge-success badge-pill">Overlaps &nbsp;<i class="fas fa-info"></i></span>\n'
            }
        } else {
            $('#colorPoly').addClass('d-none');
            var multibadge = '<span title="There are no distinctive categories in this search. No multiple color display is possible." class="ml-1 badge float-right badge-secondary badge-pill"><i class="fas fa-exclamation-triangle"></i></span>';

        }

        if (layertypes.gradientcolor || layertypes.gradientcolorTimespan) {
            if (layertypes.gradientcolorNoOverlaps) {
                var gradibadge = '<span title="Gradient colors for values of your search parameters are possible without overlaps" class="ml-1 badge float-right badge-success badge-pill">Values &nbsp;<i class="fas fa-check"></i></span>\n'
            } else {
                var gradibadge = '<span title="Gradient colors for values of your search parameters are possible but there are overlapping results. This results from multiple matches in one grave. For one grave only one category can be displayed. You can narrow the results by selecting more detailed categories in the search." class="ml-1 badge float-right badge-success badge-pill">Values overlaps &nbsp;<i class="fas fa-info"></i></span>\n'
            }
        } else {
            var gradibadge = '<span title="There are no values to be displayed as gradient colors." class="ml-1 badge float-right badge-secondary badge-pill">Values &nbsp;<i class="fas fa-exclamation-triangle"></i></span>'
        }

        if (layertypes.gradientcount) {
            var gradicountbadge = '<span title="Gradient colors for the count of your search parameters for each grave are possible" class="ml-1 badge float-right badge-success badge-pill">Count &nbsp;<i class="fas fa-check"></i></span>\n'
        } else var gradicountbadge = '<span title="There are no varying counts to be displayed as gradient colors." class="ml-1 badge float-right badge-secondary badge-pill">Count &nbsp;<i class="fas fa-exclamation-triangle"></i></span>\n'

        if (layertypes.gradientcount === false && layertypes.gradientcolor === false && layertypes.gradientcolorTimespan === false) $('#choropoly').addClass('d-none')

        if (layertypes.charts) {
            var chartcountbadge = '<span title="Chart markers for the count of your search parameters for each grave are possible" class="ml-1 badge float-right badge-success badge-pill"><i class="fas fa-check"></i></span>\n'
        } else {
            $('#chart').addClass('d-none');
            var chartcountbadge = '<span title="There are no multiple counts of your search results per grave to be displayed as chart markers." class="ml-1 badge float-right badge-secondary badge-pill"><i class="fas fa-exclamation-triangle"></i></span>'
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
                '            <div class="input-group-prepend">\n' +
                '                <label class="input-group-text" for="stylecolor">Fill color: </label>\n' +
                '            </div>\n' +
                '            <input class="form-control" id="stylecolor" style="max-width: 70px" type="color"\n' +
                '                   value="' + myStyle.fillColor + '">\n' +
                '            <span class="input-group-text input-group-middle">Opacity (%): </span>\n' +
                '            <label for="mystyleopacity"></label><input class="form-control"\n' +
                '                                                       id="mystyleopacity" type="range"\n' +
                '                                                       value="' + (100 - (myStyle.fillOpacity * 100)) + '" min="0" max="100">\n' +
                '            <label for="mystyleopacityvalue"></label><input class="form-control"\n' +
                '                                                            id="mystyleopacityvalue"\n' +
                '                                                            type="number" value="10" min="0"\n' +
                '                                                            max="100"\n' +
                '                                                            style="max-width: 60px">\n' +
                '        </div>\n' +
                '        <div class="mystyleoptions input-group input-group-sm mb-3">\n' +
                '            <div class="input-group-prepend">\n' +
                '                <label class="input-group-text" for="stylebordercolor">Border\n' +
                '                    color: </label>\n' +
                '            </div>\n' +
                '            <label for="stylecolorborder"></label><input class="form-control"\n' +
                '                                                         id="stylecolorborder"\n' +
                '                                                         style="max-width: 70px"\n' +
                '                                                         type="color"\n' +
                '                                                         value="' + myStyle.color + '">\n' +
                '            <span class="input-group-text input-group-middle">Border width: </span>\n' +
                '            <label for="styleborderwidth"></label><input class="form-control"\n' +
                '                                                         id="styleborderwidth" type="number"\n' +
                '                                                         value="' + myStyle.color + '" min="0">\n' +
                '        </div>\n' +
                '        <button class="btn btn-sm btn-secondary btn-sm float-right" type="button"\n' +
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
                '<div class="input-group-prepend">' +
                '<label class="input-group-text" for="legendtitle">Legend title: </label>' +
                '</div>' +
                '<input class="form-control legendtext" id="legendtitle" type="text" value="' + currentLegend + '">' +
                '</div>' +
                '</div>' +
                '<div class="mysearchoptions input-group input-group-sm mb-3">' +
                '<div class="input-group-prepend">' +
                '<label class="input-group-text" for="Searchfillcolor">Fill color: </label>' +
                '</div>' +
                '<input class="form-control" id="Searchfillcolor" style="max-width: 70px" type="color" value="' + searchStyle.fillColor + '">' +
                '<span class="input-group-text input-group-middle">Opacity (%): </span>' +
                '<input class="form-control" id="Searchmysearchopacity" type="range" value="' + (100 - ((searchStyle.fillOpacity) * 100)) + '" min="0" max="100">' +
                '<input class="form-control" id="Searchmysearchopacityvalue" type="number" value="' + (100 - ((searchStyle.fillOpacity) * 100)) + '" min="0" max="100" style="max-width: 60px">' +
                '</div>' +
                '<div class="mysearchoptions input-group input-group-sm mb-3">' +
                '<div class="input-group-prepend">' +
                '<label class="input-group-text" for="searchbordercolor">Border color: </label>' +
                '</div>' +
                '<input class="form-control" id="Searchcolorborder" style="max-width: 70px" type="color" value="' + searchStyle.color + '">' +
                '<span class="input-group-text input-group-middle">Border width: </span>' +
                '<input class="form-control input-group-middle" id="Searchsearchborderwidth" type="number" value="' + searchStyle.weight + '" min="0">' +
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
                '<button class="btn btn-secondary btn-sm dropdown-toggle toremovebtn" type="button" id="dropdownMenuButtonDL" title="Download search result geodata" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                '<i class="far fa-save"></i>' +
                '</button>' +
                '<div class="dropdown-menu" aria-labelledby="dropdownMenuButtonDL">' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresult)" title="Download as GEOJson polygons" href="#">Polygons</a>' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresultPoints)" title="Download as GEOJson points" href="#">Points</a>' +
                '</div>' +
                '</div>' +
                '<button class="btn btn-secondary btn-sm toremovebtn" onclick="finishQuery(\'table\', finalSearchResultIds, CSVresult, false, currentLayerId)" type="button" id="SearchShowListButton" title="Show/Export result list" data-toggle="modal" data-target="#CSVmodal">' +
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
                '<div class="input-group-prepend">' +
                '<label class="input-group-text" for="colorrange">Color range</label>' +
                '</div>' +
                '<input class="form-control" id="colorstart" style="max-width: 70px" type="color" value="' + myChorocolor[0] + '">' +
                '<input class="form-control" id="colorend" style="max-width: 70px" type="color" value="' + myChorocolor[1] + '">' +
                '<span class="input-group-text input-group-middle">Steps: </span>' +
                '<input class="form-control" id="chorosteps" type="number" value="' + myChorosteps + '" min="2" max="100">' +
                '</div>' +
                '<div class="myoptions input-group input-group-sm mb-3">' +
                '<div class="input-group-prepend">' +
                '<label class="input-group-text" for="legendtitle">Legend title: </label>' +
                '</div>' +
                '<input class="form-control legendtext" id="legendtitle" type="text" value="' + myChorolegendtitle + '">' +
                '</div>' +
                '<div class="myoptions input-group input-group-sm mb-3">' +
                '<div class="input-group-prepend">' +
                '<label class="input-group-text" for="ChoroOpacity">Opacity (%): </label>' +
                '</div>' +
                '<input class="form-control" id="ChoroOpacity" type="range" value="' + myChoroopacity + '" min="0" max="100">' +
                '<input class="form-control" id="ChoroOpacityvalue" type="number" value="' + myChoroopacity + '" min="0" max="100" style="max-width: 60px">' +
                '</div>' +
                '<div class="myoptions input-group input-group-sm mb-3">' +
                '<div class="input-group-prepend">' +
                '<label class="input-group-text" for="bordercolor">Border color: </label>' +
                '</div>' +
                '<input class="form-control" id="ChoroColorborder" style="max-width: 70px" type="color" value="' + myChoroborder + '">' +
                '<span class="input-group-text input-group-middle">Border width: </span>' +
                '<input class="form-control" id="ChoroBorderwidth" type="number" value="' + myChoroborderwidth + '" min="0">' +
                '</div>' +

                '<div class="myoptions input-group input-group-sm mb-3">' +
                '<div class="input-group-prepend">' +
                '<label class="input-group-text" for="gradselect">Point:</label>' +
                '</div>' +
                '<select class="custom-select empty" id="gradselect">' +
                '<option value="0">single size</option>' +
                '<option value="1">gradient size</option>' +
                '</select>' +
                '<span id="radius" class="input-group-text input-group-middle">Radius: </span>' +
                '<input class="d-none pointBtn form-control" id="minRadius" type="number" value="' + mysearchpointminradius + '" min="1">' +
                '<input class="input-group-addon pointBtn form-control" id="Searchsearchpointradius" type="number" value="' + mysearchpointradius + '" min="1">' +

                '</div>' +
                '<div id="MethodSelect_parent" class="myoptions input-group input-group-sm mb-3">' +
                '<div class="input-group-prepend">' +
                '<label class="input-group-text" for="MethodSelect">Method: </label>' +
                '</div>' +
                '<select class="custom-select empty" id="MethodSelect">' +
                '<option value="e">equidistant</option>' +
                '<option value="q">quantile</option>' +
                '<option value="k">k-means</option>' +
                '</select>' +
                '<span class="input-group-text input-group-middle">Color value: </span>' +
                '<div class="input-group-append input-group-sm">\n' +
                '       <select class="custom-select input-group-addon empty"\n' +
                '                title="Select what value the color intensity is calculated from." \n' +
                '                id="ValueSelect">\n' +
                '            <option id="valueOption" class="d-none" title="The value associated with the search result. E.g. the depth of a grave" value="value">Value</option>\n' +
                '            <option id="countOption" title="The total count of search results per grave. E.g. the number of finds" value="count">Count</option>\n' +
                '            <option id="beginOption" class="d-none timeOption" title="Display the begin value in gradient colors" value="begin">Begin</option>\n' +
                '            <option id="middleOption" class="d-none timeOption" title="Display the average value between begin and end in gradient colors" value="middle">Middle</option>\n' +
                '            <option id="endOption" class="d-none timeOption" title="Display the end value in gradient colors" value="end">End</option>\n' +
                '        </select>' +
                '</div>' +
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
                '<button class="btn btn-secondary btn-sm dropdown-toggle toremovebtn" type="button" id="dropdownMenuButtonDL" title="Download search result geodata" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                '<i class="far fa-save"></i>' +
                '</button>' +
                '<div class="dropdown-menu" aria-labelledby="dropdownMenuButtonDL">' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresult)" title="Download as GEOJson polygons" href="#">Polygons</a>' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresultPoints)" title="Download as GEOJson points" href="#">Points</a>' +
                '</div>' +
                '</div>' +
                '<button class="btn btn-secondary btn-sm toremovebtn" onclick="finishQuery(\'table\', finalSearchResultIds, CSVresult, false, currentLayerId)" type="button" id="SearchShowListButton" title="Show/Export result list" data-toggle="modal" data-target="#CSVmodal">' +
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
                '<div class="input-group-prepend">' +
                '<label class="input-group-text" for="legendtitle">Legend title: </label>' +
                '</div>' +
                '<input class="form-control legendtext" id="legendtitle" type="text" value="' + currentLegend + '">' +
                '</div>' +
                '<div class="mysearchoptions input-group input-group-sm mb-3">' +
                '<div class="input-group-prepend">' +
                '<label class="input-group-text" for="searchbordercolor">Border color: </label>' +
                '</div>' +
                '<input class="form-control" id="Searchcolorborder" style="max-width: 70px" type="color" value="' + MultiColorSearchStyle.color + '">' +
                '<span class="input-group-text input-group-middle">Border width: </span>' +
                '<input class="form-control input-group-middle" id="Searchsearchborderwidth" type="number" value="' + MultiColorSearchStyle.weight + '" min="0">' +
                '<span title="Radius for point result" class="pointBtn input-group-text input-group-middle">Radius: </span>' +
                '<input title="Radius for point result" class="pointBtn form-control" id="Searchsearchpointradius" type="number" value="' + MultiColorSearchStyle.radius + '" min="1">' +
                '</div>' +
                '<div class="mysearchoptions input-group input-group-sm mb-3">' +
                '<div class="input-group-prepend">' +
                '<label class="input-group-text" for="Opacity">Opacity (%): </label>' +
                '</div>' +
                '<input class="form-control input-group-middle" id="Searchmysearchopacity" type="range" value="' + (100 - ((MultiColorSearchStyle.fillOpacity) * 100)) + '" min="0" max="100">' +
                '<input class="form-control" id="Searchmysearchopacityvalue" type="number" value="' + (100 - ((MultiColorSearchStyle.fillOpacity) * 100)) + '" min="0" max="100" style="max-width: 60px">' +
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
                '<button class="btn btn-secondary btn-sm dropdown-toggle toremovebtn" type="button" id="dropdownMenuButtonDL" title="Download search result geodata" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                '<i class="far fa-save"></i>' +
                '</button>' +
                '<div class="dropdown-menu" aria-labelledby="dropdownMenuButtonDL">' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresult)" title="Download as GEOJson polygons" href="#">Polygons</a>' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresultPoints)" title="Download as GEOJson points" href="#">Points</a>' +
                '</div>' +
                '</div>' +
                '<button class="btn btn-secondary btn-sm toremovebtn" onclick="finishQuery(\'table\', finalSearchResultIds, CSVresult, false, currentLayerId)" type="button" id="SearchShowListButton" title="Show/Export result list" data-toggle="modal" data-target="#CSVmodal">' +
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
                                "<input class='MultiColorPicker float-right' id='" + oData.SearchKey + "' style='cursor: pointer; border: none; min-width: 60px; padding: 0;' type='color' value='" + oData.FillColor + "'>");
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
                '<div class="input-group-prepend">' +
                '<label class="input-group-text" for="legendtitle">Legend title: </label>' +
                '</div>' +
                '<input class="form-control legendtext" id="legendtitle" type="text" value="' + currentLegend + '">' +
                '</div>' +
                '<div class="mysearchoptions input-group input-group-sm mb-3">' +
                '<div class="input-group-prepend">' +
                '<label class="input-group-text" for="Searchsearchbarwidth">Bar thickness: </label>' +
                '</div>' +
                '<input class="form-control input-group-middle" id="Searchsearchbarwidth" type="number" value="' + ChartStyle.barthickness + '" min="0">' +
                '<span title="Radius chart marker" class="pointBtn input-group-text input-group-middle">Radius: </span>' +
                '<input title="Radius chart marker" class="pointBtn form-control" id="Searchsearchpointradius" type="number" value="' + ChartStyle.radius + '" min="1">' +
                '</div>' +
                '<div class="mysearchoptions input-group input-group-sm mb-3">' +
                '<div class="input-group-prepend">' +
                '<label class="input-group-text" for="Opacity">Opacity (%): </label>' +
                '</div>' +
                '<input class="form-control input-group-middle" id="Searchmysearchopacity" type="range" value="' + (100 - ((ChartStyle.fillOpacity) * 100)) + '" min="0" max="100">' +
                '<input class="form-control" id="Searchmysearchopacityvalue" type="number" value="' + (100 - ((ChartStyle.fillOpacity) * 100)) + '" min="0" max="100" style="max-width: 60px">' +
                '<span class="input-group-text input-group-middle">Border width: </span>' +
                '<input class="form-control input-group-addon" id="Searchsearchborderwidth" type="number" value="' + ChartStyle.weight + '" min="0">' +
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
                '<button class="btn btn-secondary btn-sm dropdown-toggle toremovebtn" type="button" id="dropdownMenuButtonDL" title="Download search result geodata" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                '<i class="far fa-save"></i>' +
                '</button>' +
                '<div class="dropdown-menu" aria-labelledby="dropdownMenuButtonDL">' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresult)" title="Download as GEOJson polygons" href="#">Polygons</a>' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresultPoints)" title="Download as GEOJson points" href="#">Points</a>' +
                '</div>' +
                '</div>' +
                '<button class="btn btn-secondary btn-sm toremovebtn" onclick="finishQuery(\'table\', finalSearchResultIds, CSVresult, false, currentLayerId)" type="button" id="SearchShowListButton" title="Show/Export result list" data-toggle="modal" data-target="#CSVmodal">' +
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
                                "<input class='MultiColorPicker float-right' id='" + oData.SearchKey + "' style='cursor: pointer; border: none; min-width: 60px; padding: 0;' type='color' value='" + oData.FillColor + "'>");
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
                '      <h7 class="mb-0">\n' +
                '        <a href="#" class="btn infobtns btn-link" onclick="this.blur()" data-toggle="collapse" data-target="#collapseInfoOne" aria-expanded="true" aria-controls="collapseInfoOne">\n' +
                '        <i class="fas fa-chevron-down mr-2"></i>Info\n' +
                '        </a>\n' +
                '      </h7>\n' +
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
                '      <h7 class="mb-0">\n' +
                '        <a href="#" class="btn infobtns btn-link" onclick="this.blur()" data-toggle="collapse" data-target="#collapseInfoTwo" aria-expanded="false" aria-controls="collapseInfoTwo">\n' +
                '        <i class="fas fa-chevron-right mr-2"></i>Results\n' +
                '        </a>\n' +
                '      </h7>\n' +
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
                '      <h7 class="mb-0">\n' +
                '        <a href="#" class="btn infobtns btn-link" onclick="this.blur()" data-toggle="collapse" data-target="#collapseInfoThree" aria-expanded="false" aria-controls="collapseInfoThree">\n' +
                '           <i class="fas fa-chevron-right mr-2"></i>Display possibilites' +
                '        </a>\n' +
                '      </h7>\n' +
                '    </div>\n' +
                '    <div id="collapseInfoThree" class="collapse" aria-labelledby="headingThree">\n' +
                '      <div class="card-body" style="padding: 1.5em 0.7em 1.5em 0.7em;\n' +
                '    font-size: 0.9em;">\n' +
                '<ul class="list-group">\n' +
                '  <li style="padding: 0.6em; font-size: 0.9em;" class="list-group-item h7 align-items-center">\n' +
                '    Single color\n' +
                '    <span class="ml-1 badge float-right badge-success badge-pill"><i class="fas fa-check"></i></span>\n' +
                '  </li>\n' +
                '  <li style="padding: 0.6em; font-size: 0.9em;" class="list-group-item h7 align-items-center">\n' +
                '    <span> Multiple color </span>' + multibadge +
                '  </li>\n' +
                '  <li style="padding: 0.6em; font-size: 0.9em;" class="list-group-item h7 align-items-center">\n' +
                '    <span> Gradient color </span>' + gradibadge + gradicountbadge +
                '  </li>\n' +
                '  <li style="padding: 0.6em; font-size: 0.9em;" class="list-group-item h7 align-items-center">\n' +
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
                '<button class="btn btn-secondary btn-sm dropdown-toggle toremovebtn" type="button" id="dropdownMenuButtonDL" title="Download search result geodata" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                '<i class="far fa-save"></i>' +
                '</button>' +
                '<div class="dropdown-menu" aria-labelledby="dropdownMenuButtonDL">' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresult)" title="Download as GEOJson polygons" href="#">Polygons</a>' +
                '<a class="dropdown-item" onclick="finishQuery(null, finalSearchResultIds, CSVresult, false, currentLayerId); exportToJsonFile(jsonresultPoints)" title="Download as GEOJson points" href="#">Points</a>' +
                '</div>' +
                '</div>' +
                '<button class="btn btn-secondary btn-sm toremovebtn" onclick="finishQuery(\'table\', finalSearchResultIds, CSVresult, false, currentLayerId)" type="button" id="SearchShowListButton" title="Show/Export result list" data-toggle="modal" data-target="#CSVmodal">' +
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
    mywindowtitle = 'THANADOS: ';
    if (typeof (myjson) != "undefined") mywindowtitle = 'THANADOS: ' + myjson.name + '. ';
    if (typeof (jsonmysite) != "undefined") mywindowtitle = 'THANADOS: ' + jsonmysite.name + '. ';


    OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '<a href="#" style="display: inline-block" class="togglebtn" onclick="$( this ).next().toggle()">&copy; Info</a>' +
            '<div id="myattr" class="mapAttr" style="display: inline-block">: ' + mywindowtitle + '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors</div>'
    });

    Stamen_Terrain = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 14,
        ext: 'png'
    });

    Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution:
            '<a href="#" style="display: inline-block" class="togglebtn" onclick="$( this ).next().toggle()">&copy; Info</a>' +
            '<div id="myattr" class="mapAttr" style="display: inline-block">: ' + mywindowtitle + 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community</div>',
        maxZoom: 25,
    });

    thunderforestlandscape = L.tileLayer('https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=' + thunderforestAPIkey, {
        attribution:
            '<a href="#" style="display: inline-block" class="togglebtn" onclick="$( this ).next().toggle()">&copy; Info</a>' +
            '<div id="myattr" class="mapAttr" style="display: inline-block">: ' + mywindowtitle + 'Tiles: &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a></div>',
        maxZoom: 25
    });

//czech basemap
    basemap_cz = L.tileLayer.wms('http://geoportal.cuzk.cz/WMS_ZM10_PUB/WMService.aspx', {
        layers: 'GR_ZM10',
        maxZoom: 25
    })

    satellite = Esri_WorldImagery; //define aerial image layer
    landscape = thunderforestlandscape; // define topography layer
    streets = OpenStreetMap_Mapnik // define streets Layer

    baseLayers = {
        "Landscape": landscape,
        "Satellite": satellite,
        "Streets": streets
    };

    //define basemap for Minimap
    miniBaseMap = new L.TileLayer('https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=' + thunderforestAPIkey,
        {
            minZoom: 0,
            maxZoom: 20,
            attribution: 'Tiles: &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }
    );
}

function attributionChange() {
    //$(".leaflet-control-attribution").find(':first-child').remove();
    var val = $(".leaflet-control-attribution").html();
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


        legendOn = 'Legend <a onclick="legendToggle(\'' + mapId + '\')" class="legendToggle" data-map=' + mapId + ' title="Hide legend"><i id="' + mapId + '_toggleLeg" style="color: #eeeeee; cursor: pointer; font-size: 1.3em;" class="legendBtn ml-2 float-right far fa-check-square"></a>'
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
        '<i id="' + options.layername + '_toggleIcon" style="cursor: pointer; font-size: 1.3em;" class="ml-2 float-right far fa-check-square"></i></a></div>';

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

    console.log(numbers);
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
        thismap.panTo(latlng);
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

mycitation1 = ' From: Stefan Eichert et al., THANADOS: <a href="' + window.location + '">' + window.location + '</a> [Accessed: ' + today() + ']<br>' +
    'Licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a><br> After: ';