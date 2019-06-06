from flask import render_template

from medcem import app


@app.route('/sites/kourim')
def sites_kourim():
    return render_template('sites/kourim.html')
