const { Op } = require('sequelize');
const { User } = require('../models');
// TZ: Validatsiya obyektini figurali qavs ichida import qilamiz
const { registerUserSchema, loginSchema } = require('../validation/User.Validation'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
 
exports.createInviteLink = async (req, res) => {
    try {
        // TZ: Koordinator 72 soat amal qiladigan bir martalik havola yaratadi
        const { email, role } = req.body;
        const token = jwt.sign(
            { email, role }, 
            process.env.JWT_SECRET || 'algoritm_2026', 
            { expiresIn: '72h' }
        );
        
        const inviteLink = `https://algoritm.uz/${token}`;
        res.status(200).send({ inviteLink });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.registerUser = async (req, res) => {
    // TZ: Joi obyektidan registerUserSchema funksiyasini to'g'ri chaqiramiz
    const { error } = registerUserSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
        const { email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await User.create({
            email,
            password: hashedPassword,
            role,
            status: 'active'
        });
        res.status(201).send(user);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.loginUser = async (req, res) => {
    try {
        // TZ: Login uchun ham kiritilgan ma'lumotlarni Joi orqali tekshiramiz
        const { error } = loginSchema.validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        
        if (!user || user.status === 'inactive') {
            return res.status(401).send('Akkaunt topilmadi yoki faolsizlantirilgan');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).send('Parol noto‘g‘ri');

        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET || 'algoritm_2026', 
            { expiresIn: '24h' }
        );
        res.status(200).send({ token, role: user.role });
    } catch (error) {
        res.status(500).send(error.message);
    }
};
