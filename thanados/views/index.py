from flask import render_template

from thanados import app


@app.route('/')
@app.route('/index')
def index():
    return render_template('/index/index.html')
