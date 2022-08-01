const { fetchResponsibleList } = require('./fetch-responsible-map');

async function getResponsibleIds(projectName) {
  const responsibleList = await fetchResponsibleList();

  return responsibleList[projectName] || '';
}

module.exports = {
  getResponsibleIds,
};
