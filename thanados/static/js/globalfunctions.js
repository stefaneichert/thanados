function setJson(data) {
    countGeom = 0
    $.each(data.features, function (i, feature) {
        if (typeof (feature.geometry) != 'undefined') {
            countGeom += 1;
        }
    })
    if (countGeom === 0) return false;
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

function iniateTree(Iter, appendLevel, criteria, targetField) {
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
    if (GlobalNodeSelected === '')
        alert('select property first');
    if (Globalcriteria === 'material' && GlobalNodeSelected !== '' || Globalcriteria === 'value' && GlobalNodeSelected !== '') {
        $('#SQL' + Iter).val($('#SQL' + Iter).val() + ' is "' + GlobalSelectedNodeName + '"');
        $("#Heading" + Iter).html($('#SQL' + Iter).val());
        $('#' + targetField).text(SelectedNodeName);
        $('#' + targetField).prop('disabled', true);
        setNodes(NodeSelected);
        $('#type' + Iter).val(nodeIds);
        $('#mytreeModal').dialog("close");
        //debug // console.log(Iter);
        appendMaterial(Iter);
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

    if (criteria === 'value') {
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

function openStyleDialog() {
    $("#styledialog").dialog({
        width: mymodalwith,
    });
    $("#styledialog").removeClass('d-none');
    setStyleValues();
}

function setStyleValues() {
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
        MyStyleOpacityVar = 10;
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
        mystylebordercolor = "#000000";
    }
    stylebordercolorInput = document.getElementById("stylecolorborder");
    stylebordercolor = stylebordercolorInput.value;
    stylebordercolorInput.addEventListener("input", function () {
        mystylebordercolor = stylebordercolorInput.value;
    }, false);

    if (typeof (mystyleborderwidth) == "undefined") mystyleborderwidth = 1;
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


function printMapbutton(id, position) {

    currentID = id;
    //eval('printPlugin_' + currentID + ' = L.easyPrint({position: "topleft", hidden: true, sizeModes: ["A4Landscape"], filename: "ThanadosMap"}).addTo(' + currentID + ');');
    //console.log('filePlugin_' + currentID + ' = L.easyPrint({position: "topleft", hidden: true, sizeModes: ["A4Landscape"], exportOnly: true, filename: "ThanadosMap"}).addTo(' + currentID + ');');
    //eval('filePlugin_' + currentID + ' = L.easyPrint({position: "topleft", hidden: true, sizeModes: ["A4Landscape"], exportOnly: true, filename: "ThanadosMap"}).addTo(' + currentID + ');');
    eval('L.easyPrint({position: "' + position + '", title: "Export map as image file", sizeModes: ["A4Landscape", "A4Portrait"], exportOnly: true, filename: "ThanadosMap"}).addTo(' + currentID + ');');
    //eval('printPlugin_' + currentID + '.printMap("A4Portrait", "MyFileName");');
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

function testbutton() {
    L.easyButton({
        id: 'OptionsButton',
        'data-toggle': 'dropdown',
        position: 'topleft',      // inherited from L.Control -- the corner it goes in
        states: [{                 // specify different icons and responses for your button
            stateName: 'get-center',
            onClick: function () {
                console.log('hallo')
            },
            title: 'test me',
            icon: 'fas fa-bars'
        }]
    }).addTo(map);
    $('.Easy').css({'background-image': ''});

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

    thunderforestlandscape = L.tileLayer('https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=b3c55fb5010a4038975fd0a0f4976e64', {
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
    miniBaseMap = new L.TileLayer('https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=b3c55fb5010a4038975fd0a0f4976e64',
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


