# Installation Notes

This software was developed and tested on Linux/Debian 11 (codename "buster")
and the easiest way to install would be on Debian 11 system following these
instructions.

Some knowledge about package installation, web server and database configuration
will be needed. It may work on other Linux distributions or even on non Linux
systems but would need substantially more knowledge about server administration.

## Requirements

You need to connect the application to an [OpenAtlas](https://openatlas.eu)
database to access its data in order to visualise and present the information
stored there.

### Python 3.9 and Flask 1.1.2

    # apt install python3 python3-bcrypt python3-dateutil python3-psycopg2
    # apt install python3-fuzzywuzzy python3-flask python3-flask-babel
    # apt install python3-flask-login python3-flaskext.wtf python3-markdown
    # apt install python3-numpy python3-pandas python3-jinja2 python3-flask-cors
    # apt install python3-flask-restful p7zip-full python3-wand python3-rdflib
    # apt install python3-dicttoxml python3-rdflib-jsonld python3-flasgger
    # apt install python3-pil

### Apache 2.4

    # apt install apache2 libapache2-mod-wsgi-py3

### PostgreSQL 13 and PostGIS 3

    # apt install postgresql
    # apt install postgresql-13-postgis-3 postgresql-13-postgis-3-scripts

Add sfcgal extension to the database.

    $ psql openatlas -c "CREATE EXTENSION postgis_sfcgal;"

### IOSACAL
THANADOS uses [IOSACAL](https://doi.org/10.5281/zenodo.630455), an open source 
radiocarbon calibration software of the [IOSA](http://www.iosa.it/) project,
to calibrate radiocarbon data.
As IOSACAL is licensed under the
[GNU General Public License v3.0 only](https://opensource.org/licenses/GPL-3.0) 
it needs to be installed separately. This can be done by using a THANADOS 
specific
[fork of its repository](https://github.com/stefaneichert/IOSACAL-THANADOS.git)
that contains the necessary files.


Get them from 
[https://github.com/stefaneichert/IOSACAL-THANADOS.git](https://github.com/stefaneichert/IOSACAL-THANADOS.git) 
and copy them into the directory:

    'your thanados root directory'/thanados/models/iosacal



## Installation

### Files

Copy the files to /var/www/your_site_name or clone THANADOS from GitHub

    $ git clone https://github.com/stefaneichert/thanados.git

### Configuration

Copy instance/example_production.py to instance/production.py

    $ cp instance/example_production.py instance/production.py

Add/change values as appropriate. See config/default.py which settings are
available.

### Apache

As root copy and adapt install/example_apache.conf for a new vhost, activate
the site:

    # a2ensite your_sitename

Test Apache configuration and restart

    # apache2ctl configtest
    # service apache2 restart

### Database Adaptions

enter "://your_server/admin" in your browser and log in with your OpenAtlas
login credentials. A script is executed that prepares the data for the
application. A new schema is created with all necessary data to be displayed.
Change the parameters in the admin.py view if needed
(see comments in the script).

### Content and Layout Adaptions

The HTML content of the index and about page is now containing the information
on the THANADOS Project. Please change logos, text and whatever you like to fit
it to your requirements.
