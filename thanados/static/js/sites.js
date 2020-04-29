$(window).resize(function () {
    maximumHeight = ($(window).height() - $('#mynavbar').height());
    $('#mycontent').css('max-height', (maximumHeight - 10) + 'px');
    $('#map').css('height', (maximumHeight - 200) + 'px');
    map.invalidateSize();

});

$.each(sitelist, function (e, data) {
if (data.description !== null) data.description = ((data.description).replace(/'/g, ""));
});


AccRemove();

$(document).ready(function () {
    maximumHeight = ($(window).height() - $('#mynavbar').height())
    $('#mycontent').css('max-height', (maximumHeight - 10) + 'px');
    $('#map').css('height', (maximumHeight - 200) + 'px');
    getBasemaps();

    //$('#siteModal').modal('show');

//define basemaps
    map = L.map('map', {
        fullscreenControl: true,
        zoom: 18,
        maxZoom: 18,
        zoomControl: false,
        layers: [landscape]
    }).setView([51.505, -0.09], 13);

    //hack for right order of basemaps
    map.on('baselayerchange', function (e) {
        attributionChange()
    });
    attributionChange();

    //initiate markers
    heatmarkers = []
    mymarkers = new L.featureGroup([]);
    markergroup = new L.layerGroup();
    clustermarkers = L.markerClusterGroup();
    heat = L.heatLayer(heatmarkers, {radius: 25, minOpacity: 0.5, blur: 30});
    //var ciLayer = L.canvasIconLayer({}).addTo(map);
    //layergroup for highlighting on popup hover
    hoverMarkers = new L.LayerGroup();
    hoverMarkers.addTo(map);

    if ((sitelist).length > 100) {
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
        "pagingType": "numbers",
        "scrollX": true,
        columns: [
            {
                data: "name",
                "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                    $(nTd).html("<a id='" + oData.id + "' onmouseover='hoverMarker(this.id, " + 'map' + ")' class='hovermarker' data-type='" + oData.type + "' data-latlng='[" + ([((oData.lon)), ((oData.lat))]) + "]' href='/entity/" + oData.id + "' title='" + oData.description + "'>" + oData.name + "</a>" + "<a href='/map/" + oData.id + "' title='open map' class='btn-xs float-right'><i class=\"fas fa-map-marked-alt\"></i></a>"); //create links in rows
                }
            },
            {
                data: 'type',
                "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                    $(nTd).html("<div title='" + oData.path + "'>" + oData.type + "</div> ");
                    //create markers
                    if (oData.lon != null) {
                        heatmarkers.push([JSON.parse(oData.lon) + ',' + JSON.parse(oData.lat)]);
                        var marker = L.marker([((oData.lon)), ((oData.lat))], {title: oData.name}).addTo(mymarkers).bindPopup('<a href="/entity/' + oData.id + '" title="' + oData.description + '"><b>' + oData.name + '</b></a><br><br>' + oData.type);
                        //var marker = L.marker([((oData.lon)), ((oData.lat))], {icon: icon}, {title: oData.name}).bindPopup('<a href="/entity/' + oData.id + '" title="' + oData.description + '"><b>' + oData.name + '</b></a><br><br>' + oData.type);
                        //ciLayer.addMarker(marker);
                        var marker = L.marker([((oData.lon)), ((oData.lat))], {title: oData.name}).addTo(clustermarkers).bindPopup('<a href="/entity/' + oData.id + '" title="' + oData.description + '"><b>' + oData.name + '</b></a><br><br>' + oData.type);
                    }
                }
            },
            {data: 'begin'},
            {data: 'end'},
            {data: 'graves'}
        ],
    });

//add markers to map and zoom to content
    mymarkers.addTo(markergroup);
    heatmarkers = JSON.parse(JSON.stringify(heatmarkers).replace(/"/g, ''));
    var bounds = mymarkers.getBounds();
    bounds._northEast.lat = bounds._northEast.lat + 0.1;
    bounds._northEast.lng = bounds._northEast.lng + 0.1;
    bounds._southWest.lat = bounds._southWest.lat - 0.1;
    bounds._southWest.lng = bounds._southWest.lng - 0.1;
    map.fitBounds(bounds);
    heat.setLatLngs(heatmarkers);

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
            var age = parseFloat(data[2]) || 0; // use data for the age column

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
            var age = parseFloat(data[3]) || 0; // use data for the age column

            return (isNaN(min) && isNaN(max)) ||
                (isNaN(min) && age <= max) ||
                (min <= age && isNaN(max)) ||
                (min <= age && age <= max);

        }
    );


//update map on search
    table.on('search.dt', function () {
        markergroup.clearLayers();
        clustermarkers.clearLayers();
        heatmarkers = [];
        resultLenght = [];
        mymarkers = new L.featureGroup([]);
        table.rows({search: 'applied'}).every(function (rowIdx, tableLoop, rowLoop) {
            var data = this.data();
            resultLenght.push(data.id);
            heatmarkers.push([JSON.parse(data.lon) + ',' + JSON.parse(data.lat)]);
            var marker = L.marker([((data.lon)), ((data.lat))], {title: data.name}).addTo(mymarkers).bindPopup('<a href="/entity/' + data.id + '" title="' + data.description + '"><b>' + data.name + '</b></a><br><br>' + data.type);
            var marker = L.marker([((data.lon)), ((data.lat))], {title: data.name}).addTo(clustermarkers).bindPopup('<a href="/entity/' + data.id + '" title="' + data.description + '"><b>' + data.name + '</b></a><br><br>' + data.type);

        });
        mymarkers.addTo(markergroup);
        heatmarkers = JSON.parse(JSON.stringify(heatmarkers).replace(/"/g, ''));
        heat.setLatLngs(heatmarkers);
        if (resultLenght.length > 0) map.fitBounds(mymarkers.getBounds());
    });
    map.invalidateSize();
})
;
