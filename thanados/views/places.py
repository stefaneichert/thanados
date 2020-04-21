from flask import render_template

from thanados import app


@app.route('/places')
def places():
    return render_template('/places/places.html')
