$('#nav-search').addClass('activePage')

$(document).ready(function () {
    //$(".sortable").sortable();
    //$(".sortable").disableSelection();
    maximumHeight = ($(window).height() - $('#mynavbar').height())
    containerheight = ($(window).height() - $('#mynavbar').height() - 15)
    $('#mycontent').css('max-height', (maximumHeight - 15) + 'px');
    local = false;
    mymodalwith = ($(window).width());
    if (mymodalwith > 500) mymodalwith = 500;
    Queryclass = 'nix';
    ComboSearchString = 'no';
    getBasemaps();
    if (($(window).width()) > 550) dialogPosition = {my: "left+20 top+20", at: "left top", of: "body"}
    if (($(window).width()) <= 550) dialogPosition = {my: "left top", at: "left top", of: "body"}
});

$(window).resize(function () {
    //$(".sortable").sortable();
    //$(".sortable").disableSelection();
    maximumHeight = ($(window).height() - $('#mynavbar').height())
    $('#mycontent').css('max-height', (maximumHeight - 15) + 'px');
    local = false;
    mymodalwith = ($(window).width());
    if (mymodalwith > 500) mymodalwith = 500;
    if (($(window).width()) > 550) dialogPosition = {my: "left+20 top+20", at: "left top", of: "body"}
    if (($(window).width()) <= 550) dialogPosition = {my: "left top", at: "left top", of: "body"}
});

$('#AddSearch').click(function () {
    Iter = (Iter + 1);
    ComboSearchString = 'no';
    addSearch()
});


$(window).resize(function () {
    maximumHeight = ($(window).height() - $('#mynavbar').height());
    $('#mycontent').css('max-height', (maximumHeight - 15) + 'px');
});

Iter = 1;

