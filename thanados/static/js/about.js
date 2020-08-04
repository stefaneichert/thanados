maximumHeight = ($(window).height() - $('#mynavbar').height())
$('#mycontent').css('max-height', (maximumHeight - 10) + 'px');
$('#nav-about').addClass('activePage')

$(window).resize(function () {
    maximumHeight = ($(window).height() - $('#mynavbar').height());
    $('#mycontent').css('max-height', (maximumHeight - 10) + 'px');
});
