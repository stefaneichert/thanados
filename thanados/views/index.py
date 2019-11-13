from flask import render_template

from thanados import app

projectname=app.config["PROJECT_NAME"]
sitename="/index/index" + projectname + ".html"

@app.route('/')
@app.route('/index')
def index():
    return render_template(sitename)
