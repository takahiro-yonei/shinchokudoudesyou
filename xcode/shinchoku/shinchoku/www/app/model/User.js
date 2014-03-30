Ext.define('shinchoku.model.User', {
  extend: 'Ext.data.Model',

  config: {
    fields: [
      'Id',
      'AccountId',
      'Username',
      'Alias',
      'FirstName',
      'LastName',
      'Name',
      'IsActive',
      'Department',
      'Division',
      'Email',
      'MobilePhone',
      'Phone',
      'EmployeeNumber',
      'Title',
      'ManagerId',
      'ProfileId',
      'SmallPhotoUrl',
      'UserType'
    ],
    idProperty: 'Id'
  }
});