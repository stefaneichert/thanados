$('#nav-charts').addClass('activePage');

//prepare charts/plots and data
//remove sites without graves
site_ids = [];
mysite_ids = []
maxGraves = []

$.each(sitelist, function (i, dataset) {
        if (dataset.graves) {
            site_ids.push(dataset.id);
            maxGraves.push(parseInt(dataset.graves));
        }
    }
)

maxGraves.sort(function (a, b) {
    return a - b;
});
maxGraves = maxGraves.slice(maxGraves.length - 10);

mysite_ids = site_ids;
if (site_ids.length > 10) {
    mysite_ids = [];
    $.each(sitelist, function (i, dataset) {
        if (dataset.graves >= maxGraves[0]) mysite_ids.push(dataset.id);
    })
    if (mysite_ids.length > 10) {
        mysite_ids = mysite_ids.slice(mysite_ids.length - 10)
    }
}
CurrentSelection = mysite_ids;

setcharts();

beginArray = [];
$.each(sitelist, function (i, site, end) {
    beginArray.push(site.begin);
});
beginArray = [];
endArray = [];
$.each(sitelist, function (i, site) {
    beginArray.push(site.begin);
    endArray.push(site.end);
});
minbegin = Math.min(...beginArray);
maxbegin = Math.max(...beginArray);

minend = Math.min(...endArray);
maxend = Math.max(...endArray);


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


//set datatable

table = $('#sitelist').DataTable({
    data: filterList(sitelist),
    "pagingType": "numbers",
    "scrollX": true,
    columns: [
        {
            data: "id",
            "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                $(nTd).html('<input class="siteselector" type="checkbox" id="' + oData.id + '" value="' + oData.id + '"><label for="' + oData.id + '"></label>');
            },
            "orderDataType": "dom-checkbox",
        },
        {
            data: "name",
            "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                $(nTd).html("<div title='" + oData.description + "'>" + oData.name + "</div>");
            }
        },
        {
            data: 'type',
            "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                $(nTd).html("<div title='" + oData.path + "'>" + oData.type + "</div> ");
                //create markers
            }
        },
        {data: 'begin'},
        {data: 'end'},
        {data: 'graves'}
    ],
    'columnDefs': [
        {
            orderable: true,
            targets: 0
        },
    ],
    'order': [[5, 'desc']],
    drawCallback: function () {
        checkTheBoxes();
    }
});


$(function () {
    $("#slider-range").slider({
        range: true,
        min: minbegin,
        max: maxbegin,
        values: [minbegin, maxbegin],
        slide: function (event, ui) {
            var table = $('#sitelist').DataTable();
            $("#amount").val(ui.values[0] + " and " + ui.values[1]);
            $("#min").val(ui.values[0]);
            $("#max").val(ui.values[1]);
            table.draw();
        }
    });
    $("#amount").val($("#slider-range").slider("values", 0) +
        " and " + $("#slider-range").slider("values", 1));
});

$(function () {
    $("#slider-range2").slider({
        range: true,
        min: minend,
        max: maxend,
        values: [minend, maxend],
        slide: function (event, ui) {
            var table = $('#sitelist').DataTable();
            $("#amount2").val(ui.values[0] + " and " + ui.values[1]);
            $("#min1").val(ui.values[0]);
            $("#max1").val(ui.values[1]);
            table.draw();
        }
    });
    $("#amount2").val($("#slider-range2").slider("values", 0) +
        " and " + $("#slider-range2").slider("values", 1));
});

/* Custom filtering function which will search data in column four between two values */
$.fn.dataTable.ext.search.push(
    function (settings, data, dataIndex) {
        var min = parseInt($('#min').val(), 10);
        var max = parseInt($('#max').val(), 10);
        var age = parseFloat(data[3]) || 0; // use data for the age column

        return (isNaN(min) && isNaN(max)) ||
            (isNaN(min) && age <= max) ||
            (min <= age && isNaN(max)) ||
            (min <= age && age <= max);

    }
);

