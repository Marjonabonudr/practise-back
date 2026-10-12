const { Op } = require('sequelize');
const { Student, User, Placement } = require('../models');
const { studentSchema } = require('../validation/student.Validation');

exports.createStudent = async (req, res) => {
    const { error } = studentSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
        const student = await Student.create(req.body);
        res.status(201).send(student);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.getStudents = async (req, res) => {
    try {
        const students = await Student.findAll();
        res.status(200).send(students);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.getStudentById = async (req, res) => {
    try {
        // TZ: O‘quvchi kartochkasi: profil, barcha joylashtirishlar tarixi
        const student = await Student.findByPk(req.params.id, {
            include: [
                { model: User, as: 'user'},
                { model: Placement, as: 'placements' }
            ]
        });

        if (!student) return res.status(404).send('Student not found');
        res.status(200).send(student);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.updateStudent = async (req, res) => {
    const { error } = studentSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
        const student = await Student.findByPk(req.params.id);
        if (!student) return res.status(404).send('Student not found');
        
        await student.update(req.body);
        res.status(200).send(student);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByPk(req.params.id);
        if (!student) return res.status(404).send('Student not found');

        const studentData = student.toJSON();
        await student.destroy();
        res.status(200).send(studentData);
    } catch (error) {
        res.status(500).send(error.message);
    }
};
