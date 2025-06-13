import Config from "./components/Config";
import Logs from "./components/Logs";
import Main from "./components/Main";
import { CONFIG_ROUTE, LOGS_ROUTE, MAIN_ROUTE } from "./consts";

export const publicRoutes = [
    {
        path: MAIN_ROUTE,
        Component: Main
    },
    {
        path: LOGS_ROUTE,
        Component: Logs
    },
    {
        path: CONFIG_ROUTE,
        Component: Config
    },
]