$.fn.dataTable.ext.search.push(
    function (settings, data, dataIndex) {
        var min = parseInt($('#min1').val(), 10);
        var max = parseInt($('#max1').val(), 10);
        var age = parseFloat(data[4]) || 0; // use data for the age column

        return (isNaN(min) && isNaN(max)) ||
            (isNaN(min) && age <= max) ||
            (min <= age && isNaN(max)) ||
            (min <= age && age <= max);

    }
);

$.fn.dataTable.ext.order['dom-checkbox'] = function (settings, col) {
    return this.api().column(col, {order: 'index'}).nodes().map(function (td, i) {
        return $('input', td).prop('checked') ? '1' : '0';
    });
}

$('#submitBtn').on('click', function (e) {
    mysite_ids = CurrentSelection;
    $('#collapseFilter').collapse();
    changeArrows();
    setTimeout(setcharts, 200);
    setSiteSelection();
});

$(document).on('change', '#selectall', function () {
    CurrentSelection = [];
    CurrentSites = [];
    if (this.checked) {
        CurrentSelection = site_ids;
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
        CurrentSelection.push(parseInt(this.value));
    } else {
        CurrentSelection = removeItemAll(CurrentSelection, parseInt(this.value))
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
    $.each(sitelist, function (i, site) {
        if ($.inArray(site.id, CurrentSelection) != -1) {
            CurrentSites.push(site.name);
        }
    });
    var textarea = document.getElementById("mySelectedSites");
    textarea.value = CurrentSites.join(", ");
    $('#submitBtn').html('Apply (' + CurrentSites.length + ')')
}

function checkTheBoxes() {
    $('.siteselector').each(function () {
        if (CurrentSelection.includes(parseInt(this.value))) {
            this.checked = true
        } else {
            this.checked = false
        }
    })
}

function setcharts() {

    sorttype = 'beginend';
    sortdirection = false;
    bigDatechart = false;


//date of sites: Data contains site and chronological range
    mydatedata = setDating(sorttype, sortdirection);
    dateconfig = {
        // The type of chart we want to create
        type: 'bar',
        // The data for our dataset
        data: mydatedata,
        // Configuration options go here
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: false,
                        labelString: 'Site'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Years'
                    }
                }]
            },
            legend: false,
            plugins: {
                colorschemes: {
                    scheme: 'tableau.Tableau20'
                }
            }
        }
    };

    if (typeof (datechart) != 'undefined') datechart.destroy();
    var ctx = document.getElementById('date-chart').getContext('2d');

    datechart = new Chart(ctx, dateconfig);


//depth of graves: Data contains site and no of graves of a depth interval of 20cm
    mydepthdata = setChartData(depth_data, false, true, true);
    depthconfig = {
        // The type of chart we want to create
        type: 'bar',
        // The data for our dataset
        data: mydepthdata,
        // Configuration options go here
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Depth in cm.'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: '%',
                        beginAtZero: true
                    }
                }]
            },
            plugins: {
                colorschemes: {
                    scheme: 'tableau.Tableau20'
                }
            }
        }
    };
    var ctx = document.getElementById('depth-chart').getContext('2d');
    if (typeof (depthchart) != 'undefined') depthchart.destroy();
    depthchart = new Chart(ctx, depthconfig);

    //bodyheight: Data contains site and no of burials of bodyheight interval of 10cm
    mybodyheightdata = setChartData(bodyheight_data, false, true, true);
    bodyheightconfig = {
        // The type of chart we want to create
        type: 'bar',
        // The data for our dataset
        data: mybodyheightdata,
        // Configuration options go here
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Bodyheight in cm.'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: '%',
                        beginAtZero: true
                    }
                }]
            },
            plugins: {
                colorschemes: {
                    scheme: 'tableau.Tableau20'
                }
            }
        }
    };
    var ctx = document.getElementById('bodyheight-chart').getContext('2d');
    if (typeof (bodyheightchart) != 'undefined') bodyheightchart.destroy();
    bodyheightchart = new Chart(ctx, bodyheightconfig);

