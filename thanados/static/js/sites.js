$(window).resize(function () {
    maximumHeight = ($(window).height() - $('#mynavbar').height());
    $('#mycontent').css('max-height', (maximumHeight - 10) + 'px');
    $('#map').css('height', (maximumHeight - 200) + 'px');

});

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


$(document).ready(function () {
    maximumHeight = ($(window).height() - $('#mynavbar').height())
    $('#mycontent').css('max-height', (maximumHeight - 10) + 'px');
    $('#map').css('height', (maximumHeight - 200) + 'px');

    mywindowtitle = 'THANADOS ';

//define basemaps
    var landscape = L.tileLayer('https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=2245afa655044c5c8f5ef8c129c29cdb', {
        attribution: mywindowtitle + 'Tiles: &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        apikey: '<2245afa655044c5c8f5ef8c129c29cdb>',
        maxZoom: 18
    });
    var satellite = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: mywindowtitle + 'Tiles: &copy; Google Maps ',
        maxZoom: 18
    });

    map = L.map('map', {
        fullscreenControl: true,
        zoom: 18,
        zoomControl: false,
        layers: [satellite, landscape]
    }).setView([51.505, -0.09], 13);

    baseLayers = {
        "Landscape": landscape,
        "Satellite": satellite,
    };

    //initiate markers
    heatmarkers = []
    mymarkers = new L.featureGroup([]);
    markergroup = new L.layerGroup();
    clustermarkers = L.markerClusterGroup().addTo(map);
    heat = L.heatLayer(heatmarkers, {radius: 25, minOpacity: 0.5, blur: 30});


    var overlays = {
        "Sites": markergroup,
        "Cluster": clustermarkers,
        "Density": heat
    };

    //add layer control
    baseControl = L.control.layers(baseLayers, overlays).addTo(map);

//hack for right order of basemaps
    map.removeLayer(satellite);

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
    columns: [
        {
            data: "name",
            "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                $(nTd).html("<a href='/entity/view/" + oData.id + "' title='" + oData.description + "'>" + oData.name + "</a> "); //create links in rows
            }
        },
        {
            data: 'type',
            "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                $(nTd).html("<div title='" + oData.path + "'>" + oData.type + "</div> ");
                //create markers
                if (oData.lon != null) {
                    heatmarkers.push([JSON.parse(oData.lon) + ',' + JSON.parse(oData.lat)]);
                    var marker = L.marker([((oData.lon)), ((oData.lat))], {title: oData.name }).addTo(mymarkers).bindPopup('<a href="/entity/view/' + oData.id + '" title="' + oData.description + '"><b>' + oData.name + '</b></a><br><br>' + oData.type);
                    var marker = L.marker([((oData.lon)), ((oData.lat))], {title: oData.name }).addTo(clustermarkers).bindPopup('<a href="/entity/view/' + oData.id + '" title="' + oData.description + '"><b>' + oData.name + '</b></a><br><br>' + oData.type);
                }
            }
        },
        {data: 'begin'},
        {data: 'end'}
    ],
});
//add markers to map and zoom to content
mymarkers.addTo(markergroup);
heatmarkers = JSON.parse(JSON.stringify(heatmarkers).replace(/"/g, ''));
map.fitBounds(mymarkers.getBounds());
heat.setLatLngs(heatmarkers);

$(function () {
    $("#slider-range").slider({
        range: true,
        min: minbegin,
        max: maxbegin,
        values: [minbegin, maxbegin],
        slide: function (event, ui) {
            var table = $('#sitelist').DataTable();
            $("#amount").val(ui.values[0] + " and " + ui.values[1]);
            $("#min").val(ui.values[0]);
            $("#max").val(ui.values[1]);
            table.draw();
        }
    });
    $("#amount").val($("#slider-range").slider("values", 0) +
        " and " + $("#slider-range").slider("values", 1));
});

$("#min").onchange = function () {console.log("hallo welt")}

$(function () {
    $("#slider-range2").slider({
        range: true,
        min: minend,
        max: maxend,
        values: [minend, maxend],
        slide: function (event, ui) {
            var table = $('#sitelist').DataTable();
            $("#amount2").val(ui.values[0] + " and " + ui.values[1]);
            $("#min1").val(ui.values[0]);
            $("#max1").val(ui.values[1]);
            table.draw();
        }
    });
    $("#amount2").val($("#slider-range2").slider("values", 0) +
        " and " + $("#slider-range2").slider("values", 1));
});

/* Custom filtering function which will search data in column four between two values */
$.fn.dataTable.ext.search.push(
    function (settings, data, dataIndex) {
        var min = parseInt($('#min').val(), 10);
        var max = parseInt($('#max').val(), 10);
        var age = parseFloat(data[2]) || 0; // use data for the age column

        if ((isNaN(min) && isNaN(max)) ||
            (isNaN(min) && age <= max) ||
            (min <= age && isNaN(max)) ||
            (min <= age && age <= max)) {
            return true;
        }
        return false;
    }
);

$.fn.dataTable.ext.search.push(
    function (settings, data, dataIndex) {
        var min = parseInt($('#min1').val(), 10);
        var max = parseInt($('#max1').val(), 10);
        var age = parseFloat(data[3]) || 0; // use data for the age column

        if ((isNaN(min) && isNaN(max)) ||
            (isNaN(min) && age <= max) ||
            (min <= age && isNaN(max)) ||
            (min <= age && age <= max)) {
            return true;
        }
        return false;
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
        var marker = L.marker([((data.lon)), ((data.lat))], {title: data.name }).addTo(mymarkers).bindPopup('<a href="/entity/view/' + data.id + '" title="' + data.description + '"><b>' + data.name + '</b></a><br><br>' + data.type);
        var marker = L.marker([((data.lon)), ((data.lat))], {title: data.name }).addTo(clustermarkers).bindPopup('<a href="/entity/view/' + data.id + '" title="' + data.description + '"><b>' + data.name + '</b></a><br><br>' + data.type);

    });
    mymarkers.addTo(markergroup);
    heatmarkers = JSON.parse(JSON.stringify(heatmarkers).replace(/"/g, ''));
    heat.setLatLngs(heatmarkers);
    if (resultLenght.length > 0) map.fitBounds(mymarkers.getBounds());

});
})
;
