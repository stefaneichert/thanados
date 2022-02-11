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

    if (typeof (table) != 'undefined') {

        table.on('draw', function () {
                popoverRedraw()
            }
        );
    }
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
                    '<a href="/entity/' + entity.id + '" target="_self">' + entity.context + '</a>');

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
                    '<a href="/entity/' + entity.id + '" target="_self">' + entity.context + '</a>');

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

        if ($(window).width() <= 1199) mobileMap = true

        map = L.map('map', {
            renderer: L.canvas(),
            zoom: 18,
            maxZoom: 18,
            layers: [landscape],
            zoomControl: false,
            gestureHandling: mobileMap
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
                    if (oData.file === null) $(nTd).html("<a id='" + oData.id + "' href='/entity/" + oData.id + "' title='" + oData.main_type + " ' target='_self'>" + oData.name + "</a>");
                    if (oData.file !== null) $(nTd).html("<a id='" + oData.id + "' href='/entity/" + oData.id + "' title='" + oData.main_type + " ' target='_self'>" + oData.name + "</a>" +
                        "<a class='btn-xs float-end' data-toggle='popover-hover' data-img='" + loc_image + oData.file + "'><i class='fas fa-image'></i></a>"); //create links in rows
                }
            },
            {
                data: 'type',
            },
            {
                data: 'context'
            },
            {
                data: 'openatlas_class_name'
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


function getCitation() {

    $('#mycitation').empty();
    $('#mycitation').html('<div style="border: 1px solid #dee2e6; border-radius: 5px; padding: 0.5em; color: #495057; font-size: 0.9em;" id="Textarea1">' + '"' + data.name + '" ' + mycitation1.replace("After:", "") + '</div>');
    var citemodal = new bootstrap.Modal(document.getElementById('citeModal'))
    citemodal.show();
}

function makeTimeBar(time) {

    var startTrue = false
    var endTrue = false
    var start = []
    var end = []
    var text1
    var text2

    $.each(time, function (key, value) {
        if (key.includes('begin')) {
            start.push(parseInt(value))
            startTrue = true
        }
        if (key.includes('end')) {
            end.push(parseInt(value))
            endTrue = true
        }

    })

    if (startTrue && endTrue) {
        var earlBeg = (Math.min.apply(Math, start))
        var lateBeg = (Math.max.apply(Math, start))
        var earlEnd = (Math.min.apply(Math, end))
        var lateEnd = (Math.max.apply(Math, end))
        var totaltime = lateEnd - earlBeg
        var startSpan = 0
        var endSpan = 0
        var begintext = ''
        var endtext = ''
        if (start.length > 1 && start[0] !== start[1]) {
            startSpan = Math.abs(start[0] - start[1]);
            text1 = 'Begin: between ' + earlBeg + ' and ' + lateBeg
            begintext = lateBeg
        } else text1 = 'Begin: ' + start[0]


        if (end.length > 1 && end[0] !== end[1]) {
            endSpan = Math.abs(end[0] - end[1]);
            text2 = 'End: between ' + earlEnd + ' and ' + lateEnd
            endtext = earlEnd
            console.log('hallo')
        } else text2 = 'End: ' + end[0];



        var scale = 0
        if (totaltime <= 50) scale = 10
        if (totaltime > 50 && totaltime <= 250) scale = 20
        if (totaltime > 250 && totaltime <= 500) scale = 50
        if (totaltime > 500 && totaltime <= 1000) scale = 100
        if (totaltime > 1000 && totaltime <= 2000) scale = 200
        if (totaltime > 2000 && totaltime <= 5000) scale = 500
        if (totaltime > 5000) scale = 1000

        var scalebegin = (Math.floor(earlBeg / scale) * scale)
        var scaleend = (Math.ceil(lateEnd / scale) * scale)

        if ((earlBeg - scalebegin) < scale / 2) scalebegin -= scale
        if ((lateEnd - scaleend) < scale / 2) scaleend += scale

        var scaletime = scaleend - scalebegin
        var minDur = earlEnd - lateBeg
        var scalegap = (scale / scaletime * 100)
        var scalegaps = scaletime / scale

        for (let i = 0; i < scalegaps; i++) {
            {
                var interval = scalebegin + (i * scale)
                console.log(i + ': ' + interval)
                $('#timeline_heading').append('<td class="text-muted" style="width: ' + scalegap + '%"><small>' + interval + '</small></td>')
            }
        }

        var firstgap = (earlBeg - scalebegin) / scaletime * 100
        var secondgap = startSpan / scaletime * 100
        var thirdgap = minDur / scaletime * 100
        var fourthgap = endSpan / scaletime * 100
        var fifthgap = (scaleend - lateEnd) / scaletime * 100

        var border1Width = 0
        var border2Width = 0
        earlBeg = earlBeg + '&nbsp;'
        if (begintext !== '') {
            begintext = '&nbsp;' + begintext;
            border1Width = 1
        }
        if (endtext !== '') {
            endtext += '&nbsp;';
            border2Width = 1
        }
        lateEnd = '&nbsp;' + lateEnd

        $('#timeline_bars').append('<td class="text-muted" style="width: ' + firstgap + '%; height: 2rem"></td>')
        $('#timeline_bars').append('<td class="text-muted" style="width: ' + secondgap + '%; height: 2rem; background: linear-gradient(to right, #ffffff 0%, #99bae3 100%)"></td>')
        $('#timeline_bars').append('<td class="text-muted" style="width: ' + thirdgap + '%; height: 2rem; background-color: #99bae3"></td>');
        $('#timeline_bars').append('<td class="text-muted" style="width: ' + fourthgap + '%; height: 2rem; background: linear-gradient(to left, #ffffff 0%, #99bae3 100%)"></td>')
        $('#timeline_bars').append('<td class="text-muted" style="width: ' + fifthgap + '%; height: 2rem"></td>')

        $('#timeline_spans').append('<td class="text-muted" style="width: ' + firstgap + '%; height: 2rem; text-align: right; vertical-align: bottom"><small>' + earlBeg + '</small></td>')
        $('#timeline_spans').append('<td class="text-muted" style="width: ' + secondgap + '%; height: 2rem; border-left: 1px solid #a09b9b; border-right: ' + border1Width + 'px solid #a09b9b"></td>')
        $('#timeline_spans').append('<td class="text-muted" style="width: ' + thirdgap / 2 + '%; height: 2rem; vertical-align: bottom"><small>' + begintext + '</small></td>');
        $('#timeline_spans').append('<td class="text-muted" style="width: ' + thirdgap / 2 + '%; height: 2rem; vertical-align: bottom; text-align: right"><small>' + endtext + '</small></td>');
        $('#timeline_spans').append('<td class="text-muted" style="width: ' + fourthgap + '%; height: 2rem; border-left: ' + border2Width + 'px solid #a09b9b; border-right: 1px solid #a09b9b"></td>')
        $('#timeline_spans').append('<td class="text-muted" style="width: ' + fifthgap + '%; height: 2rem; vertical-align: bottom"><small>' + lateEnd + '</small></td>')

        $('#time').append('<br><ul class="list-inline">\n' +
            '  <small class="float-start list-inline-item text-muted">' + text1 + '</small>\n' +
            '  <small class="float-end list-inline-item text-muted">' + text2 + '</small>\n')
    }
}

if (typeof (data.time) !== 'undefined') makeTimeBar(data.time)
