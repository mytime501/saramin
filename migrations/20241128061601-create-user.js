module.exports = {
  up: async (queryInterface, Sequelize) => {
      await queryInterface.addColumn('jobs', 'experience', {
          type: Sequelize.STRING,
      });
      await queryInterface.addColumn('jobs', 'education', {
          type: Sequelize.STRING,
      });
      await queryInterface.addColumn('jobs', 'employmentType', {
          type: Sequelize.STRING,
      });
  },
  down: async (queryInterface, Sequelize) => {
      await queryInterface.removeColumn('jobs', 'experience');
      await queryInterface.removeColumn('jobs', 'education');
      await queryInterface.removeColumn('jobs', 'employmentType');
  }
};
