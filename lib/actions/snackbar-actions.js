/** @babel */

class SnackbarActions {
  // rewritten to use atom notification manager

  post(msg, kind='info', detail=null) {
    const { notifications } = atom;

    switch (kind) {
      case 'warning':
        notifications.addWarning(msg, { detail });
        break;
      case 'error':
        notifications.addError(msg, { detail });
        break;
      default:
        notifications.addInfo(msg, { detail });
    }
  }

  remove() {} // noop
}

export default new SnackbarActions();