function addSearch() {
    $('.combosearchdropdown').addClass('disabled');
    $('#AddSearch').addClass('d-none');
    $("#mySearchCards").append(
        '<div id="Query' + Iter + '" class="card mb-3" style="width: 100%;">\n' +
        '<div class="card-header" id="heading' + Iter + '">\n' +
        '                <h5 class="mb-0">\n' +
        '                    <button id="Heading' + Iter + '" class="btn btn-link text-left" type="button" data-toggle="collapse"\n' +
        '                            data-target="#collapseQuery_' + Iter + '" aria-expanded="true"\n' +
        '                            aria-controls="collapseQuery_' + Iter + '">\n' +
        '                        Search' +
        '                    </button>\n' +
        '    <div class="float-right">\n' +
        '        <button id="ResetBtn' + Iter + '" class="btn btn-link myResetbutton d-none" type="button" value="' + Iter + '" class="card-link">Remove</button>\n' +
        '        <button id="RemoveBtn' + Iter + '" class="btn btn-link myRemovebutton d-none" type="button" value="' + Iter + '" class="card-link">Remove</button>\n' +
        '    </div>\n' +
        '                </h5>\n' +
        '            </div>\n' +
        '<div id="collapseQuery' + Iter + '" aria-labelledby="heading' + Iter + '">\n' +
        '<div id="collapseQuery_' + Iter + '" aria-labelledby="heading' + Iter + '" class="collapse show">\n' +
        '    <div class="card-body">\n' +
        '        <div id="Form' + Iter + '" ></div>\n' +
        '        <div class="input-group mb-3 d-none">\n' +
        '                            <textarea readonly id="SQL' + Iter + '" class="form-control" aria-label="Selected sites" placeholder="Query statement"></textarea>\n' +
        '        </div>\n' +
        '    </div>' +
        '    </div>' +
        '    <div class="card-header" style="border-top: 1px solid rgba(0, 0, 0, 0.125); display: none" id="headingb' + Iter + '">' +
        '        <h5 class="mb-0">\n' +
        '            <button id="Resultlist' + Iter + '" class="btn btn-link" type="button" data-toggle="collapse"\n' +
        '                            data-target="#collapseList' + Iter + '" aria-expanded="true"\n' +
        '                            aria-controls="collapseList' + Iter + '">\n' +
        '                        Results' +
        '            </button>\n' +
        '        </h5>\n' +
        '    </div>' +
        '    <div data-map="map' + Iter + '" id="collapseList' + Iter + '" style="display: none" class="resultCard collapse show" aria-labelledby="headingb' + Iter + '">\n' +
        '        <div class="card-body row">' +
        '          <div class="col-lg">' +
        '            <table id="myResultlist' + Iter + '" class="display table table-striped table-bordered w-100">' +
        '                    <thead>\n' +
        '                    <tr>\n' +
        '                        <th>Name</th>\n' +
        '                        <th>Type</th>\n' +
        '                        <th id="Min_' + Iter + '">Begin</th>\n' +
        '                        <th>End</th>\n' +
        '                        <th>Context</th>\n' +
        '                    </tr>\n' +
        '                    </thead>' +
        '            </table>' +
        '          </div>' +
        '        <div class="col-lg">' +
        '            <div class="m-1 map" id="map' + Iter + '" style="height: 100%; min-height: 500px; min-width: 300px"></div>' +
        '        </div>' +
        '      </div>' +
        '    <div class="float-right card-body btn-toolbar">\n' +
        '           <button value="' + Iter + '" type="button" onclick="currentBtn = this.value; getCitation()" title="how to cite this" class="mr-2 btn btn-secondary combosearchdropdown">\n' +
        '                            <i class="fas fa-quote-right"></i>\n' +
        '           </button>'+
        '       <div class="dropdown">' +
        '           <button class="btn btn-secondary dropdown-toggle combosearchdropdown" type="button" id="dropdownMenuButton' + Iter + '" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
        '               Combine search' +
        '           </button>' +
        '               <div class="dropdown-menu" aria-labelledby="dropdownMenuButton' + Iter + '">' +
        '                   <button id="AndSearch' + Iter + '" class="dropdown-item andSearchBtn" value="' + Iter + '" onclick="oldIter = this.value; combinate(\'and\')">And</button>' +
        '                   <button id="OrSearch' + Iter + '" class="dropdown-item orSearchBtn" value="' + Iter + '" onclick="oldIter = this.value; combinate(\'or\')">Or</button>' +
        '                   <button id="NotSearch' + Iter + '" class="dropdown-item notSearchBtn" value="' + Iter + '" onclick="oldIter = this.value; combinate(\'and not\')">Not</button>' +
        '               </div>' +
        '       </div>' +
        '    </div>\n' +
        '</div>' +
        '<div style="display: none">' +
        '<div id="variables" class="row">' +
        '<input class="col" type=text id="level' + Iter + '">' +
        '<input class="col" type=text id="criteria' + Iter + '">' +
        '<input class="col" type=text id="type' + Iter + '">' +
        '<input class="col" type=text id="min' + Iter + '">' +
        '<input class="col" type=text id="max' + Iter + '">' +
        '</div>' +
        '<div class="row">' +
        '<div class="col-lg">' +
        '<textarea id="ajaxresult' + Iter + '" style="width: 100%"></textarea>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>\n' +
        '</div>\n' +
        '</div>');

    $(".resultCard").mouseleave(function () {
        var thismap = ($(this).data('map'))
        //console.log(thismap);
        if (typeof(hovermarker) !== 'undefined') {
                hovermarker.removeFrom(eval(thismap))
        }
    })

    $(".myResetbutton").click(function f() {
        $("#Query" + this.value).remove();
        $("#AddSearch").removeClass('d-none');
        $(".combosearchdropdown").removeClass('disabled');
    });

    $(".myRemovebutton").click(function f() {
        $("#Query" + this.value).remove();
        $(".combosearchdropdown").removeClass('disabled');
    });

    $(".mySearchbutton").click(function f() {
        $("#Heading" + Iter).html($('#SQL' + Iter).val());
    });
    appendSearch();
}

function scrollToElement(where) {
    $('#Query' + Iter)[0].scrollIntoView(
        {
            behavior: "smooth", // or "auto" or "instant"
            block: where
        }
    );
}


