// utils/emailTemplateManager.js
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const logger = require('../logger');

function getTemplate(templateName, data) {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateContent);
    return template(data);
  } catch (error) {
    logger.error(`Error al cargar la plantilla ${templateName}: ${error.message}`);
    throw error;
  }
}

module.exports = { getTemplate };
