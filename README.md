# Divvy App

Divvy App is a comprehensive personal finance and group expense management application. It helps individuals track their daily spending, set budgets, and easily split shared bills among friends.

## Features

* **Personal Finance Management**: Track your daily expenses and categorize them for better budgeting.
* **Expense Analytics**: View spending trends, date-based filtering, and retroactive transaction logging.
* **Group Management**: Seamlessly create groups and add friends individually.
* **Shared Expenses**: Log shared expenses within groups, track who owes what, and settle balances easily.
* **Authentication**: Secure user accounts and authentication.

## Tech Stack

This project is built using the MERN stack:
* **Frontend**: React.js
* **Backend**: Node.js, Express.js
* **Database**: MongoDB

## Getting Started

Follow these steps to set up the project locally.

### Prerequisites

* Node.js
* MongoDB (running locally or a cloud instance like MongoDB Atlas)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/divesh2806/divvy-app.git
   cd divvy-app
   ```

2. **Install Server Dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies:**
   ```bash
   cd ../client
   npm install
   ```

### Configuration

Create a `.env` file in the `server` directory and add necessary environment variables (replace with your own values):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/divvy
# Add any secret keys for JWT authentication if implemented
```

### Running the App

1. **Start the backend server:**
   ```bash
   cd server
   npm start
   # Server will run on port 5000
   ```

2. **Start the frontend application:**
   ```bash
   cd client
   npm start
   # Client will run on port 3000
   ```

Visit `http://localhost:3000` in your browser.

## Contributing

Feel free to submit pull requests or log issues for any bugs you discover or enhancements you'd like to suggest.