function appendSearch() {//append search form to dialog
    $('#Form' + Iter).append(
        //selection for search level: grave, burial or find
        '<div id="LevelSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">\n' +
        '<div class="input-group-prepend">\n' +
        '<label class="input-group-text" for="LevelSelect_' + Iter + '">1. </label>\n' +
        '</div>\n' +
        '<select class="custom-select empty" title="Select whether to search for cemeteries, graves, burials (=human remains) or finds" id="LevelSelect_' + Iter + '">\n' +
        '<option selected disabled>Select search level...</option>\n' +
        '<option value="burial_site">Cemeteries</option>\n' +
        '<option value="feature">Graves</option>\n' +
        '<option value="strat">Burials</option>\n' +
        '<option value="find">Finds</option>\n' +
        '</select>\n' +
        '</div>');
    scrollToElement('start');

    //after main level is selected:
    $('#LevelSelect_' + Iter).on('change', function () {
        $('#ResetBtn' + Iter).removeClass('d-none');
        appendLevel = $('#LevelSelect_' + Iter + ' option:selected').val(); //set level as variable
        appendLevelName = $('#LevelSelect_' + Iter + ' option:selected').html(); //set level as variable
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
            '<option title="Main type of ' + appendLevelName + '" value="maintype">Maintype</option>' +
            '<option title="Classifications, typology and other named types associated with ' + appendLevelName + '" value="type">Properties</option>' +
            '<option title="Date range of ' + appendLevelName + '" value="timespan">Timespan</option>' +
            '<option title="Dimensions and certain other measured values concerning the spatial extend of ' + appendLevelName + '" value="dimension">Dimensions</option>' +
            '<option title="Materials (like copper, iron, ceramics etc.) of ' + appendLevelName + '" value="material">Material</option>' +
            '<option title="Classifications of entities that are connected with values (e.g. maximum age, body height etc.)" value="value">Value property</option>' +
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
    if (criteria === 'maintype' || criteria === 'type') { //if maintype or type append form with tree select
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
        initiateTree(Iter, appendLevel, criteria, targetField); //open tree to select value and add variable to form after
    }

    if (criteria === 'timespan') { //if timespan append form with value fields
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
            '<input title="start year (CE) of the entity\'s dating" id="valMin_' + Iter + '" class="form-control value-input" type="text">\n' +
            '<span class="input-group-text input-group-middle">max: </span>\n' +
            '<input title="end year (CE) of the entity\'s dating" id="valMax_' + Iter + '" class="form-control value-input" type="text">\n' +
            '<div class="input-group-append">\n' +
            '<button class="btn btn-secondary btn-sm" type="button" id="timespanbutton_' + Iter + '" onclick="searchTime(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for timespan">\n' +
            'Search\n' +
            '</button>\n' +
            '</div>\n' +
            '</div>'
        );
    }


    if (criteria === 'dimension') {//if dimension append form with select
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
            '<option title="Orientation represents the clockwise angle between North and the directed axis of the entity. E.g. between North and a skeleton\'s axis (from head to feet)" value="26192">Orientation (°)</option>' +
            '<option title="Azimuth represents the smallest angle between north and the non directed axis of an entity. E.g. beetween North and a grave pit\'s axis" value="118730">Azimuth (°)</option>' +
            '<option value="15680">Weight (g)</option>\n' +
            '</select>\n' +
            '</div>'
        );
        $('#DimensionSelect_' + Iter).on('change', function () {
            $('#DimensionSelect_' + Iter).prop('disabled', true); //disable input
            $('#DimensionSelect_' + Iter + '_parent').append(//append input of values
                '<span class="input-group-text input-group-middle">min: </span>\n' +
                '<input title="minumum value of the dimension to search for. Leave blank if you want to get all entities with any value of this type" id="valMin_' + Iter + '" class="form-control value-input" type="text">\n' +
                '<span class="input-group-text input-group-middle">max: </span>\n' +
                '<input title="maximum value of the dimension to search for. Leave blank if you want to get all entities with any value of this type" id="valMax_' + Iter + '" class="form-control value-input" type="text">\n' +
                '<div class="input-group-append">\n' +
                '<button class="btn btn-secondary btn-sm" type="button" id="dimMatButton_' + Iter + '" onclick="searchDimMat(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for dimension">\n' +
                'Search\n' +
                '</button>\n' +
                '</div>'
            );
            $('#SQL' + Iter).val($('#SQL' + Iter).val() + ' is "' + $('#DimensionSelect_' + Iter + ' option:selected').text() + '"');
            $("#Heading" + Iter).html($('#SQL' + Iter).val());
        });
    }

    if (criteria === 'material' || criteria === 'value') { //if material append form with tree select
        $('#Form' + Iter).append(
            '<div id="MaterialSelect_' + Iter + '_parent" class="input-group input-group-sm mb-3">\n' +
            '<div class="input-group-prepend">\n' +
            '<span id="MaterialSelect_' + Iter + '" class="input-group-text"></span>\n' +
            '</div>\n' +
            '</div>'
        );
        targetField = 'MaterialSelect_' + Iter;
        initiateTree(Iter, appendLevel, criteria, targetField);
    }
}

