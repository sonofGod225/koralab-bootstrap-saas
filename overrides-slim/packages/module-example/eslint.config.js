import moduleConfig from '@__SCOPE__/config/eslint/module.js';

export default [...moduleConfig, { ignores: ['dist/', 'node_modules/'] }];
