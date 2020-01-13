from flask import render_template, flash, g
from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField

from thanados import app


class SearchForm(FlaskForm):
    term = StringField()
    search = SubmitField()


@app.route('/search/', methods=["GET", "POST"])
def search():
    form = SearchForm()
    search_result = ''
    if form.validate_on_submit():
        flash("you have searched", 'info')
        sql = """
              SELECT name FROM model.entity WHERE name LIKE %(term)s;
              """
        g.cursor.execute(sql, {"term": '%' + form.term.data + '%'})
        for row in g.cursor.fetchall():
            search_result += row.name + '<br>'
    g.cursor.execute('SELECT * FROM thanados.typesjson;')
    types = g.cursor.fetchall()
    return render_template('search/search.html', form=form, search_result=search_result, typesjson=types[0].types)
