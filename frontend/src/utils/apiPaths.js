export const BASE_URL = 'http://localhost:8000';

// utils/apiPaths.js
export const API_PATHS = {
    AUTH: {
        LOGIN: "/api/v1/auth/login",
        REGISTER: "/api/v1/auth/register",
        GET_USER_INFO: "/api/v1/auth/getUser",
        LOGOUT: "/api/v1/auth/logout",
    },
    TRANSACTIONS: {
        PARSE_PDF: "/api/v1/transactions/parse-pdf",
    },
    DASHBOARD: {
        GET_DATA: "/api/v1/dashboard",
    },
    INCOME: {
        ADD_INCOME: "/api/v1/income/add",
        GET_ALL_INCOME: "/api/v1/income/get",
        DELETE_INCOME: (incomeId) => `/api/v1/income/${incomeId}`,
        DOWNLOAD_INCOME: `/api/v1/income/downloadexcel`,
    },
    EXPENSE: {
        ADD_EXPENSE: "/api/v1/expense/add",
        GET_ALL_EXPENSES: "/api/v1/expense/get",
        DELETE_EXPENSE: (expenseId) => `/api/v1/expense/${expenseId}`,
        DOWNLOAD_EXPENSE: `/api/v1/expense/downloadexcel`,
        PARSE_RECEIPT: `/api/v1/expense/parse-receipt`,
    },
    IMAGE: {
        UPLOAD_IMAGE: "/api/v1/auth/upload-image",
    },
};