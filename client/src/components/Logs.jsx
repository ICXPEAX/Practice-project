import '../App.css'
import { useEffect, useState } from 'react'
import logService from '../api/logService'

function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isAddingLog, setIsAddingLog] = useState(false)
  const [newLog, setNewLog] = useState({
    type: 'info',
    input: '',
    output: '',
    info: '',
    size: '',
    check: true
  })

  // Загрузка логов
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await logService.getAllLogs()
        setLogs(data)
      } catch (error) {
        console.error('Failed to fetch logs:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchLogs()
  }, [])

  // Фильтрация логов
  const filteredLogs = logs.filter(log => {
    const typeMatch = typeFilter === 'all' || log.type === typeFilter
    const statusMatch = statusFilter === 'all' || 
                      (statusFilter === 'success' && log.check) || 
                      (statusFilter === 'error' && !log.check)
    return typeMatch && statusMatch
  })

  // Обработчики изменения фильтров
  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value)
  }

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value)
  }

  // Открытие/закрытие формы добавления
  const openAddForm = () => setIsAddingLog(true)
  const closeAddForm = () => setIsAddingLog(false)

  // Обработчик изменений в форме
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setNewLog(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Отправка новой записи
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await logService.createLog({
        ...newLog,
        size: parseInt(newLog.size) // Преобразуем в число
      })
      
      // Обновляем список логов
      const data = await logService.getAllLogs()
      setLogs(data)
      
      // Закрываем форму и сбрасываем данные
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
      console.error('Failed to add log:', error)
      alert('Ошибка при добавлении лога')
    }
  }

  // Удаление лога
  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      try {
        await logService.deleteLog(id)
        setLogs(logs.filter(log => log.id !== id))
      } catch (error) {
        console.error('Failed to delete log:', error)
      }
    }
  }

  return (
    <>
      <div className='LogsBg'>
        <p className='mainInfoText'>Архив логов</p>
        <div className='FilterLogs'>
          <p className='textMain'>Фильтр</p>
          <div className='ButtomFilter' style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <select 
              value={typeFilter} 
              onChange={handleTypeFilterChange}
              style={{ fontSize: '20px', padding: '5px', borderRadius: '10px' }}
            >
              <option value="all">Все типы</option>
              <option value="info">Информация</option>
              <option value="error">Ошибка</option>
              <option value="warning">Предупреждение</option>
            </select>
            
            <select 
              value={statusFilter} 
              onChange={handleStatusFilterChange}
              style={{ fontSize: '20px', padding: '5px', borderRadius: '10px' }}
            >
              <option value="all">Все статусы</option>
              <option value="success">Успешно</option>
              <option value="error">Ошибка</option>
            </select>
            
            <button 
              onClick={openAddForm}
              className='buttonConfig'
              style={{ fontSize: '20px', padding: '5px 15px' }}
            >
              Добавить лог
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className='Logs'>
            <p className='textLog'>Загрузка...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map(log => (
            <div key={log.id} className='Logs'>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px' }}>
                <div>
                  <p className='textLog'>{log.datetime} - {log.type}</p>
                  <p className='textLog'>Input: {log.input}</p>
                  <p className='textLog'>Output: {log.output}</p>
                  <p className='textLog'>Info: {log.info}</p>
                  <p className='textLog'>Size: {log.size} bytes</p>
                  <p className='textLog'>Status: {log.check ? 'Success' : 'Error'}</p>
                </div>
                <button 
                  onClick={() => handleDelete(log.id)}
                  style={{ 
                    background: 'red', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px', 
                    padding: '5px 15px',
                    cursor: 'pointer',
                    alignSelf: 'center'
                  }}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className='Logs'>
            <p className='textLog'>Нет данных для отображения</p>
          </div>
        )}
      </div>

      {/* Модальное окно для добавления лога */}
      {isAddingLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '40px',
            width: '600px'
          }}>
            <h2 style={{ textAlign: 'center', fontSize: '30px' }}>Добавить новый лог</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '25px' }}>Тип:</label>
                <select 
                  name="type" 
                  value={newLog.type}
                  onChange={handleInputChange}
                  style={{ fontSize: '25px', width: '100%', padding: '5px' }}
                  required
                >
                  <option value="info">Информация</option>
                  <option value="error">Ошибка</option>
                  <option value="warning">Предупреждение</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '25px' }}>Входной файл:</label>
                <input
                  type="text"
                  name="input"
                  value={newLog.input}
                  onChange={handleInputChange}
                  placeholder="/path/to/input/file.txt"
                  style={{ fontSize: '25px', width: '100%', padding: '5px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '25px' }}>Выходной файл:</label>
                <input
                  type="text"
                  name="output"
                  value={newLog.output}
                  onChange={handleInputChange}
                  placeholder="/path/to/output/file.txt"
                  style={{ fontSize: '25px', width: '100%', padding: '5px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '25px' }}>Информация:</label>
                <textarea
                  name="info"
                  value={newLog.info}
                  onChange={handleInputChange}
                  placeholder="Описание операции"
                  style={{ fontSize: '25px', width: '100%', padding: '5px', height: '100px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '25px' }}>Размер (байты):</label>
                <input
                  type="number"
                  name="size"
                  value={newLog.size}
                  onChange={handleInputChange}
                  style={{ fontSize: '25px', width: '100%', padding: '5px' }}
                  min="0"
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  name="check"
                  checked={newLog.check}
                  onChange={handleInputChange}
                  style={{ width: '30px', height: '30px', marginRight: '10px' }}
                />
                <label style={{ fontSize: '25px' }}>Успешное выполнение</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <button 
                  type="submit"
                  style={{ 
                    background: 'green', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '40px', 
                    padding: '10px 30px',
                    fontSize: '25px',
                    cursor: 'pointer'
                  }}
                >
                  Добавить
                </button>
                <button 
                  type="button" 
                  onClick={closeAddForm}
                  style={{ 
                    background: 'red', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '40px', 
                    padding: '10px 30px',
                    fontSize: '25px',
                    cursor: 'pointer'
                  }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Logs