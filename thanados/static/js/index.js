$(document).ready(function () {
    maximumHeight = (($(window).height() - $('#mynavbar').height()));
    $('#container1').css('max-height', (maximumHeight - 13) + 'px');

    $('#container1').scroll(function () {
        if ($(this).scrollTop() > 50) {
            $('#back-to-top').fadeIn();
        } else {
            $('#back-to-top').fadeOut();
        }
    });
    // scroll body to 0px on click
    $('#back-to-top').click(function () {
        //$('#back-to-top').tooltip('hide');
        $('#container1').animate({
            scrollTop: 0
        }, 200);
        return false;
    });

    //$('#back-to-top').tooltip('show');

});

$(window).resize(function () {
    maximumHeight = (($(window).height() - $('#mynavbar').height()));
    $('#container1').css('max-height', (maximumHeight - 13) + 'px');
});


//check if there is a map div and if yes, add map
if ($('#map').length) {

    getBasemaps();

    map = L.map('map', {
        maxZoom: 12,
        scrollWheelZoom: false
    });

    landscape.addTo(map);

    /*entitycounters = L.control({position: "bottomleft"});
    entitycounters.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'counterLegend')
        div.innerHTML =
            '<div id="entCount"><span class="entCounters">Cemeteries: ' + entitycount[0] + '</span><span class="entCounters">Graves: ' + entitycount[1] + '</span><span class="entCounters">Burials: ' + entitycount[2] + '</span><span class="entCounters">Finds: ' + entitycount[3] + '</span> </div>'
        return div
    }
    entitycounters.addTo(map);*/

    $('#counters').html(
        '<div class="col-sm">' +
        '<h4 class="statistic-counter">' + entitycount[0] + '</h4>' +
        '                                <p>Cemeteries</p>\n' +
        '                            </div>' +
        '<div class="col-sm">' +
        '<h4 class="statistic-counter">' + entitycount[1] + '</h4>' +
        '                                <p>Graves</p>\n' +
        '                            </div>' +
        '<div class="col-sm">' +
        '<h4 class="statistic-counter">' + entitycount[2] + '</h4>' +
        '                                <p>Burials</p>\n' +
        '                            </div>' +
        '<div class="col-sm">' +
        '<h4 class="statistic-counter">' + entitycount[3] + '</h4>' +
        '                                <p>Finds</p>\n' +
        '                            </div>'
    )

    $('.statistic-counter').each(function () {
        $(this).prop('Counter', 0).animate({
            Counter: $(this).text()
        }, {
            duration: 1000,
            //easing: 'swing',
            step: function (now) {
                $(this).text(Math.ceil(now));
            }
        });
    });

    heatmarkers = []
    mymarkers = new L.featureGroup([]).addTo(map);

    $.each(sitelist, function (e, dataset) {
        marker = L.circleMarker([((dataset.lon)), ((dataset.lat))], {
            radius: 7,
            weight: 0,
            fillOpacity: 0,
            fillColor: "#ff3636"
        }).bindPopup('<a href="/entity/' + dataset.id + '" title="' + dataset.description + '"><b>' + dataset.name + '</b></a><br><br>' + dataset.type);
        heatmarkers.push([dataset.lon, dataset.lat]);
        marker.addTo(mymarkers);
    })

    //heat = L.heatLayer(heatmarkers, {radius: 40, minOpacity: 0.2, blur: 40}).addTo(map);
    var bounds = mymarkers.getBounds();
    bounds._northEast.lat = bounds._northEast.lat + 0.1;
    bounds._northEast.lng = bounds._northEast.lng + 0.1;
    bounds._southWest.lat = bounds._southWest.lat - 0.1;
    bounds._southWest.lng = bounds._southWest.lng - 0.1;
    map.fitBounds(bounds);
    //map.setZoom((map.getZoom() - 1));
    attributionChange();


    if (sitelist.length > 15) {
    zoom = map.getZoom() / 10 - 0.3;
    if (zoom > 1) zoom = 1;
    if (zoom < 0.1) zoom = 0.1;
    map.on('zoomend', function () {
        zoom = map.getZoom() / 10 - 0.3;
        if (zoom > 1) zoom = 1;
        if (zoom < 0.1) zoom = 0.1;
        $.each($('.leaflet-interactive'), function (i, el) {
            $(el).animate({
                'fillOpacity': zoom
            }, 50);
        })
        console.log(zoom)
    });
    } else zoom = 0.7

    console.log(zoom)


    $.each($('.leaflet-interactive'), function (i, el) {
        var time = (1000 / sitelist.length);
        setTimeout(function () {
            $(el).animate({
                'fillOpacity': zoom
            }, 50);
        }, time + (i * time));

    });

} else {
    console.log('no map on index')
}

function markerwait() {
    setTimeout(function () {

    }, 250)
}

