import '../App.css'
import { useEffect, useState } from 'react'
import logService from '../api/logService'

function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddingLog, setIsAddingLog] = useState(false)
  const [newLog, setNewLog] = useState({
    type: 'info',
    input: '',
    output: '',
    info: '',
    size: '',
    check: true
  })
  
  const [filters, setFilters] = useState({
    datetime: '',
    type: 'all',
    input: '',
    output: '',
    minSize: '',
    maxSize: '',
    success: 'all'
  })
  
  // Загрузка логов с фильтрами
  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = {}
      
      if (filters.datetime) params.datetime = filters.datetime
      if (filters.type !== 'all') params.type = filters.type
      if (filters.input) params.input = filters.input
      if (filters.output) params.output = filters.output
      if (filters.minSize) params.min_size = filters.minSize
      if (filters.maxSize) params.max_size = filters.maxSize
      if (filters.success !== 'all') {
        params.success = filters.success === 'success' ? '1' : '0'
      }
      
      const data = await logService.getAllLogs(params)
      setLogs(data)
    } catch (error) {
      console.error('Ошибка загрузки логов:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [filters])

  // Обработчики фильтров
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleResetFilters = () => {
    setFilters({
      datetime: '',
      type: 'all',
      input: '',
      output: '',
      minSize: '',
      maxSize: '',
      success: 'all'
    })
  }

  // Управление формой добавления
  const openAddForm = () => setIsAddingLog(true)
  const closeAddForm = () => setIsAddingLog(false)

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setNewLog(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const createdLog = await logService.createLog({
        ...newLog,
        size: parseInt(newLog.size)
      })
      
      // Добавляем новый лог в начало списка
      setLogs(prev => [createdLog, ...prev])
      
      closeAddForm()
      setNewLog({
        type: 'info',
        input: '',
        output: '',
        info: '',
        size: '',
        check: true
      })
      
      alert('Лог успешно добавлен!')
    } catch (error) {
      console.error('Ошибка добавления лога:', error)
      alert('Ошибка при добавлении лога: ' + (error.response?.data?.error || error.message))
    }
  }

  // Удаление лога
  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      try {
        await logService.deleteLog(id)
        setLogs(logs.filter(log => log.id !== id))
      } catch (error) {
        console.error('Ошибка удаления:', error)
      }
    }
  }

  return (
    <div className="logs-page">
      <div className="logs-header">
        <p className="page-title">Архив логов</p>
      </div>
      
      <div className="filters-section">
        <h2 className="section-title">Фильтры</h2>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label>Дата и время</label>
            <input
              type="text"
              name="datetime"
              value={filters.datetime}
              onChange={handleFilterChange}
              placeholder="дд/мм/гггг"
            />
          </div>
          
          <div className="filter-group">
            <label>Тип</label>
            <select 
              name="type" 
              value={filters.type}
              onChange={handleFilterChange}
            >
              <option value="all">Все типы</option>
              <option value="info">Информация</option>
              <option value="error">Ошибка</option>
              <option value="warning">Предупреждение</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Статус</label>
            <select 
              name="success" 
              value={filters.success}
              onChange={handleFilterChange}
            >
              <option value="all">Все статусы</option>
              <option value="success">Успешно</option>
              <option value="error">Ошибка</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Входной файл</label>
            <input
              type="text"
              name="input"
              value={filters.input}
              onChange={handleFilterChange}
              placeholder="Путь к файлу"
            />
          </div>
          
          <div className="filter-group">
            <label>Выходной файл</label>
            <input
              type="text"
              name="output"
              value={filters.output}
              onChange={handleFilterChange}
              placeholder="Путь к файлу"
            />
          </div>
          
          <div className="filter-group">
            <label>Размер (байты)</label>
            <div className="size-range">
              <input
                type="number"
                name="minSize"
                value={filters.minSize}
                onChange={handleFilterChange}
                placeholder="Мин."
                min="0"
              />
              <span>-</span>
              <input
                type="number"
                name="maxSize"
                value={filters.maxSize}
                onChange={handleFilterChange}
                placeholder="Макс."
                min="0"
              />
            </div>
          </div>
        </div>
        
        <div className="filter-buttons">
          <button 
            className="reset-btn"
            onClick={handleResetFilters}
          >
            Сбросить фильтры
          </button>
          
          <button 
            className="add-btn"
            onClick={openAddForm}
          >
            Добавить лог
          </button>
        </div>
      </div>
      
      <div className="logs-section">
        {loading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Загрузка данных...</p>
          </div>
        ) : logs.length > 0 ? (
          <div className="logs-container">
            {logs.map(log => (
              <div key={log.id} className="log-card">
                <div className="log-header">
                  <div className="log-meta">
                    <span className="log-date">{log.datetime}</span>
                    <span className={`log-type ${log.type}`}>{log.type}</span>
                  </div>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(log.id)}
                  >
                    Удалить
                  </button>
                </div>
                
                <div className="log-details">
                  <div className="log-path">
                    <span className="path-label">Input:</span>
                    <span className="path-value">{log.input}</span>
                  </div>
                  <div className="log-path">
                    <span className="path-label">Output:</span>
                    <span className="path-value">{log.output}</span>
                  </div>
                  <div className="log-info">
                    <span className="info-label">Info:</span>
                    <span className="info-value">{log.info}</span>
                  </div>
                </div>
                
                <div className="log-footer">
                  <div className="size-info">
                    <span>Size:</span>
                    <span className="size-value">{log.size.toLocaleString()} байт</span>
                  </div>
                  <div className={`status-info ${log.check ? 'success' : 'error'}`}>
                    <span className="check-label">Check:</span>
                    <span className="check-value">{log.check ? '1' : '0'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">
            <p>Нет данных для отображения</p>
          </div>
        )}
      </div>

  
      {isAddingLog && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Добавить новый лог</h2>
            
            <form onSubmit={handleSubmit} className="add-log-form">
              <div className="form-group">
                <label>Тип:</label>
                <select 
                  name="type" 
                  value={newLog.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="info">Информация</option>
                  <option value="error">Ошибка</option>
                  <option value="warning">Предупреждение</option>
                </select>
              </div>

              <div className="form-group">
                <label>Input:</label>
                <input
                  type="text"
                  name="input"
                  value={newLog.input}
                  onChange={handleInputChange}
                  placeholder="/path/to/input/file.txt"
                  required
                />
              </div>

              <div className="form-group">
                <label>Output:</label>
                <input
                  type="text"
                  name="output"
                  value={newLog.output}
                  onChange={handleInputChange}
                  placeholder="/path/to/output/file.txt"
                  required
                />
              </div>

              <div className="form-group">
                <label>Info:</label>
                <textarea
                  name="info"
                  value={newLog.info}
                  onChange={handleInputChange}
                  placeholder="Описание операции"
                  required
                />
              </div>

              <div className="form-group">
                <label>Size:</label>
                <input
                  type="number"
                  name="size"
                  value={newLog.size}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>

              <div className="form-checkbox">
                <input
                  type="checkbox"
                  name="check"
                  checked={newLog.check}
                  onChange={handleInputChange}
                />
                <label>Check (успешное выполнение)</label>
              </div>

              <div className="form-buttons">
                <button 
                  type="submit"
                  className="logs-buttom"
                >
                  Добавить
                </button>
                
                <button 
                  type="button" 
                  className="logs-buttom"
                  onClick={closeAddForm}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Logs