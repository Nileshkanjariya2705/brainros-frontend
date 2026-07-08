/**
 * Toast/notification strings (repo convention — `ToastMsg`). Functions where
 * the message is dynamic, strings where it's static.
 */
export const ToastMsg = Object.freeze({
  auth: {
    loginSuccess: 'Signed in successfully',
    logoutSuccess: 'Signed out successfully',
    loginFailed: 'Invalid email or password',
  },
  common: {
    createSuccess: (moduleName: string) => `${moduleName} created successfully`,
    updateSuccess: (moduleName: string) => `${moduleName} updated successfully`,
    deleteSuccess: (moduleName: string) => `${moduleName} deleted successfully`,
  },
  networkError: {
    msg: 'Network error: unable to connect. Please check your connection and try again.',
    code: 'ERR_NETWORK',
  },
});
