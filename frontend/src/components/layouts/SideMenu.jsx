import React, { useContext } from "react";
import { SIDE_MENU_DATA } from "../../utils/data";
import { UserContext } from "../../context/userContext";
import { useNavigate } from "react-router-dom";
import CharAvatar from "../Cards/CharAvatar";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const SideMenu = ({ activeMenu }) => {
    const { user, clearUser } = useContext(UserContext);
    const fullName = user?.firstName + " " + user?.lastName;

    const navigate = useNavigate();
    
    const handleClick = (item) => {
        // Check if this is the logout item by label or path
        if (item.label === 'Logout' || item.path === 'logout' || item.path === '/logout') {
            handleLogout();
            return;
        }

        // For all other menu items, navigate normally
        navigate(item.path);
    };

    const handleLogout = async () => {
        try {
            // Call the logout API endpoint
            await axiosInstance.post(API_PATHS.AUTH.LOGOUT, {}, {
                withCredentials: true
            });
            console.log('Logout API call successful');
        } catch (error) {
            console.log('Logout API call failed:', error);
            // Continue with logout even if API call fails
        }
        
        // Clean up frontend state
        localStorage.clear();
        clearUser();
        
        // Remove authorization header from future requests
        delete axiosInstance.defaults.headers.common['Authorization'];
        
        // Navigate to login page
        navigate('/login', { replace: true });
    };

    return <div className="w-64 h-[calc(100vh-61px)] bg-white border-r border-gray-200/50 p-5 sticky top-[61px] z-20">
        <div className="flex flex-col items-center justify-center gap-3 mt-3 mb-7">
            {user?.profileImageUrl ? (
                <img
                    src={user?.profileImageUrl || ""}
                    alt="Profile Image"
                    className="w-20 h-20 bg-slate-400 rounded-full"
                />
            ) : (
                <CharAvatar
                    fullName={fullName}
                    width="w-20"
                    height="h-20"
                    style="text-xl"
                />
            )}

            <h5 className="text-gray-950 font-medium leading-6">
                {fullName || ""}
            </h5>
        </div>

        {SIDE_MENU_DATA.map((item, index) => (
            <button
                key={`menu_${index}`}
                className={`w-full flex items-center gap-4 text-[15px] ${activeMenu == item.label ? "text-white bg-primary" : ""
                    } py-3 px-6 rounded-lg mb-3`}
                onClick={() => handleClick(item)}
            >
                <item.icon className="text-xl" />
                {item.label}
            </button>
        ))}
    </div>;
};

export default SideMenu;