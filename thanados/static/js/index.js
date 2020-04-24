maximumHeight = (($(window).height() - $('#mynavbar').height()));
$('#container1').css('max-height', (maximumHeight - 13) + 'px');

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
    gravescount = 0

    $.each(sitelist, function (e, dataset) {
        var marker = L.circleMarker([((dataset.lon)), ((dataset.lat))], {
            radius: 7,
            weight: 0,
            fillOpacity: 0.8,
            fillColor: "#ff3636"
        }).addTo(mymarkers).bindPopup('<a href="/entity/' + dataset.id + '" title="' + dataset.description + '"><b>' + dataset.name + '</b></a><br><br>' + dataset.type);
        heatmarkers.push([dataset.lon, dataset.lat]);
        gravescount += parseInt(dataset.graves);
    })

    //heat = L.heatLayer(heatmarkers, {radius: 40, minOpacity: 0.2, blur: 40}).addTo(map);
    var bounds = mymarkers.getBounds();
    bounds._northEast.lat = bounds._northEast.lat + 0.1;
    bounds._northEast.lng = bounds._northEast.lng + 0.1;
    bounds._southWest.lat = bounds._southWest.lat - 0.1;
    bounds._southWest.lng = bounds._southWest.lng - 0.4;
    map.fitBounds(bounds);
    //map.setZoom((map.getZoom() - 1));
    attributionChange();
} else {
    console.log('no map on index')
}

