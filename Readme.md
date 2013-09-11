# multi-select

  A simple multi select component

  [Demo](http://chemzqm.github.io/multi-select/index.html)

## Installation

  Install with [component(1)](http://component.io):

    $ component install chemzqm/multi-select

## Events

* `change` value change, with value as first argumant.

## API

### MultiSelect(el, [data])

* `el` hidden input element.

* `data` should contain objects with `id` and `text` attributes or `name `and `values` attributes for unselectable group element.

### .placeholder(text)

Set placeholder with `text`.

### .value([value])

Get or set the value.

### .rebuild(data)

Reset all the options with `data`.

### .remove()

Destroy the MultiSelect instance.

### .max(number)

Limit the maximum selected items.

### .reset()

## License

  MIT
