from flask import render_template

from thanados import app


@app.route('/about')
def about():
    return render_template('about.html')
