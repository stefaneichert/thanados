from flask import render_template, flash, g
from flask_wtf import Form
from wtforms import StringField, SubmitField

from thanados import app


class SearchForm(Form):
    term = StringField()
    search = SubmitField()


@app.route('/search/index', methods=["GET", "POST"])
def search_index():
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
    return render_template('search/index.html', form=form, search_result=search_result)
