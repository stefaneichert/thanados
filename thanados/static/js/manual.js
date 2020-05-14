window.onload = function () {
    gifs = Gifffer();

}

$(document).ready(function () {
    $('#nav-manual').addClass('activePage')
    maximumHeight = ($(window).height() - $('#mynavbar').height());
    $('#mycontent').css('height', (maximumHeight - 15) + 'px');
    $('.wrapper').css('height', (maximumHeight) + 'px');
    $('#sidebarCollapse').on('click', function () {
        this.blur();
        $('#sidebar').toggle();
        collapsebutton();
    });

    if ($(window).width() <= 768) $('#sidebar').addClass('active');
    if ($(window).width() > 768) $('#sidebar').removeClass('active');
    collapsebutton();
});

$(window).resize(function () {
    maximumHeight = ($(window).height() - $('#mynavbar').height());
    $('#mycontent').css('height', (maximumHeight - 15) + 'px');
    $('.wrapper').css('height', (maximumHeight) + 'px');
    if ($(window).width() <= 768) $('#sidebar').addClass('active');
    if ($(window).width() > 768) $('#sidebar').removeClass('active');
    setTimeout(function () {
        collapsebutton()
    }, 400);
});

function collapsebutton() {
    if ($('#sidebar').is(":visible")) {
        var buttonpos = $('#sidebar').width();
        $('#toggleIcon').removeClass('fa-chevron-right');
        $('#toggleIcon').addClass('fa-chevron-left');
    } else {
        var buttonpos = 0;
        $('#toggleIcon').removeClass('fa-chevron-left');
        $('#toggleIcon').addClass('fa-chevron-right');
    }
    $('#sidebarCollapse').css({
        left: buttonpos
    });
}



