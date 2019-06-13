var ctx = document.getElementById('depth-chart').getContext('2d');
var depthchart = new Chart(ctx, {
    // The type of chart we want to create
    type: 'bar',
    // The data for our dataset
    data: setChartData(depth_data, false, false, true),
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
                    labelString: 'no.'
                }
            }]
        },
        plugins: {
            colorschemes: {
                scheme: 'tableau.Tableau20'
            }
        }
    }
});

// noinspection JSDuplicatedDeclaration
var octx = document.getElementById('orientation-chart').getContext('2d');
var orientationchart = new Chart(octx, {
    // The type of chart we want to create
    type: 'bar',
    // The data for our dataset
    data: setChartData(orientation_data, false, false, false),
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
                    labelString: 'no.'
                }
            }]
        },
        plugins: {
            colorschemes: {
                scheme: 'tableau.Tableau10'
            }
        }
    }
});

var sctx = document.getElementById('sex-chart').getContext('2d');
var sexchart = new Chart(sctx, {
    // The type of chart we want to create
    type: 'bar',
    // The data for our dataset
    data: setChartData(sex_data, true, true, false),
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
                    labelString: '%'
                }
            }]
        },
        plugins: {
            colorschemes: {
                scheme: 'tableau.Tableau10'
            }
        }
    }
});


/*function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}*/


function removeZeros(data) {
    $.each(data.datasets, function (i, dataset) {
        arraylength = dataset.data.length;
        $.each(dataset.data, function (i, number) {
            if (number > 0)
                valueindex = (i + 1);
            if (i == (arraylength - 1))
                lastvalueindex = valueindex;
        })
        var newdata = (dataset.data.slice(0, valueindex));
        dataset.data = newdata;
        if (i == 0) {
            newvalueindex = lastvalueindex;
        } else {
            if (lastvalueindex > newvalueindex)
                newvalueindex = lastvalueindex
        }
    })
    data.labels = data.labels.slice(0, newvalueindex)
    return data;
}

$(window).resize(function () {
    var windowheight = ($(window).height());
    $('#mycontent').css('max-height', windowheight - 56 + 'px');
});

$(document).ready(function () {
    var windowheight = ($(window).height());
    $('#mycontent').css('max-height', windowheight - 56 + 'px');
});

function switchaxes(datatoswitch) {
    newdata = {
        "datasets": [],
        "labels": []
    };
    $.each(datatoswitch.datasets, function (i, dataset) {
        newdata.labels.push(dataset.label);
    });
    $.each(datatoswitch.datasets, function (i, dataset) {
        data1 = {};
        data1.label = datatoswitch.labels[i];
        data1.data = [];
        index = i;
        $.each(datatoswitch.datasets, function (i, dataset) {
            data2 = dataset.data;
            $.each(data2, function (i, value) {
                if (index == i) {
                    data1.data.push(value);
                }
            })
        })
        newdata.datasets.push(data1);
    })
    return newdata;
}

function getPercentage(datatoswitch) {
    $.each(datatoswitch.datasets, function (i, dataset) {
        sum = dataset.data.reduce(
            function (total, num) {
                return total + num
            }
            , 0);
        newArray = [];
        $.each(dataset.data, function (i, value) {
            var perValue = parseFloat(Math.round((value / sum * 100) * 100) / 100).toFixed(2);
            newArray.push(perValue)
        });
        dataset.data = newArray;
    })
    return datatoswitch;
}


function updateChart(chart, data, percentageset) {
    chart.data = data;
    if (percentageset) {
        chart.options.scales.yAxes[0].scaleLabel.labelString = '%'
    } else {
        chart.options.scales.yAxes[0].scaleLabel.labelString = 'no.'
    }
    chart.update();
}

function setChartData(originalData, axesswitch, percentageset, zeroslice) {
    dataToWorkWith = JSON.parse(JSON.stringify(originalData));
    if (zeroslice) dataToWorkWith = removeZeros(dataToWorkWith);
    if (percentageset) dataToWorkWith = getPercentage(dataToWorkWith);
    if (axesswitch) dataToWorkWith = switchaxes(dataToWorkWith);
    return dataToWorkWith;
}

