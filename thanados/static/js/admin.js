maximumHeight = ($(window).height() - $('#mynavbar').height())
$('#mycontent').css('max-height', (maximumHeight - 10) + 'px');

$(window).resize(function () {
    maximumHeight = ($(window).height() - $('#mynavbar').height());
    $('#mycontent').css('max-height', (maximumHeight - 10) + 'px');
});

$(document).ready(function () {

    $('#missingmain').DataTable();
    $('#missingGeoNames').DataTable();
    $('#missingGeo').DataTable();
    $('#missingFileref').DataTable({
        initComplete: function () {
            this.api().column(1).every(function () {
                var column = this;
                var select = $('<select><option value=""></option></select>')
                    .appendTo($(column.header()))
                    .on('change', function () {
                        var val = $.fn.dataTable.util.escapeRegex(
                            $(this).val()
                        );

                        column
                            .search(val ? '^' + val + '$' : '', true, false)
                            .draw();
                    });

                column.data().unique().sort().each(function (d, j) {
                    select.append('<option value="' + d + '">' + d + '</option>')
                });
            });
        },
        columnDefs: [{
            orderable: false,
            className: 'select-checkbox',
            targets: 0
        },
        ],
        order: [[1, 'asc']],
        paging:   false
    });

    $('#infotext').toggle();
    $("#jsonPrepBtn").click(function () {
        // disable button
        $('.sql_button').prop("disabled", true);
        // add spinner to button
        $(this).html(
            `<span class="spinner-border spinner-border-sm me-3" role="status" aria-hidden="true"></span>...in progress`
        );
        setAlert();
    });
    $("#GeoCleanBtn").click(function () {
        // disable button
        $('.sql_button').prop("disabled", true);
        // add spinner to button
        $(this).html(
            `<span class="spinner-border spinner-border-sm me-3" role="status" aria-hidden="true"></span>...in progress`
        );
        setAlert();
    });
    $("#TimeCleanBtn").click(function () {
        // disable button
        $('.sql_button').prop("disabled", true);
        // add spinner to button
        $(this).html(
            `<span class="spinner-border spinner-border-sm me-3" role="status" aria-hidden="true"></span>...in progress`
        );
        setAlert();
    });
    $("#FileRefBtn").click(function () {
        // disable button
        $('.sql_button').prop("disabled", true);
        // add spinner to button
        $(this).html(
            `<span class="spinner-border spinner-border-sm me-3" role="status" aria-hidden="true"></span>...in progress`
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
    "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
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
                    oData.name + '<a title="Link to backend" class="backendlink" href="' + openAtlasUrl + oData.id + '" target="_blank""><i class="float-end text-secondary fas fa-database"></i></a>'); //create links in rows
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
    'order': [[0, 'desc'], [1, 'asc']],
    drawCallback: function () {
        checkTheBoxes();
    }
});

function checkTheBoxes() {
    $('.siteselector').each(function () {
        this.checked = (parseInt(this.value)) === 1;
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


//get ids of selected images
imgIds = []
$(document).on('change', '.imgselector', function () {

    if (this.checked) {
        this.value = parseInt(this.id);
        imgIds.push(parseInt(this.id));
        document.getElementById("file_" + this.id).readOnly = false;
    } else {
        this.value = "";
        removeItemOnce(imgIds, parseInt(this.id))
        var pageRef = document.getElementById("file_" + this.id);
        pageRef.value = ''
        document.getElementById("file_" + this.id).readOnly = true;
    }

    var textarea = document.getElementById("imgstoinsert");
    textarea.value = imgIds;
});

refId = 0

$(document).on('change', '#ReferenceSelect', function () {
    refId = parseInt(this.value)

    //console.log(this.options[this.selectedIndex].title);
    var textarea = document.getElementById("bibstoinsert");
    textarea.value = this.options[this.selectedIndex].title;
});

function removeItemOnce(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}

function logData() {
    if (refId === 0) {
        alert('Please select reference first');
        return false
    } else {
        imageRefs = []
        var filereftable = $('#missingFileref').DataTable()
        var data = filereftable.$('.imgselector')
        $.each(data, function (i, dataset) {
                if ((dataset.value) !== '') {
                    var pageRef = document.getElementById("file_" + dataset.value);

                    if (pageRef.value) {pageRef = pageRef.value} else {pageRef = ''}
                    var ref = {"file_id": parseInt(dataset.value), "page": pageRef, "refId": refId}
                    imageRefs.push(ref)
                }
            }

        )
        if (imageRefs.length === 0) {
            alert ('Please select at least one image')
            return false
        }
        setRefs(imageRefs)

    }
}

function setRefs(imagerefs) {
    $.ajax({
        type: 'POST',
        url: '/admin/filerefs',
        data: {
            'refs': JSON.stringify(imagerefs)
        },
        success: function (result) {
            window.location.href = "/admin";
        }
    });
}

/*$.each(missingeonames, function (i, geo) {

    if(i===0) getGeonames(geo.lat, geo.lon)
})

function getGeonames (lat, lon) {
$.getJSON("http://api.geonames.org/findNearbyJSON?lat="+lon+"&lng="+lat+"&username=thanados", function (data) {

        console.log(data)

    //    var outHtml = '<li><a class="dropdown-item" title="'+ title +'" href="#" onclick="filterTable('+data.id+')">' + data.name + ' (' + sitecount + ')</a></li>'
    //    $(container).append(outHtml)

    });
}*/
