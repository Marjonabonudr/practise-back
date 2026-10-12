const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const sequelize = require('./config/database');
const setupSwagger = require('./swagger/swagger');
const initCronJobs = require('./utils/cronScheduler');

// Render (Linux) uchun barcha import yo'llari va fayl kengaytmalari kichik harfli fayllarga moslandi
const User = require('./routes/User.Route.js');
const AuditLog = require('./routes/AuditLog.Route.js');
const Company = require('./routes/Company.Route.js');
const Placement = require('./routes/Placement.Route.js');
const Student = require('./routes/Student.Route.js');
const WorkLog = require('./routes/WorkLog.Route.js');
const WeeklyReport = require('./routes/WeeklyReport.Route.js');
const Notification = require('./routes/Notification.Route.js');

dotenv.config();

const app = express();

app.use(express.json());
app.use(
    cors({ 
        origin: "*"
    })
);

app.use('/api', User);
app.use('/api', AuditLog);
app.use('/api', Company);
app.use('/api', Placement);
app.use('/api', Student);
app.use('/api', WorkLog);
app.use('/api', WeeklyReport);
app.use('/api', Notification);
app.use('/api', require('./routes/Dashboard.Route.js'));

setupSwagger(app);

const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true }).then(() => {
    initCronJobs();
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((err) => console.error(" DB xatosi", err));