// orientation of graves: Data contains site and no of graves of a orientation interval of 20°
    myorientationdata = setChartData(orientation_data, false, true, false);
    orientationconfig = {
        // The type of chart we want to create
        type: 'bar',
        // The data for our dataset
        data: myorientationdata,
        // Configuration options go here
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Orientation in Degrees (360°)'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: '%',
                        beginAtZero: true
                    }
                }]
            },
            plugins: {
                colorschemes: {
                    scheme: 'tableau.Tableau20'
                }
            }
        }
    };
    var ctx = document.getElementById('orientation-chart').getContext('2d');
    if (typeof (orientationchart) != 'undefined') orientationchart.destroy();
    orientationchart = new Chart(ctx, orientationconfig)


// Azimuth of graves: Data contains site and no of graves of an Azimuth interval of 20°
    myazimuthdata = setChartData(azimuth_data, false, true, false);
    azimuthconfig = {
        // The type of chart we want to create
        type: 'bar',
        // The data for our dataset
        data: myazimuthdata,
        // Configuration options go here
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Azimuth in Degrees (180°)'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: '%',
                        beginAtZero: true
                    }
                }]
            },
            plugins: {
                colorschemes: {
                    scheme: 'tableau.Tableau20'
                }
            }
        }
    };
    var ctx = document.getElementById('azimuth-chart').getContext('2d');
    if (typeof (azimuthchart) != 'undefined') azimuthchart.destroy();
    azimuthchart = new Chart(ctx, azimuthconfig)

//sex of individuals: Data contains site and no of skeletons with male, female or undefined sex
    mysexdata = setChartData(sex_data, true, true, false, false);
    sexconfig = {
        // The type of chart we want to create
        type: 'bar',
        // The data for our dataset
        data: mysexdata,
        // Configuration options go here
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    stacked: true
                }],
                yAxes: [{
                    stacked: true,
                    scaleLabel: {
                        display: true,
                        labelString: '%',
                        beginAtZero: true
                    }
                }]
            },
            plugins: {
                colorschemes: {
                    scheme: 'tableau.Tableau10'
                }
            }
        }
    };
    var ctx = document.getElementById('sex-chart').getContext('2d');
    if (typeof (sexchart) != 'undefined') sexchart.destroy();
    sexchart = new Chart(ctx, sexconfig)

    //gender of individuals: Data contains site and no of skeletons with male, female or undefined gender
    mygenderdata = setChartData(gender_data, true, true, false, false);
    genderconfig = {
        // The type of chart we want to create
        type: 'bar',
        // The data for our dataset
        data: mygenderdata,
        // Configuration options go here
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    stacked: true
                }],
                yAxes: [{
                    stacked: true,
                    scaleLabel: {
                        display: true,
                        labelString: '%',
                        beginAtZero: true
                    }
                }]
            },
            plugins: {
                colorschemes: {
                    scheme: 'tableau.Tableau10'
                }
            }
        }
    };
    var ctx = document.getElementById('gender-chart').getContext('2d');
    if (typeof (genderchart) != 'undefined') genderchart.destroy();
    genderchart = new Chart(ctx, genderconfig)

//types of graves: Data contains site and no of graves of a certain type
    gravetypesconfig = {
        // The type of chart we want to create
        type: 'bar',
        // The data for our dataset
        data: setChartData(gravetypes, true, true, false, true),
        // Configuration options go here
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    stacked: true
                }],
                yAxes: [{
                    stacked: true,
                    scaleLabel: {
                        display: true,
                        labelString: '%',
                        beginAtZero: true
                    }
                }]
            },
            plugins: {
                colorschemes: {
                    scheme: 'tableau.Tableau20'
                }
            }
        }
    };
    var ctx = document.getElementById('gravetypes-chart').getContext('2d');
    if (typeof (gravetypeschart) != 'undefined') gravetypeschart.destroy();
    gravetypeschart = new Chart(ctx, gravetypesconfig)

//construction of graves: Data contains site and no of graves of a certain construction
    graveconstrconfig = {
        // The type of chart we want to create
        type: 'bar',
        // The data for our dataset
        data: setChartData(graveconstr, true, true, false, true),
        // Configuration options go here
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    stacked: true
                }],
                yAxes: [{
                    stacked: true,
                    scaleLabel: {
                        display: true,
                        labelString: '%',
                        beginAtZero: true
                    }
                }]
            },
            plugins: {
                colorschemes: {
                    scheme: 'tableau.Tableau20'
                }
            }
        }
    };
    var ctx = document.getElementById('graveconstr-chart').getContext('2d');
    if (typeof (graveconstrchart) != 'undefined') graveconstrchart.destroy();
    graveconstrchart = new Chart(ctx, graveconstrconfig)

