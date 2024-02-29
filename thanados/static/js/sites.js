$('#nav-sites').addClass('activePage');


$(window).resize(function () {
    maximumHeight = ($(window).height() - $('#mynavbar').height())
    $('#mycontent').css('max-height', (maximumHeight - 10) + 'px');
    $('#map').css('height', (maximumHeight - 15) + 'px');
    map.invalidateSize();

});



AccRemove();

$(document).ready(function () {

    $.each(sitelist, function (e, data) {
    if (data.description !== null) data.description = ((data.description).replace(/'/g, ""));
    if (online_sites.includes(data.id)) {data.online = true} else {data.online = false};
});

    maximumHeight = ($(window).height() - $('#mynavbar').height())
    $('#mycontent').css('max-height', (maximumHeight - 16) + 'px');
    $('#mycontent').addClass("p-0")
    $('#map').css('height', (maximumHeight - 15) + 'px');
    getBasemaps();

//define basemaps
    map = L.map('map', {
        renderer: L.canvas(),
        fullscreenControl: false,
        zoom: 18,
        maxZoom: 18,
        zoomControl: false,
        layers: [landscape],
        gestureHandling: mobileMap
    }).setView([51.505, -0.09], 13);

    //hack for right order of basemaps
    map.on('baselayerchange', function (e) {
        attributionChange()
    });
    attributionChange();

    myCircleStyle = {
        "color": "#000000",
        "weight": 1,
        "fillOpacity": 0.8,
        "fillColor": "#007bd9",
        "radius": 10
    };

    myInvCircleStyle = {
        "color": "rgba(255,255,255,0)",
        "weight": 1,
        "fillOpacity": 0,
        "fillColor": "rgba(255,255,255,0)",
        "radius": 0
    };

    //initiate markers
    heatmarkers = []
    mymarkers = new L.featureGroup([]);
    myinvisiblemarkers = new L.featureGroup([]);
    markergroup = new L.layerGroup();
    InvMarkergroup = new L.layerGroup();
    clustermarkers = L.markerClusterGroup();
    heat = L.heatLayer(heatmarkers, {radius: 25, minOpacity: 0.5, blur: 30});
    //var ciLayer = L.canvasIconLayer({}).addTo(map);
    //layergroup for highlighting on popup hover
    hoverMarkers = new L.LayerGroup();
    hoverMarkers.addTo(map);
    InvMarkergroup.addTo(map);

    let locSites = 0
    for (const site of sitelist) {
        if (site.lon) locSites += 1
    }

    if (locSites > 1000) {
        clustermarkers.addTo(map)
    } else {
        markergroup.addTo(map)
    }

    var overlays = {
        "Sites": markergroup,
        "Cluster": clustermarkers,
        "Density": heat
    };

    /*icon = L.icon({
      iconUrl: '/static/images/icons/marker-icon.png',
      iconSize: [20, 18],
      iconAnchor: [10, 9]
    });*/

    //add layer control
    baseControl = L.control.layers(baseLayers, overlays).addTo(map);

    L.control.scale({imperial: false}).addTo(map);//scale on map

    var logo = L.control({position: 'bottomleft'});
    logo.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'easy-button-button-sitecount');
        div.innerHTML = "<span id='counter'></span>";
        return div;
    }
    logo.addTo(map);

    map.addControl(loadingControl);


    //get minimum and maximum begin and end of sites
    beginArray = [];
    $.each(sitelist, function (i, site, end) {
        beginArray.push(site.begin);
    });
    beginArray = [];
    endArray = [];
    $.each(sitelist, function (i, site) {
        beginArray.push(site.begin);
        endArray.push(site.end);
    });
    minbegin = Math.min(...beginArray);
    maxbegin = Math.max(...beginArray);

    minend = Math.min(...endArray);
    maxend = Math.max(...endArray);


//set datatable
    table = $('#sitelist').DataTable({
        data: sitelist,
        "scrollX": true,
        initComplete: function () {
            $('div.dataTables_filter input').focus();
        },
        drawCallback: function () {
            if (loginTrue) {
                $('.backendlink').removeClass('d-none')
            }
        },
        columns: [
            {
                data: "id",
                "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                    $(nTd).html(
                        oData.id
                    )
                }
            },
            {
                data: "name",
                "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                    if (oData.lon) {
                    $(nTd).html(
                        "<a id='" + oData.id + "' onmouseover='hoverMarker(this.id, " + 'map' + ")' class='hovermarker' data-type='" + oData.type + "' data-latlng='[" + ([((oData.lon)), ((oData.lat))]) + "]' href='/entity/" + oData.id + "' title='" + oData.description + "'>" + oData.name + "</a>" +
                        '<a title="Link to backend" class="backendlink d-none" href="' + openAtlasUrl + oData.id + '" target="_blank"><i class="float-end text-secondary fas fa-database"></i></a>' +
                        "<a href='/map/" + oData.id + "' title='open map' class='btn-xs float-end'><i class=\"fas fa-map-marked-alt\"></i></a>" +
                        ((oData.online) ? '<i class="backendlink d-none float-end me-1 text-secondary fas fa-check"></i>' : '') ); //create links in rows
                        } else {
                        $(nTd).html(
                        "<a id='" + oData.id + "' class='hovermarker' data-type='" + oData.type + "' href='/entity/" + oData.id + "' title='" + oData.description + "'>" + oData.name + "</a>" +
                        '<a title="Link to backend" class="backendlink d-none" href="' + openAtlasUrl + oData.id + '" target="_blank"><i class="float-end text-secondary fas fa-database"></i></a>' +
                        ((oData.online) ? '<i class="backendlink d-none float-end me-1 text-secondary fas fa-check"></i>' : '') ); //create links in rows
                    }
                }
            },
            {
                data: 'type',
                "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                    $(nTd).html("<div title='" + oData.path + "'>" + oData.type + "</div> ");
                    //create markers
                    if (oData.lon != null) {
                        heatmarkers.push([JSON.parse(oData.lon) + ',' + JSON.parse(oData.lat)]);
                        var marker = L.circleMarker([((oData.lon)), ((oData.lat))], myInvCircleStyle).addTo(myinvisiblemarkers);
                        var marker = L.circleMarker([((oData.lon)), ((oData.lat))], myCircleStyle).addTo(mymarkers).bindPopup('<a href="/entity/' + oData.id + '" title="' + oData.description + '"><b>' + oData.name + '</b></a><br><br>' + oData.type);
                        var marker = L.marker([((oData.lon)), ((oData.lat))], {title: oData.name}).addTo(clustermarkers).bindPopup('<a href="/entity/' + oData.id + '" title="' + oData.description + '"><b>' + oData.name + '</b></a><br><br>' + oData.type);
                    }
                }
            },
            {data: 'begin'},
            {data: 'end'},
            {data: 'graves'}
        ],
        "columnDefs": [
            {
                "targets": [0],
                "visible": false
            }
        ]
    });

