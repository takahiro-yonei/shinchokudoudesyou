Ext.define('shinchoku.view.UserList', {
  extend: 'Ext.dataview.List',
  xtype: 'userList',

  requires: [
    'Ext.TitleBar',
    'Ext.field.Search'
  ],

  config: {
    useSimpleItems: false,
    infinite: true,
    scrollToTopOnRefresh: false,
    variableHeights: true,

    plugins: [
      {xclass: 'Ext.plugin.ListPaging'},
      {xclass: 'Ext.plugin.PullRefresh'}
    ],
    store: 'Users',

    itemTpl: new Ext.XTemplate(
      '<div>',
        '<table>',
          '<tr>',
            '<td>',
              '<img src="{SmallPhotoUrl}" width="45" height="45">',
            '</td>',
            '<td>',
              '<div class="user-name">{Name}</div>',
              '<tpl if="this.isYou(Id)">',
                '<p style="padding-left:15px;">[You!]</p>',
              '</tpl>',
              '<tpl if="this.isCustomerUser(UserType)">',
                '<p style="padding-left:15px;">[*Chatter]</p>',
              '</tpl>',
            '</td>',
          '</tr>',
        '</table>',
      '</div>',
      {
        disableFormats: true,
        isYou: function(userId){
          return (userId == force.getUserId());
        },
        isCustomerUser: function(userType){
          return userType != 'Standard';
        }
      }
    ),

    items: [{
      xtype: 'toolbar',
      docked: 'top',
      items: [
        {
          xtype: 'spacer'
        },{
          xtype: 'searchfield',
          placeHolder: 'Search...',
          listeners: {
            clearicontap: function(field){
              field.up('userList').onSearchClearIconTap();
            },
            keyup: function(field){
              field.up('userList').onSearchKeyUp(field);
            }
          }
        },{
          xtype: 'spacer'
        }
      ]
    }],

    listeners: [
      {
        event: 'itemtap',
        fn: 'onRecordTap'
      }
    ]
  },

  initialize: function(){
    var me = this;

    me.getStore().load();

    me.callParent(arguments);
  },

  /**
   * @override
   */
  prepareData: function(data, index, record) {
    this.getItemTpl().record = record;
    return this.callParent(arguments);
  },

  onRecordTap: function (self, index, target, record, e, eOpts) {
    var me = this;

    me.fireEvent('recordtap', record);
  },

  onSearchKeyUp: function(field) {
    var me = this,
        value = field.getValue(),
        store = me.getStore();

    store.clearFilter(!!value);

    if(value){
      var searches = value.split(','),
          regexps = [],
          i, regex;

      for(i = 0; i < searches.length; i++){
        if(!searches[i]){
          continue;
        }

        regex = searches[i].trim();
        regex = regex.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");

        regexps.push(new RegExp(regex.trim(), 'i'));
      }

      // フィルタする
      store.filter(function(record){
        var matched = [];

        for(i = 0; i < regexps.length; i++){
          var search = regexps[i],
            didMatch = search.test(record.get('Name'));

          matched.push(didMatch);
        }

        return (regexps.length && matched.indexOf(true) !== -1);
      });
    }
  },

  onSearchClearIconTap: function() {
    // フィルタをクリアする
    this.getStore().clearFilter();
  }
});
