import { Route,Routes} from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { publicRoutes } from './routes'

const AppRouter = observer(() => {

    return(
        <Routes>
            {publicRoutes.map(({path,Component}) =>
            
                <Route key={path} path={path} Component={Component} exact/>
            )}
        </Routes>
       

    )
})

export default AppRouter