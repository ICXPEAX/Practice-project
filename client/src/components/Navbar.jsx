import { useNavigate } from 'react-router-dom'
import '../App.css'
import { CONFIG_ROUTE, LOGS_ROUTE, MAIN_ROUTE } from '../consts'

function Navbar() {

    const navigate = useNavigate()
  return (
    <>
     <div className="navbar">
      <button onClick={() => navigate(MAIN_ROUTE)} className='buttonNavbar'>Главная страница</button>
      <button onClick={() => navigate(LOGS_ROUTE)} className='buttonNavbar'>Логи</button>
      <button onClick={() => navigate(CONFIG_ROUTE)} className='buttonNavbar'>Настройка конфига</button>
      </div>
    </>
  )
}

export default Navbar