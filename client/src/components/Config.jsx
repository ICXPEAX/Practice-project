import '../App.css'
import { useEffect, useState } from 'react'
import configService from '../api/configService'

function Config() {
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [newConfig, setNewConfig] = useState({
    input: '',
    output: '',
    args: []
  })
  const [isAdding, setIsAdding] = useState(false)
  const [newArg, setNewArg] = useState('')

  // Загрузка конфигураций
  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const data = await configService.getAllConfigs()
      setConfigs(data)
    } catch (error) {
      console.error('Ошибка загрузки конфигураций:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  // Обработчики для формы
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewConfig(prev => ({ ...prev, [name]: value }))
  }

  const handleAddArg = () => {
    if (newArg.trim() && !newConfig.args.includes(newArg.trim())) {
      setNewConfig(prev => ({
        ...prev,
        args: [...prev.args, newArg.trim()]
      }))
      setNewArg('')
    }
  }

  const handleRemoveArg = (index) => {
    setNewConfig(prev => ({
      ...prev,
      args: prev.args.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await configService.updateConfig(editingId, newConfig)
        setConfigs(configs.map(config => 
          config.id === editingId ? { ...config, ...newConfig } : config
        ))
        setEditingId(null)
      } else {
        const createdConfig = await configService.createConfig(newConfig)
        setConfigs([createdConfig, ...configs])
      }
      
      // Сброс формы
      setNewConfig({
        input: '',
        output: '',
        args: []
      })
      setIsAdding(false)
      alert('Конфигурация успешно сохранена!')
    } catch (error) {
      console.error('Ошибка сохранения конфигурации:', error)
      alert('Ошибка: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleEdit = (config) => {
    setEditingId(config.id)
    setNewConfig({
      input: config.input,
      output: config.output,
      args: [...config.args]
    })
    setIsAdding(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту конфигурацию?')) {
      try {
        await configService.deleteConfig(id)
        setConfigs(configs.filter(config => config.id !== id))
      } catch (error) {
        console.error('Ошибка удаления:', error)
      }
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setNewConfig({
      input: '',
      output: '',
      args: []
    })
  }

  return (
    <div className="config-page">
      <div className="logs-header">
        <h1 className="page-title">Настройка конфига</h1>
      </div>
      
      <div className="config-controls">
        <button 
          className="config-btn"
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
        >
          Добавить объект
        </button>
      </div>
      
      {/* Форма добавления/редактирования */}
      {isAdding && (
        <div className="config-form-section">
          <h2 className="section-title">
            {editingId ? 'Редактирование конфигурации' : 'Добавление новой конфигурации'}
          </h2>
          
          <form onSubmit={handleSubmit} className="config-form">
            <div className="form-group">
              <label>Input:</label>
              <input
                type="text"
                name="input"
                value={newConfig.input}
                onChange={handleInputChange}
                placeholder="/path/to/input/folder"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Output:</label>
              <input
                type="text"
                name="output"
                value={newConfig.output}
                onChange={handleInputChange}
                placeholder="/path/to/output/folder"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Аргументы:</label>
              <div className="args-container">
                {newConfig.args.map((arg, index) => (
                  <div key={index} className="arg-item">
                    <span>{arg}</span>
                    <button 
                      type="button"
                      className="remove-arg-btn"
                      onClick={() => handleRemoveArg(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="add-arg">
                  <input
                    type="text"
                    value={newArg}
                    onChange={(e) => setNewArg(e.target.value)}
                    placeholder="Новый аргумент"
                  />
                  <button 
                    type="button"
                    className="add-arg-btn"
                    onClick={handleAddArg}
                  >
                    Добавить
                  </button>
                </div>
              </div>
            </div>
            
            <div className="form-buttons">
              <button type="submit" className="submit-btn">
                {editingId ? 'Обновить' : 'Добавить'}
              </button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={handleCancel}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="config-list-section">
        <h2 className="section-title">Конфигурации</h2>
        
        {loading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Загрузка данных...</p>
          </div>
        ) : configs.length > 0 ? (
          <div className="config-list">
            {configs.map(config => (
              <div key={config.id} className="config-card">
                <div className="config-header">
                  <h3>ID: {config.id.substring(0, 8)}</h3>
                  <div className="config-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEdit(config)}
                    >
                      Редактировать
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(config.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                
                <div className="config-details">
                  <div className="config-item">
                    <span className="item-label">Input:</span>
                    <span className="item-value">{config.input}</span>
                  </div>
                  <div className="config-item">
                    <span className="item-label">Output:</span>
                    <span className="item-value">{config.output}</span>
                  </div>
                  <div className="config-item">
                    <span className="item-label">Args:</span>
                    <div className="args-list">
                      {config.args.map((arg, index) => (
                        <span key={index} className="arg-tag">{arg}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">
            <p>Нет конфигураций для отображения</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Config