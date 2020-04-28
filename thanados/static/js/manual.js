$(document).ready(function () {
    maximumHeight = ($(window).height() - $('#mynavbar').height());
    $('#mycontent').css('max-height', (maximumHeight) + 'px');
    $('.wrapper').css('height', (maximumHeight) + 'px');
    $('#sidebarCollapse').on('click', function () {
                $('#sidebar').toggleClass('active');
            });
});

$(window).resize(function () {
    maximumHeight = ($(window).height() - $('#mynavbar').height());
    $('#mycontent').css('max-height', (maximumHeight) + 'px');
    $('.wrapper').css('height', (maximumHeight) + 'px');
});
