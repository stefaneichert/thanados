/**
 * Created by Sean on 4/11/2017.
 */
var Chart = require('chart.js');

var handleEvent = function(titleBlock, e) {
    // from core.legend.js
    var me = titleBlock,
        opts = me.options,
        type = e.type === 'mouseup' ? 'click' : e.type;

    if(type === 'mousemove') {
        if(!opts.onHover) return;
    } else if(type === 'click') {
        if(!opts.onClick) return;
    } else {
        return;
    }

    var x = e.x,
        y = e.y;

    var hitBox = {
        left: me.left,
        top: me.top,
        width: me.width,
        height: me.height
    };

    if (x >= hitBox.left && x <= hitBox.left + hitBox.width && y >= hitBox.top && y <= hitBox.top + hitBox.height) {
        // Touching an element
        if (type === 'click') {
            // use e.native for backwards compatibility
            opts.onClick.call(me, e.native, me);
        } else if (type === 'mousemove') {
            // use e.native for backwards compatibility
            opts.onHover.call(me, e.native, me);
        }
    } else if (type === 'mousemove' && opts.onLeave) {
        opts.onLeave.call(me, e.native, me);
    }
};

var titleClickPlugin = {
    afterEvent: function(chartInstance, e) {
        var titleBlock = chartInstance.titleBlock;
        if(titleBlock) {
            handleEvent(titleBlock, e);
        }
    }
};

module.exports = titleClickPlugin;
Chart.pluginService.register(titleClickPlugin);