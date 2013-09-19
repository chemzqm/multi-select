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
  if (data) { this.renderData(data); }
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
    this.dropdown.find('.multiselect-item').removeClass('active');
  }.bind(this));
  this.input.on('focus', function (e) {
    var input = $(e.target);
    if (input.hasClass('multiselect-default')) {
      input.val('');
    }
  }.bind(this))

  this.input.on('keydown', function(e) {
    e.preventDefault();
    var key = keyname(e.which);
    switch(key) {
      case 'backspace':
        var li = this.container.find('.multiselect-search-choice:last');
        li.remove();
        this.saveItems();
        this.hideLimit();
        break;
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
    }
  }.bind(this))
  this._documentClick = this.documentClick.bind(this);
  $(document).on('click', this._documentClick);
}

MultiSelect.prototype.next = function() {
  this.showDropdown();
  if (this.limit.is(':visible')) return;
  var lis = this.dropdown.find('.multiselect-item');
  var curr, index = 0;
  lis.each(function(i) {
    if ($(this).hasClass('active')) {
      curr = $(this);
      index = i + 1;
    }
  })
  lis.removeClass('active');
  index = index === lis.length? 0 : index;
  lis.eq(index).addClass('active').parents('.multiselect-group').removeClass('multiselect-collapse');
}

MultiSelect.prototype.prev = function() {
  this.showDropdown();
  if (this.limit.is(':visible')) return;
  var lis = this.dropdown.find('.multiselect-item');
  var curr, index = lis.length - 1;
  lis.each(function(i) {
    if ($(this).hasClass('active')) {
      curr = $(this);
      index = i - 1;
    }
  })
  lis.removeClass('active');
  index = index === -1? lis.length - 1 : index;
  lis.eq(index).addClass('active').parents('.multiselect-group').removeClass('multiselect-collapse');;
}

MultiSelect.prototype.select = function() {
  var active = this.dropdown.find('.active');
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

MultiSelect.prototype.hideLimit = function() {
  if (!this.limit) return;
  var v = this.value();
  this.limit.hide();
  this.limit.siblings().show();
  if (v) {
    var vs = v.split(',');
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
    this.hideLimit();
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
      this.hideLimit();
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
    this.input.width(10);
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
