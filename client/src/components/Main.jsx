import '../App.css'
import { useEffect, useState } from 'react'
import logService from '../api/logService'

function Main() {
  const [recentLogs, setRecentLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentLogs = async () => {
      try {
        setLoading(true)
        const data = await logService.getRecentLogs(4)
        setRecentLogs(data)
      } catch (error) {
        console.error('Ошибка загрузки логов:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRecentLogs()
  }, [])

  return (
    <div className="main-page">
      <div className="menuMain">
        <h2 className="last-logs">Последние логи</h2>
        
        {loading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Загрузка данных...</p>
          </div>
        ) : recentLogs.length > 0 ? (
          <div className="logs-container">
            {recentLogs.map(log => (
              <div key={log.id} className="log-card">
                <div className="log-header">
                  <div className="log-meta">
                    <span className="log-date">{log.datetime}</span>
                    <span className={`log-type ${log.type}`}>{log.type}</span>
                  </div>
                </div>
                
                <div className="log-details">
                  <div className="log-info">
                    <span className="info-value">{log.info}</span>
                  </div>
                  <div className="log-path">
                    <span className="path-label">From:</span>
                    <span className="path-value">{log.input}</span>
                  </div>
                  <div className="log-path">
                    <span className="path-label">To:</span>
                    <span className="path-value">{log.output}</span>
                  </div>
                </div>
                
                <div className="log-footer">
                  <div className="size-info">
                    <span>Size:</span>
                    <span className="size-value">{log.size.toLocaleString()} байт</span>
                  </div>
                  <div className={`status-info ${log.check ? 'success' : 'error'}`}>
                    <span className="check-value">
                      {log.check ? 'Успешно' : 'Ошибка'}
                    </span>
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
      
      <div className="mainInfo">
        <div className="mainInfoWhite">
          <p className="section-title">Информация</p>
          <div className="info-content">
            <p>Инструкция по использованию системы:</p>
            <ul>
              <li>Для просмотра всех логов перейдите в раздел "Логи"</li>
              <li>Настройте пути обработки файлов в разделе "Конфигурация"</li>
              <li>Добавляйте новые логи через интерфейс архива логов</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Main