//type of finds: Data contains site and no of finds of a certain type
    findtypeschartconfig = {
        // The type of chart we want to create
        type: 'bar',
        // The data for our dataset
        data: setChartData(finds_data, true, true, false, true),
        // Configuration options go here
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    stacked: true
                }],
                yAxes: [{
                    stacked: true,
                    scaleLabel: {
                        display: true,
                        labelString: '%',
                        beginAtZero: true
                    }
                }]
            },
            plugins: {
                colorschemes: {
                    scheme: 'tableau.Tableau20'
                }
            }
        }
    };
    var ctx = document.getElementById('findtypes-chart').getContext('2d');
    if (typeof (findtypeschart) != 'undefined') findtypeschart.destroy();
    findtypeschart = new Chart(ctx, findtypeschartconfig);

//construction of graves: Data contains site and no of graves of a certain construction
    burialtypesconfig = {
        // The type of chart we want to create
        type: 'bar',
        // The data for our dataset
        data: setChartData(burialtypes, true, true, false, true),
        // Configuration options go here
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    stacked: true
                }],
                yAxes: [{
                    stacked: true,
                    scaleLabel: {
                        display: true,
                        labelString: '%',
                        beginAtZero: true
                    }
                }]
            },
            plugins: {
                colorschemes: {
                    scheme: 'tableau.Tableau20'
                }
            }
        }
    };
    var ctx = document.getElementById('burialtypes-chart').getContext('2d');
    if (typeof (burialtypeschart) != 'undefined') burialtypeschart.destroy();
    burialtypeschart = new Chart(ctx, burialtypesconfig)

    ageconfig = {
        type: 'violin',
        data: setage(age_data),
        options: {
            responsive: true,
            legend: {
                position: 'top',
            },
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'age'
                    }
                }]
            },
        }
    };
    ageconfigBoxplot = {
        type: 'boxplot',
        data: setage(age_data),
        options: {
            responsive: true,
            legend: {
                position: 'top',
            },
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'age'
                    }
                }]
            },
        }
    };
    var ctx = document.getElementById('age-chart').getContext('2d');
    if (typeof (agechart) != 'undefined') agechart.destroy();
    agechart = new Chart(ctx, JSON.parse(JSON.stringify(ageconfig)));


    valueageconfig = {
        type: 'violin',
        data: setage(valueage_data),
        options: {
            responsive: true,
            legend: {
                position: 'top',
            },
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'age'
                    }
                }]
            },
        }
    };
    valueageconfigBoxplot = {
        type: 'boxplot',
        data: setage(valueage_data),
        options: {
            responsive: true,
            legend: {
                position: 'top',
            },
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'age'
                    }
                }]
            },
        }
    };
    var ctx = document.getElementById('valueage-chart').getContext('2d');
    if (typeof (valueagechart) != 'undefined') valueagechart.destroy();
    valueagechart = new Chart(ctx, JSON.parse(JSON.stringify(valueageconfig)));


    $("#violin").click(function () {
        change('violin', 'agechart', 'age-chart', ageconfig);
    });

    $("#boxplot").click(function () {
        change('boxplot', 'agechart', 'age-chart', ageconfigBoxplot);
    });

    $("#violinV").click(function () {
        change('violin', 'valueagechart', 'valueage-chart', valueageconfig);
    });

    $("#boxplotV").click(function () {
        change('boxplot', 'valueagechart', 'valueage-chart', valueageconfigBoxplot);
    });

}

function setChronVars() {

    if (sorttype === 'beginend') {
        sorttype = 'endbegin'
    } else {
        sorttype = 'beginend'

    }


    if (bigDatechart) {
        updateChron(bigchart, sorttype, sortdirection);
    } else {
        updateChron(datechart, sorttype, sortdirection);
    }
    bigDatechart = false
}

