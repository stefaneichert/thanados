import deepmerge from 'deepmerge';
import createStore from './createStore';
import { importConfig } from './actions/config';
import { filterValidPlugins, getConfigFromPlugins, getReducersFromPlugins, getSagasFromPlugins } from '../extend/pluginPreprocessing';
/**
 * Configure Store
 */

function createPluggableStore(config) {
  var plugins = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var filteredPlugins = filterValidPlugins(plugins);
  var store = createStore(getReducersFromPlugins(filteredPlugins), getSagasFromPlugins(filteredPlugins));
  store.dispatch(importConfig(deepmerge(getConfigFromPlugins(filteredPlugins), config)));
  return store;
}

export default createPluggableStore;