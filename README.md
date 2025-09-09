# 💸 SpendWise: Personal Finance Assistant

SpendWise is a full‑stack web app to **track, manage, and understand personal finances**. Users can add incomes/expenses, filter by time range, visualize spending, and even parse expenses from receipts (images/PDF). Built with **Vite + React** on the frontend, **Node.js (Express)** on the backend, and **MongoDB** for storage.

---

## 📦 Features

- ✍️ Create **income/expense entries** from the web app
- 🗓️ **List transactions in a selected time range**
- 📊 **Graphs**: e.g., expenses by **category** and by **date**
- 🧾 **Extract expenses from uploaded receipts** (images/PDF); supports **POS receipts**
- 📥 Upload **transaction history from PDF** (tabular format)
- 📜 **Pagination** on list API
- 👥 **Multiple users** can use the app

---

## 🧑‍💻 Tech Stack

### Frontend ⚛️
- Vite + React
- Tailwind CSS
- Recharts
- Axios

### Backend 🛠️
- Node.js + Express
- MongoDB + Mongoose
- JWT (Authentication)
- dotenv

---

## 📁 Folder Structure

```
SpendWise/
├── backend/            # Node.js Express API
└── frontend/           # Vite + React frontend
```

---

## 🛠️ Setup Instructions

### 1) Clone the repository
```bash
git clone https://github.com/mk0910-afk/typeface-assignment
cd SpendWise
```

### 2) Backend setup
```bash
cd backend
npm install
```

Create a **.env** file inside **/backend**:
```env
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
PORT=8000
```

Run the backend server:
```bash
npm run dev
```

### 3) Frontend setup
```bash
cd ../frontend
npm install
```

Create a **.env** file inside **/frontend**:
```env
VITE_BASE_URL=http://localhost:8000
```

Run the frontend:
```bash
npm run dev
```

---

## 🙌 Acknowledgements

This project structure and feature list align with the **“Software Engineer | Project Assignment”** brief .

---

## 🧑‍💼 Author

**Manas Kumar Khetan**
