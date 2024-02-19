import TouchBackend from './TouchBackend';
const createBackend = (manager, context, options = {}) => new TouchBackend(manager, context, options);
export default createBackend;
