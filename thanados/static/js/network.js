jsonmysite = repairJson(jsonmysite);
sitename = jsonmysite.name;
entId = entity_id;
entName = myentity.name
entDesc = myentity.description

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

    maximumHeight = (($(window).height() - $('#mynavbar').height()) - $('#mybreadcrumb').height());
    $('#mycontent').css('max-height', (maximumHeight - 17) + 'px');

    $(window).resize(function () {
        maximumHeight = (($(window).height() - $('#mynavbar').height()) - $('#mybreadcrumb').height());
        $('#mycontent').css('max-height', (maximumHeight - 17) + 'px');
    });


});

$('#mybreadcrumb').append(
    '<nav aria-label="breadcrumb">' +
    '<ol id="mybreadcrumbs" class="breadcrumb">' +
    '<li class="breadcrumb-item"><a href="/entity/' + jsonmysite.site_id + '">' + sitename + '</a></li>' +
    '</ol>' +
    '</nav>');

subLabel = 'Subunits'

if (systemtype == 'place') {
    subLabel = 'Graves';
    //getEntityData(sitename, jsonmysite.id, jsonmysite);
    mycitation = '"' + sitename + '".';
    myjson = jsonmysite;
    $('#mybreadcrumbs').append('<div class="ml-3 text-muted"> (Site) </div>');
}

if (systemtype == 'feature') {
    subLabel = 'Burials';
    $.each(jsonmysite.features, function (f, feature) {
        if (entity_id == feature.id) {
            graveName = feature.properties.name;
            graveId = feature.id;
            graveGeom = feature.geometry;
            $('#mybreadcrumbs').append('<li class="breadcrumb-item"><a href="/entity/' + entId + '">' + entName + '</a></li>');
            mycitation = '"' + sitename + ': ' + entName + '".';
            myjson = {
                "type": "FeatureCollection", //prepare geojson
                "features": [feature],
                "properties": jsonmysite.properties,
                "site_id": jsonmysite.site_id,
                "name": jsonmysite.name
            };
        }

    });
    $('#mybreadcrumbs').append('<div class="ml-3 text-muted"> (Feature/Grave) </div>');
}

if (systemtype == 'stratigraphic_unit') {
    subLabel = 'Finds';
    $.each(jsonmysite.features, function (f, feature) {
        var featureName = feature.properties.name;
        var featureID = feature.id;
        var featureGeom = feature.geometry;
        $.each(feature.burials, function (b, burial) {
            if (entity_id == burial.id) {
                graveName = featureName;
                graveId = featureID;
                graveGeom = featureGeom;
                $('#mybreadcrumbs').append(
                    '<li class="breadcrumb-item"><a href="/entity/' + graveId + '">' + graveName + '</a></li>' +
                    '<li class="breadcrumb-item"><a href="/entity/' + entId + '">' + entName + '</a></li>'
                );
                mycitation = '"' + sitename + ': ' + graveName + ': ' + entName + '".';
                myjson = {
                    "type": "FeatureCollection", //prepare geojson
                    "features": [feature],
                    "properties": jsonmysite.properties,
                    "site_id": jsonmysite.site_id,
                    "name": jsonmysite.name
                };

            }

        });
    });
    $('#mybreadcrumbs').append('<div class="ml-3 text-muted"> (Burial/Stratigraphic Unit) </div>');
}


