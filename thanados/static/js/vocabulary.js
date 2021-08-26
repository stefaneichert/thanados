$(document).ready(function () {
    $('#nav-vocabulary').addClass('activePage')
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

    maximumHeight = (($(window).height() - $('#mynavbar').height()) - $('#mybreadcrumbs').height());
    $('#mycontent').css('max-height', (maximumHeight - 40) + 'px');
    if (typeof (table) !== 'undefined') table.draw();

    function popoverRedraw() {
        $('[data-toggle="popover-hover"]').popover({
            html: true,
            trigger: 'hover',
            placement: 'right',
            content: function () {
                return '<img class="popover-img" src="' + $(this).data('img') + '" />';
            }
        });
    }

    popoverRedraw()

    table.on('draw', function () {
            popoverRedraw()
        }
    );
});

$(window).resize(function () {
    maximumHeight = (($(window).height() - $('#mynavbar').height()) - $('#mybreadcrumbs').height());
    $('#mycontent').css('max-height', (maximumHeight - 40) + 'px');
});


getBasemaps();

$.each(data.topparent.forms, function (e, form) {
    if (e < data.topparent.forms.length - 1) {
        $('#usage').append(form + ', ')
    } else {
        $('#usage').append(form)
    }
})

if (data.children) {
    $('#childrencount').html(data.children.length)
}

//create map content

recEnts = false;
ents = false;
coords = false;
entCount = 0;
entRecCount = 0;

if (data.entities_recursive) {
    var entPointsRec = L.markerClusterGroup({
        singleMarkerMode: true,
        maxClusterRadius: 0,
    });

    if (data.entities_recursive.length > 0) {

        $.each(data.entities_recursive, function (i, entity) {
            if (entity.lon) {
                coords = true;
                recEnts = true;
                entRecCount += 1;

                var marker = L.marker([entity.lon, entity.lat]).bindPopup(
                    '<a href="/entity/' + entity.id + '" target="_blank">' + entity.context + '</a>');

                entPointsRec.addLayer(marker);
            }
        })
    }

    if (data.entities) {
        entPoints = L.markerClusterGroup({
            singleMarkerMode: true,
            maxClusterRadius: 0,
        });

        $.each(data.entities, function (i, entity) {
            if (entity.lon) {
                ents = true;
                entCount += 1;

                var marker = L.marker([entity.lon, entity.lat]).bindPopup(
                    '<a href="/entity/' + entity.id + '" target="_blank">' + entity.context + '</a>');

                entPoints.addLayer(marker);
            }
        })
    }

    onlyRecEnts = false;
    onlyEnts = false;
    if (ents === false && recEnts) {
        entPoints = entPointsRec;
        onlyRecEnts = true;
    }

    if (data.entities) {
        if (data.entities.length === data.entities_recursive.length) {
            onlyRecEnts = false;
            onlyEnts = true;
        }
    }

    if (coords) {

        if (recEnts && ents) {
            var groupedOverlays = {
                "Entities": {
                    "Exact matches": entPoints,
                    "Incl. Subcategories": entPointsRec
                }
            };
            occCount = entCount + ' exact matches (' + entRecCount + ' including subcategories)'
        }
        if (onlyEnts) {
            var groupedOverlays = {
                "Entities": {
                    "Exact matches": entPoints
                }
            };
            occCount = entCount + ' exact matches (no subcategories)'
        }
        if (onlyRecEnts) {
            var groupedOverlays = {
                "Entities": {
                    "Incl. Subcategories": entPointsRec
                }
            };
            occCount = entCount + ' exact matches (' + entRecCount + ' including subcategories)'
        }


        var options = {
            groupCheckboxes: false,
            exclusiveGroups: ['Entities']
        };


        map = L.map('map', {
            renderer: L.canvas(),
            zoom: 18,
            maxZoom: 18,
            layers: [landscape],
            scrollWheelZoom: false
        });
        loadingControl.addTo(map);
        entPoints.addTo(map)
        map.fitBounds(entPoints.getBounds())
        attributionChange()

        L.control.groupedLayers(baseLayers, groupedOverlays, options).addTo(map);
        map.on('baselayerchange', function (layer) {
            attrib = layer.layer.options.attribution
            MultAttributionChange(map, '#map', attrib)
        });
        $('#occurence').append(occCount);
        map.on('overlayadd', function (e) {
            if (e.name === 'Incl. Subcategories') {
                map.fitBounds(entPointsRec.getBounds())
            } else {
                map.fitBounds(entPoints.getBounds())
            }
            ;
        });


    }

}

