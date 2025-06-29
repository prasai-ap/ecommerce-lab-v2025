# E-Commerce Web App (Flask)

This repository contains the source code for a simple e-commerce web application built using **Flask**, a lightweight web framework for Python. The project includes features such as user registration, login/logout, product listings, and basic purchase functionality using Flask extensions like `Flask-WTF`, `Flask-Login`, and `Flask-SQLAlchemy`.

---

## Technologies Used

- Python 3.8+
- Flask – Lightweight web framework
- Flask-WTF – Simplified form handling with CSRF protection
- Flask-Login – User session and authentication management
- Flask-SQLAlchemy – ORM for database interaction
- Bootstrap – Frontend styling framework
- SQLite 3 – Lightweight database for development

---

## Core Sections

- Styling & Templates
- Sending data to Templates
- Template Inheritance
- Models and Databases
- Project Restructure
- Model Relationships
- Flask Forms
- Flask Validations
- Flashes & Advanced Validations
- User Authentication
- Logout and Customizations
- Item Purchasing
- Item Selling

## Steps:

### 1. Install Flask using `pip`

Open your terminal or command prompt and run:

```bash
python -m pip install --user flask
``` 

### 2. Install Flask-SQLAlchemy

This extension allows you to interact with a SQL database using Python objects.

```bash
pip install flask_sqlalchemy
``` 

### 3. Install Flask-WTF and Flask-Login

These libraries handle secure form inputs and user session management.

```bash
pip install flask-wtf flask-login
``` 

### 3. Connect to the database and create tables

To initialize the database and create all tables defined in your models, open a Python shell and run the following:

```bash
>>> from market import app, db
>>> app.app_context().push()
>>> db.create_all()
``` 