function appendMaterial(Iter) { //append value input after material is chosen
    $('#MaterialSelect_' + Iter + '_parent').append(
        '<span class="input-group-text input-group-middle">min: </span>\n' +
        '<input title="minimum value of the criteria to search for. In case of material this can be left blank if you want to get all entities with any value of this material" id="valMin_' + Iter + '" class="form-control value-input" type="text">\n' +
        '<div class="input-group-append">\n' +
        '<span class="input-group-text input-group-middle">max: </span>\n' +
        '</div>\n' +
        '<input title="maximum value of the criteria to search for. In case of material this can be left blank if you want to get all entities with any value of this material" id="valMax_' + Iter + '" class="form-control value-input" type="text">\n' +
        '<div class="input-group-append">\n' +
        '<button class="btn btn-secondary btn-sm" type="button" id="dimMatButton_' + Iter + '" onclick="searchDimMat(Globalcriteria, GlobalappendLevel, Globaliter, Globalval, Globalval2)" title="Search for selected criteria">\n' +
        'Search\n' +
        '</button>\n' +
        '</div>'
    );
}

//search functions depending on criteria
function searchDimMat(criteria, appendLevel, iter, val1, val2) {
    SQLString = '';
    val1 = $('#valMin_' + iter).val();
    val2 = $('#valMax_' + iter).val();
    goOn = validateNumbers(val1, val2, criteria);
    if (goOn) {
        if (val1 === '') {
            val1 = 0;
        }

        if (criteria === 'material' && val2 === '') {
            val2 = 100;
        }

        if (criteria === 'dimension' && val2 !== '') {
            SQLString = (' minumum ' + val1 + ' and maximum ' + val2);
        }


        if (criteria === 'dimension' && val2 === '') {
            val2 = 9999999999999999999999999999999999999999999999999999999999999999999999999999999999999;
            SQLString = (' minumum ' + val1);
        }


        $('#dimMatButton_' + iter).prop('disabled', true);
        $('#valMin_' + iter).prop('disabled', true);
        $('#min' + iter).val(val1);
        $('#valMax_' + iter).prop('disabled', true);
        $('#max' + iter).val(val2);
        dimId = $('#DimensionSelect_' + iter + ' option:selected').val(); //set criteria variable
        if (criteria === 'material') {
            SQLString = (' between ' + val1 + '% and ' + val2 + '%');
            dimId = nodeIds;
        }

        if (criteria === 'value') {
            SQLString = (' between ' + val1 + ' and ' + val2);
            dimId = nodeIds;
        }

        if (criteria === 'dimension') dimId = $('#DimensionSelect_' + iter + ' option:selected').val().toLowerCase();
        $('#type' + iter).val(dimId);
        $('#SQL' + iter).val($('#SQL' + iter).val() + SQLString);
        $("#Heading" + Iter).html($('#SQL' + Iter).val());
        returnQuerystring();
    }
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
        SQLString = (' is between ' + val1 + ' and ' + val2);
        $('#SQL' + iter).val($('#SQL' + iter).val() + SQLString);
        $("#Heading" + Iter).html($('#SQL' + Iter).val());
        returnQuerystring();
    }
}

function returnQuerystring() {
    $('#ResetBtn' + Iter).addClass('d-none');
    $('#RemoveBtn' + Iter).removeClass('d-none');
    $('#AddSearch').removeClass('d-none');
    mylevel = $('#level' + Iter).val();
    mycriteria = $('#criteria' + Iter).val();
    mymin = $('#min' + Iter).val();
    mymax = $('#max' + Iter).val();
    mytypes = $('#type' + Iter).val();
    system_type = mylevel;
    if (mylevel === 'burial_site') system_type = 'place';
    if (mylevel === 'strat') system_type = 'stratigraphic unit';
    $('#headingb' + Iter).toggle();
    $('#Resultlist' + Iter).html('<span class="spinner-border spinner-border-sm mr-3" role="status" aria-hidden="true"></span>...Search in progress');
    $.ajax({
        type: 'POST',
        url: '/ajax/test',
        data: {
            'system_type': system_type,
            'types': mytypes,
            'criteria': mycriteria,
            'min': mymin,
            'max': mymax
        },
        success: function (result) {
            //$('#ajaxresult' + Iter).html(JSON.stringify(result));
            if (result === null) {
                $('#Resultlist' + Iter).html('No results for this search');
                return false
            } else {
                if (Queryclass !== 'nix') {
                    eval('result_' + Iter + '= JSON.parse(JSON.stringify(CombinedSearch(oldresult, oldLevel, result, mylevel).json));');
                    if (eval('result_' + Iter).length === 0) {
                        $('#Resultlist' + Iter).html('No results for this search');
                        return false
                    }
                    if (ComboSearchString !== 'no') {
                        connectionString = ((CombinedSearch(oldresult, oldLevel, result, mylevel)).connection);
                        ComboSearchString = ComboSearchString.replace(/Search for /, '');
                        $("#Heading" + Iter).html($("#Heading" + Iter).html() + '<br>' + Queryclass + connectionString + ': ' + ComboSearchString);
                    }
                    Queryclass = 'nix';
                } else {
                    eval('result_' + Iter + '= JSON.parse(JSON.stringify(result));');
                }
                $('#Resultlist' + Iter).html('Results (' + eval('result_' + Iter + '.length') + ')');
                eval('setdatatable(result_' + Iter + ', ' + Iter + ');');
                $('#collapseList' + Iter).toggle();
                eval('map' + Iter).invalidateSize()
                eval('map' + Iter + '.fitBounds(markers' + Iter + '.getBounds());')
                eval('table' + Iter).draw();
                scrollToElement('start');
            }
        }
    });
    $('#collapseQuery_' + Iter).collapse();
    $('.combosearchdropdown').removeClass('disabled');
}