//populate datatables

if (data.entities_recursive) {
    table = $('#entities_tbl').DataTable({
        data: setData(),

        "pagingType": "numbers",
        "lengthMenu": [10],
        "bLengthChange": false,
        "scrollX": true,

        columns: [
            {
                data: "name",
                "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                    if (oData.file === null) $(nTd).html("<a id='" + oData.id + "' href='/entity/" + oData.id + "' title='" + oData.main_type + " ' target='_blank'>" + oData.name + "</a>");
                    if (oData.file !== null) $(nTd).html("<a id='" + oData.id + "' href='/entity/" + oData.id + "' title='" + oData.main_type + " ' target='_blank'>" + oData.name + "</a>" +
                        "<a class='btn-xs float-end' data-toggle='popover-hover' data-img='" + api_image + oData.file + "'><i class='fas fa-image'></i></a>"); //create links in rows
                }
            },
            {
                data: 'type',
            },
            {
                data: 'context'
            },
            {
                data: 'system_class'
            }
        ],
    });


    if (data.entities) {
        if (data.entities.length !== data.entities_recursive.length) {
            $('#entities').prepend('<h6><span id="exact">' + data.entities.length + ' exact matches </span><input id="entSwitch" type="checkbox"><label for="entSwitch"></label><span id="incl" class="text-muted">' + data.entities_recursive.length + ' including subcategories</span></h6>')
        } else {
            $('#entities').prepend('<h6 class="text-muted">' + $('#occurence').text() + '</h6>')
        }
    } else {
        $('#entities').prepend('<h6 class="text-muted">' + $('#occurence').text() + '</h6>')
    }
}

$(document).on('change', '#entSwitch', function () {
    if (this.checked) {
        $('#entities_tbl').dataTable().fnClearTable();
        $('#entities_tbl').dataTable().fnAddData(data.entities_recursive);
    } else {
        $('#entities_tbl').dataTable().fnClearTable();
        $('#entities_tbl').dataTable().fnAddData(data.entities);

    }
    $('#exact, #incl').toggleClass('text-muted');
});


$('#tree').bstreeview({data: data.tree});
$('.toptreenode')

function setData() {
    if (data.entities) {
        if (data.entities.length !== data.entities_recursive.length) {
            return data.entities
        } else {
            return data.entities_recursive
        }
    } else {
        return data.entities_recursive
    }
}

var container = document.getElementById("mynetwork");
var nodes = new vis.DataSet(data.hierarchy.nodes);
var edges = new vis.DataSet(data.hierarchy.edges);


var hierarchydata = {
    nodes: nodes,
    edges: edges,
};
var options = {
    layout: {
        hierarchical: {
            direction: "UD",
            sortMethod: "directed",
            shakeTowards: "roots"
        },
    },
    physics: {
        hierarchicalRepulsion: {
            avoidOverlap: 1,
        },
    },
    nodes: {
        shape: "box",
        shadow: true
    },
    edges: {
        shadow: true
    },
};

noNetwork = true;

$('#network').on('shown.bs.collapse', function () {

    if (noNetwork) {

        $('#loadingspinner').removeClass('d-none')

        $('#network-container')[0].scrollIntoView(
            {
                behavior: "smooth", // or "auto" or "instant"
                block: 'end'
            }
        );

        setTimeout(function () {
            createNetwork()
        }, 500);
    }

})


function createNetwork() {

    network = new vis.Network(container, hierarchydata, options);

    network.once("stabilizationIterationsDone", function () {
        setTimeout(function () {
            $('#loadingspinner').addClass('d-none')
        }, 200);
    });
    noNetwork = false;
}





