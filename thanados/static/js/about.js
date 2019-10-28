    maximumHeight = ($(window).height() - $('#mynavbar').height())
    $('#mycontent').css('max-height', (maximumHeight - 10) + 'px');

    $(window).resize(function () {
        maximumHeight = ($(window).height() - $('#mynavbar').height());
        $('#mycontent').css('max-height', (maximumHeight - 10) + 'px');
    });
