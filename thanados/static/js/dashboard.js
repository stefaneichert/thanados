networkExistsNotYet = true;

jsonmysite = repairJson(jsonmysite);
sitename = jsonmysite.name;
mycitation = '"' + sitename + '".';
//mycitation2 = "unknown source";
singleref = false;
furtherRefs = false;
bibfeature = jsonmysite;
bubbleNotThere = true;
FindbubbleNotThere = true;
PathobubbleNotThere = true;
overviewmissing = true;
gravesmissing = true;
burialsmissing = true;
findsmissing = true;
burialstotal = 0;
OvCh = false;
GrCh = false;
BuCh = false;
FiCh = false;
if (typeof (bibfeature.properties.references) !== 'undefined' && bibfeature.properties.references.length === 1) singleref = true;

$('.chart-help-btn').click(function (i) {
    currentChart = (($(this).parent().attr('id')).replace('-chart-container', ''));

    currentChartDescription = 'Detailed description will be available soon';
    currentChartTitle = 'Work in progress';
    currentChartData = [];

    $.each(DashboardInfo, function (i, info) {
        if (info.chart === currentChart) {
            currentChartDescription = info.description;
            currentChartTitle = info.title;
            currentChartData = info.data;
        }
    })

    $('#chartDescr').empty();
    $('#chartDescr').text(currentChartDescription);
    $('#chartTitle').empty();
    $('#chartTitle').text(currentChartTitle);
    $('#chart-xl').show();
})

$.each(bibfeature.properties.references, function (t, ref) {
    if (typeof (ref.title) !== 'undefined') {
        title = ref.title;
        citeme = title;
    } else {
        title = '';
        citeme = 'unknown source';
    }
    if (typeof (ref.reference) !== 'undefined') {
        page = ref.reference.replace("##main", "");
        citeme = citeme + ' ' + page + '.';
    } else
        page = '';
    mainref = false;
    if (typeof (ref.reference) !== 'undefined' && ref.reference.includes('##main') || singleref) {
        mainref = true;
        mainrefthere = true;
    }

    if (mainref) {
        if (typeof (mycitation2) == 'undefined') {
            mycitation2 = citeme
        } else {
            mycitation2 += '. ' + citeme
        }
    } else {
        furtherRefs += 1;
    }
})

mysource = (mycitation + mycitation1 + mycitation2);
mysource = mysource.replace(/(\r\n|\n|\r)/gm, "");
mysource = mysource.replace("dashboard/", "");
$('#mycitation').append('<div style="border: 1px solid #dee2e6; border-radius: 5px; padding: 0.5em; color: #495057; font-size: 0.9em;" id="Textarea1">' + mysource + '</div>');


maleids = [25, 22374, 120167]
femaleids = [22373, 24, 120168]
burialids = [26516, 26517, 26519, 26520]

descriptionSummary = {
    graves: jsonmysite.features.length,
    burials: 0,
    finds: 0,
    osteology: 0,
    gravetypes: [],
    burialtypes: [],
    findtypes: [],
    osteotypes: [],
    gravegoodBurials: [["Grave goods", "No grave goods"], [0, 0]]
}

function countTypes(arr) {
    var a = [], b = [], prev;

    arr.sort();
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] !== prev) {
            a.push(arr[i]);
            b.push(1);
        } else {
            b[b.length - 1]++;
        }
        prev = arr[i];
    }

    for (var i = 0; i < a.length; i++) {
        a[i] = a[i] + ' (' + b[i] + ')'
    }
    return [a, b];
}


$.each(jsonmysite.features, function (i, feature) {
    if (feature.id === 0) descriptionSummary.graves = 0;
    if (feature.id !== 0) descriptionSummary.gravetypes.push(feature.properties.maintype.name)
    $.each(feature.burials, function (i, burial) {
        descriptionSummary.burials += 1;
        descriptionSummary.burialtypes.push(burial.properties.maintype.name);
        if (burialids.includes(burial.properties.maintype.id)) {
            burialstotal += 1;
            if (typeof (burial.finds) !== "undefined") {
                descriptionSummary.gravegoodBurials[1][0] += 1;
            } else {
                descriptionSummary.gravegoodBurials[1][1] += 1;
            }
        }

        $.each(burial.finds, function (i, feature) {
            descriptionSummary.finds += 1;
            descriptionSummary.findtypes.push(feature.properties.maintype.name)
        })
        $.each(burial.humanremains, function (i, feature) {
            descriptionSummary.osteology += 1;
            descriptionSummary.osteotypes.push(feature.properties.maintype.name)
        })
    })
});
descriptionSummary.gravegoodBurials[0][0] += ' (' + descriptionSummary.gravegoodBurials[1][0] + ')';
descriptionSummary.gravegoodBurials[0][1] += ' (' + descriptionSummary.gravegoodBurials[1][1] + ')';

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

    if ($(window).width() <= 768) {
        $('#sidebar').addClass('active');
        legendPos = 'bottom'
    }

    if ($(window).width() > 768) {
        $('#sidebar').removeClass('active');
        legendPos = 'left'
    }


    collapsebutton();
    loadOverview();
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

