var Emitter = require('emitter');
var template = require('./template');
var $ = require('jquery');
var keyname = require('keyname');
var equals = require ('equals');


function MultiSelect (input, data) {
  this.source = $(input);
  this.el = $(template).insertBefore(input);
  this.container= this.el.find('.multiselect-container');
  this.dropdown = this.el.find('.multiselect-drop');
  this.search = this.el.find('.multiselect-search-field');
  this.input = this.container.find('input');
  var w = this.source.width();
  this.el.width(w);
  this.renderData(data || []);
  this.initEvents();
}

Emitter(MultiSelect.prototype);

MultiSelect.prototype.placeholder = function(placeholder) {
  this._placeholder = placeholder || this._placeholder;
  if (!this.source.val() && this._placeholder) {
    var w = this.search.width() - 10;
    this.input.addClass('multiselect-default');
    this.input.width(w);
    this.input.val(this._placeholder);
  }
}

MultiSelect.prototype.renderData = function(data) {
  this.data = data;
  data.forEach(function(o) {
    var parent = this.dropdown;
    if (Array.isArray(o.values)) {
      this.addGroup(parent, o);
    } else {
      this.addItem(parent, o.id, o.text);
    }
  }.bind(this));
  if (data.length === 0) {
    this.dropdown.append('<li class="multiselect-empty">可选项为空</li>')
  } else {
    this.dropdown.find('.multiselect-empty').remove();
  }
  this.rendered = true;
  var v = this.source.val(), li, id;
  if (v) this.value(v);
}

MultiSelect.prototype.initEvents = function() {
  this._containerClick = this.containerClick.bind(this);
  this.container.on('click', this._containerClick);
  this._dropdownClick = this.dropdownClick.bind(this);
  this.dropdown.on('click', this._dropdownClick);
  this.dropdown.on('mouseenter', function() {
  }.bind(this));
  this.input.on('focus', function (e) {
    var input = $(e.target);
    if (input.hasClass('multiselect-default')) {
      input.val('');
    }
  }.bind(this))
  this.input.on('keydown', function(e) {
    var key = keyname(e.which);
    var v = $(e.target).val();
    switch(key) {
      case 'backspace':
        if (v.length === 0) {
          var li = this.container.find('.multiselect-search-choice:last');
          li.remove();
          this.saveItems();
          this.displayItems();
        }
        break;
      default:
        // code
    }
  }.bind(this));
  this.input.on('keyup', function(e) {
    //e.preventDefault();
    var key = keyname(e.which);
    switch(key) {
      case 'up':
        this.prev();
        break;
      case 'down':
        this.next();
        break;
      case 'enter':
        this.select();
        break;
      default:
        this.filter();
    }
  }.bind(this))
  this._documentClick = this.documentClick.bind(this);
  $(document).on('click', this._documentClick);
}

MultiSelect.prototype.filter = function() {
  this.showDropdown();
  var v = this.value();
  var vs = v.split(',');
  if (this.maximum && v.split(',').length === this.maximum) return;
  this.displayItems();
  this.dropdown.find('.multiselect-group').removeClass('multiselect-collapse');
  var str = this.input.val().toLowerCase();
  var items = this.dropdown.find('.multiselect-item');
  items.each(function(i) {
    var text = this.innerHTML.toLowerCase();
    var id = $(this).attr('data-id');
    if (vs.indexOf(id) !== -1) {
      $(this).hide();
    } else if (!str) {
      $(this).show();
    } else if (text.indexOf(str) !== -1) {
      $(this).show();
    } else {
      $(this).hide();
    }
  })
  items.removeClass('active');
  items.filter(':visible').eq(0).addClass('active');
}

MultiSelect.prototype.next = function() {
  var items = this.dropdown.find('.multiselect-item');
  if (items.length === 0) return;
  var lis = items.filter(':visible');
  var curr, index = 0;
  lis.each(function(i) {
    if ($(this).hasClass('active')) {
      curr = $(this);
      index = i + 1;
    }
  })
  items.removeClass('active');
  index = index === lis.length? 0 : index;
  lis.eq(index).addClass('active');
}

MultiSelect.prototype.prev = function() {
  var items = this.dropdown.find('.multiselect-item');
  if (items.length === 0) return;
  var lis = items.filter(':visible');
  var curr, index = lis.length - 1;
  lis.each(function(i) {
    if ($(this).hasClass('active')) {
      curr = $(this);
      index = i - 1;
    }
  })
  items.removeClass('active');
  index = index === -1? lis.length - 1 : index;
  lis.eq(index).addClass('active');
}

MultiSelect.prototype.select = function() {
  var active = this.dropdown.find('.active');
  active.removeClass('active');
  if (active.length > 0) {
    var id = active.attr('data-id');
    active.removeClass('active');
    this.appendValue(id);
    this.saveItems();
    this.container.removeClass('multiselect-dropdown-open');
    this.container.removeClass('multiselect-focus');
    this.dropdown.hide();
    this.input.focus();
  }
}

MultiSelect.prototype.displayItems = function() {
  var v = this.value();
  if (this.limit) {
    this.limit.hide();
    this.limit.siblings().show();
  }
  if (v) {
    var vs = v.split(',');
    this.dropdown.find('.multiselect-item').show();
    vs.forEach(function(id) {
      var li = this.dropdown.find('[data-id="' + id + '"]');
      li.hide();
    }.bind(this));
  }
}

MultiSelect.prototype.remove = function() {
  $(document).off('click', this._documentClick);
  this.off();
  this.container.off();
  this.dropdown.off();
  this.input.off();
}

