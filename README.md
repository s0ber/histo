Histo.js
=====
[![Build Status](https://travis-ci.org/s0ber/histo.png?branch=master)](https://travis-ci.org/s0ber/histo)

Histo.js is a small library, which allows different widgets to register it's own history events handlers, which won't be conflicting with each others.

## Usage

Let's say you have a widget, and this widget will push it's states to history, you can register history API support for this widget in a very simple way.

```
widget = Histo.addWidget({id: 'my_widget'})
```

## Widget class

Instance of Histo.Widget class will be return, this instance will have some methods for dealing with history. Here they are.

### replaceInitialState(stateData)

It will add some widget-specific data to current state. **stateData** is data, which will be attached to current state.

### pushState(path, stateData)

Will push new state. As in usual history API.

### onPopState(callback)

Will add pop state callbacks for a widget.
Those callbacks will be called, when state for the current widget will be changed.

Three arguments will be provided to callback, when it will be called:

#### state

State data, that was attached to state by a widget.

#### path

Current state path (it is **location.href** for the state). Your question may be — why are you providing this path, if it is equal to **location.href**?
That is because callbacks are called in a queue, i.e. if you are switching browser history too fast, then,
you'll get location.href, which is not proper for processing current state.

#### dfd

This is deferred object, which should be resolved, when processing of changed state is finished.
Usually, you need to make few ajax-requests, which are asynchronous, to reproduce state.
You should call ```dfd.resolve()``` when your state is completely reproduced.
In this case, if user switching states too fast, then, next state callbacks won't be called
until current state is competely reproduced and deferred object is resolved.

But what about cases, when you don't want to reproduce your state, and you want to,
for example, abort current ajax request and immediately start another one?

When states for the widget are switching too fast, Histo.js rejects deferred object for the state,
which was switched. So, you can do whatever you want in this case.

## Example Code

This is a very simple example of how you can implement some very primitive kind of pjax.

```coffee
$ ->
  new PjaxWidget()

class PjaxWidget

  constructor: ->
    @historyWidget = Histo.addWidget id: 'pjax'

    @setInitialState()
    @setPoppedStateProcessing()

    $('a').click(@renderNewPage.bind(@))

  setPoppedStateProcessing: ->
    @historyWidget.onPopState (state, path, dfd) =>
      # when state is rejected, we are aborting current ajax request,
      # and then this callback will be called for the next state
      dfd.fail @abortCurrentRequest.bind(@)
      @loadPage(path)
        .done(@renderPage.bind(@))
        .done => dfd.resolve()

  setInitialState: ->
    @historyWidget.replaceInitialState {}

  renderNewPage: ->
    path = $(e.currentTarget).attr('href')

    @loadPage(path).done (json) =>
      @historyWidget.pushState path, {}
      @renderPage(json)

  loadPage: (path) ->
    @abortCurrentRequest()
    @currentRequest = $.getJSON(path)

  renderPage: (json) ->
    $('#page_wrapper').html(json.html)

  abortCurrentRequest: ->
    @currentRequest.abort() if @currentRequest? and @currentRequest.state() isnt 'resolved'
```

## Example App

http://young-bastion-3622.herokuapp.com/ — example of using this widget,
https://github.com/s0ber/history_app — code for the example app above.