function setChronDir() {
    if (sortdirection) {
        sortdirection = false
    } else {
        sortdirection = true
    }
    if (bigDatechart) {
        updateChron(bigchart, sorttype, sortdirection);
    } else {
        updateChron(datechart, sorttype, sortdirection);
    }
    bigDatechart = false
}

function setDating(sorttype, sortdirection) {
    var sites = [];
    var labels = [];
    var data = [];

    $.each(sitelist, function (i, site) {
        if (CurrentSelection.includes(site.id)) {
            if (site.begin && site.end) {
                sites.push({'name': site.name, 'begin': site.begin, 'end': site.end})
            }
        }
    })

    if (sorttype === 'beginend') {

        sites = sites.sort(function (a, b) {
            return parseFloat(a.end) - parseFloat(b.end);
        });

        sites = sites.sort(function (a, b) {
            return parseFloat(a.begin) - parseFloat(b.begin);
        });
    }

    if (sorttype === 'endbegin') {

        sites = sites.sort(function (a, b) {
            return parseFloat(a.begin) - parseFloat(b.begin);
        });

        sites = sites.sort(function (a, b) {
            return parseFloat(a.end) - parseFloat(b.end);
        });
    }

    if (sortdirection) {
        sites = sites.reverse()
    }


    $.each(sites, function (i, site) {
        labels.push(site.name);
        data.push([site.begin, site.end])
    })

    var returndata = {
        labels: labels,
        datasets: [{
            data: data
        }]
    }
    return returndata
}

function setage(data) {
    agelabels = [];
    min_age = [];
    avg_age = [];
    max_age = [];
    $.each(data.age, function (i, dataset) {

        if (mysite_ids.includes(dataset.site_id)) {
            //mynewdata.datasets.push(dataset);
            agelabels.push(dataset.name);
            min_age.push(dataset.min);
            avg_age.push(dataset.avg);
            max_age.push(dataset.max);
        }
    })
    boxplotData = {
        // define label tree
        labels: agelabels,
        datasets: [{
            label: 'min',
            backgroundColor: 'rgba(225,87,89,0.5)',
            borderColor: 'red',
            borderWidth: 1,
            padding: 10,
            itemRadius: 0,
            outlierColor: '#999999',
            data: min_age
        },
            {
                label: 'avg',
                backgroundColor: 'rgba(78,121,167,0.5)',
                borderColor: 'blue',
                borderWidth: 1,
                padding: 10,
                itemRadius: 0,
                outlierColor: '#999999',
                data: avg_age
            },
            {
                label: 'max',
                backgroundColor: 'rgba(242,142,43,0.5)',
                borderColor: 'orange',
                borderWidth: 1,
                padding: 10,
                itemRadius: 0,
                outlierColor: '#999999',
                data: max_age
            }]
    };
    return (boxplotData)
}


//change('violin', 'agechart', 'age-chart', ageconfig);

/*function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}*/

//changetype of chart
function change(newType, chartvar, canvasid, config) {
    eval(chartvar + '.destroy()');
    delete eval.chartvar;
    var ctx = document.getElementById(canvasid).getContext("2d");
    // Chart.js modifies the object you pass in. Pass a copy of the object so we can use the original object later
    var temp = jQuery.extend(true, {}, config);
    temp.type = newType;
    eval(chartvar + ' = new Chart(ctx, temp)');
}


function filtersites(data) {
    mynewdata = {
        "datasets": [],
        "labels": []
    };
    mynewdata.labels = data.labels;
    $.each(data.datasets, function (i, dataset) {

        if (mysite_ids.includes(dataset.site_id)) {
            mynewdata.datasets.push(dataset);
        }
    })

    return mynewdata;
}


//change chart from absolute values to percentage
function updateChart(chart, data, percentageset) {
    chart.data = data;
    if (percentageset) {
        chart.options.scales.yAxes[0].scaleLabel.labelString = '%'
    } else {
        chart.options.scales.yAxes[0].scaleLabel.labelString = 'no.'
    }
    chart.update();
}

