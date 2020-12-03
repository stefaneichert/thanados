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

$('#filterBtn').on('click', function (e) {
    changeArrows();
});

function changeArrows() {
    var down = ($('#filterBtnArrow').hasClass("fa-chevron-down"));
    if (down) {
        $('#filterBtnArrow').removeClass('fa-chevron-down').addClass('fa-chevron-right');
    } else {
        $('#filterBtnArrow').removeClass('fa-chevron-right').addClass('fa-chevron-down');
    }
}

table = $('#sitelist').DataTable({
    data: tabledata.sites,
    paging: true,
    "lengthMenu": [ [10, 25, 50, 100, -1], [10, 25, 50, 100, "All"] ],
    "scrollX": true,
    columns: [
        {
            data: "used",
            "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                $(nTd).html('<input class="siteselector" type="checkbox" id="' + oData.id + '" value="' + oData.used + '"><label for="' + oData.id + '"></label>');
            },
            //"orderDataType": "dom-checkbox",
        },
        {
                data: "name",
                "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                    $(nTd).html(
                        oData.name + '<a title="Link to backend" class="backendlink" href="' + openAtlasUrl + oData.id + '" target="_blank""><i class="float-right text-secondary fas fa-database"></i></a>'); //create links in rows
                }
        },
        {data: 'type'},
        {data: 'id'}
    ],
    'columnDefs': [
        {
            orderable: true,
            targets: 0
        },
    ],
    'order': [[0, 'desc'],[1, 'asc']],
    drawCallback: function () {
        checkTheBoxes();
    }
});

function checkTheBoxes() {
    $('.siteselector').each(function () {
        if ((parseInt(this.value)) === 1) {
            this.checked = true
        } else {
            this.checked = false
        }
    })
}

$.fn.dataTable.ext.order['dom-checkbox'] = function (settings, col) {
    return this.api().column(col, {order: 'index'}).nodes().map(function (td, i) {
        return $('input', td).prop('checked') ? '1' : '0';
    });
}

site_ids = [];
allsite_ids = []
$.each(tabledata.sites, function (i, dataset) {
        if (dataset.used === 1) {
            site_ids.push(dataset.id);
        }
        allsite_ids.push(dataset.id);
    }
)

CurrentSelection = site_ids;

$(document).on('change', '#selectall', function () {
    CurrentSelection = [];
    if (this.checked) {
        CurrentSelection = allsite_ids;
        $('.siteselector').each(function () {
            this.checked = true;
        })
    } else {
        CurrentSelection = [];
        $('.siteselector').each(function () {
            this.checked = false;
        })
    }
    setSiteInfo()
})

$(document).on('change', '.siteselector', function () {
    if (this.checked) {
        CurrentSelection.push(parseInt(this.id));
    } else {
        CurrentSelection = removeItemAll(CurrentSelection, parseInt(this.id))
    }
    setSiteInfo()
});

function removeItemAll(arr, value) {
    var i = 0;
    while (i < arr.length) {
        if (arr[i] === value) {
            arr.splice(i, 1);
        } else {
            ++i;
        }
    }
    return arr;
}

function setSiteInfo() {
    CurrentSites = [];
    $.each(tabledata.sites, function (i, site) {
        if ($.inArray(site.id, CurrentSelection) != -1) {
            CurrentSites.push(site.name);
        }
    });
    var textarea = document.getElementById("mySelectedSites");
    textarea.value = CurrentSites.join(", ");
    $('#submitBtn').html('Apply (' + CurrentSites.length + ')<br>\n' +
        '                        <i class="fas fa-caret-down mx-auto"></i>')
}


$('#selectedSites').html(
        '(currently ' + site_ids.length + '/' + allsite_ids.length + ')'
    )


$('#submitBtn').on('click', function (e) {
    var textarea = document.getElementById("site_list");
    textarea.value = JSON.stringify(CurrentSelection)
});

setSiteInfo();
