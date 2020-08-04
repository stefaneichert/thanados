from flask import json, render_template, g, abort

from thanados import app
from thanados.models.entity import Data


@app.route('/vocabulary/')
def vocabulary():
    hierarchytypes = app.config["HIERARCHY_TYPES"]
    systemtypes = app.config["SYSTEM_TYPES"]
    customtypes = app.config["CUSTOM_TYPES"]
    valuetypes = app.config["VALUE_TYPES"]
    alltypesused = list(set().union(hierarchytypes, systemtypes, customtypes, valuetypes))
    parenttree = []

    sql_list = """
                   SELECT name, id, name_path FROM (
                    SELECT name, id::INTEGER, path, name_path, left(path, strpos(path, ' >') -1)::INTEGER AS 
                    topparent FROM thanados.types_all WHERE path LIKE '%%>%%'
                    UNION ALL 
                    SELECT name, id::INTEGER, path, name_path, PATH::INTEGER AS topparent FROM 
                    thanados.types_all WHERE path NOT LIKE '%%>%%' ORDER BY name_path) tp
                    WHERE topparent IN %(list)s 
                    """


    g.cursor.execute(sql_list, {'list': tuple(alltypesused)})
    results = g.cursor.fetchall()
    Typelist = []
    for row in results:
        Typelist.append({'label': row.name, 'path': row.name_path, 'id': row.id})

    def makeparents(typelist, typeClass):
        for id in typelist:
            sql_tree = "SELECT name, id FROM thanados.types_all WHERE id = %(id)s ORDER BY name"
            g.cursor.execute(sql_tree, {'id': id})
            results = g.cursor.fetchone()
            if results:
                node = {
                    'text': results.name,
                    'id': results.id,
                    'type': typeClass,
                    'class': 'treenode'
                }
                maketree(id, node, typeClass)
            parenttree.append(node)

    def maketree(id, node, typeClass):
        sql_tree = """
            SELECT name, id FROM thanados.types_all WHERE parent_id = %(id)s ORDER BY name
        """
        g.cursor.execute(sql_tree, {'id': id})
        results = g.cursor.fetchall()
        if results:
            node['nodes'] = []
            for row in results:
                currentnode = {
                    'text': row.name,
                    'id': row.id,
                    'type': typeClass,
                    'class': 'treenode'
                }
                node['nodes'].append(currentnode)
                maketree(row.id, currentnode, typeClass)

    tabsToCreate = ['Classifications', 'Standard', 'User defined', 'Value types']

    makeparents(hierarchytypes, 'Classifications')
    makeparents(systemtypes, 'Standard')
    makeparents(customtypes, 'User defined')
    makeparents(valuetypes, 'Value types')

    # return json.dumps(parenttree)
    return render_template('vocabulary/vocabulary.html', tree=parenttree, tabsToCreate=tabsToCreate, typelist=Typelist)


