import React from 'react';
import renderer from 'react-test-renderer';

import IComCom from '../lib/index';

test('component should render', () => {
  const component = renderer.create(
    <IComCom />
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('component should register eventlistener and react on event', () => {
  const mockEvent = {name: 'iframe:event'};
  const mockAddEventListener = jest.fn((event, cb) => {
    cb(mockEvent);
  });
  const mockHandleReceiveMessage = jest.fn();

  global.addEventListener = mockAddEventListener;

  const component = new IComCom({
    handleReceiveMessage: mockHandleReceiveMessage,
  });
  component.componentDidMount();

  expect(global.addEventListener).toHaveBeenCalled();
  expect(mockHandleReceiveMessage).toHaveBeenCalled();
  expect(mockHandleReceiveMessage).toHaveBeenCalledWith(mockEvent);
});

test('component should callback on load', () => {
  const mockHandleReady = jest.fn();
  const mockAddEventListener = jest.fn((_, cb) => cb());

  const component = new IComCom({
    handleReady: mockHandleReady,
  });
  component._frame = {
    addEventListener: mockAddEventListener,
    contentWindow: {
      postMessage: jest.fn(),
    },
  };

  component.componentDidMount();
  expect(mockAddEventListener).toHaveBeenCalled();
  expect(mockHandleReady).toHaveBeenCalled();
});

test('should pass in data on load', () => {
  const data = 'iframe:load';
  const mockPostMessage = jest.fn((e) => {
    expect(e).toEqual(data);
  });
  const component = new IComCom({
    postMessageData: data,
  });
  component._frame = {
    contentWindow: {
      postMessage: mockPostMessage,
    },
  };

  component.onLoad();
  expect(mockPostMessage).toHaveBeenCalled();
});
