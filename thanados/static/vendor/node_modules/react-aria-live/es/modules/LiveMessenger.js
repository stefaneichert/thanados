import React from 'react';
import PropTypes from 'prop-types';
import AnnouncerContext from './AnnouncerContext';

var LiveMessenger = function LiveMessenger(_ref) {
  var children = _ref.children;
  return React.createElement(
    AnnouncerContext.Consumer,
    null,
    function (contextProps) {
      return children(contextProps);
    }
  );
};

LiveMessenger.propTypes = process.env.NODE_ENV !== "production" ? {
  children: PropTypes.func.isRequired
} : {};

export default LiveMessenger;