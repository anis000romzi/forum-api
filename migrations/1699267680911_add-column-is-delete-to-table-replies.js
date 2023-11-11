/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('replies', {
    is_delete: {
      type: 'BOOLEAN',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('replies', 'is_delete');
};