function loadnetwork() {
    $(".db-element").addClass('d-none');
    $("#network-wrapper").removeClass('d-none')
    if (networkExistsNotYet) {


        var container = document.getElementById("network");
        var nodes = new vis.DataSet(mynetwork.nodes);
        var edges = new vis.DataSet(mynetwork.edges);


        var hierarchydata = {
            nodes: nodes,
            edges: edges,
        };
        var options = {
            nodes: {
                shape: "dot",
                size: 16,
            },
            physics: {
                forceAtlas2Based: {
                    gravitationalConstant: -18,
                    centralGravity: 0.005,
                },
                maxVelocity: 146,
                solver: "forceAtlas2Based",
                timestep: 0.35,
                stabilization: {iterations: 70},
            },
            layout: {
                improvedLayout: false
            }
        };

        network = new vis.Network(container, hierarchydata, options);

        network.once("stabilizationIterationsDone", function () {
            setTimeout(function () {
                $('#loadingspinner').addClass('d-none')
            }, 200);
            networkExistsNotYet = false;
        });
    }


}

function loadWordCloud() {
    $(".db-element").addClass('d-none');
    $("#wordcloud-wrapper").removeClass('d-none')
    $("#wordcloud").jQCloud(wordcloud, {autoResize: true});
}

function loadOverview() {
    $(".db-element").addClass('d-none');
    $("#overview-wrapper").removeClass('d-none');
    if (overviewmissing) {
        $('#counters').html(
            '<div class="col-sm">' +
            '<h4 class="statistic-counter">' + descriptionSummary.graves + '</h4>' +
            '                                <p>Features</p>\n' +
            '                            </div>' +
            '<div class="col-sm">' +
            '<h4 class="statistic-counter">' + descriptionSummary.burials + '</h4>' +
            '                                <p>Strat. Units</p>\n' +
            '                            </div>' +
            '<div class="col-sm">' +
            '<h4 class="statistic-counter">' + descriptionSummary.finds + '</h4>' +
            '                                <p>Finds</p>\n' +
            '                            </div>' +
            '<div class="col-sm">' +
            '<h4 class="statistic-counter">' + descriptionSummary.osteology + '</h4>' +
            '                                <p>Osteology Datasets</p>\n' +
            '                            </div>'
        )

        $('.statistic-counter').each(function () {
            $(this).prop('Counter', 0).animate({
                Counter: $(this).text()
            }, {
                duration: 500,
                //easing: 'swing',
                step: function (now) {
                    $(this).text(Math.ceil(now));
                }
            });
        });

        if (descriptionSummary.gravetypes.length > 0) {
            createchart(countTypes(descriptionSummary.gravetypes), 'Graves/Features', 'gravetypes-chart');
            OvCh = true;
            $('.chartcontainer').css('max-height', $('gravetypes-chart').height() + 'px')

            svgWidth = $('#gravetypes-chart-container').height();
            //console.log(svgWidth);

        } else {
            $('#gravetypes-chart-container').remove()
        }

        if (descriptionSummary.burialtypes.length > 0) {
            createchart(countTypes(descriptionSummary.burialtypes), 'Burials/Strat. Units', 'burialtypes-chart');
            if (descriptionSummary.gravegoodBurials[1][0] + descriptionSummary.gravegoodBurials[1][1] > 0) {
                createchart(descriptionSummary.gravegoodBurials, 'Burials with/without grave goods', 'gravegoods-chart')
            } else {
                $('#gravegoods-chart-container').remove();
            }
            OvCh = true;
        } else {
            $('#burialtypes-chart-container').remove();
        }

        if (descriptionSummary.findtypes.length > 0 && bubbleNotThere && findBubble[0].children) {

            setBubble(findBubble[0], 'bubble', ["hsl(204,61%,77%)", "hsl(227,30%,40%)"]);

            OvCh = true;
            bubbleNotThere = false;
        } else {
            $("#bubblecard").remove()
        }
        overviewmissing = false;
        if (OvCh === false) {
            $('#overviewCharts').html('<div class="card-body">Not enough data for visualisations</div>')
        }
    }

}

