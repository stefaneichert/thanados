from datetime import datetime, date

from flask import render_template, g, abort, jsonify
import json

from thanados import app
from thanados.models.entity import Data


@app.route('/sites')
@app.route('/sites/<domain_>')
@app.route('/sites/<domain_>/<date_>')
def sites(domain_=None, date_=None):
    site_list = Data.get_list()

    try:
        with open(app.root_path + "/../instance/site_list.txt") as file:
            g.sites_online = json.loads(file.read())
            online_sites = str(g.sites_online)
            print(online_sites)
    except Exception as e:  # pragma: no cover
        pass

    f = open(app.root_path + '/../instance/domains.json')
    data = json.load(f)

    f = open(app.root_path + '/../instance/site_list.txt')
    siteArray = json.load(f)

    nameArray = []

    for i in data:
        nameArray.append(i['name'])
    f.close()

    if domain_ and str(domain_) == 'sitelist' and not date_:
        print(len(siteArray))
        return json.dumps(
            {
                '"description"': 'sites published on https://thanados.net',
                '"date"': datetime.today().strftime('%Y-%m-%d'),
                '"count"': len(siteArray),
                '"sites"': siteArray
            }
        )

    if domain_ and str(domain_) == 'sitelist' and date_ != None:

        def validatedate(date_text):
            try:
                if date_text != datetime.strptime(date_text,
                                                  "%Y-%m-%d").strftime(
                    '%Y-%m-%d'):
                    raise ValueError
                return True
            except ValueError:
                return False

        if not validatedate(date_):
            return 'Something went wrong. Did you use the following format: ' \
                   'https://thanados.net/sites/sitelist/YYYY-MM-DD ?'

        try:
            date_object = datetime.strptime(date_, "%Y-%m-%d")
            if date_object > datetime.now():
                return 'The date you entered is in the future.'

        except Exception:
            return 'Something went wrong. Did you use the following format: ' \
                   'https://thanados.net/sites/sitelist/YYYY-MM-DD ?'

        sql = """
            SELECT * FROM (SELECT site_id, MAX(timestamp) AS date from
                (SELECT s.site_id, b.timestamp FROM thanados.searchdata s JOIN
                (SELECT id, created AS timestamp from thanados.entity 
                    WHERE id IN 
                    (SELECT DISTINCT child_id from thanados.searchdata)
                UNION ALL
                SELECT id, modified AS timestamp from thanados.entity 
                WHERE id IN 
                (SELECT DISTINCT child_id from thanados.searchdata)) b
            ON s.child_id = b.id) c 
            GROUP BY site_id ORDER BY date) d 
            WHERE date >= %(date_)s::timestamp AND site_id IN %(site_list)s
        """

        sites_per_date = []

        try:
            g.cursor.execute(sql, {'date_': date_,
                                   'site_list': tuple(g.site_list)})
            result = g.cursor.fetchall()
            for row in result:
                sites_per_date.append(row.site_id)
            print(len(sites_per_date))
            if len(sites_per_date) == 0:
                sql_latest = """
                    SELECT MAX(date) AS latest
                    FROM (SELECT site_id, MAX(timestamp) AS date from
                        (SELECT s.site_id, b.timestamp 
                        FROM thanados.searchdata s JOIN
                        (SELECT id, created AS timestamp from thanados.entity 
                            WHERE id IN 
                            (SELECT DISTINCT child_id from thanados.searchdata)
                        UNION ALL
                        SELECT id, modified AS timestamp from thanados.entity 
                        WHERE id IN 
                        (SELECT DISTINCT child_id from thanados.searchdata)) b
                    ON s.child_id = b.id) c 
                    GROUP BY site_id ORDER BY date) d 
                    WHERE site_id IN %(site_list)s
                        """
                g.cursor.execute(sql_latest, {'date_': date_,
                                              'site_list': tuple(g.site_list)})
                latest = g.cursor.fetchone()
                latest = (latest.latest)
                latest = datetime.strptime(str(latest), "%Y-%m-%d %H:%M:%S.%f")
                latest = latest.strftime('%Y-%m-%d')
                today = datetime.now()
                today = today.strftime('%Y-%m-%d')

                return json.dumps({
                    '"description"': 'No sites updated since ' + date_ + '. The latest update was done on ' + str(latest),
                    '"date"': today,
                    '"count"': 0,
                    '"sites"': []
                })


        except Exception:
            return 'Something went wrong. Did you use the following format: ' \
                   'https://thanados.net/sites/sitelist/YYYY-MM-DD ?'

        return json.dumps({
            '"description"': "updated sites on https://thanados.net",
            '"updated after"': date_,
            '"count"': len(sites_per_date),
            '"sites"': sites_per_date
        })

    if domain_ and str(domain_) in nameArray and not date_:
        print(domain_)
        for arr in data:
            if arr['name'] == str(domain_):
                id_ = arr['id']
                print(id_)
        return render_template('/sites/sites.html', online_sites = online_sites,
                               sitelist=site_list[0].sitelist, domain=id_)
    elif domain_ or domain_ and date_:
        abort(404)

    return render_template('/sites/sites.html', online_sites = online_sites, sitelist=site_list[0].sitelist,
                           domain=0)
