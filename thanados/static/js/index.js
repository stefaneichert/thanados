$(document).ready(function () {
    $('#feature-container').css('background-image', "url('/static/images/home/skulls.jpg'")
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
});

window.onload = function () {
    $.each(domaintypes, function (i, domain) {
        getProjectData(domain, '#featProj')
    })
    window.setTimeout(makeMasonrywork, 2000)
};

function makeMasonrywork() {
    $('#featProj').removeClass('d-none')
    $('#featProj').masonry({
        percentPosition: true,
    });
    $('.bg-img').css('background-image', "url('/static/images/home/skulls.jpg'")
    $('#proj-load').addClass('d-none')
}


$(window).resize(function () {
    maximumHeight = (($(window).height() - $('#mynavbar').height()));
    $('#container1').css('max-height', (maximumHeight - 13) + 'px');
});


//check if there is a map div and if yes, add map
if ($('#map').length) {

    getBasemaps();

    map = L.map('map', {
        //renderer: L.canvas(),
        maxZoom: 12,
        scrollWheelZoom: false,
        dragging: false,
        zoomControl: false,
        layers: [OpenStreetMap_HOT, Esri_WorldHillshade]
    });
    loadingControl.addTo(map);


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
        '                                <p>Individuals</p>\n' +
        '                            </div>' +
        '<div class="col-sm">' +
        '<h4 class="statistic-counter">' + entitycount[3] + '</h4>' +
        '                                <p>Finds</p>\n' +
        '                            </div>' +
        '<div class="col-sm">' +
        '<h4 class="statistic-counter">' + entitycount[4] + '</h4>' +
        '                                <p>Osteology Datasets</p>\n' +
        '                            </div>'
    )

    $('.statistic-counter').each(function (i) {
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

    mymarkers = new L.featureGroup([]).addTo(map);

    $.each(sitelist, function (e, dataset) {
        marker = L.circleMarker([((dataset.lon)), ((dataset.lat))], {
            radius: 7,
            weight: 0,
            fillOpacity: 0,
            fillColor: "#ff3636"
        });//.bindPopup('<a href="/entity/' + dataset.id + '" title="' + dataset.description + '"><b>' + dataset.name + '</b></a><br><br>' + dataset.type);
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
        });
    } else zoom = 0.7

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

function getProjectData(id, container) {
    $.getJSON("/vocabulary/" + id + "/json", function (data) {
        var sitecount = 0

        if (typeof (data.entities_recursive) !== 'undefined') {
            $.each(data.entities_recursive, function (i, ent) {
                if (ent.main_type.includes('Place > Burial Site')) {
                    sitecount += 1
                }
            })
        }

        if (sitecount > 0) {

            var ProjName = data.name
            if (typeof (data.description) !== 'undefined') {
                var ProjDescr = data.description
            } else {
                ProjDescr = ProjName
            }

            if (ProjDescr.includes('http')) {
                var projLink = 'http' + ProjDescr.slice(ProjDescr.lastIndexOf('http') + 4);
                ProjDescr = ProjDescr.replace(projLink, '')
                projLink = '<a title="Project website" target="_self" href="' + projLink + '">Project Website<i class="ms-2 fas fa-external-link-alt"></i></a>'
                var Linkthere = true

            }
            if (data.files) {
                var ProjLogo = data.files[0].file_name
                var Logothere = true
            }


            var outHtml =

                '<div class="col-lg-4 col-sm-6 mb-4">\n' +
                '                <div class="card" style="opacity: 0.85">\n' +
                '                        <h5 class="card-header text-center">' + ProjName + '</h5>\n' +
                ((Logothere) ? '         <figure class="figure mx-auto ps-2 pt-3 pe-2">\n' +
                    '                             <img src="' + ProjLogo + '" class="figure-img p-1 img-fluid " alt="Project Logo">\n' +
                    '</figure>' : '') +
                '                    <div class="card-body">\n' +
                '                        <p class="card-text"><small>' + ProjDescr + '</small></p>\n' +
                '                        <h6 class="card-subtitle mt-2 mb-2">' + sitecount + ' site(s)</h6>\n' +
                ((Linkthere) ? projLink : '') +
                '                    </div>\n' +
                '                </div>\n' +
                '</div>'

            $(container).append(outHtml)

        }
    });

}


$(function () {
    $('.scroll-link').bind('click', function (event) {
        event.preventDefault();
        var $anchor = $(this);
        var element = ($anchor.attr('href'))
        element = document.querySelector(element);
        element.scrollIntoView({behavior: 'smooth', block: 'start'});
    });
});

window.addEventListener('DOMContentLoaded', event => {


    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('.scroll-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

});