function setBubble(data, container, colorRange) {

    document.getElementById(container).setAttribute("width", svgWidth);
    document.getElementById(container).setAttribute("height", svgWidth);

    var svg = d3.select("#" + container),
        margin = 5,
        diameter = +svg.attr("width"),
        g = svg.append("g").attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

    var color = d3.scaleLinear()
        .domain([-1, 5])
        .range(colorRange)
        .interpolate(d3.interpolateHcl);

    var calculateTextFontSize = function (d) {
        var id = d.data.id;
        //var radius = 0;
        if (d.data.fontsize) {
            var r = d3.selectAll("#c" + id).attr("r");
            //if radius present in DOM use that
            if (r) {
                radius = r;
            }
            //calculate the font size and store it in object for future
            d.data.fontsize = (2 * radius - 8) / d.data.computed * 24 + "px";
            if (((2 * radius - 8) / d.data.computed * 24) < 0) d.data.fontsize = 0 + "px";
            //if fontsize is already calculated use that.
            return d.data.fontsize;
        }

        if (!d.data.computed) {
            //if computed not present get & store the getComputedTextLength() of the text field
            d.data.computed = this.getComputedTextLength();
            if (d.data.computed != 0) {
                //if computed is not 0 then get the visual radius of DOM
                var r = d3.selectAll("#c" + id).attr("r");
                //if radius present in DOM use that
                if (r) {
                    radius = r;
                }
                //calculate the font size and store it in object for future
                d.data.fontsize = (2 * radius - 8) / d.data.computed * 24 + "px";
                if (((2 * radius - 8) / d.data.computed * 24) < 0) d.data.fontsize = 0 + "px";
                return d.data.fontsize;
            }
        }
    }

    var pack = d3.pack()
        .size([diameter - margin, diameter - margin])
        .padding(function (d) {
            if (d.data.children.length === 1) {
                return 10
            } else {
                return 2
            }
        });

    root = data

    root = d3.hierarchy(root)
        .sum(function (d) {
            return d.size;
        })
        .sort(function (a, b) {
            return b.value - a.value;
        });

    var focus = root,
        nodes = pack(root).descendants(),
        view;

    var circle = g.selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("class", function (d) {
            return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root";
        })

        .style("fill", function (d) {
            return d.children ? color(d.depth) : null;
        })
        .attr("r", function (d) {
            return d.r;
        })
        .on("click", function (d) {
            if (!d.data.children) {
                labelid = "#" + d.data.id;
                circleid = "#c" + d.data.id;
                currentnode = true;
            } else {
                currentnode = false
            }
            if (focus !== d) zoom(d), d3.event.stopPropagation();
        })
        .attr("id", function (d) {
            return "c" + d.data.id;
        })


    circle.append("svg:title")
        .text(function (d) {
            return d.data.name + ": " + d.value;
        })


    var text = g.selectAll("text")
        .data(nodes)
        .enter().append("text")
        .attr("class", "label")
        .attr("id", function (d) {
            return d.data.id
        })
        .style("fill-opacity", function (d) {
            return d.parent === root ? 1 : 0;
        })
        .style("display", function (d) {
            return d.parent === root ? "inline" : "none";
        })
        .text(function (d) {
            return d.data.name;
        })
        .style("font-size", calculateTextFontSize)
        .attr("dy", ".35em");

    var node = g.selectAll("circle,text");

    svg
        .style("background", "#f9f9f9")
        .on("click", function () {
            zoom(root);
        });

    zoomTo([root.x, root.y, root.r * 2 + margin]);

    function zoom(d) {
        var focus0 = focus;
        focus = d;

        var transition = d3.transition()
            .duration(d3.event.altKey ? 7500 : 500)
            .tween("zoom", function (d) {
                var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
                return function (t) {
                    zoomTo(i(t));
                };
            });

        transition.selectAll("text")
            .filter(function (d) {
                return d.parent === focus || this.style.display === "inline";
            })
            .style("fill-opacity", function (d) {
                return d.parent === focus || d === focus && !d.children ? 1 : 0;
            })

            .on("start", function (d) {
                if (d.parent === focus || d === focus && !d.children) this.style.display = "inline";
            })
            .on("end", function (d) {
                if (d.parent !== focus) this.style.display = "inline";
            })
        if (typeof (labelid) !== "undefined") {
            if (labelid) {


                if (eval('$("' + circleid + '").hasClass("node--leaf")') && currentnode) {
                    eval('$("' + labelid + '").css("fill-opacity", "1")');
                    eval('$("' + labelid + '").css("display", "inline")');
                }
            }
        }

        setTimeout(function () {
            d3.selectAll("text").filter(function (d) {
                return d.parent === focus || this.style.display === "inline";
            }).style("font-size", calculateTextFontSize);
        }, 501)

    }

    function zoomTo(v) {
        var k = diameter / v[2];
        view = v;
        node.attr("transform", function (d) {
            return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
        });
        circle.attr("r", function (d) {
            return d.r * k;
        });
    }
}