//change chart from absolute values to percentage
function updateChron(chart, sorttype, sortdirection) {
    chart.data = setDating(sorttype, sortdirection);
    chart.update();
}


//some css fixes for the window/container size
$(window).resize(function () {
    var windowheight = ($(window).height());
    $('#mycontent').css('max-height', windowheight - 56 + 'px');
    $('#bigchart-container').css('height', (windowheight * 73 / 100));
});

$(document).ready(function () {
    if ($(window).width() > 1000) {
        $(".sortable").sortable();
        $(".sortable").disableSelection();
    }
    var windowheight = ($(window).height());
    $('#mycontent').css('max-height', windowheight - 56 + 'px');
    $('#bigchart-container').css('height', (windowheight * 73 / 100));
});

function filterList(data) {
    filterData = [];
    $.each(data, function (i, dataset) {
        if (dataset.graves > 0) filterData.push(dataset)
    });
    return filterData
}

$('#collapseFilter').on('shown.bs.collapse', function () {
    var table = $('#sitelist').DataTable();
    table.draw();
})

function enlargeChart(currentConfig) {
    $('.boxBtn').addClass('d-none')
    $('.boxBtnV').addClass('d-none')
    $('.absBtn').addClass('d-none')
    $('.chronBtn').addClass('d-none')
    $('.modal-title').text(currentTitle);
    $('#chart-xl').show();
    $('#back-to-top').addClass('d-none');
    if (typeof (bigchart) !== 'undefined') {
        bigchart.destroy();
        delete bigchart
    }
    var ctx = document.getElementById('bigchart-container').getContext('2d');
    bigchart = new Chart(ctx, currentConfig);

    if (percScript !== '') {
        if (percScript.includes('Chron') === false) {
            $('.absBtn').removeClass('d-none')
        } else {
            $('.chronBtn').removeClass('d-none')
        }
        if (percScript !== 'valueage') {
            percScript = percScript.substring(percScript.indexOf(",") + 1);
            percScript = 'updateChart(bigchart,' + percScript;
            absScript = absScript.substring(absScript.indexOf(",") + 1);
            absScript = 'updateChart(bigchart,' + absScript;
            $('#percBtn').click(function () {
                eval(percScript)
            });
            $('#absBtn').click(function () {
                eval(absScript)
            });
        }
        if (percScript === 'valueage') {
            console.log('valueageshallo')
            $('.boxBtnV').removeClass('d-none');
            $('.absBtn').addClass('d-none');
        }
    } else {

        $('.boxBtn').removeClass('d-none');
        $('.absBtn').addClass('d-none');
    }
}

function getCitation() {
    updateSourceSites();
    mysource = '"' + JSON.stringify(currentTitle.replace(/(\r\n|\n|\r)/gm, "")).replace('"', '').replace('"', '').replace(/^\s+|\s+$/g, '') + '". For Sites: ' + SourceSites + '.<br>' + mycitation1.replace("After:", "");
    mysource = mysource.replace(/(\r\n|\n|\r)/gm, "");
    $('#mycitation').empty();
    $('#mycitation').html('<div style="border: 1px solid #dee2e6; border-radius: 5px; padding: 0.5em; color: #495057; font-size: 0.9em;" id="Textarea1">' + mysource + '</div>');
    $('#backgroundgray').fadeIn(300);
    $('#citeModal').show();
}

function updateSourceSites() {
    SourceSites = '';
    $.each(sitelist, function (i, dataset) {
            if (mysite_ids.includes(dataset.id)) {
                SourceSites += dataset.name + ', '
            }
        }
    )
    SourceSites = SourceSites.substr(0, (SourceSites.length - 2));
}

function setSiteSelection() {
    updateSourceSites();
    $('#selectedSites').html(
        '(currently ' + mysite_ids.length + '/' + site_ids.length + ')'
    )
}

setSiteSelection();
$('#mySelectedSites').text(SourceSites);

setSiteInfo();

$('#citeModal').css('z-index', '1070')
$('#citeModal').css('opacity', '1')
$('#closeSiteMe').click(function () {
    $('#citeModal').toggle();
    $('#backgroundgray').toggle();
})