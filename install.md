# Installation Notes

Some knowledge about package installation, web server and database configuration will be needed.

This software was developed and tested on Linux/Debian 10 (codename "buster") and the easiest way to
install would be on Debian 10 system following these instructions.

It may work on other Linux distributions or even on non Linux systems but would need substantially
more knowledge about server administration.

## Requirements

You need to connect the application to an [OpenAtlas](https://openatlas.eu) database to access its data in order to visualise and present the information stored there.

### Python 3.7 and Flask 1.0

    # apt-get install python3 python3-bcrypt python3-dateutil python3-jinja2 python3-psycopg2
    # apt-get install python3-flask python3-flask-babel python3-flask-login python3-flaskext.wtf
    # apt-get install python3-markdown python3-numpy python3-pandas python3-fuzzywuzzy

### Apache 2.4

    # apt-get install apache2 libapache2-mod-wsgi-py3

### PostgreSQL 11 and PostGIS 2.5

    # apt-get install postgresql postgresql-11-postgis-2.5 postgresql-11-postgis-2.5-scripts

## Installation

### Files

Copy the files to /var/www/your_site_name or clone Thanados from GitHub

    $ git clone https://github.com/stefaneichert/thanados.git

### Configuration

Copy instance/example_production.py to instance/production.py

    $ cp instance/example_production.py instance/production.py

Add/change values as appropriate. See config/default.py which settings are available.

### Apache

As root copy and adapt install/example_apache.conf for a new vhost, activate the site:

    # a2ensite your_sitename

Test Apache configuration and restart

    # apache2ctl configtest
    # service apache2 restart

### Database Adaptions

enter "://your_server/admin" in your browser and log in with your OpenAtlas login credentials. A script is executed that prepares the data for the application.
A new schema is created with all necessary data to be displayed. Change the parameters in the admin.py view if needed (See comments in the script).

### Content and Layout Adaptions

The HTML content of the index and about page is now containing the information on the THANADOS Project. Please change logos, text and whatever you like to fit it to your requirements.
