# Created by Alexander Watzinger and others. Please see README.md for licensing information

from bcrypt import hashpw
from flask import flash, render_template, request, url_for
from flask_login import LoginManager, current_user, login_required, login_user, logout_user
from flask_wtf import Form
from werkzeug.utils import redirect
from wtforms import BooleanField, PasswordField, StringField, SubmitField
from wtforms.validators import InputRequired

from thanados import app
from thanados.models.user import UserMapper

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'


@login_manager.user_loader
def load_user(user_id):
    return UserMapper.get_by_id(user_id)


class LoginForm(Form):
    username = StringField('Username', [InputRequired()], render_kw={'autofocus': True})
    password = PasswordField('Password', [InputRequired()])
    show_passwords = BooleanField('show password')
    save = SubmitField('login')


@app.route('/login', methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect('/')
    form = LoginForm()
    if form.validate_on_submit():
        user = UserMapper.get_by_username(request.form['username'])
        if user:
            hash_ = hashpw(request.form['password'].encode('utf-8'), user.password.encode('utf-8'))
            if hash_ == user.password.encode('utf-8'):
                if user.active:
                    login_user(user)
                    return redirect(request.args.get('next') or url_for('index'))
                else:
                    flash('error inactive', 'error')
            else:
                flash('error wrong password', 'error')
        else:
            flash('error username', 'error')
    error_html=''
    if form and hasattr(form, 'errors'):
        for fieldName, errorMessages in form.errors.items():
            error_html += fieldName + ' - ' + errorMessages[0] + '<br />'
    return render_template('login/index.html', form=form, error_html=error_html)


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect('/')