//add markers to map and zoom to content
    mymarkers.addTo(markergroup);
    myinvisiblemarkers.addTo(InvMarkergroup);
    heatmarkers = JSON.parse(JSON.stringify(heatmarkers).replace(/"/g, ''));
    var bounds = mymarkers.getBounds();
    bounds._northEast.lat = bounds._northEast.lat + 0.2;
    bounds._northEast.lng = bounds._northEast.lng + 0.2;
    bounds._southWest.lat = bounds._southWest.lat - 0.2;
    bounds._southWest.lng = bounds._southWest.lng - 0.2;
    map.fitBounds(bounds);
    heat.setLatLngs(heatmarkers);
    countVisibleMarkers()

    map.on('zoomend', function () {
        countVisibleMarkers()
    });
    map.on('dragend', function () {
        countVisibleMarkers()
    });

    $(function () {
        $("#slider-range").slider({
            range: true,
            min: minbegin,
            max: maxbegin,
            values: [minbegin, maxbegin],
            slide: function (event, ui) {
                var table = $('#sitelist').DataTable();
                $("#amount").text("Begin between " + ui.values[0] + " and " + ui.values[1]);
                $("#min").val(ui.values[0]);
                $("#max").val(ui.values[1]);
                table.draw();
            }
        });
        $("#amount").text("Begin between " + $("#slider-range").slider("values", 0) +
            " and " + $("#slider-range").slider("values", 1));
    });

    $(function () {
        $("#slider-range2").slider({
            range: true,
            min: minend,
            max: maxend,
            values: [minend, maxend],
            slide: function (event, ui) {
                var table = $('#sitelist').DataTable();
                $("#amount2").text("End between " + ui.values[0] + " and " + ui.values[1]);
                $("#min1").val(ui.values[0]);
                $("#max1").val(ui.values[1]);
                table.draw();
            }
        });
        $("#amount2").text("End between " + $("#slider-range2").slider("values", 0) +
            " and " + $("#slider-range2").slider("values", 1));
    });

    /* Custom filtering function which will search data in column four between two values */
    $.fn.dataTable.ext.search.push(
        function (settings, data, dataIndex) {
            var min = parseInt($('#min').val(), 10);
            var max = parseInt($('#max').val(), 10);
            var age = parseFloat(data[3]) || 0; // use data for the age column

            return (isNaN(min) && isNaN(max)) ||
                (isNaN(min) && age <= max) ||
                (min <= age && isNaN(max)) ||
                (min <= age && age <= max);

        }
    );

    $.fn.dataTable.ext.search.push(
        function (settings, data, dataIndex) {
            var min = parseInt($('#min1').val(), 10);
            var max = parseInt($('#max1').val(), 10);
            var age = parseFloat(data[4]) || 0; // use data for the age column

            return (isNaN(min) && isNaN(max)) ||
                (isNaN(min) && age <= max) ||
                (min <= age && isNaN(max)) ||
                (min <= age && age <= max);

        }
    );


//update map on search
    table.on('search.dt', function () {
        markergroup.clearLayers();
        InvMarkergroup.clearLayers();
        clustermarkers.clearLayers();
        heatmarkers = [];
        resultLenght = [];
        mymarkers = new L.featureGroup([]);
        myinvisiblemarkers = new L.featureGroup([]);
        table.rows({search: 'applied'}).every(function (rowIdx, tableLoop, rowLoop) {
            var data = this.data();
            resultLenght.push(data.id);
            heatmarkers.push([JSON.parse(data.lon) + ',' + JSON.parse(data.lat)]);
            var marker = L.circleMarker([((data.lon)), ((data.lat))], myInvCircleStyle).addTo(myinvisiblemarkers);
            var marker = L.circleMarker([((data.lon)), ((data.lat))], myCircleStyle).addTo(mymarkers).bindPopup('<a href="/entity/' + data.id + '" title="' + data.description + '"><b>' + data.name + '</b></a><br><br>' + data.type);
            var marker = L.marker([((data.lon)), ((data.lat))], {title: data.name}).addTo(clustermarkers).bindPopup('<a href="/entity/' + data.id + '" title="' + data.description + '"><b>' + data.name + '</b></a><br><br>' + data.type);

        });
        mymarkers.addTo(markergroup);
        myinvisiblemarkers.addTo(InvMarkergroup);
        heatmarkers = JSON.parse(JSON.stringify(heatmarkers).replace(/"/g, ''));
        heat.setLatLngs(heatmarkers);
        if (resultLenght.length > 0) map.fitBounds(mymarkers.getBounds());
        countVisibleMarkers()
        removeHoverMarker();
    });
    map.invalidateSize();


    $('input[type="search"]').addClass('w-75')

    if(domain != 0) filterTable(domain)


})
;

fillDropdowns(domaintypes, '#case_studies')
fillDropdowns(periodtypes, '#periods')
fillDropdowns(countrytypes, '#regions')

function fillDropdowns(types, container) {
    $.each(types, function (i, domain) {
        getCaseData(domain, container)
    });
}

function filterTable(filterType) {
    var Newsitelist = []
    if (filterType === 0) {
        table.clear().rows.add(sitelist).draw();
    } else {
        $.getJSON("/vocabulary/" + filterType + "/json", function (data) {
            if (typeof (data.entities_recursive) !== 'undefined') {
                $.each(data.entities_recursive, function (i, ent) {
                    if (ent.main_type.includes('Place > Burial Site')) {
                        entID = ent.id
                        $.each(sitelist, function (i, siteEnt) {
                            if (entID === siteEnt.id) {
                                Newsitelist.push(siteEnt)
                            }
                        })
                    }
                })
            }
            table.clear().rows.add(Newsitelist).draw();
        });
    }
}

function countVisibleMarkers() {
    var bounds = map.getBounds();
    var count = 0;

    map.eachLayer(function (layer) {
        if (layer.options.fillColor === "rgba(255,255,255,0)") {
            if (bounds.contains(layer.getLatLng())) count++;
        }
    });
    $('#counter').html(' ' + count + ' sites')
    $('.easy-button-button-sitecount').prop('title', count + ' sites in current map bounds')
}
