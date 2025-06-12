export const clearNotificationsStorage = () => {
  localStorage.removeItem('notificationsData');
  localStorage.removeItem('lastGeneratedTime');
  localStorage.removeItem('deletedNotificationIds');
};
