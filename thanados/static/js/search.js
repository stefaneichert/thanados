$(document).ready(function () {
    $(".sortable").sortable();
    $(".sortable").disableSelection();
    maximumHeight = ($(window).height() - $('#mynavbar').height())
    $('#mycontent').css('max-height', (maximumHeight - 15) + 'px');
    local = false;
    addSearch();
});

$('#AddSearch').click(function() {
    Iter += 1;
    addSearch()
});


$(window).resize(function () {
    maximumHeight = ($(window).height() - $('#mynavbar').height());
    $('#mycontent').css('max-height', (maximumHeight - 15) + 'px');
});

Iter = 1;

function addSearch() {
    $("#mySearchCards").append(
        '<div id="Query' + Iter + '" class="card mb-3" style="width: 100%;">\n' +
        '<div class="card-header" id="heading' + Iter + '">\n' +
        '                <h5 class="mb-0">\n' +
        '                    <button id="Heading' + Iter + '" class="btn btn-link" type="button" data-toggle="collapse"\n' +
        '                            data-target="#collapseQuery' + Iter + '" aria-expanded="true"\n' +
        '                            aria-controls="collapseQuery' + Iter + '">\n' +
        '                        Search' +
        '                    </button>\n' +
        '                </h5>\n' +
        '            </div>\n' +
        '            <div id="collapseQuery' + Iter + '" class="collapse show" aria-labelledby="heading' + Iter + '">\n' +
        '<div class="card-body">\n' +
        '<div id="Form' + Iter + '"></div>\n' +
        '<div class="input-group mb-3">\n' +
        '                            <textarea readonly id="SQL' + Iter + '" class="form-control" aria-label="Selected sites" placeholder="Query statement"></textarea>\n' +
        '</div>\n' +
        '<div class="float-right mb-3">\n' +
        '<button class="btn btn-link mySearchbutton" type="button" value="' + Iter + '" class="card-link">search</button>\n' +
        '<button class="btn btn-link myResetbutton" type="button" value="' + Iter + '" class="card-link">reset</button>\n' +
        '</div>\n' +
        '<div id="variables" class="row">' +
        '<input class="col" type=text id="level' + Iter + '">' +
        '<input class="col"type=text id="criteria' + Iter + '">' +
        '<input class="col" type=text id="type' + Iter + '">' +
        '<input class="col" type=text id="min' + Iter + '">' +
        '<input class="col" type=text id="max' + Iter + '">' +
        '</div>' +
        '</div>\n' +
        '</div>\n' +
        '</div>');
    $(".myResetbutton").click(function f() {
        console.log(this.value);
        $("#Query" + this.value).remove();
        addSearch();
    });
    $(".mySearchbutton").click(function f() {
        $("#Heading" + Iter).html($('#SQL' + Iter).val());
        $('#term').val(returnQuerystring())
    });
    appendSearch();
};

function appendSearch() {//append search form to dialog
    $('#Form' + Iter).append(
        //selection for search level: grave, burial or find
        '<div id="LevelSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">\n' +
        '<div class="input-group-prepend">\n' +
        '<label class="input-group-text" for="LevelSelect_' + Iter + '">' + Iter + '. </label>\n' +
        '</div>\n' +
        '<select class="custom-select empty" id="LevelSelect_' + Iter + '">\n' +
        '<option selected disabled>Select search level...</option>\n' +
        '<option value="burial_site">Cemeteries</option>\n' +
        '<option value="feature">Graves</option>\n' +
        '<option value="strat">Burials</option>\n' +
        '<option value="find">Finds</option>\n' +
        '</select>\n' +
        '</div>');
    //after main level is selected:
    $('#LevelSelect_' + Iter).on('change', function () {
        appendLevel = $('#LevelSelect_' + Iter + ' option:selected').val(); //set level as variable
        Querystring = 'Search for "' + $('#LevelSelect_' + Iter + ' option:selected').text() + '"';
        $('#SQL' + Iter).val(Querystring);
        $("#Heading" + Iter).html($('#SQL' + Iter).val());
        $('#level' + Iter).val($('#LevelSelect_' + Iter + ' option:selected').val());
        $('#LevelSelect_' + Iter).prop('disabled', true); //disble former selection field
        $('#Form' + Iter).append(
            //selection for property to choose: maintype, types, dimensions, material or timespan
            '<div id="PropSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">\n' +
            '<select class="custom-select empty" id="PropSelect_' + Iter + '">\n' +
            '<option selected disabled>Select search criteria...</option>\n' +
            '<option value="maintype">Maintype</option>\n' +
            '<option value="type">Properties</option>\n' +
            '<option value="timespan">Timespan</option>\n' +
            '<option value="dimension">Dimensions</option>\n' +
            '<option value="material">Material</option>\n' +
            '<option value="text">Search in Text</option>\n' +
            '</select>\n' +
            '</div>'
        );
        appendCriteria(Iter, appendLevel);
    });
}

