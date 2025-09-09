import {
    LuLayoutDashboard,
    LuHandCoins,
    LuWalletMinimal,
    LuListOrdered,
    LuLogOut,
} from "react-icons/lu";


export const SIDE_MENU_DATA = [
    {
        id: "01",
        label: "Dashboard",
        icon: LuLayoutDashboard,
        path: "/dashboard",
    },
    {
        id: "04",
        label: "Transactions",
        icon: LuListOrdered,
        path: "/transactions",
    },
    {
        id: "02",
        label: "Income",
        icon: LuWalletMinimal,
        path: "/income",
    },
    {
        id: "03",
        label: "Expense",
        icon: LuHandCoins,
        path: "/expense",
    },

    {
        id: "06",
        label: "Log Out",
        icon: LuLogOut,
        path: "/logout",
    },
];