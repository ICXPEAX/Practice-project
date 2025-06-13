from flask import Flask, request, jsonify, g
from flask_cors import CORS
import sqlite3
import datetime
import os

app = Flask(__name__)
CORS(app)  
DATABASE = 'logs.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

def init_db():
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS Logs (
                ID INTEGER PRIMARY KEY AUTOINCREMENT,
                Datetime TEXT NOT NULL,
                Type TEXT NOT NULL,
                Input TEXT NOT NULL,
                Output TEXT NOT NULL,
                Info TEXT NOT NULL,
                Size INTEGER NOT NULL,
                Success INTEGER NOT NULL
            )
        ''')
        db.commit()

@app.route('/api/logs', methods=['POST'])
def add_log():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['type', 'input', 'output', 'info', 'size', 'check']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        db = get_db()
        cursor = db.cursor()
        current_time = datetime.datetime.now().strftime('%d/%m/%Y %H:%M')
        
        cursor.execute('''
            INSERT INTO Logs (Datetime, Type, Input, Output, Info, Size, Success)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            current_time,
            data['type'],
            data['input'],
            data['output'],
            data['info'],
            data['size'],
            1 if data['check'] else 0
        ))
        db.commit()
        
        return jsonify({'message': 'Log added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/logs', methods=['GET'])
def get_logs():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM Logs ORDER BY Datetime DESC')
        logs = cursor.fetchall()
        
        result = []
        for log in logs:
            result.append({
                'id': log['ID'],
                'datetime': log['Datetime'],
                'type': log['Type'],
                'input': log['Input'],
                'output': log['Output'],
                'info': log['Info'],
                'size': log['Size'],
                'check': bool(log['Success'])
            })
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/logs/<int:id>', methods=['DELETE'])
def delete_log(id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('DELETE FROM Logs WHERE ID = ?', (id,))
        db.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Log not found'}), 404
            
        return jsonify({'message': 'Log deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

if __name__ == '__main__':
    # Удаляем старую базу данных перед созданием новой
    if os.path.exists(DATABASE):
        os.remove(DATABASE)
    
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)