if (systemtype === 'find' || systemtype === 'human_remains') {
    $.each(jsonmysite.features, function (f, feature) {
        var featureName = feature.properties.name;
        var featureID = feature.id;
        var featureGeom = feature.geometry;

        $.each(feature.burials, function (b, burial) {

            if (systemtype === 'find') {
                currentobjects = burial.finds
            } else {
                currentobjects = burial.humanremains
            }

            var stratName = burial.properties.name;
            var stratID = burial.id;
            $.each(currentobjects, function (f, find) {
                if (entity_id == find.id) {
                    graveName = featureName;
                    graveId = featureID;
                    graveGeom = featureGeom;
                    burialName = stratName;
                    burialId = stratID;
                    $('#mybreadcrumbs').append(
                        '<li class="breadcrumb-item"><a href="/entity/' + graveId + '">' + graveName + '</a></li>' +
                        '<li class="breadcrumb-item"><a href="/entity/' + burialId + '">' + burialName + '</a></li>' +
                        '<li class="breadcrumb-item"><a href="/entity/' + entId + '">' + entName + '</a></li>'
                    );
                    mycitation = '"' + sitename + ': ' + graveName + ': ' + burialName + ': ' + entName + '".';
                    myjson = {
                        "type": "FeatureCollection", //prepare geojson
                        "features": [feature],
                        "properties": jsonmysite.properties,
                        "site_id": jsonmysite.site_id,
                        "name": jsonmysite.name
                    };
                }

            });
        });
    });
    if (systemtype === 'find') {
        $('#mybreadcrumbs').append('<div class="ml-3 text-muted"> (Find) </div>')
    } else {
        $('#mybreadcrumbs').append('<div class="ml-3 text-muted"> (Osteology) </div>');
    }
}


today = today();

if (typeof (mycitation2) == 'undefined') {
    mycitation2 = '';
    mycitation1 = mycitation1.substring(0, mycitation1.length - 8);
}

mysource = (mycitation + mycitation1 + mycitation2);
mysource = mysource.replace(/(\r\n|\n|\r)/gm, "");
$('#mycitation').append('<div style="border: 1px solid #dee2e6; border-radius: 5px; padding: 0.5em; color: #495057; font-size: 0.9em;" id="Textarea1">' + mysource + '</div>');

//add title to breadcrumb items
$('.breadcrumb-item').prop('title', 'Path of the entity. Click to navigate');

var container = document.getElementById("mynetwork");
var nodes = new vis.DataSet(mynetwork.nodes);
var edges = new vis.DataSet(mynetwork.edges);


var hierarchydata = {
    nodes: nodes,
    edges: edges,
};
var options = {
    nodes: {
        shape: "dot",
        size: 16,
    },
    physics: {
        forceAtlas2Based: {
            gravitationalConstant: -18,
            centralGravity: 0.005,
        },
        maxVelocity: 146,
        solver: "forceAtlas2Based",
        timestep: 0.35,
        stabilization: {iterations: 70},
    },
    layout: {
        improvedLayout: false
    }
};

network = new vis.Network(container, hierarchydata, options);

network.once("stabilizationIterationsDone", function () {
        setTimeout(function () {
            $('#loadingspinner').addClass('d-none')
        }, 200);
    });

networkLegend = network.groups.groups

network.on("doubleClick", function (params) {
    if (params.nodes.length === 1) {
        var node = nodes.get(params.nodes[0]);
        var entities = ['place', 'feature', 'stratigraphic_unit', 'find', 'human_remains'];
        if (entities.includes(node.group)) window.open('/entity/' + node.id);
        if (node.group === 'classification' ) window.open('/vocabulary/' + node.id);
        if (node.group === 'external_reference geonames' ) window.open('https://www.geonames.org/' + node.label);
        if (['bibliography', 'place_location', 'file'].includes(node.group)) window.open('/entity/' + entId);
    }
});

Object.keys(networkLegend).forEach(function(key) {
    var value = networkLegend[key];
    var data = {'name': key.replace('external_reference ', ''), 'color': value.color.border, 'background': value.color.background}
    $('#mylegend').append('<li class="list-group-item" style="padding: 0 0.7em"><div style="display: inline-flex; height: 20px; width: 20px; border: 2px solid ' + data.color + '; background: '+ data.background +'; '+
        '                              border-radius: 50%; margin-top: 0.5em;"></div><span class="text-muted" style="margin-left: 1em; vertical-align: super; font-size: 0.875rem;">' + data.name +'</span></li>')
});