function prepareSexData(data) {
    var Labels = [];
    var Datasets = [];
    $.each(data, function (i, dataset) {
        Labels.push(dataset.name + ' (' + dataset.count + ')');
        Datasets.push(dataset.count);
    })
    return [Labels, Datasets]
}

function loadGraves() {
    $(".db-element").addClass('d-none');
    $("#grave-wrapper").removeClass('d-none');
    if (gravesmissing) {
        var depthcount = (depthData.datasets.reduce((a, b) => a + b, 0))
        if (depthcount > 0) {
            createbarchart(removeDashboardZeros(JSON.parse(JSON.stringify(depthData))), 'Depth of Graves (cm)', 'gravedepth-chart', depthcount, false, false);
            GrCh = true;
        } else {
            $('#gravedepth-chart-container').remove()
        }
        var lengthcount = (lengthData.datasets.reduce((a, b) => a + b, 0))
        if (lengthcount > 0) {
            createbarchart(removeDashboardZeros(JSON.parse(JSON.stringify(lengthData))), 'Length of Graves (cm)', 'gravelength-chart', lengthcount, false, false);
            GrCh = true;
        } else {
            $('#gravelength-chart-container').remove()
        }
        var widthcount = (widthData.datasets.reduce((a, b) => a + b, 0))
        if (widthcount > 0) {
            createbarchart(removeDashboardZeros(JSON.parse(JSON.stringify(widthData))), 'Width of Graves (cm)', 'gravewidth-chart', widthcount, false, false);
            GrCh = true;
        } else {
            $('#gravewidth-chart-container').remove()
        }
        var degcount = (degData.datasets.reduce((a, b) => a + b, 0))
        if (degcount > 0) {
            createbarchart((JSON.parse(JSON.stringify(degData))), 'Orientation of Graves/Skeletons (0 - 360°)', 'gravedeg-chart', degcount, false, false);
            GrCh = true;
        } else {
            $('#gravedeg-chart-container').remove()
        }
        var azicount = (aziData.datasets.reduce((a, b) => a + b, 0))
        if (azicount > 0) {
            createbarchart((JSON.parse(JSON.stringify(aziData))), 'Azimuth of Gravespits (0 - 180°)', 'graveazi-chart', azicount, false, false);
            GrCh = true;
        } else {
            $('#graveazi-chart-container').remove()
        }

        if (constrData.types !== null) {
            if (constrData.types.length > 0) {
                createchart(typedataPie(constrData), 'Grave construction', 'graveconstr-chart');
                GrCh = true;
            } else {
                $('#graveconstr-chart-container').remove()
            }
        } else {
            $('#graveconstr-chart-container').remove()
        }
        var knncount = (knn.values.length)
        if (knncount > 0) {
            createbarchart(removeDashboardZeros(JSON.parse(JSON.stringify(knn))), 'Distance to nearest Neighbour (m)', 'graveknn-chart', knncount, false, false);
            GrCh = true;
        } else {
            $('#graveknn-chart-container').remove()
        }
    }
    if (GrCh === false) {
        $('#GraveCharts').html('<div class="card-body">Not enough data for visualisations</div>')
    }
    gravesmissing = false;


}

