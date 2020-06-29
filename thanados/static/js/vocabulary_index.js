$(document).ready(function () {
    $('#nav-vocabulary').addClass('activePage')
    $('#mycontent').scroll(function () {
        if ($(this).scrollTop() > 50) {
            $('#back-to-top').fadeIn();
        } else {
            $('#back-to-top').fadeOut();
        }
    });
    // scroll body to 0px on click
    $('#back-to-top').click(function () {
        //$('#back-to-top').tooltip('hide');
        $('#mycontent').animate({
            scrollTop: 0
        }, 200);
        return false;
    });

    maximumHeight = (($(window).height() - $('#mynavbar').height()));
    $('#mycontent').css('max-height', (maximumHeight - 15) + 'px');

    settabs();
    setpanes()
    setTrees();
    settypeInfoBtn()
    initTreePopovers();

    $.ui.autocomplete.prototype._resizeMenu = function () {
        var ul = this.menu.element;
        ul.outerWidth(this.element.outerWidth());
    }

    $(function () {
        $("#searchTypes").autocomplete({
            minLength: 0,
            source: typelist,
            focus: function (event, ui) {
                $("#searchTypes").val(ui.item.label);
                return false;
            },
            select: function (event, ui) {
                $("#project").val(ui.item.label);
                $("#project-id").val(ui.item.id);

                var id = ui.item.id;
                $.getJSON("/vocabulary/" + id + "/json", function (data) {
                    if (data.topparent.forms) {
                        $.each(data.topparent.forms, function (i, form) {
                            if (i === 0) {
                                usage = form;
                            } else {
                                usage += ', ' + form;
                            }
                        })
                    }
                    var content = '<h5 title="' + data.path + '" class="text-muted">' + data.name + '<a class="ml-4 detailLink" title="Open details in new tab" href="/vocabulary/' + id + '" target="_blank"><i class="fas fa-external-link-alt"></i></a></h5>';
                    if (data.description) content = content + '<p class="text-muted font-italic" >' + data.description + '</p>';
                    if (data.parent) content = content + '<p> Subcategory of:' +
                        ' <span class="text-muted"> ' + data.parent_name + '</span></p>';
                    if (data.topparent.name) content = content + '<p> Hierarchy:' +
                        ' <span class="text-muted">' + data.topparent.name + '</span></p>';
                    if (data.topparent.description) content = content + '<p><i' +
                        ' class="text-muted">' + data.topparent.description + '</i></p>';
                    content = content + '<p>Relation: <span class="text-muted">' + data.topparent.selection + '</span></p>';
                    if (usage !== '') content = content + '<p>Usage: <span class="text-muted">' + usage + '</span></p>';
                    if (data.types_recursive) content = content + '<p>Subcategories: <span class="text-muted">' + (data.types_recursive.length - 1) + '</span></p>';
                    if (data.entities) content = content + '<p>Entities: <span class="text-muted">' + data.entities.length + '</span></p>';
                    if (data.entities_recursive) content = content + '<p>Entities (incl. subcategories): <span class="text-muted">' + data.entities_recursive.length + '</span></p>';

                    $('#search_result').html(content)
                })

                return false;
            }
        })
            .autocomplete("instance")._renderItem = function (ul, item) {
            return $("<li>")
                .append("<div>" + item.label + ": <span class='text-muted'>" + item.path + "</span></div>")
                .appendTo(ul);
        };

        $("#searchTypes").keypress(function (e) {
            var code = (e.keyCode ? e.keyCode : e.which);
            if (code == 13) { //Enter keycode
                return false;
            }
        });

    });

});

$(window).resize(function () {
    maximumHeight = (($(window).height() - $('#mynavbar').height()));
    $('#mycontent').css('max-height', (maximumHeight - 20) + 'px');
});

function setTrees() {
    $('.treecard').each(function (i) {
        var div = $(this).attr('id');
        var topparent = $(this).data('topparent')
        getTree(tree, div, topparent)

    })
}


function populateTree(data, div) {
    eval('$("#' + div + '").bstreeview({data: data})')
}

function getTree(data, div, topnode) {
    for (var i in data) {
        if (data[i].id === topnode) {
            newnode = data[i];
            populateTree(newnode.nodes, div)
            return
        } else {
            if (data[i].nodes) {
                getTree(data[i].nodes, div, topnode)
            } else {
                getTree(data[i + 1], div, topnode)
            }
        }
    }
}

function settabs() {
    $.each(tabsToCreate, function (i, tab) {
        var link = tab.replace(" ", "");
        if (i === 0) {
            var active = ' active'
        } else {
            var active = ''
        }

        var tab = '<li class="nav-item"><a class="nav-link ' + active + '" data-toggle="tab" href="#' + link + '">' + tab + '</a></li>';
        $('#treeTabs').append(tab);
    })
    var searchtab = '<li class="nav-item pull-right"><a class="nav-link" data-toggle="tab" href="#_searchTab"><i title="Search for a certain type" class="fas fa-search"></i></a></li>'

    $('#treeTabs').append(searchtab);

}

function setpanes() {
    $.each(tabsToCreate, function (i, tab) {
        var typename = tab;
        var link = tab.replace(" ", "");
        if (i === 0) {
            var active = ' active'
        } else {
            var active = ''
        }

        var pane = '<div class="tab-pane' + active + '" id="' + link + '"></div>';
        $('#treePanes').append(pane);
        $.each(tree, function (i, node) {
            if (node.type === typename) {
                var treecard = '<div class="card mb-3">' +
                    '<div class="card-header hierarchy-row row justify-content-start">' +
                    '<span data-id="' + node.id + '" class="btn-link typeheading" ' +
                    'data-toggle="collapse" ' +
                    'data-target="#tree_' + node.text.replace(/ /g, "") + '"' +
                    'aria-expanded="true" aria-controls="#tree_' + node.text.replace(/ /g, "") + '">' +
                    '' + node.text +
                    '</span>\n' +
                    '<div class="hierarchy-detail col-sm-8 float-right d-none">\n' +
                    '</div>\n' +
                    '</div>\n' +
                    '<div class="card-body collapse treecard" data-topparent="' + node.id + '" id="tree_' + node.text.replace(/ /g, "") + '">\n' +
                    '</div>\n' +
                    '</div>'
                eval('$("#' + link + '").append(treecard)');
            }
        })
    })
    $('.typeheading').click(function () {
        var div = $(this).next();
        getHierarchyData($(this).data('id'), div);
        $(this).next().toggleClass('d-none');
        $(this).toggleClass('col-sm-4');
    })


    $('.btn-link').css('cursor', 'pointer')

    var searchpane = '<div class="tab-pane" id="_searchTab">' +
        '<form>\n' +
        '  <div class="form-group">\n' +
        '      <input class="form-control" id="searchTypes" placeholder="Enter search term">' +
        '      <input type="hidden" id="type-id">' +
        '  </div>\n' +
        '</form>' +
        '<div id="search_result" class="card-body">\n' +
        '</div>\n' +
        '</div>' +
        '</div>';
    $('#treePanes').append(searchpane);

}

function settypeInfoBtn() {
    $('.treenode').each(function (i, node) {
        var id = $(this).attr('id');
        $('<div data-id="' + id + '" class="popCont"><i class="fa fa-info-circle" aria-hidden="true"></i></div><span class="popover-wrapper"></span>').insertAfter(this);
        $(this).next(".popCont").addBack().wrapAll("<div class='node-wrapper' />")
        //$('').insertAfter(this).next();
        if ($(this).find('i').length === 0) $(this).css('cursor', 'text');
    });
}
