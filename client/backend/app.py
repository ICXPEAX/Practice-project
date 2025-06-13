from flask import Flask, request, jsonify, g
from flask_cors import CORS
import sqlite3
import datetime
import os
import logging

app = Flask(__name__)
CORS(app)  
DATABASE = 'logs.db'

# Настройка логирования
logging.basicConfig(level=logging.DEBUG)

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
    app.logger.debug(f"Received data: {data}")
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['type', 'input', 'output', 'info', 'size', 'check']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        db = get_db()
        cursor = db.cursor()
        current_time = datetime.datetime.now().strftime('%d/%m/%Y %H:%M')
        
        # Проверка типа данных для размера
        try:
            size_value = int(data['size'])
        except ValueError:
            return jsonify({'error': 'Size must be an integer'}), 400
        
        cursor.execute('''
            INSERT INTO Logs (Datetime, Type, Input, Output, Info, Size, Success)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            current_time,
            data['type'],
            data['input'],
            data['output'],
            data['info'],
            size_value,
            1 if data['check'] else 0
        ))
        db.commit()
        
        # Получаем ID только что вставленной записи
        log_id = cursor.lastrowid
        app.logger.debug(f"Inserted log with ID: {log_id}")
        
        # Возвращаем полный объект созданного лога
        cursor.execute('SELECT * FROM Logs WHERE ID = ?', (log_id,))
        new_log = cursor.fetchone()
        
        result = {
            'id': new_log['ID'],
            'datetime': new_log['Datetime'],
            'type': new_log['Type'],
            'input': new_log['Input'],
            'output': new_log['Output'],
            'info': new_log['Info'],
            'size': new_log['Size'],
            'check': bool(new_log['Success'])
        }
        
        return jsonify(result), 201
    except Exception as e:
        app.logger.error(f"Error adding log: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/logs', methods=['GET'])
def get_logs():
    try:
        # Логируем полученные параметры
        app.logger.debug(f"Request args: {request.args}")
        
        # Получаем параметры фильтрации
        datetime_filter = request.args.get('datetime')
        type_filter = request.args.get('type')
        input_filter = request.args.get('input')
        output_filter = request.args.get('output')
        min_size = request.args.get('min_size')
        max_size = request.args.get('max_size')
        success_filter = request.args.get('success')
        limit = request.args.get('limit')  # Для главной страницы

        db = get_db()
        cursor = db.cursor()
        
        query = 'SELECT * FROM Logs'
        conditions = []
        params = []
        
        # Добавляем условия фильтрации
        if datetime_filter:
            conditions.append("Datetime LIKE ?")
            params.append(f'%{datetime_filter}%')
        
        if type_filter and type_filter != 'all':
            conditions.append("Type = ?")
            params.append(type_filter)
        
        if input_filter:
            conditions.append("Input LIKE ?")
            params.append(f'%{input_filter}%')
        
        if output_filter:
            conditions.append("Output LIKE ?")
            params.append(f'%{output_filter}%')
        
        if min_size:
            try:
                min_value = int(min_size)
                conditions.append("Size >= ?")
                params.append(min_value)
            except ValueError:
                pass
        
        if max_size:
            try:
                max_value = int(max_size)
                conditions.append("Size <= ?")
                params.append(max_value)
            except ValueError:
                pass
        
        if success_filter:
            try:
                success_value = 1 if success_filter in ['true', '1', 'yes'] else 0
                conditions.append("Success = ?")
                params.append(success_value)
            except:
                pass
        
        # Собираем полный запрос
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        query += " ORDER BY datetime(Datetime) DESC"  # Исправлено для правильной сортировки
        
        # Ограничение для главной страницы
        if limit:
            try:
                limit_value = int(limit)
                query += f" LIMIT {limit_value}"
            except ValueError:
                pass
        
        app.logger.debug(f"Executing query: {query}")
        app.logger.debug(f"With params: {params}")
        
        cursor.execute(query, tuple(params))
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
        
        app.logger.debug(f"Returning {len(result)} logs")
        return jsonify(result), 200
    except Exception as e:
        app.logger.error(f"Error fetching logs: {str(e)}")
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