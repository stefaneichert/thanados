import createTransition from './createTransition';
export var TouchTransition = createTransition('touchstart', function (event) {
  return event.touches != null; // eslint-disable-line no-eq-null, eqeqeq
});
export var HTML5DragTransition = createTransition('dragstart', function (event) {
  if (event.type) {
    return event.type.indexOf('drag') !== -1 || event.type.indexOf('drop') !== -1;
  }

  return false;
});
export var MouseTransition = createTransition('mousedown', function (event) {
  if (event.type) {
    return event.type.indexOf('touch') === -1 && event.type.indexOf('mouse') !== -1;
  }

  return false;
});