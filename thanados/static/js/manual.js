    maximumHeight = ((($(window).height() - $('#mynavbar').height()) - $('#mysubmenu').height()));
    $('#mycontent').css('max-height', (maximumHeight - 27) + 'px');

    $(window).resize(function () {
        maximumHeight = ((($(window).height() - $('#mynavbar').height()) - $('#mysubmenu').height()));
        $('#mycontent').css('max-height', (maximumHeight - 27) + 'px');
    });
