const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const sequelize = require('./config/database');
const setupSwagger = require('./swagger/swagger');
const initCronJobs = require('./utils/cronScheduler');



const User = require('./routes/User.Route');
const AuditLog = require('./routes/AuditLog.Route');
const Company = require('./routes/Company.Route');
const Placement = require('./routes/Placement.Route');
const Student = require('./routes/Student.Route');
const WorkLog = require('./routes/WorkLog.Route');
const WeeklyReport = require('./routes/WeeklyReport.Route');
const Notification = require('./routes/Notification.Route');




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
app.use('/api', require('./routes/Dashboard.Route'));





setupSwagger(app);

const PORT = process.env.PORT || 3000;

sequelize.sync({alter: true }).then(() => {
    initCronJobs();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })

    .catch((err) => console.error(" DB xatosi", err));


