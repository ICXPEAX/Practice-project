import '../App.css'
import { useEffect, useState } from 'react'
import logService from '../api/logService'

function Main() {
  const [recentLogs, setRecentLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentLogs = async () => {
      try {
        setLoading(true);
        const data = await logService.getRecentLogs(4);
        setRecentLogs(data);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRecentLogs();
  }, []);

  return (
    <>
      <div className='menuMain'> 
        <p className='mainInfoText'>Последние логи</p>
        
        {loading ? (
          <div className='logsMain'>
            <p className='logsText'>Загрузка...</p>
          </div>
        ) : recentLogs.length > 0 ? (
          recentLogs.map((log, index) => (
            <div key={index} className='logsMain'>
              <p className='logsText'>
                <strong>{log.datetime}</strong> - {log.type}: {log.info}
              </p>
              <p className='logsText'>
                {log.input} → {log.output} ({log.size} байт)
              </p>
              <p className='logsText' style={{ color: log.check ? 'green' : 'red' }}>
                {log.check ? 'Успешно' : 'Ошибка'}
              </p>
            </div>
          ))
        ) : (
          <div className='logsMain'>
            <p className='logsText'>Нет данных</p>
          </div>
        )}
      </div>
      
      <div className='mainInfo'>
        <div className='mainInfoWhite'>
          <div className='textMain'>Информация</div>
          <div className='textMain'>Возможная инструкция о том, как пользоваться сайтом</div>
        </div>
      </div>
    </>
  )
}

export default Main