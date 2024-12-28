from flask import Flask, render_template, jsonify, request
import psycopg2
import psycopg2.extras
from credentials import DB_PASSWORD, DB_NAME, DB_USERNAME

app = Flask(__name__)

app.config['DB_NAME'] = DB_NAME
app.config['DB_USER'] = DB_USERNAME
app.config['DB_PASSWORD'] = DB_PASSWORD
app.config['DB_HOST'] = 'localhost'
app.config['DB_PORT'] = 5432

def connect_db():
    try:
        conn = psycopg2.connect(
            host=app.config['DB_HOST'],
            database=app.config['DB_NAME'],
            user=app.config['DB_USER'],
            password=app.config['DB_PASSWORD']
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/inventions', methods=['GET'])
def get_all_inventions():
    try:
        conn = connect_db()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500

        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        offset = (page - 1) * limit

        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            cursor.execute("""
                SELECT 
                    i.*,
                    n.award_id,
                    n.nomination_status,
                    STRING_AGG(DISTINCT im.inventor_id, ', ') as inventor_ids,
                    STRING_AGG(DISTINCT CONCAT(inv.inventor_fname, ' ', inv.inventor_lname), ', ') as inventor_names
                FROM invention i
                LEFT JOIN nomination n ON i.invention_id = n.invention_id
                LEFT JOIN invention_management im ON i.invention_id = im.invention_id
                LEFT JOIN inventor inv ON im.inventor_id = inv.inventor_id
                GROUP BY i.invention_id, n.award_id, n.nomination_status
                ORDER BY i.year_of_invention DESC
                LIMIT %s OFFSET %s
            """, (limit, offset))
            
            inventions = cursor.fetchall()
            return jsonify({"inventions": [dict(inv) for inv in inventions]}), 200
            
    except Exception as e:
        return jsonify({"error": "Failed to fetch inventions", "details": str(e)}), 500

@app.route('/api/inventors', methods=['GET'])
def get_all_inventors():
    try:
        conn = connect_db()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500

        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            cursor.execute("""
                SELECT 
                    i.*,
                    STRING_AGG(DISTINCT inv.invention_name, ', ') as inventions,
                    STRING_AGG(DISTINCT a.award_name, ', ') as awards
                FROM inventor i
                LEFT JOIN invention_management im ON i.inventor_id = im.inventor_id
                LEFT JOIN invention inv ON im.invention_id = inv.invention_id
                LEFT JOIN award a ON im.award_id = a.award_id
                GROUP BY i.inventor_id
                ORDER BY i.dob
            """)
            inventors = cursor.fetchall()
            return jsonify({"inventors": [dict(inventor) for inventor in inventors]}), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch inventors", "details": str(e)}), 500

@app.route('/api/awards', methods=['GET'])
def get_all_awards():
    try:
        conn = connect_db()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500

        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            cursor.execute("""
                SELECT 
                    a.*,
                    j.jury_name,
                    STRING_AGG(DISTINCT i.invention_name, ', ') as nominated_inventions,
                    STRING_AGG(DISTINCT n.nomination_status, ', ') as nomination_statuses
                FROM award a
                LEFT JOIN jury j ON a.jury_id = j.jury_id
                LEFT JOIN nomination n ON a.award_id = n.award_id
                LEFT JOIN invention i ON n.invention_id = i.invention_id
                GROUP BY a.award_id, j.jury_name
                ORDER BY a.award_id
            """)
            awards = cursor.fetchall()
            return jsonify({"awards": [dict(award) for award in awards]}), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch awards", "details": str(e)}), 500

@app.route('/api/juries', methods=['GET'])
def get_all_juries():
    try:
        conn = connect_db()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500

        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            cursor.execute("""
                SELECT 
                    j.*,
                    STRING_AGG(DISTINCT a.award_name, ', ') as managed_awards,
                    COUNT(DISTINCT n.invention_id) as nominations_judged
                FROM jury j
                LEFT JOIN award a ON j.jury_id = a.jury_id
                LEFT JOIN nomination n ON j.jury_id = n.jury_id
                GROUP BY j.jury_id
                ORDER BY j.start_year DESC
            """)
            juries = cursor.fetchall()
            return jsonify({"juries": [dict(jury) for jury in juries]}), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch juries", "details": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)