MultiSelect.prototype.containerClick = function(e) {
  e.preventDefault();
  this.input.focus();
  var target = $(e.target);
  if (target.hasClass('multiselect-search-choice-close')) {
    var li = target.parent();
    li.remove();
    this.saveItems();
    this.displayItems();
    return;
  }
  if (this.container.hasClass('multiselect-dropdown-open')) {
    this.container.removeClass('multiselect-dropdown-open');
    this.dropdown.hide();
    this.container.removeClass('multiselect-focus');
  }else {
    this.showDropdown();
  }
}

MultiSelect.prototype.showDropdown = function() {
  var v = this.value();
  var len = v.split(',').length;
  if (this.limit) {
    if (v && len === this.maximum) {
      this.limit.show();
      this.limit.siblings().hide();
    } else {
      this.displayItems();
    }
  }
  this.container.addClass('multiselect-dropdown-open');
  this.container.addClass('multiselect-focus');
  this.dropdown.show();
}

MultiSelect.prototype.dropdownClick = function(e) {
  var el = $(e.target);
  e.stopPropagation();
  if (el.hasClass('multiselect-title') || el.hasClass('multiselect-arrow')) {
    var group = el.parents('.multiselect-group');
    var list =group.find('.multiselect-list');
    if (group.hasClass('multiselect-collapse')) {
      group.removeClass('multiselect-collapse');
    } else {
      group.addClass('multiselect-collapse');
    }
  } else if (el.hasClass('multiselect-item')) {
    var id = el.attr('data-id');
    this.appendValue(id);
    this.saveItems();
    this.container.removeClass('multiselect-dropdown-open');
    this.container.removeClass('multiselect-focus');
    this.dropdown.hide();
    this.input.focus();
  }
}

MultiSelect.prototype.saveItems = function() {
  var items = this.container.find('.multiselect-search-choice');
  var ids = [];
  items.each(function() {
    return ids.push($(this).attr('data-id'));
  });
  this.value(ids.join(','));
}

MultiSelect.prototype.documentClick = function(e) {
  var el = $(e.target).parents('.multiselect');
  if (!el.is(this.el)) {
    this.container.removeClass('multiselect-focus');
    this.container.removeClass('multiselect-dropdown-open');
    this.dropdown.hide();
    this.input.val('');
    var v = this.value();
    if (!v) this.placeholder();
  }
}

MultiSelect.prototype.addGroup = function(parent, data) {
  var title = $('<div class="multiselect-group multiselect-collapse"><div class="multiselect-title"><i class="multiselect-arrow"></i>' + data.name + '</div></div>');
  var ul = $('<ul class="multiselect-list"></ul>');
  title.appendTo(parent);
  ul.appendTo(title);
  data.values.forEach(function(o) {
    this.addItem(ul, o.id, o.text);
  }.bind(this));
}

MultiSelect.prototype.addItem = function(ul, id, text) {
  var li = $('<li class="multiselect-item" data-id="' + id + '">' + text + '</li>')
  li.appendTo(ul);
}

MultiSelect.prototype.value = function(v) {
  if (arguments.length === 0) return this.source.val();
  if(!this.data || this.data.length === 0) return;
  var pre = this.source.val();
  this.dropdown.find('.multiselect-item').show();
  this.container.find('.multiselect-search-choice').remove();
  var vs;
  this.source.val(v);
  if (!v) {
    if (!this.container.hasClass('multiselect-focus')) {
      this.placeholder();
    }
  } else {
    this.input.removeClass('multiselect-default');
    this.input.width(100);
    this.input.val('');
    vs = v.split(',');
    vs.forEach(function(id) {
      var li = this.dropdown.find('[data-id="' + id + '"]');
      li.hide();
      this.appendValue(id);
    }.bind(this));
  }
  if (pre != v) {
    this.emit('change', vs || v);
  }
}

MultiSelect.prototype.reset = function() {
  this.value('');
}

function contains (arr, sub) {
  var contain = true;
  sub.forEach(function(v) {
    if (arr.indexOf(v) === -1) contain = false;
  })
  return contain;
}

MultiSelect.prototype.rebuild = function(data) {
  if (equals(this.data, data)) return;
  if (!this.data) return this.renderData(data);
  var ids = data.map(function(d) {
    return d.id.toString();
  });
  var v = this.value();
  if (v && contains(ids, v.split(','))) {
    //only limit, no reset
    return this.renderData(data);
  }
  this.reset();
  this.dropdown.find('.multiselect-item').remove();
  this.dropdown.find('.multiselect-group').remove();
  this.renderData(data);
}

MultiSelect.prototype.max = function(number) {
  this.maximum = number;
  if (this.limit) this.limit.remove();
  this.limit = $('<li class="multiselect-limit">你只能选择最多' + number + '项</li>');
  this.limit.appendTo(this.dropdown).hide();
}

MultiSelect.prototype.appendValue = function(id) {
  var li = this.dropdown.find('[data-id="' + id + '"]');
  var text = li.html();
  $('<li class="multiselect-search-choice" data-id="' + id + '"><div>' + text + '</div>'+
    '<a href="#" onclick="return false;" class="multiselect-search-choice-close" tabindex="-1"></a>' +
    '</li>').insertBefore(this.search);
}

MultiSelect.prototype.ids = function() {
  return $.map(this.dropdown.find('.multiselect-item'), function(li) {
    return $(li).attr('data-id');
  })
}

module.exports = MultiSelect;
