import PropTypes from 'prop-types';
import React from 'react';

var offScreenStyle = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  padding: 0,
  width: '1px',
  position: 'absolute'
};

var MessageBlock = function MessageBlock(_ref) {
  var message = _ref.message,
      ariaLive = _ref['aria-live'];
  return React.createElement(
    'div',
    { style: offScreenStyle, role: 'log', 'aria-live': ariaLive },
    message ? message : ''
  );
};

MessageBlock.propTypes = process.env.NODE_ENV !== "production" ? {
  message: PropTypes.string.isRequired,
  'aria-live': PropTypes.string.isRequired
} : {};

export default MessageBlock;