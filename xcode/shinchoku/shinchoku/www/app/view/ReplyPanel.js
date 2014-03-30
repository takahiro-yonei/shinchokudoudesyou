Ext.define('shinchoku.view.ReplyPanel', {
  extend: 'Ext.Container',
  xtype: 'replyPanel',

  requires: [
    'Ext.TitleBar',
    'shinchoku.view.QuestionList',
    'shinchoku.view.QuestionDetail'
  ],

  config: {
    layout: 'fit',
    items: {
      itemId: 'replyPanel',
      xtype: 'container',
      layout: 'card',
      activeItem: 0,

      items: [
        {
          itemId: 'questionList',
          layout: 'fit',
          items: [
            {
              docked: 'top',
              xtype: 'titlebar',
              title: '進捗聞かれてます'
            },{
              xtype: 'questionList'
            }
          ]
        },{
          itemId: 'questionDetail',
          layout: 'fit',
          items: [
            {
              docked: 'top',
              xtype: 'titlebar',
              title: '',
              items: [
                {
                  xtype: 'button',
                  ui: 'back',
                  text: '<<<',
                  itemId: 'backToQuestionListButton'
                }
              ]
            },{
              xtype: 'questionDetail'
            }
          ],

          listeners: [
            {
              delegate: '#backToQuestionListButton',
              event: 'tap',
              fn: function(){
                this.fireEvent('backtoquestionlist');
              }
            }
          ]
        }
      ]
    }
    
  }


});