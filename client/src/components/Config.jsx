import '../App.css'
function Config() {


  return (
    <>
    <div className='ConfBg'>
        <p className='mainInfoText'>Настройка конфига</p>
        <div className='ConfWhiteBg'>
          <div>
                <button  className='buttonConfig'>Добавить объект</button>
                <button  className='buttonConfig'>Обновить объект</button>
                <button  className='buttonConfig'>Удалить объект</button>
                </div>
                <p className='mainInfoText'>Вывод конфига конфига</p>
                <div className='configView'>
                  <p className='configText'>ID:1</p>
                  <p className='configText'>Input:str</p>
                  <p className='configText'>Output:str</p>
                  <p className='configText'>Arg:</p>
                </div>
        </div>
    </div>
    </>
  )
}

export default Config
