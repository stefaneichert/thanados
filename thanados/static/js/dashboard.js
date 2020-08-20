jsonmysite = repairJson(jsonmysite);

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
    getEntityData(sitename, jsonmysite.id, jsonmysite);
    mycitation = '"' + sitename + '".';
    myjson = jsonmysite;
    $('#mybreadcrumbs').append('<div class="ml-3 text-muted"> (Site) </div>');
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