@app.route('/vocabulary/<int:object_id>')
@app.route('/vocabulary/<int:object_id>/<format_>')
def vocabulary_view(object_id: int, format_=None):
    object_id = object_id

    if not object_id:
        return render_template('vocabulary/vocabulary.html')

    # get dataset for type entity
    sql_base = 'SELECT * FROM model.entity WHERE id = %(object_id)s;'
    g.cursor.execute(sql_base, {'object_id': object_id})
    output_base = g.cursor.fetchone()

    # check if exists
    if not output_base:
        abort(403)
    # check if type class
    CRMclass = output_base.class_code
    if CRMclass not in ['E55']:
        abort(403)

    # get top parent
    sql_topparent = """
        SELECT topparent FROM (
            SELECT id::INTEGER, path, name_path, left(path, strpos(path, ' >') -1)::INTEGER AS 
            topparent FROM thanados.types_all WHERE path LIKE '%%>%%'
            UNION ALL 
            SELECT id::INTEGER, path, name_path, PATH::INTEGER AS topparent FROM 
            thanados.types_all WHERE path NOT LIKE '%%>%%' ORDER BY name_path) tp
            WHERE id = %(object_id)s"""
    g.cursor.execute(sql_topparent, {'object_id': object_id})
    topparent = g.cursor.fetchone().topparent

    g.cursor.execute('select name, description, id from model.entity WHERE id = %(object_id)s',
                     {'object_id': topparent})
    topparent = g.cursor.fetchone()

    sql_topparent_info = """
        select e.name, e.description, e.id, h.multiple, h.standard AS system_type, h.value_type 
        from model.entity e JOIN web.hierarchy h ON e.id = h.id WHERE e.id = %(topparent)s
    """

    g.cursor.execute(sql_topparent_info, {'topparent': topparent.id})
    result = g.cursor.fetchone()

    topparent = {}
    topparent['id'] = result.id
    topparent['name'] = result.name
    topparent['description'] = result.description

    if result.multiple:
        multi = 'multiple selection'
    else:
        multi = 'single selection'

    type = ''

    if result.system_type:
        type = 'System type'
    if result.value_type:
        type = 'Value type'
    elif not result.system_type:
        type = 'Custom type'

    topparent['selection'] = multi
    topparent['type'] = type

    topparent['forms'] = []

    sql_forms = """
        select f.name FROM  
	    web.form f JOIN web.hierarchy_form h ON f.id = h.form_id WHERE h.hierarchy_id = %(topparent)s
    """

    g.cursor.execute(sql_forms, {'topparent': topparent['id']})
    forms_used = g.cursor.fetchall()
    for row in forms_used:
        topparent['forms'].append(row.name)

    # get parent and path
    sql_path_parent = 'SELECT name_path, parent_id FROM thanados.types_all WHERE id = %(object_id)s;'
    g.cursor.execute(sql_path_parent, {'object_id': object_id})
    output_path_parent = g.cursor.fetchone()

    # get name of parent
    sql_parentname = 'SELECT name FROM thanados.types_all WHERE id = %(object_id)s;'
    g.cursor.execute(sql_parentname, {'object_id': output_path_parent.parent_id})
    output_parentname = g.cursor.fetchone()

    # define json
    data = {}
    data['id'] = output_base.id
    data['name'] = output_base.name
    data['path'] = output_path_parent.name_path
    if output_base.description:
        data['description'] = output_base.description
    if output_base.begin_from:
        data['earliest_begin'] = output_base.begin_from
    if output_base.begin_to:
        data['latest_begin'] = output_base.begin_to
    if output_base.begin_comment:
        data['begin_comment'] = output_base.begin_comment
    if output_base.end_from:
        data['earliest_end'] = output_base.end_from
    if output_base.end_to:
        data['latest_end'] = output_base.end_to
    if output_base.end_comment:
        data['end_comment'] = output_base.end_comment
    if output_path_parent.parent_id:
        data['parent'] = output_path_parent.parent_id
        data['parent_name'] = output_parentname.name

    # get subtypes
    sql_children = 'SELECT id, name FROM thanados.types_all WHERE parent_id = %(object_id)s;'
    g.cursor.execute(sql_children, {'object_id': object_id})
    output_children = g.cursor.fetchall()

    if output_children:
        data['children'] = []
        for row in output_children:
            data['children'].append({'id': row.id, 'name': row.name})

    # get files
    sql_files = """SELECT 
                m.id
                FROM model.entity m JOIN model.link l ON m.id = l.domain_id
                WHERE l.range_id = %(object_id)s AND l.property_code = 'P67' AND m.system_type = 
                'file' 
           """
    g.cursor.execute(sql_files, {'object_id': object_id})
    output_files = g.cursor.fetchall()

    # get file license
    sql_filelicense = """
            SELECT 
                name AS license, name_path::TEXT, t.id::INTEGER AS licId, domain_id::INTEGER
                FROM thanados.types_all t JOIN model.link l ON t.id = l.range_id WHERE l.domain_id = 
                %(file_id)s AND l.property_code = 'P2' AND t.name_path LIKE 'License >%%'  
        """
    # define files
    if output_files:
        data['files'] = []

        # get file references
        sql_file_refs = """
            SELECT 
                r.description AS title,
                l.description AS reference
                FROM model.entity r JOIN model.link l ON r.id = l.domain_id
                WHERE l.range_id = %(file_id)s AND l.property_code = 'P67'    
        """

        for row in output_files:
            file_name = (Data.get_file_path(row.id))
            file_id = (row.id)
            file = {'id': file_id, 'file_name': file_name}
            g.cursor.execute(sql_file_refs, {'file_id': file_id})
            output_file_refs = g.cursor.fetchone()
            g.cursor.execute(sql_filelicense, {'file_id': file_id})
            output_filelicense = g.cursor.fetchone()

            if output_file_refs:
                if output_file_refs.title:
                    file['source'] = output_file_refs.title
                    if output_file_refs.reference:
                        file['reference'] = output_file_refs.reference

            # add licence information
            if output_filelicense:
                file['license'] = output_filelicense.license
                file['licenseId'] = output_filelicense.licid
            data['files'].append(file)

    # get all subtypes recursively
    sql_subtypesrec = """
        SELECT id from thanados.types_all WHERE path LIKE %(type_name)s OR path LIKE 
        %(type_name2)s OR id = %(type_id)s
    """

    entlist = []

    g.cursor.execute(sql_subtypesrec,
                     {'type_id': object_id, 'type_name': '%> ' + str(output_base.id) + ' >%',
                      'type_name2': str(output_base.id) + ' >%'})
    output_subtypesrec = g.cursor.fetchall()
    if output_subtypesrec:
        data['types_recursive'] = []
        for row in output_subtypesrec:
            data['types_recursive'].append(row.id)
            entlist.append(row.id)

    entlist = tuple(entlist)

    # get all entitites with this type
    sql_entities = """
        SELECT child_id, child_name, maintype, type, type_id, min, lon, lat, context, 
        filename, system_type FROM 
        thanados.searchdata s
        WHERE type_id IN %(type_id)s AND s.site_id IN %(site_ids)s  
    """
    g.cursor.execute(sql_entities, {'type_id': tuple([object_id]), 'site_ids': tuple(g.site_list)})
    output_direct_ents = g.cursor.fetchall()
    if output_direct_ents:
        data['entities'] = []
        for row in output_direct_ents:
            data['entities'].append({'id': row.child_id, 'name': row.child_name, 'main_type':
                row.maintype, 'type': row.type, 'type_id': row.type_id, 'value': row.min,
                                     'lon': row.lon,
                                     'lat': row.lat, 'context': row.context, 'file': row.filename,
                                     'system_type':
                                         row.system_type})

    g.cursor.execute(sql_entities, {'type_id': entlist, 'site_ids': tuple(g.site_list)})
    output_direct_ents = g.cursor.fetchall()
    if output_direct_ents:
        data['entities_recursive'] = []
        for row in output_direct_ents:
            data['entities_recursive'].append({'id': row.child_id, 'name': row.child_name,
                                               'main_type':
                                                   row.maintype, 'type': row.type,
                                               'type_id': row.type_id, 'value': row.min,
                                               'lon': row.lon,
                                               'lat': row.lat, 'context': row.context,
                                               'file': row.filename,
                                               'system_type':
                                                   row.system_type})

    # get type tree
    def getchildren(id, node):
        sql_getChildren = """
            SELECT name, id FROM thanados.types_all WHERE parent_id = %(id)s ORDER BY name
        """
        g.cursor.execute(sql_getChildren, {'id': id})
        results = g.cursor.fetchall()
        if results:
            node['nodes'] = []
            for row in results:
                currentnode = {'text': row.name,
                               'class': 'treenode',
                               'href': '/vocabulary/%r' % row.id,
                               'openNodeLinkOnNewTab': False}
                node['nodes'].append(currentnode)
                getchildren(row.id, currentnode)

    tree = [{
        'text': data['name'],
        'class': 'toptreenode'
    }]
    getchildren(object_id, tree[0])

    data['topparent'] = topparent
    data['tree'] = tree

    if format_ == 'json':
        return json.dumps(data)

    if object_id:
        return render_template('vocabulary/view.html', object_id=object_id, data=data,
                               children=len(output_children),
                               children_recursive=len(entlist))