function loadBurials() {
    $(".db-element").addClass('d-none');
    $("#burial-wrapper").removeClass('d-none');
    if (burialsmissing) {
        if (DashAgeData.length > 0) {
            if (DashAgeData.length < 20) {
                $('#burialage-chart-container').removeClass('col-xl-12');
                $('#burialage-chart-container').addClass('col-xl-6');
            }
            createAgeChart(DashAgeData, 'burialage-chart', 'Age at death based on age bracket classifications');
            //$('#burialage-chart-container').append('<div class="charttitle text-center text-muted" id="avgLegend"><b class="me-2">- - - - - - - -</b> Average age at death: ' + AgeAvg + ' years</div>')
            BuCh = true
        } else {
            $('#burialage-chart-container').remove();
        }
        if (ValueAgeData.length > 0) {
            if (ValueAgeData.length < 20) {
                $('#valueage-chart-container').removeClass('col-xl-12');
                $('#valueage-chart-container').addClass('col-xl-6');
            }
            $.each(ValueAgeData, function (i, dataset) {
                if (dataset.from === dataset.to) {
                    dataset.from = (dataset.from - 0.25);
                    dataset.to = (dataset.to + 0.25);
                }
            })
            createAgeChart(ValueAgeData, 'valueage-chart', 'Age at death based on absolute age (min - max)');
            //$('#valueage-chart-container').append('<div class="charttitle text-center text-muted" id="avgLegend"><b class="me-2">- - - - - - - -</b> Average age at death: ' + AgeAvg + ' years</div>')
            BuCh = true
        } else {
            $('#valueage-chart-container').remove();
        }

        if (BoxPlotData.BracketData.labels.length > 0) {
            createBoxChart(BoxPlotData.BracketData, 'boxplotBracket-chart', 'Age at death based on age bracket classifications', 'Years', true);
            //$('#valueage-chart-container').append('<div class="charttitle text-center text-muted" id="avgLegend"><b class="me-2">- - - - - - - -</b> Average age at death: ' + AgeAvg + ' years</div>')
            BuCh = true
        } else {
            $('#boxplotBracket-chart-container').remove();
        }

        if (BoxPlotData.ValueData.labels.length > 0) {
            createBoxChart(BoxPlotData.ValueData, 'boxplot-chart', 'Age at death based on absolute age (min - max)',  'Years', true);
            //$('#valueage-chart-container').append('<div class="charttitle text-center text-muted" id="avgLegend"><b class="me-2">- - - - - - - -</b> Average age at death: ' + AgeAvg + ' years</div>')
            BuCh = true
        } else {
            $('#boxplot-chart-container').remove();
        }

        if (isoboxplot.labels.length > 1) {
            createBoxChart(isoboxplot, 'isoboxplot-chart', 'Delta15N vs. Sex', 'Delta15N (per mil)', false);
            //$('#valueage-chart-container').append('<div class="charttitle text-center text-muted" id="avgLegend"><b class="me-2">- - - - - - - -</b> Average age at death: ' + AgeAvg + ' years</div>')
            BuCh = true
        } else {
            $('#isoboxplot-chart-container').remove();
        }

        if (SexData.length > 0) {
            sexBurials = {'name': 'no information', 'count': 0};
            $.each(SexData, function (i, dataset) {
                sexBurials.count += dataset.count
            })
            sexBurials.count = burialstotal - sexBurials.count;
            SexData.push(sexBurials)
            createchart(prepareSexData(SexData), 'Anthropological Sex determination', 'sex-chart');
            BuCh = true
        } else {
            $('#sex-chart-container').remove();
        }

        if (isodata != null) {
            createschatterchart(isodata, 'Isotopic Analyses Delta15N vs. Delta13C', 'iso-chart', 'Delta13C (per mil)', 'Delta15N (per mil)', false);
            BuCh = true
        } else {
            $('#iso-chart-container').remove();
        }

        if (isoage != null) {
            createschatterchart(isoage, 'Delta 15N vs. Age at death', 'isoage-chart', 'Age at death', 'Delta15N (per mil)', true);
            BuCh = true
        } else {
            $('#isoage-chart-container').remove();
        }

        if (bodyheightAvg.datasets) {
            createbarchart(bodyheightAvg, 'Bodyheights in cm.', 'bodyheight-chart', bodyheightAvg.datasets.length, true, true);
            BuCh = true
        } else {
            $('#bodyheight-chart-container').remove();
        }

        if (GenderData.length > 0) {
            GenderBurials = {'name': 'no information', 'count': 0};
            $.each(GenderData, function (i, dataset) {
                GenderBurials.count += dataset.count
            })
            GenderBurials.count = burialstotal - GenderBurials.count;
            GenderData.push(GenderBurials)
            createchart(prepareSexData(GenderData), 'Archaeological Gender determination', 'gender-chart');
            BuCh = true
        } else {
            $('#gender-chart-container').remove();
        }

        if (SexDepthData.datasets.length > 0) {
            createMultiLinechart(removeStackedZeros(SexDepthData), 'Sex of individuals by depth of graves', 'sexdepth-chart', 'brewer.SetOne3')
            BuCh = true
        } else {
            $('#sexdepth-chart-container').remove();
        }

        if (PathobubbleNotThere && pathoBubble[0].children) {
            setBubble(pathoBubble[0], 'pathology', ["hsl(9,100%,94%)", "hsl(17,100%,40%)"]);
            //setBubble(findBubble[0], 'bubble', 'burialtypes-chart-container' );
            BuCh = true
            PathobubbleNotThere = false;
        } else {
            $("#pathocard").remove()
        }

    }
    burialsmissing = false;
    if (BuCh === false) {
        $('#burialCharts').html('<div class="card-body">Not enough data for visualisations</div>')
    }
}

