from flask import Flask, request, jsonify, g
from flask_cors import CORS
import sqlite3
import datetime
import os
import json
import uuid
import threading
import logging

app = Flask(__name__)
CORS(app)

# Пути к файлам
LOGS_DB = 'logs.db'
CONFIG_FILE = 'config.json'

# Блокировка для безопасного доступа к файлу конфигурации
config_lock = threading.Lock()

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ====================== Функции для работы с логами ======================
def get_logs_db():
    """Получение соединения с базой данных логов"""
    db = getattr(g, '_logs_database', None)
    if db is None:
        db = g._logs_database = sqlite3.connect(LOGS_DB)
        db.row_factory = sqlite3.Row
    return db

def init_logs_db():
    """Инициализация базы данных логов"""
    with app.app_context():
        db = get_logs_db()
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

@app.teardown_appcontext
def close_logs_db(exception):
    """Закрытие соединения с базой данных логов"""
    db = getattr(g, '_logs_database', None)
    if db is not None:
        db.close()

# ====================== Функции для работы с конфигурацией ======================
def load_config():
    """Загрузка конфигурации из файла"""
    if not os.path.exists(CONFIG_FILE):
        # Создаем файл с начальными данными, если он не существует
        initial_config = [
            {
                "id": str(uuid.uuid4()),
                "input": "/default/input/path",
                "output": "/default/output/path",
                "args": ["HASH", "DELETE"]
            }
        ]
        with open(CONFIG_FILE, 'w') as f:
            json.dump(initial_config, f, indent=2)
        return initial_config
    
    with open(CONFIG_FILE, 'r') as f:
        return json.load(f)

def save_config(config_data):
    """Сохранение конфигурации в файл"""
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config_data, f, indent=2)

# ====================== API для логов ======================
@app.route('/api/logs', methods=['POST'])
def add_log():
    """Добавление новой записи в лог"""
    data = request.get_json()
    logger.debug(f"Received log data: {data}")
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['type', 'input', 'output', 'info', 'size', 'check']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        db = get_logs_db()
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
        logger.debug(f"Inserted log with ID: {log_id}")
        
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
        logger.error(f"Error adding log: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/logs', methods=['GET'])
def get_logs():
    """Получение логов с возможностью фильтрации"""
    try:
        # Логируем полученные параметры
        logger.debug(f"Request args: {request.args}")
        
        # Получаем параметры фильтрации
        datetime_filter = request.args.get('datetime')
        type_filter = request.args.get('type')
        input_filter = request.args.get('input')
        output_filter = request.args.get('output')
        min_size = request.args.get('min_size')
        max_size = request.args.get('max_size')
        success_filter = request.args.get('success')
        limit = request.args.get('limit')  # Для главной страницы

        db = get_logs_db()
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
        
        logger.debug(f"Executing query: {query}")
        logger.debug(f"With params: {params}")
        
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
        
        logger.debug(f"Returning {len(result)} logs")
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error fetching logs: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/logs/<int:id>', methods=['DELETE'])
def delete_log(id):
    """Удаление записи лога"""
    try:
        db = get_logs_db()
        cursor = db.cursor()
        cursor.execute('DELETE FROM Logs WHERE ID = ?', (id,))
        db.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Log not found'}), 404
            
        return jsonify({'message': 'Log deleted successfully'}), 200
    except Exception as e:
        logger.error(f"Error deleting log: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ====================== API для конфигурации ======================
@app.route('/api/configs', methods=['GET'])
def get_configs():
    """Получение всех конфигураций"""
    with config_lock:
        configs = load_config()
    return jsonify(configs)

@app.route('/api/configs', methods=['POST'])
def add_config():
    """Добавление новой конфигурации"""
    data = request.get_json()
    logger.debug(f"Received config data: {data}")
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['input', 'output']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Устанавливаем аргументы по умолчанию, если не предоставлены
    if 'args' not in data:
        data['args'] = []
    
    # Генерируем уникальный ID
    data['id'] = str(uuid.uuid4())
    
    with config_lock:
        configs = load_config()
        configs.append(data)
        save_config(configs)
    
    logger.info(f"Added new config: {data['id']}")
    return jsonify(data), 201

@app.route('/api/configs/<string:config_id>', methods=['PUT'])
def update_config(config_id):
    """Обновление существующей конфигурации"""
    data = request.get_json()
    logger.debug(f"Update config {config_id}: {data}")
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    with config_lock:
        configs = load_config()
        updated = False
        
        for i, config in enumerate(configs):
            if config['id'] == config_id:
                # Обновляем только разрешенные поля
                configs[i]['input'] = data.get('input', configs[i]['input'])
                configs[i]['output'] = data.get('output', configs[i]['output'])
                configs[i]['args'] = data.get('args', configs[i]['args'])
                updated = True
                break
        
        if not updated:
            return jsonify({'error': 'Config not found'}), 404
        
        save_config(configs)
        logger.info(f"Updated config: {config_id}")
        return jsonify({'message': 'Config updated successfully'}), 200

@app.route('/api/configs/<string:config_id>', methods=['DELETE'])
def delete_config(config_id):
    """Удаление конфигурации"""
    with config_lock:
        configs = load_config()
        initial_count = len(configs)
        
        # Фильтруем конфигурации, исключая удаляемую
        configs = [config for config in configs if config['id'] != config_id]
        
        if len(configs) == initial_count:
            return jsonify({'error': 'Config not found'}), 404
        
        save_config(configs)
        logger.info(f"Deleted config: {config_id}")
        return jsonify({'message': 'Config deleted successfully'}), 200

# ====================== Запуск приложения ======================
if __name__ == '__main__':
    # Инициализация базы данных логов
    if not os.path.exists(LOGS_DB):
        init_logs_db()
        logger.info("Initialized logs database")
    
    # Инициализация файла конфигурации
    if not os.path.exists(CONFIG_FILE):
        load_config()
        logger.info("Initialized config file")
    
    app.run(host='0.0.0.0', port=5000, debug=True)