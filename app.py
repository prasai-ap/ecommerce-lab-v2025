from flask import Flask, render_template, request, session, redirect, url_for, jsonify
from flask_session import Session
import json
import os
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import sqlite3
from datetime import datetime
from jinja2 import Environment
import json

app = Flask(__name__)
app.secret_key = 'your-secret-key-here-change-in-production'
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_FILE_DIR'] = os.path.join(app.root_path, 'flask_session')
os.makedirs(app.config['SESSION_FILE_DIR'], exist_ok=True)
Session(app)

# Load products data
def load_products():
    try:
        with open('data/products.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Fallback data if JSON file doesn't exist
        return {
            "nike": [
                {
                    "id": 1,
                    "name": "Nike Air Max 270",
                    "price": 12450.00,
                    "image": "nike/air-max-270.jpg",
                    "description": "The Nike Air Max 270 delivers visible cushioning under every step.",
                    "sizes": ["7", "8", "9", "10", "11", "12"],
                    "featured": True
                },
                {
                    "id": 2,
                    "name": "Nike React Infinity Run",
                    "price": 13280.00,
                    "image": "nike/W+NIKE+REACT+INFINITY+RUN+FK+3.jpg",
                    "description": "Designed to help reduce injury and keep you running.",
                    "sizes": ["7", "8", "9", "10", "11", "12"],
                    "featured": False
                }
            ],
            "adidas": [
                {
                    "id": 3,
                    "name": "Adidas Ultraboost 22",
                    "price": 14940.00,
                    "image": "adidas/Adidas-Ultraboost-22.jpg",
                    "description": "Our most responsive running shoe yet.",
                    "sizes": ["7", "8", "9", "10", "11", "12"],
                    "featured": True
                },
                {
                    "id": 4,
                    "name": "Adidas Stan Smith",
                    "price": 6640.00,
                    "image": "adidas/Stan_Smith_Shoes_White_M20324_06_standard.jpg",
                    "description": "The iconic tennis shoe that never goes out of style.",
                    "sizes": ["7", "8", "9", "10", "11", "12"],
                    "featured": False
                }
            ],
            "puma": [
                {
                    "id": 5,
                    "name": "Puma RS-X",
                    "price": 9130.00,
                    "image": "puma/RS-X³-Puzzle-Men's-Sneakers.jpg",
                    "description": "Bold design meets maximum comfort.",
                    "sizes": ["7", "8", "9", "10", "11", "12"],
                    "featured": True
                }
            ],
            "newbalance": [
                {
                    "id": 6,
                    "name": "New Balance 990v5",
                    "price": 14525.00,
                    "image": "newbalance/NewBalance990v5.jpg",
                    "description": "Made in USA premium running shoe.",
                    "sizes": ["7", "8", "9", "10", "11", "12"],
                    "featured": False
                }
            ],
            "converse": [
                {
                    "id": 7,
                    "name": "Converse Chuck 70",
                    "price": 4565.00,
                    "image": "converse/converse-chuck-70-hi-chucks-black-black.jpg",
                    "description": "The original basketball shoe, now a timeless classic.",
                    "sizes": ["7", "8", "9", "10", "11", "12"],
                    "featured": True
                }
            ]
        }


products_data = load_products()


# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)

    return decorated_function


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))

        conn = sqlite3.connect('ecommerce.db')
        c = conn.cursor()
        c.execute("SELECT is_admin FROM users WHERE id = ?", (session['user_id'],))
        user = c.fetchone()
        conn.close()

        if not user or not user[0]:
            return redirect(url_for('index'))
        return f(*args, **kwargs)

    return decorated_function


