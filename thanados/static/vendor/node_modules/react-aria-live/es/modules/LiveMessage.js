var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

import React from 'react';
import PropTypes from 'prop-types';
import AnnouncerContext from './AnnouncerContext';
import AnnouncerMessage from './AnnouncerMessage';

var LiveMessage = function LiveMessage(props) {
  return React.createElement(
    AnnouncerContext.Consumer,
    null,
    function (contextProps) {
      return React.createElement(AnnouncerMessage, _extends({}, contextProps, props));
    }
  );
};

LiveMessage.propTypes = process.env.NODE_ENV !== "production" ? {
  message: PropTypes.string.isRequired,
  'aria-live': PropTypes.string.isRequired,
  clearOnUnmount: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf(['true', 'false'])])
} : {};

export default LiveMessage;