function CombinedSearch(oldresult, oldLevel, newresult, newLevel) {

    if (oldLevel === newLevel) {
        oldId = 'id';
        newId = 'id';
        connectionString = '';
    }

    if (oldLevel === 'burial_site') {
        if (newLevel === 'feature' || newLevel === 'strat' || newLevel === 'find') {
            oldId = 'id';
            newId = 'site_id';
            connectionString = ' found in';
        }
    }

    if (oldLevel === 'feature' || oldLevel === 'strat' || oldLevel === 'find') {
        if (newLevel === 'burial_site') {
            oldId = 'site_id';
            newId = 'id';
            connectionString = ' containing';
        }
    }

    if (oldLevel === 'feature') {
        if (newLevel === 'find') {
            oldId = 'id';
            newId = 'grave_id';
            connectionString = ' found in';
        }
    }

    if (oldLevel === 'strat' || oldLevel === 'find') {
        if (newLevel === 'feature') {
            oldId = 'grave_id';
            newId = 'id';
            connectionString = ' containing';
        }
    }

    if (oldLevel === 'strat') {
        if (newLevel === 'find') {
            oldId = 'id';
            newId = 'burial_id';
            connectionString = ' found in';
        }
    }

    if (oldLevel === 'find') {
        if (newLevel === 'strat') {
            oldId = 'burial_id';
            newId = 'id';
            connectionString = ' containing';
        }
    }


    intersectionIds = [];
    $.each(oldresult, function (i, dataset) {
        intersectionIds.push(eval('dataset.' + oldId))
    });

    myresult = [];
    $.each(newresult, function (i, dataset) {

        if (Queryclass === 'and' && intersectionIds.includes(eval('dataset.' + newId))) {
            myresult.push(dataset)
        }

        if (Queryclass === 'and not') {
            if (intersectionIds.includes(eval('dataset.' + newId)) === false) {
                myresult.push(dataset);
            }
        }
    });
    if (Queryclass === 'or') {
        $.each(newresult, function (i, dataset) {
            oldresult.push(dataset);
        })
        myresult = oldresult;
    }

    myreturnobject = {};
    myreturnobject.json = myresult;
    myreturnobject.connection = connectionString;
    return (myreturnobject);


}

