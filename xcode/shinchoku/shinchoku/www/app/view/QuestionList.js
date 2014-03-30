Ext.define('shinchoku.view.QuestionList', {
  extend: 'Ext.dataview.List',
  xtype: 'questionList',

  requires: [
    'Ext.TitleBar'
  ],

  config: {

    plugins: [
      {xclass: 'Ext.plugin.ListPaging'},
      {xclass: 'Ext.plugin.PullRefresh'}
    ],
    store: 'Questions',

    itemTpl: new Ext.XTemplate(
      '<div>',
        '<div class="user-name">{from_user_name} さんから</div>',
        '<div>{feed_count} 回ほど、進捗聞かれてます</div>',
      '</div>',
      {
        disableFormats: true
      }
    ),
    listeners: [
      {
        event: 'itemtap',
        fn: 'onRecordTap'
      }
    ]
  },

  initialize: function(){
    var me = this;

    var url = Ext.String.format('https://shinchokudoudesyo.herokuapp.com/shinchoku/{0}/view', force.getUserId());
    me.getStore().getProxy().setUrl(url);
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
    this.fireEvent('recordtap', record);
  }
});
