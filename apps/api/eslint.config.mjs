import { baseConfig } from '../../eslint.config.mjs';

// The API had no eslint config and no lint script at all, so the entire
// backend went unlinted.
export default [...baseConfig];
