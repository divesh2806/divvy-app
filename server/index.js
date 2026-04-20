const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const expenseRoute = require('./routes/expenses'); // Import the route
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// USE THE ROUTE
app.use('/api/expenses', expenseRoute);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/personal', require('./routes/personalExpenses'));

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/divvy')
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});