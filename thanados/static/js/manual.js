$(document).ready(function () {
    maximumHeight = ($(window).height() - $('#mynavbar').height());
    $('#mycontent').css('max-height', (maximumHeight) + 'px');
    $('.wrapper').css('height', (maximumHeight) + 'px');
});

$(window).resize(function () {
    maximumHeight = ($(window).height() - $('#mynavbar').height());
    $('#mycontent').css('max-height', (maximumHeight) + 'px');
    $('.wrapper').css('height', (maximumHeight) + 'px');
});
