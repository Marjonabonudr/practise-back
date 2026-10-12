const { Op } = require('sequelize');
const { Company } = require('../models');
const { companySchema } = require('../validation/company.Validation');

exports.createCompany = async (req, res) => {
    const { error } = companySchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
        const company = await Company.create(req.body);
        res.status(201).send(company);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.getCompanies = async (req, res) => {
    try {
        const companies = await Company.findAll({ where: { status: 'active' } });
        res.status(200).send(companies);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.getCompanyById = async (req, res) => {
    try {
        const company = await Company.findByPk(req.params.id);
        if (!company) return res.status(404).send('Company not found');
        res.status(200).send(company);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.updateCompany = async (req, res) => {
    const { error } = companySchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
        const company = await Company.findByPk(req.params.id);
        if (!company) return res.status(404).send('Company not found');
        
        await company.update(req.body);
        res.status(200).send(company);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.deleteCompany = async (req, res) => {
    try {
        const company = await Company.findByPk(req.params.id);
        if (!company) return res.status(404).send('Company not found');

        const companyData = company.toJSON();
        await company.destroy();
        res.status(200).send(companyData);
    } catch (error) {
        res.status(500).send(error.message);
    }
};
