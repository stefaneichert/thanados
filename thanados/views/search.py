from flask import render_template, flash, g
from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField

from thanados import app
from thanados.models.entity import Data


class SearchForm(FlaskForm):
    term = StringField()
    search = SubmitField()


@app.route('/search', methods=["GET", "POST"])
def search():
    site_list = Data.get_list()
    form = SearchForm()
    search_result = ''
    if form.validate_on_submit():
        g.cursor.execute(form.term.data)
        for row in g.cursor.fetchall():
            search_result += row.child_name + '<br>'
    g.cursor.execute('SELECT * FROM thanados.typesjson;')
    types = g.cursor.fetchall()
    return render_template('search/search.html', form=form, search_result=search_result, typesjson=types[0].types, sitelist=site_list[0].sitelist)