function setdatatable(data, tablePosition) {
    var mymarkers = new L.featureGroup([]);
    var heatmarkers = [];
    var table = $('#myResultlist' + Iter).DataTable({
        data: data,
        drawCallback: function () {
            $('a[rel=popover]').popover({
                html: true,
                trigger: 'hover',
                placement: 'right',
                container: '#myResultlist' + tablePosition + '_wrapper',
                content: function () {
                    return '<img class="popover-img" src="' + $(this).data('img') + '" alt=""/>';
                }
            });
        },
        "pagingType": "numbers",
        "lengthMenu": [10],
        "bLengthChange": false,
        "scrollX": true,

        /*columnDefs: [{
            targets: 4,
            render: $.fn.dataTable.render.ellipsis(29, true)
        }],*/

        columns: [
            {
                data: "name",
                "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                    if (oData.file === null) $(nTd).html("<a id='" + oData.id + "' onmouseover='hoverMarker(this.id, " + 'map' + Iter + ")' data-latlng='[" + ([((oData.lon)), ((oData.lat))]) + "]' href='/entity/" + oData.id + "' title='" + oData.maintype + " ' target='_blank'>" + oData.name + "</a>");
                    if (oData.file !== null) $(nTd).html("<a id='" + oData.id + "' onmouseover='hoverMarker(this.id, " + 'map' + Iter + ")' data-latlng='[" + ([((oData.lon)), ((oData.lat))]) + "]' href='/entity/" + oData.id + "' title='" + oData.maintype + " ' target='_blank'>" + oData.name + "</a>" +
                        "<a class='btn-xs float-right' rel='popover' data-img='" + oData.file + "'><i class='fas fa-image'></i></a>"); //create links in rows
                }
            },
            {
                data: 'type',
                "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                    $(nTd).html("<div title='" + oData.path + "'>" + oData.type + "</div> ");
                    if (mycriteria === 'type' || mycriteria === 'maintype') myPopupLine = '<a href="/entity/' + oData.id + '" title="' + oData.maintype + '" target="_blank"><b>' + oData.context + '</b></a><br><br><i title="' + oData.path + '">' + oData.type + '</i>'
                    if (mycriteria === 'timespan') myPopupLine = '<a href="/entity/' + oData.id + '" title="' + oData.maintype + '" target="_blank"><b>' + oData.context + '</b></a><br><br><i>Timespan: ' + oData.min + ' to ' + oData.max + '</i>'
                    if (mycriteria === 'dimension') myPopupLine = '<a href="/entity/' + oData.id + '" title="' + oData.maintype + '" target="_blank"><b>' + oData.context + '</b></a><br><br><i title="' + oData.path + '">' + oData.type + ': ' + oData.min + '</i>'
                    if (mycriteria === 'material') {
                        matString = oData.type;
                        if (oData.min > 0) matString = oData.type + ': ' + oData.min + '%';
                        myPopupLine = '<a href="/entity/' + oData.id + '" title="' + oData.maintype + '" target="_blank"><b>' + oData.context + '</b></a><br><br><i title="' + oData.path + '">' + matString + '</i>'
                    }
                    if (mycriteria === 'value') myPopupLine = '<a href="/entity/' + oData.id + '" title="' + oData.maintype + '" target="_blank"><b>' + oData.context + '</b></a><br><br><i title="' + oData.path + '">' + oData.type + ': ' + oData.min + '</i>'

                    //create markers
                    marker = L.marker([((oData.lon)), ((oData.lat))], {title: (oData.context)}).addTo(mymarkers).bindPopup(myPopupLine);
                    heatmarkers.push([JSON.parse(oData.lon) + ',' + JSON.parse(oData.lat)]);
                }
            },
            {
                data: 'min',
                "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                    valueMin = oData.min;
                    if (oData.min === 0 && mycriteria === 'material') var valueMin = '';
                    if (oData.min > 0 && mycriteria === 'material') var valueMin = oData.min + '%';
                    $(nTd).html(valueMin);
                }
            },
            {data: 'max'},
            {data: 'context'}
        ],
    });
    eval('table' + Iter + '= table');
    if (mycriteria === 'type' || criteria === 'maintype') table.columns([2, 3]).visible(false);
    if (mycriteria === 'material' || mycriteria === 'dimension' || mycriteria === 'value') {
        table.columns([3]).visible(false);
        $('#Min_' + Iter).html('Value');
    }
    $('#collapseList' + Iter).on('shown.bs.collapse', function () {
        //table.draw();
    });
    //table.draw();
    setmymap(mymarkers, heatmarkers);
}