function appendCriteria(Iter, appendLevel) { //select search criteria after level is chosen
    $('#PropSelect_' + Iter).on('change', function () {
        criteria = $('#PropSelect_' + Iter + ' option:selected').val().toLowerCase(); //set criteria variable
        $('#PropSelect_' + Iter).prop('disabled', true); //disable input
        $('#SQL' + Iter).val(Querystring + ' where "' + $('#PropSelect_' + Iter + ' option:selected').text() + '"');
        $("#Heading" + Iter).html($('#SQL' + Iter).val());
        $('#criteria' + Iter).val(criteria);
        appendCriteriaSearch(Iter, criteria, appendLevel); //append further search options
    });
}

function appendCriteriaSearch(Iter, criteria, appendLevel) { //append respective forms depending on search criteria e.g. with values for timespan etc.
    $('#PropSelect_' + Iter + '_parent').remove(); //remove former input
    if (criteria == 'maintype' || criteria == 'type') { //if maintype or type append form with tree select
        $('#Form' + Iter).append(
            '<div id="MaintypeSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">\n' +
            '<div class="input-group-prepend">\n' +
            '<label class="input-group-text" for="MaintypeSelect_' + Iter + '">Type </label>\n' +
            '</div>\n' +
            '<input id="MaintypeSelect_' + Iter + '" class="form-control" onclick="this.blur()" type="text" placeholder="Select type.." readonly>\n' +
            '<input id="MaintypeSelect_' + Iter + '_Result" class="form-control" onclick="this.blur()" type="text" readonly disabled>\n' +
            '</div>'
        );
        targetField = 'MaintypeSelect_' + Iter;
        iniateTree(Iter, appendLevel, criteria, targetField); //open tree to select value and add variable to form after
    }
    ;
    if (criteria == 'timespan') { //if timespan append form with value fields
        //set global vars for button
        UnsetGlobalVars();
        Globalcriteria = criteria;
        GlobalappendLevel = appendLevel;
        Globaliter = Iter;

        $('#Form' + Iter).append(
            '<div id="TimespanSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">\n' +
            '<div class="input-group-prepend">\n' +
            '<span class="input-group-text dim-label">Timespan min: </span>\n' +
            '</div>\n' +
            '<input id="valMin_' + Iter + '" class="form-control value-input" type="text">\n' +
            '<span class="input-group-text input-group-middle">max: </span>\n' +
            '<input id="valMax_' + Iter + '" class="form-control value-input" type="text">\n' +
            '<div class="input-group-append">\n' +
            '<button class="btn btn-secondary btn-sm" type="button" id="timespanbutton_' + Iter + '" onclick="searchTime(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for timespan">\n' +
            'Validate\n' +
            '</button>\n' +
            '</div>\n' +
            '</div>'
        );
        /*timestring = $('#SQL' + Iter).val();
        var $MinTime = $('#valMin_' + Iter);
        var $MaxTime = $('#valMax_' + Iter);
        $MinTime.add($MaxTime).on('input', function () {
            var val1 = $('#valMin_' + Iter).val();
            var val2 = $('#valMax_' + Iter).val();
            var SQLString = ('is between ' + val1 + ' and ' + val2);
            $('#SQL' + Iter).val(timestring + SQLString);
            console.log(SQLString);
        });*/
    }
    ;

    if (criteria == 'dimension') {//if dimension append form with select
        UnsetGlobalVars();
        Globalcriteria = criteria;
        GlobalappendLevel = appendLevel;
        Globaliter = Iter;
        $('#Form' + Iter).append(
            '<div id="DimensionSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">\n' +
            '<select class="custom-select  dim-label empty" id="DimensionSelect_' + Iter + '">\n' +
            '<option selected disabled>Select dimension...</option>\n' +
            '<option value="15679">Height/Depth (cm)</option>\n' +
            '<option value="26189">Length (cm)</option>\n' +
            '<option value="26188">Width (cm)</option>\n' +
            '<option value="26191">Diameter (cm)</option>\n' +
            '<option value="26190">Thickness (cm)</option>\n' +
            '<option value="26192">Orientation (°)</option>\n' +
            '<option value="118730">Azimuth (°)</option>\n' +
            '<option value="15680">Weight (g)</option>\n' +
            '</select>\n' +
            '</div>'
        );
        $('#DimensionSelect_' + Iter).on('change', function () {
            $('#DimensionSelect_' + Iter).prop('disabled', true); //disable input
            $('#DimensionSelect_' + Iter + '_parent').append(//append input of values
                '<span class="input-group-text input-group-middle">min: </span>\n' +
                '<input id="valMin_' + Iter + '" class="form-control value-input" type="text">\n' +
                '<span class="input-group-text input-group-middle">max: </span>\n' +
                '<input id="valMax_' + Iter + '" class="form-control value-input" type="text">\n' +
                '<div class="input-group-append">\n' +
                '<button class="btn btn-secondary btn-sm" type="button" id="dimMatButton_' + Iter + '" onclick="searchDimMat(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for dimension">\n' +
                'Validate\n' +
                '</button>\n' +
                '</div>'
            );
            $('#SQL' + Iter).val($('#SQL' + Iter).val() + ' is "' + $('#DimensionSelect_' + Iter + ' option:selected').text() + '"');
            $("#Heading" + Iter).html($('#SQL' + Iter).val());
        });
    }
    ;

    if (criteria == 'material') { //if material append form with tree select
        $('#Form' + Iter).append(
            '<div id="MaterialSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">\n' +
            '<div class="input-group-prepend">\n' +
            '<span id="MaterialSelect_' + Iter + '" class="input-group-text"></span>\n' +
            '</div>\n' +
            '</div>'
        );
        targetField = 'MaterialSelect_' + Iter;
        iniateTree(Iter, appendLevel, criteria, targetField);
    }
    ;
}