# Database initialization
def init_db():
    conn = sqlite3.connect('ecommerce.db')
    c = conn.cursor()

    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (
                     id
                     INTEGER
                     PRIMARY
                     KEY
                     AUTOINCREMENT,
                     name
                     TEXT
                     NOT
                     NULL,
                     email
                     TEXT
                     UNIQUE
                     NOT
                     NULL,
                     password_hash
                     TEXT
                     NOT
                     NULL,
                     is_admin
                     BOOLEAN
                     DEFAULT
                     FALSE,
                     created_at
                     TIMESTAMP
                     DEFAULT
                     CURRENT_TIMESTAMP
                 )''')

    # Orders table
    c.execute('''CREATE TABLE IF NOT EXISTS orders
    (
        id
        INTEGER
        PRIMARY
        KEY
        AUTOINCREMENT,
        user_id
        INTEGER,
        order_number
        TEXT
        UNIQUE
        NOT
        NULL,
        items
        TEXT
        NOT
        NULL,
        total
        REAL
        NOT
        NULL,
        status
        TEXT
        DEFAULT
        'pending',
        billing_info
        TEXT,
        created_at
        TIMESTAMP
        DEFAULT
        CURRENT_TIMESTAMP,
        FOREIGN
        KEY
                 (
        user_id
                 ) REFERENCES users
                 (
                     id
                 ))''')

    # Create admin user if doesn't exist
    c.execute("SELECT * FROM users WHERE email = ?", ('admin@solestyle.com',))
    if not c.fetchone():
        admin_hash = generate_password_hash('admin123')
        c.execute("INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, ?)",
                  ('Admin User', 'admin@solestyle.com', admin_hash, True))

    conn.commit()
    conn.close()


# Initialize database on startup
init_db()


@app.route('/')
def index():
    # Get featured products from all brands
    featured_products = []
    for brand, products in products_data.items():
        for product in products:
            if product.get('featured', False):
                product['brand'] = brand
                featured_products.append(product)

    return render_template('index.html', featured_products=featured_products)


@app.route('/product/<int:product_id>')
def product_detail(product_id):
    # Find product by ID
    for brand, products in products_data.items():
        for product in products:
            if product['id'] == product_id:
                product['brand'] = brand
                return render_template('product.html', product=product)
    return "Product not found", 404


@app.route('/nike')
def nike():
    return render_template('nike.html', products=products_data['nike'], brand='Nike')


@app.route('/adidas')
def adidas():
    return render_template('adidas.html', products=products_data['adidas'], brand='Adidas')


@app.route('/puma')
def puma():
    return render_template('puma.html', products=products_data['puma'], brand='Puma')


@app.route('/newbalance')
def newbalance():
    return render_template('newbalance.html', products=products_data['newbalance'], brand='New Balance')


@app.route('/converse')
def converse():
    return render_template('converse.html', products=products_data['converse'], brand='Converse')


@app.route('/cart')
def cart():
    cart_items = session.get('cart', [])
    total = sum(item['price'] * item['quantity'] for item in cart_items)
    return render_template("cart.html", cart_items=cart_items, total=total)

# logout route
@app.route('/logout')
def logout():
    session.clear()  # Clears the cart and user data
    return redirect(url_for('login'))



@app.route('/checkout')
def checkout():
    cart_items = session.get('cart', [])
    total = sum(item['price'] * item['quantity'] for item in cart_items)
    return render_template('checkout.html', cart_items=cart_items, total=total)


@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    product_id = int(request.form['product_id'])
    size = request.form['size']
    quantity = int(request.form.get('quantity', 1))

    # Find product
    product = None
    for brand, products in products_data.items():
        for p in products:
            if p['id'] == product_id:
                product = p
                product['brand'] = brand
                break

    if not product:
        return jsonify({'success': False, 'message': 'Product not found'})

    # Initialize cart if it doesn't exist
    if 'cart' not in session:
        session['cart'] = []

    # Check if item already exists in cart
    cart_item = None
    for item in session['cart']:
        if item['id'] == product_id and item['size'] == size:
            cart_item = item
            break

    if cart_item:
        cart_item['quantity'] += quantity
    else:
        session['cart'].append({
            'id': product_id,
            'name': product['name'],
            'price': product['price'],
            'image': product['image'],
            'size': size,
            'quantity': quantity,
            'brand': product['brand']
        })

    session.modified = True
    return jsonify({'success': True, 'message': 'Item added to cart'})


@app.route('/remove_from_cart', methods=['POST'])
def remove_from_cart():
    product_id = int(request.form['product_id'])
    size = request.form['size']

    if 'cart' in session:
        session['cart'] = [item for item in session['cart']
                           if not (item['id'] == product_id and item['size'] == size)]
        session.modified = True

    return redirect(url_for('cart'))


@app.route('/process_checkout', methods=['POST'])
@login_required
def process_checkout():
    import random
    order_number = f"SS{random.randint(100000, 999999)}"
    cart_items = session.get('cart', [])
    total = sum(item['price'] * item['quantity'] for item in cart_items)

    # Add tax (10%)
    tax = total * 0.10
    final_total = total + tax + (0 if total >= 8300 else 830)

    # Order date
    order_date = datetime.now().strftime('%B %d, %Y')

    # Save order to database
    conn = sqlite3.connect('ecommerce.db')
    c = conn.cursor()

    billing_info = {
        'firstName': request.form['firstName'],
        'lastName': request.form['lastName'],
        'email': request.form['email'],
        'address': request.form['address'],
        'city': request.form['city'],
        'state': request.form['state'],
        'zip': request.form['zip'],
        'phone': request.form['phone']
    }

    c.execute("INSERT INTO orders (user_id, order_number, items, total, billing_info) VALUES (?, ?, ?, ?, ?)",
              (session['user_id'], order_number, json.dumps(cart_items), final_total, json.dumps(billing_info)))
    conn.commit()
    conn.close()

    session['last_order'] = order_number
    session['cart'] = []
    session.modified = True

    return render_template(
        'order_confirmation.html',
        order_number=order_number,
        total=final_total,
        order_date=order_date
    )

# Footer pages
@app.route('/about')
def about():
    return render_template('about.html')


@app.route('/contact')
def contact():
    return render_template('contact.html')


@app.route('/privacy')
def privacy():
    return render_template('privacy.html')


@app.route('/terms')
def terms():
    return render_template('terms.html')


@app.route('/shipping')
def shipping():
    return render_template('shipping.html')


@app.route('/returns')
def returns():
    return render_template('returns.html')


@app.route('/track-order')
def track_order():
    return render_template('track_order.html')


@app.route('/wishlist')
def wishlist():
    return render_template('wishlist.html')


@app.route('/size-guide')
def size_guide():
    return render_template('size_guide.html')


@app.route('/newsletter')
def newsletter():
    return render_template('newsletter.html')


# Authentication routes
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']

        # Validation
        if password != confirm_password:
            return render_template('signup.html', error='Passwords do not match')

        if len(password) < 6:
            return render_template('signup.html', error='Password must be at least 6 characters')

        conn = sqlite3.connect('ecommerce.db')
        c = conn.cursor()

        # Check if user exists
        c.execute("SELECT * FROM users WHERE email = ?", (email,))
        if c.fetchone():
            conn.close()
            return render_template('signup.html', error='Email already registered')

        # Create user
        password_hash = generate_password_hash(password)
        c.execute("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
                  (name, email, password_hash))
        conn.commit()
        conn.close()

        return render_template('signup.html', success='Account created successfully! Please login.')

    return render_template('signup.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        conn = sqlite3.connect('ecommerce.db')
        c = conn.cursor()
        c.execute("SELECT id, name, password_hash, is_admin FROM users WHERE email = ?", (email,))
        user = c.fetchone()
        conn.close()

        if user and check_password_hash(user[2], password):
            session['user_id'] = user[0]
            session['user_name'] = user[1]
            session['is_admin'] = bool(user[3])  # <- cast to boolean here

            if session['is_admin']:
                return redirect(url_for('admin'))
            else:
                return redirect(url_for('index'))
        else:
            return render_template('login.html', error='Invalid email or password')

    return render_template('login.html')






@app.route('/profile')
@login_required
def profile():
    conn = sqlite3.connect('ecommerce.db')
    c = conn.cursor()
    c.execute("SELECT name, email FROM users WHERE id = ?", (session['user_id'],))
    user = c.fetchone()

    # Get user orders
    c.execute("SELECT order_number, total, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC",
              (session['user_id'],))
    orders = c.fetchall()
    conn.close()

    return render_template('profile.html', user=user, orders=orders)


@app.route('/admin')
@admin_required
def admin():
    conn = sqlite3.connect('ecommerce.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Fetch orders
    c.execute("SELECT * FROM orders ORDER BY created_at DESC")
    orders = c.fetchall()

    # Calculate total revenue and pending orders
    total_revenue = sum(order['total'] for order in orders if order['total'])
    pending_orders = sum(1 for order in orders if order['status'] == 'pending')

    conn.close()

    return render_template(
        'admin.html',
        orders=orders,
        products=products_data,  # Ensure this is globally defined or imported
        total_revenue=total_revenue,
        pending_orders=pending_orders
    )

@app.context_processor
def utility_processor():
    return dict(loads=json.loads)

if __name__ == '__main__':
    app.run(debug=True)