from flask import render_template
from thanados import app

@app.errorhandler(500)
def update_db(e):
    return render_template('error/500.html'), 500

@app.errorhandler(404)
def page_not_found(e):
    return render_template('error/404.html'), 404

@app.errorhandler(504)
def gateway_timeout(e):
    return render_template('error/504.html'), 504