function appendMaterial(Iter) { //append value input after material is chosen
    $('#MaterialSelect_' + Iter + '_parent').append(
        '<span class="input-group-text input-group-middle">% min: </span>\n' +
        '<input id="valMin_' + Iter + '" class="form-control value-input" type="text">\n' +
        '<div class="input-group-append">\n' +
        '<span class="input-group-text input-group-middle">% max: </span>\n' +
        '</div>\n' +
        '<input id="valMax_' + Iter + '" class="form-control value-input" type="text">\n' +
        '<div class="input-group-append">\n' +
        '<button class="btn btn-secondary btn-sm" type="button" id="dimMatButton_' + Iter + '" onclick="searchDimMat(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for dimension">\n' +
        'Validate\n' +
        '</button>\n' +
        '</div>'
    );
}

//search functions depending on criteria
function searchDimMat(criteria, appendLevel, iter, val1, val2) {
    val1 = $('#valMin_' + iter).val();
    val2 = $('#valMax_' + iter).val();
    goOn = validateNumbers(val1, val2, criteria);
    if (goOn) {
        if (val1 == '') {
            val1 = 0;
        }
        ;
        if (criteria == 'material' && val2 == '') {
            val2 = 100;
        }
        ;
        if (criteria == 'dimension' && val2 != '') {
            var SQLString = (' minumum ' + val1 + ' and maximum ' + val2)
        }
        ;

        if (criteria == 'dimension' && val2 == '') {
            val2 = 9999999999999999999999999999999999999999999999999999999999999999999999999999999999999;
            var SQLString = (' minumum ' + val1)
        }
        ;

        $('#dimMatButton_' + iter).prop('disabled', true);
        $('#valMin_' + iter).prop('disabled', true);
        $('#min' + iter).val(val1);
        $('#valMax_' + iter).prop('disabled', true);
        $('#max' + iter).val(val2);
        dimId = $('#DimensionSelect_' + iter + ' option:selected').val(); //set criteria variable
        if (criteria == 'material') {
            var SQLString = (' between ' + val1 + '% and ' + val2 + '%')
            dimId = nodeIds;
        };
        if (criteria == 'dimension') dimId = $('#DimensionSelect_' + iter + ' option:selected').val().toLowerCase();
        $('#type' + iter).val(dimId);
        $('#SQL' + iter).val($('#SQL' + iter).val() + SQLString);
        $("#Heading" + Iter).html($('#SQL' + Iter).val());

    }
    ;
}

