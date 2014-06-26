Histo.js
=====
[![Build Status](https://travis-ci.org/s0ber/histo.png?branch=master)](https://travis-ci.org/s0ber/histo)

Histo.js is a small library, which allows different widgets to register it's own history events handlers, which won't be conflicting with each others.

## Usage

Let's say you have a widget, and this widget will push it's state to history, you can register history API support for this widget like this.

```
widget = Histo.addWidget({id: 'my_widget'})
```

### Widget class

Instance of Histo.Widget class will be return, this instance will have some methods for dealing with history. Here they are.

### replaceInitialState(stateData)

It will add some widget-specific data to current state. **stateData** is data, which will be attached to current state.

### pushState(path, stateData)

Will push new state. As in usual history API.

### onPopState(callback)

Will add pop state callbacks for a widget. Those callbacks will be called, when state for the current widget will be changed.
