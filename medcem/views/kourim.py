from flask import flash, g, render_template, request, session, url_for
from werkzeug.utils import redirect
from medcem import app


@app.route('/sites/kourim')
def sites_kourim():
     return render_template('sites/kourim.html')
