import React from 'react';
import PropTypes from 'prop-types';

export default class IComCom extends React.Component {
  static propTypes = {
    attributes: PropTypes.shape({
      frameBorder: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      scrolling: PropTypes.string,
      sandbox: PropTypes.string,
      srcDoc: PropTypes.string,
      src: PropTypes.string.isRequired,
      width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    handleReceiveMessage: PropTypes.func,
    handleReady: PropTypes.func,
    postMessageData: PropTypes.any,
    targetOrigin: PropTypes.string,
  };

  static defaultProps = {
    targetOrigin: '*',
  };

  static defaultAttributes = {
    frameBorder: 0,
  };

  constructor(args) {
    super(args);
    this.onReceiveMessage = this.onReceiveMessage.bind(this);
    this.onLoad = this.onLoad.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
  }

  componentDidMount() {
    window.addEventListener('message', this.onReceiveMessage);
    if (this._frame) {
      this._frame.addEventListener('load', this.onLoad);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.onReceiveMessage, false);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.postMessageData !== nextProps.postMessageData) {
      this.sendMessage(nextProps.postMessageData);
    }
  }

  onReceiveMessage(event) {
    const {handleReceiveMessage} = this.props;
    if (handleReceiveMessage) {
      handleReceiveMessage(event);
    }
  }

  onLoad() {
    const {handleReady} = this.props;
    if (handleReady) {
      handleReady();
    }

    this.sendMessage(this.props.postMessageData);
  }

  sendMessage(postMessageData) {
    this._frame.contentWindow.postMessage(postMessageData, this.props.targetOrigin);
  }

  render() {
    const {attributes} = this.props;

    return (
      <iframe
        ref={(el) => {
          this._frame = el;
        }}
        {...Object.assign({}, IComCom.defaultAttributes, attributes)}
      />
    );
  }
}
