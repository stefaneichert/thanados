maximumHeight = ($(window).height() - $('#mynavbar').height())
$('#mycontent').css('max-height', (maximumHeight - 10) + 'px');

$(window).resize(function () {
    maximumHeight = ($(window).height() - $('#mynavbar').height());
    $('#mycontent').css('max-height', (maximumHeight - 10) + 'px');
});

$(document).ready(function () {
    $('#infotext').toggle();
    $("#jsonPrepBtn").click(function () {
        // disable button
        $('.sql_button').prop("disabled", true);
        // add spinner to button
        $(this).html(
            `<span class="spinner-border spinner-border-sm mr-3" role="status" aria-hidden="true"></span>...in progress`
        );
        setAlert();
    });
    $("#GeoCleanBtn").click(function () {
        // disable button
        $('.sql_button').prop("disabled", true);
        // add spinner to button
        $(this).html(
            `<span class="spinner-border spinner-border-sm mr-3" role="status" aria-hidden="true"></span>...in progress`
        );
        setAlert();
    });
    $("#TimeCleanBtn").click(function () {
        // disable button
        $('.sql_button').prop("disabled", true);
        // add spinner to button
        $(this).html(
            `<span class="spinner-border spinner-border-sm mr-3" role="status" aria-hidden="true"></span>...in progress`
        );
        setAlert();
    });
    $("#FileRefBtn").click(function () {
        // disable button
        $('.sql_button').prop("disabled", true);
        // add spinner to button
        $(this).html(
            `<span class="spinner-border spinner-border-sm mr-3" role="status" aria-hidden="true"></span>...in progress`
        );
        setAlert();
    });
});

function setAlert() {
    $('.sql_button').addClass('disabled');
    $('#infotext').toggle();
    $('#infotext').html(
        `This may take some time. Do not close this window nor leave this page!`
    );
}


