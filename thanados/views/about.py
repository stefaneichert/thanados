from flask import render_template

from thanados import app

projectname=app.config["PROJECT_NAME"]
sitename="/about/about" + projectname + ".html"


@app.route('/about')
def about():
    return render_template(sitename)