function loadFinds() {
    $(".db-element").addClass('d-none');
    $("#find-wrapper").removeClass('d-none');
    if (findsmissing) {
        var depthcount = (findsPerDepth.datasets.reduce((a, b) => a + b, 0))
        if (depthcount > 0) {
            createlinechart(removeDashboardZeros(JSON.parse(JSON.stringify(findsPerDepth))), 'Average count of finds per depth of graves', 'findDepth-chart');
            FiCh = true;
        } else {
            $('#findDepth-chart-container').remove()
        }

        var depthcount = (findAges.datasets.reduce((a, b) => a + b, 0))
        if (depthcount > 0) {
            createlinechart(removeDashboardZeros(JSON.parse(JSON.stringify(findAges))), 'Average count of finds per age at death (min/max age) ', 'findAge-chart');
            FiCh = true;
        } else {
            $('#findAge-chart-container').remove()
        }

        var depthcount = (findBracketAges.datasets.reduce((a, b) => a + b, 0))
        if (depthcount > 0) {
            createlinechart(removeDashboardZeros(JSON.parse(JSON.stringify(findBracketAges))), 'Average count of finds per age at death (bracket classes) ', 'findBracketAge-chart');
            FiCh = true;
        } else {
            $('#findBracketAge-chart-container').remove()
        }

        var depthcount = (preciousMetalfindsAgeValue.datasets[0].data.reduce((a, b) => a + b, 0)) + preciousMetalfindsAgeValue.datasets[1].data.reduce((a, b) => a + b, 0) + preciousMetalfindsAgeValue.datasets[2].data.reduce((a, b) => a + b, 0)
        if (depthcount > 0) {
            createMultiLinechart(removeStackedZeros(JSON.parse(JSON.stringify(preciousMetalfindsAgeValue))), 'Average count of non ferrous finds per age at death (min/max)', 'metalAgeValue-chart', 'brewer.SetOne3');
            FiCh = true;
        } else {
            $('#metalAgeValue-chart-container').remove()
        }

        var depthcount = (preciousMetalfindsAgeBracket.datasets[0].data.reduce((a, b) => a + b, 0)) + preciousMetalfindsAgeBracket.datasets[1].data.reduce((a, b) => a + b, 0) + preciousMetalfindsAgeBracket.datasets[2].data.reduce((a, b) => a + b, 0)
        if (depthcount > 0) {
            createMultiLinechart(removeStackedZeros(JSON.parse(JSON.stringify(preciousMetalfindsAgeBracket))), 'Average count of non ferrous finds per age at death (bracket classes)', 'metalAgeBracket-chart', 'brewer.SetOne3');
            FiCh = true;
        } else {
            $('#metalAgeBracket-chart-container').remove()
        }

        var depthcount = (preciousMetalfinds.datasets[0].data.reduce((a, b) => a + b, 0)) + preciousMetalfinds.datasets[1].data.reduce((a, b) => a + b, 0) + preciousMetalfinds.datasets[2].data.reduce((a, b) => a + b, 0)
        if (depthcount > 0) {
            createMultiLinechart(removeStackedZeros(JSON.parse(JSON.stringify(preciousMetalfinds))), 'Average count of non ferrous finds per depth of graves', 'metalDepth-chart', 'brewer.SetOne3');
            FiCh = true;
        } else {
            $('#metalDepth-chart-container').remove()
        }

        var depthcount = getSumOfDatasets(prestigiousfinds)
        if (depthcount > 0) {
            createMultiLinechart(removeStackedZeros(JSON.parse(JSON.stringify(prestigiousfinds))), 'Average count of find types per depth of graves', 'findtypesDepth-chart', 'tableau.Tableau10');
            FiCh = true;
        } else {
            $('#findtypesDepth-chart-container').remove()
        }

        var depthcount = getSumOfDatasets(prestigiousfindsValueAge)
        if (depthcount > 0) {
            createMultiLinechart(removeStackedZeros(JSON.parse(JSON.stringify(prestigiousfindsValueAge))), 'Average count of find types per age at death (min/max)', 'findtypesAgeValue-chart', 'tableau.Tableau10');
            FiCh = true;
        } else {
            $('#findtypesAgeValue-chart-container').remove()
        }

        var depthcount = getSumOfDatasets(prestigiousfindsBracketAge)
        if (depthcount > 0) {
            createMultiLinechart(removeStackedZeros(JSON.parse(JSON.stringify(prestigiousfindsBracketAge))), 'Average count of find types per age at death (bracket classes)', 'findtypesAgeBracket-chart', 'tableau.Tableau10');
            FiCh = true;
        } else {
            $('#findtypesAgeBracket-chart-container').remove()
        }

        if (descriptionSummary.findtypes.length > 0 && FindbubbleNotThere && findBubble[0].children) {

            setBubble(findBubble2[0], 'bubbleFinds', ["hsl(204,61%,77%)", "hsl(227,30%,40%)"]);

            FiCh = true;
            FindbubbleNotThere = false;
        } else {
            $("#bubblecardFinds").remove()
        }

    }
    findsmissing = false;
    if (FiCh === false) {
        $('#findCharts').html('<div class="card-body">Not enough data for visualisations</div>')
    }
}

function getSumOfDatasets(data) {
    var sum = 0
    $.each(data.datasets, function (i, dataset) {
        sum += dataset.data.reduce((a, b) => a + b, 0)
    })
    return sum
}

