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

    //$('.treenode').mouseover(function () {console.log(this.id)})


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
