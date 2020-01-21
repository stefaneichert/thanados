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

function openInNewTab(url) {
    var win = window.open(url, '_self'); //change to _blank for new tabs.
    win.focus();
}


function attributionChange() {
    $(".leaflet-control-attribution").find(':first-child').remove();
    var val = $(".leaflet-control-attribution").html();
    $(".leaflet-control-attribution").html(val.substring(2, val.length));
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