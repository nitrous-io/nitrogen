NitrogenView = require './nitrogen-view'
{CompositeDisposable} = require 'atom'

module.exports = Nitrogen =
  nitrogenView: null
  modalPanel: null
  subscriptions: null

  activate: (state) ->
    @nitrogenView = new NitrogenView(state.nitrogenViewState)
    @modalPanel = atom.workspace.addModalPanel(item: @nitrogenView.getElement(), visible: false)

    # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    @subscriptions = new CompositeDisposable

    # Register command that toggles this view
    @subscriptions.add atom.commands.add 'atom-workspace', 'nitrogen:toggle': => @toggle()

  deactivate: ->
    @modalPanel.destroy()
    @subscriptions.dispose()
    @nitrogenView.destroy()

  serialize: ->
    nitrogenViewState: @nitrogenView.serialize()

  toggle: ->
    console.log 'Nitrogen was toggled!'

    if @modalPanel.isVisible()
      @modalPanel.hide()
    else
      @modalPanel.show()