function setmymap(markers, heatmarkers) {
//define basemaps

    //initiate markers
    var clustermarkers = L.markerClusterGroup({
        singleMarkerMode: true,
        maxClusterRadius: 0,

    });

    eval('landscape' + Iter + ' = jQuery.extend(true, {}, landscape);');
    eval('streets' + Iter + ' = jQuery.extend(true, {}, streets);');
    eval('satellite' + Iter + ' = jQuery.extend(true, {}, satellite);');


    markers.addTo(clustermarkers);
    eval('markers' + Iter + '= markers;')


    eval('map' + Iter + ' = L.map(\'map\' + Iter, {fullscreenControl: true, maxZoom: 20, zoomControl: false, layers: [landscape' + Iter + ']}).fitBounds(markers.getBounds());')

    clustermarkers.addTo((eval('map' + Iter)));


    var myMap = eval('map' + Iter);
    var mydiv = '#map' + Iter;
    eval('var attrib' + Iter + ' = landscape' + Iter + '.options.attribution;')
    MultAttributionChange(myMap, mydiv, eval('attrib' + Iter));

    (eval('map' + Iter)).on('baselayerchange', function (layer) {
        var attrib = layer.layer.options.attribution
        MultAttributionChange(myMap, mydiv, attrib);
    });

    (eval('map' + Iter)).fitBounds(markers.getBounds());

    //initiate markers
    var heatmarkersNew = JSON.parse(JSON.stringify(heatmarkers).replace(/"/g, ''));
    heat = L.heatLayer(heatmarkersNew, {radius: 25, minOpacity: 0.5, blur: 30});

    eval('resultpoints' + Iter + ' = new L.LayerGroup();');

    eval('createResult(result_' + Iter + ', ' + Iter + ')')

    var groupedOverlays = {
        "Search Results": {
            "Clustered": clustermarkers,
            "Single": eval('resultpoints' + Iter),
        },
        "Visualisations": {
            "Density": heat
        }
    };

    var options = {
        groupCheckboxes: false
    };

    eval('MyBaseLayers' + Iter + ' = {"Landscape": landscape' + Iter + ', "Satellite": satellite' + Iter + ', "Streets": streets' + Iter + '};');


    // Use the custom grouped layer control, not "L.control.layers"
    eval('layerControl' + Iter + ' = L.control.groupedLayers(MyBaseLayers' + Iter + ', groupedOverlays, options)');
    eval('map' + Iter + '.addControl(layerControl' + Iter + ')');

    L.control.scale({imperial: false}).addTo((eval('map' + Iter)));//scale on map
    (eval('map' + Iter)).invalidateSize();

    L.easyButton({
        id: '' + Iter + '',  // an id for the generated button
        position: 'topleft',      // inherited from L.Control -- the corner it goes in
        type: 'replace',          // set to animate when you're comfy with css
        leafletClasses: true,     // use leaflet classes to style the button?
        states: [{                 // specify different icons and responses for your button
            stateName: 'get-center',
            onClick: function (button, map) {
                currentID = button.options.id;
                openStyleDialog('single');
            },
            title: 'style options for search results (single)',
            icon: 'fas fa-palette'
        }]
    }).addTo(eval('map' + Iter));

    L.Control.Batn = L.Control.extend({
        onAdd: function (map) {
            var div = L.DomUtil.create('div', 'leaflet-bar easy-button-container');
            div.innerHTML = '<div onmouseover="$(this).children(\'ul\').css(\'display\', \'block\')" onmouseout="$(this).children(\'ul\').css(\'display\', \'none\')">' +
                '<a title="Download Data" style="background-size: 16px 16px; cursor: pointer; border-top-right-radius: 2px; border-bottom-right-radius: 2px;">' +
                '<span class="fas fa-download"></span>' +
                '</a>' +
                '<ul class="easyBtnHolder">' +
                '<li class="d-inline-block"><a class="csvDownload" title="Download search result as CSV file" data-iter="' + Iter + '"><i class="fas fa-list-alt"></i></a></li>' +
                '<li class="d-inline-block"><a class="jsonDownload" title="Download search result as GeoJSON file" data-iter="' + Iter + '"><i class="fas fa-map-marker-alt"></i></a></li>' +
                '</ul>' +
                '</div>';

            return div;
        },
        onRemove: function (map) {
            // Nothing to do here
        }
    });
    L.control.batn = function (opts) {
        return new L.Control.Batn(opts);
    }

    L.control.batn({position: 'topleft'}).addTo(eval('map' + Iter));


    printMapbutton(('map' + Iter), 'topleft');

    $('.jsonDownload').click(function f() {
        var currentId = $(this).data('iter');
        exportToJsonFile(eval('myGeoJSON' + currentId));
    })

    $('.csvDownload').click(function f() {
        var currentId = $(this).data('iter');
        createCSV(eval('myGeoJSON' + currentId));
    })
}

function createResult(data, iter) { //finish query and show results on map

    var jsonresult = {
        "type": "FeatureCollection", //prepare geojson
        "features": [],
        "query": $('#Heading' + iter).html(),
    };
    var uniqueSiteIds = [];
    $.each(data, function (i, dataset) {
        uniqueSiteIds.push(dataset.site_id);
    });

    var distinctResultIds = Array.from(new Set(uniqueSiteIds));
    $.each(distinctResultIds, function (i, dataset) {
        jsonresult.features.push({id: dataset});
    });

    $.each(sitelist, function (i, dataset) {
        $.each(jsonresult.features, function (i, feature) {
            if (feature.id === dataset.id) {
                feature.properties = {
                    name: dataset.name,
                    description: dataset.description,
                    type: dataset.type,
                    path: dataset.path,
                    begin: dataset.begin,
                    end: dataset.end
                }
                feature.geometry = {
                    "type": "Point",
                    "coordinates": [parseFloat(dataset.lat), parseFloat(dataset.lon)]
                }
                feature.type = "Feature"
                feature.search = []
            }
        })
    });

    $.each(jsonresult.features, function (i, feature) {
        $.each(data, function (i, dataset) {
            if (feature.id === dataset.site_id) {
                feature.search.push(dataset)
            }
        })
        feature.results = feature.search.length
    })

    eval('myGeoJSON' + iter + '  = JSON.parse(JSON.stringify(jsonresult))');
    resultrange = [];
    eval('customResult' + iter + ' = L.geoJSON(jsonresult, {' +
        'pointToLayer: function (feature, latlng) {' +
        'return L.circleMarker(latlng, myStyle)' +
        '},' +
        'onEachFeature: function (feature, layer) {' +
        'var myPopup = \'<a href="/entity/\' + feature.id + \'" title="\' + feature.properties.path + \'" target="_blank"><b>\' + feature.properties.name + \'</b></a><br><br><i>Search results here: \' + feature.results + \'</i>\';' +
        'layer.bindPopup(myPopup);' +
        '}' +
        '});');

    eval('resultpoints' + iter + '.clearLayers();');
    eval('resultpoints' + iter + '.addLayer(customResult' + iter + ');');
}

function createCSV(data) {
    var tmpArrayOrd = [];
    //console.log(data);
    $.each(data.features, function (i, feature) {
        $.each(feature.search, function (i, dataset) {
            var newDataset = [];
            newDataset.id = dataset.id;
            newDataset.name = dataset.name.replace(/"/g, '\'');
            newDataset.type = dataset.type.replace(/"/g, '\'');
            newDataset.type_id = dataset.type_id;
            newDataset.min = dataset.min;
            newDataset.max = dataset.max;
            newDataset.path = dataset.path.replace(/"/g, '\'');
            newDataset.maintype = dataset.maintype.replace(/"/g, '\'');
            newDataset.system_type = dataset.system_type;
            newDataset.context = dataset.context.replace(/"/g, '\'');
            newDataset.burial_id = dataset.burial_id;
            newDataset.grave_id = dataset.grave_id;
            newDataset.site_id = dataset.site_id;
            newDataset.easting = dataset.lat;
            newDataset.northing = dataset.lon;
            tmpArrayOrd.push(newDataset)
        })
    })
    var csv = toCSV(tmpArrayOrd);
    exportToCSV(csv)
}

function applyButton() {
    applyStyle(fillcolor, (1 - MyStyleOpacityVar / 100), mystylebordercolor, mystyleborderwidth);
    eval('if (typeof(customResult' + currentID + ') != "undefined") map' + currentID + '.removeLayer(customResult' + currentID + ');')
    eval('createResult(result_' + currentID + ', ' + currentID + ')');
    $('#styledialog').dialog('close');

}


//style polygons
myStyle = {
    "color": "#007bd9",
    "weight": 1,
    "fillOpacity": 0.5,
    "fillColor": "#007bd9"
};

myStyleSquare = {};

addSearch();

function combinate(operator) {
    oldLevel = $('#LevelSelect_' + oldIter).val();
    Queryclass = operator;
    oldresult = eval('result_' + oldIter);
    Iter = (Iter + 1);
    ComboSearchString = $('#Heading' + oldIter).html();
    addSearch();
}

function getCitation() {
    currentHeading = document.getElementById('Heading' + currentBtn);
    Search = currentHeading.innerText;
    mysource = Search.replace("Search", "Search result") + '.' + mycitation1.replace("After:", "");
    $('#mycitation').empty();
    $('#mycitation').html('<div style="border: 1px solid #dee2e6; border-radius: 5px; padding: 0.5em; color: #495057; font-size: 0.9em;" id="Textarea1">' + mysource + '</div>');
    $('#citeModal').modal();
}
