/**
 * @class Ext.ux.BootManager
 *  - Ext.Application起動前処理を起動する
 */
Ext.define('Ext.ux.util.BootManager', {
  singleton: true,
  alternateClassName: 'Ext.ux.BootManager',

  requires: [],
  queue: [],
  config: {},

  isSetuped: false,

  init: function(requires, config) {
    var me = this;

    me.config = config;

    if (Ext.isArray(requires) && requires.length) {
      me.isSetuped = false;
      me.requires = requires;
      Ext.require(requires, function() {
        me.setup();
      });
    } else {
      me.isSetuped = true;
      me.finish();
    }
  },

  setup: function() {
    var me = this,
        cb = Ext.Function.bind(me.finish, me),
        path = [];

    Ext.each(me.requires, function(boot) {
      path = boot.path.split('.');

      // ブート処理にcallbackが指定されている場合は、処理を連結させる
      if(Ext.isFunction(boot.callback)){
        cb = Ext.Function.createSequence(boot.callback, cb);
      }

      if(path.length == 3){
        me.queue.push(window[path[0]][path[1]][path[2]]['setup'](cb));
      }
      if(path.length == 4){
        me.queue.push(window[path[0]][path[1]][path[2]][path[3]]['setup'](cb));
      }
      if(path.length == 5){
        me.queue.push(window[path[0]][path[1]][path[2]][path[3]][path[4]]['setup'](cb));
      }
      
    });

    me.isSetuped = true;
  },

  finish: function() {
    var me = this;

    me.queue.pop();

    if (me.queue.length === 0 && me.isSetuped) {
      Ext.application(me.config);
    }
  }

});