function createAgeChart(data, container, title) {
    var sum = 0;
    $.each(data, function (i, dataset) {
        sum += (dataset.to + dataset.from) / 2
    })
    sum = sum / data.length;
    AgeAvg = sum;
    dateconfig = {
        // The type of chart we want to create
        type: 'bar',
        // The data for our dataset
        data: setAgeData(data, 'fromto', false),
        // Configuration options go here
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    ticks: {
                        display: false //this will remove only the label
                    },
                    scaleLabel: {
                        display: false
                    },
                    gridLines: {
                        display: false
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Years'
                    }
                }]
            },
            annotation: {
                annotations: [{
                    type: 'line',
                    mode: 'horizontal',
                    scaleID: 'y-axis-0',
                    value: sum,
                    borderColor: '#666',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    label: {
                        enabled: true,
                        backgroundColor: '#d8d8d8',
                        content: 'Average: ' + sum.toFixed(1),
                        position: "left",
                        fontColor: "#666",
                        xAdjust: 7,
                        yAdjust: -15,
                    }
                }]
            },
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: title
            },
            plugins: {
                colorschemes: {
                    scheme: 'tableau.Tableau20'
                }
            }
        }
    };

    var ctx = document.getElementById(container).getContext('2d');

    chart = new Chart(ctx, dateconfig);
}

function createBoxChart(data, container, title, yAxeLabel, showlegend) {
    ageconfigBoxplot = {
        type: 'boxplot',
        data: data,
        options: {
            responsive: true,
            legend: {
                position: 'top',
                display: showlegend,
            },
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: yAxeLabel
                    }
                }]
            },
            title: {
                display: true,
                text: title
            }
        }
    };
    var ctx = document.getElementById(container).getContext('2d');
    var agechart = new Chart(ctx, JSON.parse(JSON.stringify(ageconfigBoxplot)));
}

function typedataPie(data) {
    var returndata = [prepareTypedata(data).labels, prepareTypedata(data).datasets[0].data]
    $.each(returndata[0], function (i, data) {
        returndata[0][i] = data + ' (' + returndata[1][i] + ')'
    })
    return returndata
}

function createchart(data, title, container) {

    var pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
            position: legendPos,
        },
        title: {
            display: true,
            text: title
        },
        plugins: {
            colorschemes: {
                scheme: 'tableau.Tableau20'
            }
        },
        tooltips: {
            callbacks: {
                label: function (tooltipItems, data) {
                    return data.labels[tooltipItems.index];
                }
            }
        }
    }


    var config = {
        // The type of chart we want to create
        type: 'pie',
        // The data for our dataset
        data: {
            labels: data[0],
            datasets: [{data: data[1], borderWidth: 0}]
        },
        options: pieOptions
        // Configuration options go here

    };
    $.each(DashboardInfo, function (i, info) {
        if (info.chart === container.replace('-chart', '')) info.data = JSON.parse(JSON.stringify(config.data))
    })
    var ctx = document.getElementById(container).getContext('2d');
    var newchart = new Chart(ctx, config)
}

function createbarchart(data, title, container, n, anno, tooltips) {
    if (tooltips) {
        var tooltiplabels = JSON.parse(JSON.stringify(data.tooltips))
        var tooltipOptions = {
            tooltips: {
                callbacks: {
                    label: function (tooltipItem) {
                        var label = tooltiplabels[tooltipItem.index]
                        return label;
                    }
                }
            },
        }
    } else {
        tooltipOptions = {tooltips: {}}
    }
    if (anno) {

        var sum = 0;
        $.each(data.datasets, function (i, dataset) {
            sum += (dataset)
        })
        sum = sum / data.datasets.length;
        AgeAvg = sum;


        var barOptions = {
            responsive: true,
            tooltips: tooltipOptions.tooltips,
            maintainAspectRatio: false,
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: title
            },
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: '(n = ' + n + ')',
                    },
                    gridLines: {
                        display: false
                    }
                }],
                yAxes: [{
                    ticks: {
                        precision: 0,
                        beginAtZero: true
                    }
                }]
            },
            plugins: {
                colorschemes: {
                    scheme: 'tableau.Tableau20'
                }
            },
            annotation: {
                annotations: [{
                    type: 'line',
                    mode: 'horizontal',
                    scaleID: 'y-axis-0',
                    value: sum,
                    borderColor: '#666',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    label: {
                        enabled: true,
                        backgroundColor: '#d8d8d8',
                        content: 'Average: ' + sum.toFixed(1),
                        position: "left",
                        fontColor: "#666",
                        xAdjust: 7,
                        yAdjust: -15,
                    }
                }]
            },
        }
    } else {
        var barOptions = {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: title
            },
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: '(n = ' + n + ')',
                    },
                    gridLines: {
                        display: false
                    }
                }],
                yAxes: [{
                    ticks: {
                        precision: 0,
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
    }


    var config = {
        // The type of chart we want to create
        type: 'bar',
        // The data for our dataset
        data: {
            labels: data.labels,
            datasets: [{data: data.datasets, borderWidth: 0}]
        },
        options: barOptions
        // Configuration options go here

    };
    var ctx = document.getElementById(container).getContext('2d');
    var newchart = new Chart(ctx, config)
}


function createlinechart(data, title, container, n) {

    var Options = {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
            display: false,
        },
        title: {
            display: true,
            text: title
        },
        scales: {
            xAxes: [{
                scaleLabel: {
                    display: false,
                },
                gridLines: {
                    display: false
                }
            }],
        },
        plugins: {
            colorschemes: {
                scheme: 'tableau.Tableau20'
            }
        }
    }


    var config = {
        // The type of chart we want to create
        type: 'line',
        // The data for our dataset
        data: {
            labels: data.labels,
            datasets: [{data: data.datasets, borderWidth: 0}]
        },
        options: Options
        // Configuration options go here

    };
    var ctx = document.getElementById(container).getContext('2d');
    var newchart = new Chart(ctx, config)
}