function searchTime(criteria, appendLevel, iter, val1, val2) {
    val1 = $('#valMin_' + iter).val();
    val2 = $('#valMax_' + iter).val();
    nodeIds = [];
    goOn = validateNumbers(val1, val2, criteria);
    if (goOn) {
        $('#timespanbutton_' + iter).prop('disabled', true);
        $('#valMin_' + iter).prop('disabled', true);
        $('#valMax_' + iter).prop('disabled', true);
        $('#min' + iter).val(val1);
        $('#max' + iter).val(val2);
        var SQLString = (' is between ' + val1 + ' and ' + val2)
        $('#SQL' + iter).val($('#SQL' + iter).val() + SQLString);
        $("#Heading" + Iter).html($('#SQL' + Iter).val());
    }
    ;
}

function returnQuerystring() {
    var mylevel = $('#level' + Iter).val();
    var mycriteria = $('#criteria' + Iter).val();
    var mymin = $('#min' + Iter).val();
    var mymax = $('#max' + Iter).val();
    var mytypes = $('#type' + Iter).val();
    console.log (mylevel + ', ' + mycriteria + ', ' + mymin + ', ' + mymax + ', ' + mytypes);
    system_type = mylevel;
    if (mylevel == 'burial_site') system_type = 'place';
    if (mylevel == 'strat') system_type = 'stratigraphic unit';

    if (mycriteria == 'maintype' || mycriteria == 'type') {
        querystring = 'SELECT * FROM thanados.searchData WHERE system_type = \'' + system_type + '\' AND type_id IN (' + mytypes + ')'
    }
    if (mycriteria == 'timespan') {
        querystring = 'SELECT * FROM thanados.searchData WHERE system_type = \'' + system_type + '\' AND type_id = 0 AND min >= ' + mymin + ' AND max <= ' + mymax + ''
    }
    if (mycriteria == 'dimension' || mycriteria == 'material') {
        querystring = 'SELECT * FROM thanados.searchData WHERE system_type = \'' + system_type + '\' AND type_id IN (' + mytypes + ') AND min >= ' + mymin + ' AND max <= ' + mymax + ''
    }
    console.log(querystring);
    return(querystring);
}

$('#ajax')

function ajaxTest(param) {
    $.ajax({
        type: 'POST',
        url: '/ajax/test',
        data: 'param=' + param,
        success: function (result) {
            $('#ajaxresult').html(result);
        }
    });
}



