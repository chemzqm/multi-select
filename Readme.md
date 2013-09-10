# multi-select

  A simple multi select component

## Installation

  Install with [component(1)](http://component.io):

    $ component install chemzqm/multi-select

## Events

* `change` value change, with value as first argumant.

## API

### MultiSelect(el, [data])

* `el` hidden input element.

* `data` should contain objects with `id` and `text` attributes or `name `and `values` attributes for unselectable group element.

### MultiSelect#placeholder(text)

Set placeholder with `text`.

### MultiSelect#value([value])

Get or set the value.

### MultiSelect#show()

With parent element which has class `group` shown.

### MultiSelect#hide()

With parent element which has class `group` hidden.

### MultiSelect#rebuild(data)

Reset all the options with `data`.

### MultiSelect#remove()

Destroy the MultiSelect instance.

### MultiSelect#max(number)

Limit the maximum selected items.

### MultiSelect#reset()

## License

  MIT