function createStackedBarchart(data, title, container, xlabel, ylabel) {

    var barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
            display: false,
        },
        title: {
            display: true,
            text: title
        },
        scales: {
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: xlabel,
                },
                stacked: true,
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: ylabel,
                },
                stacked: true
            }]
        },
        plugins: {
            colorschemes: {
                scheme: 'tableau.Tableau20'
            }
        }
    }


    var config = {
        // The type of chart we want to create
        type: 'bar',
        // The data for our dataset
        data: data,
        options: barOptions
        // Configuration options go here

    };
    var ctx = document.getElementById(container).getContext('2d');
    var newchart = new Chart(ctx, config)
}

function createMultiLinechart(data, title, container, colorrange) {
    //console.log(data);
    var Options = {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
            display: true,
        },
        title: {
            display: true,
            text: title
        },
        scales: {
            yAxes: [{
                stacked: true,
            }]
        },
        plugins: {
            colorschemes: {
                scheme: colorrange
            }
        }
    }


    var config = {
        // The type of chart we want to create
        type: 'line',
        // The data for our dataset
        data: data,
        options: Options
        // Configuration options go here

    };
    var ctx = document.getElementById(container).getContext('2d');
    var newchart = new Chart(ctx, config)
}

function createschatterchart(data, title, container, xlabel, ylabel, legend) {
    var ctx = document.getElementById(container).getContext('2d');

    var scatteroptions = {

        tooltips: {
            callbacks: {
                label: function (tooltipItem, data) {
                    var label = data.datasets[tooltipItem.datasetIndex].labels[tooltipItem.index];
                    return label + ': (' + tooltipItem.xLabel + ', ' + tooltipItem.yLabel + ')';
                }
            }
        },
        responsive: true,
        maintainAspectRatio: false,
        legend: {
            display: legend,
        },
        title: {
            display: true,
            text: title
        },
        scales: {
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: xlabel,
                },
                stacked: false,
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: ylabel,
                },
                stacked: false
            }]
        },
        plugins: {
            colorschemes: {
                scheme: 'tableau.Tableau20'
            }
        }
    }


    var scatterChart = new Chart(ctx, {
        type: "scatter",
        data: data,
        options: scatteroptions
    });
}


function setAgeData(SourceData, sorttype, sortdirection) {
    var burials = [];
    var labels = [];
    var data = [];

    $.each(SourceData, function (i, burial) {


        burials.push({'name': burial.name, 'from': burial.from, 'to': burial.to})


    })

    if (sorttype === 'fromto') {

        burials = burials.sort(function (a, b) {
            return parseFloat(a.to) - parseFloat(b.to);
        });

        burials = burials.sort(function (a, b) {
            return parseFloat(a.from) - parseFloat(b.from);
        });
    }

    if (sorttype === 'tofrom') {

        burials = burials.sort(function (a, b) {
            return parseFloat(a.from) - parseFloat(b.from);
        });

        burials = burials.sort(function (a, b) {
            return parseFloat(a.to) - parseFloat(b.to);
        });
    }

    if (sortdirection) {
        burials = burials.reverse()
    }


    $.each(burials, function (i, burial) {
        labels.push(burial.name);
        data.push([burial.from, burial.to])
    })

    var returndata = {
        labels: labels,
        datasets: [{
            data: data
        }]
    }
    return returndata
}

function scrollContentTop() {
    $('#mycontent').animate({
        scrollTop: 0
    }, 0);
}

