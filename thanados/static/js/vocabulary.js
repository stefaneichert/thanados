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

    maximumHeight = (($(window).height() - $('#mynavbar').height()) - $('#mybreadcrumbs').height());
    $('#mycontent').css('max-height', (maximumHeight - 40) + 'px');

});

$(window).resize(function () {
    maximumHeight = (($(window).height() - $('#mynavbar').height()) - $('#mybreadcrumbs').height());
    $('#mycontent').css('max-height', (maximumHeight - 40) + 'px');
});


getBasemaps();

$.each(topparent.forms, function (e, form) {
    if (e < topparent.forms.length - 1) {
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

        baseLayers = {"Landscape": landscape, "Satellite": satellite, "Streets": streets}

        map = L.map('map', {
            zoom: 18,
            layers: [landscape]
        });
        entPoints.addTo(map)
        map.fitBounds(entPoints.getBounds())
        attributionChange()

        L.control.groupedLayers(baseLayers, groupedOverlays, options).addTo(map);
        map.on('baselayerchange', function (layer) {
            attrib = layer.layer.options.attribution
            MultAttributionChange(map, '#map', attrib)
        });
        $('#occurence').append(occCount)

    }

}


$('#tree').bstreeview({data: tree});
$('.toptreenode')


