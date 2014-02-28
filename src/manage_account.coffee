# We define a jQuery plugin to show an interactive form for inputting user
# credentials.  The plugin will respond to submit and cancel events from the
# user.
#
# The plugin will also subscribe to 'session.required'.  Behind the scenes, if
# another plugin makes a service request that requires the user to be logged
# in, the *eg_api* module will defer the service callback and will publish the
# deferred callback to the topic.  The plugin will then execute the service
# callback only if the user successfully logs in.
#
# Once a session has been started, the plugin will publish the username on
# *session.login*.

define [
  'eg/eg_api'
  'template'
  'plugin'
], (eg, _) -> (($) ->

  tpl_manage_account = ->
    $("#card_list", @).text content

  content = '''
  <ul class="card-list" data-role="listview"
      data-split-icon="gear" data-split-theme="a"
      data-inset="true">
  </ul>
  <a href="#add_card_popup" data-rel="popup" data-position-to="window"
     data-transition="pop" class="ui-btn ui-corner-all">
    Add a card
  </a>
  <a class="ui-btn back" data-icon="back" href="#" >Back</a>
  <div id="add_card_popup" class="popup ui-content">
    <form class="add_card" action="/add_account" method="post"
          accept-charset="utf-8">
      <label for="card_id">Card ID number:</label>
      <input type="text" name="card_id" />
      <label for="card_name">Card Name:</label>
      <input type="text" name="card_name" />
      <label for="card_password">Password:</label>
      <input type="password" name="card_password" />
      <button type="submit" name="submit">Add card</button>
      <a href="
    </form>
  </div>
  '''

  tpl_item = _.template '''
      <li class="ui-field-contain" id="<%= card_oid %>">
        <a href="#" class="card_index" title="Select this card."
           data-card-index="<%= card_index %>">
          <%= card_name %>
        </a>
        <a href="#popup-<%= card_index %>" data-rel="popup"
           data-transition="pop">
            Edit this card
        </a>
      </li>
      <div data-role="popup" class="popup ui-content ui-corner-all"
           id="popup-<%= card_index %>">
        <form class="edit_card" method="post"
              action="/edit_account">
          <input type="hidden" name="card_oid" value="<%= card_oid %>" />
          <label for="card_id">Card ID number:</label>
          <input name="card_id" type="text" value="<%= card_id %>" />
          <label for="card_name">Card Name:</label>
          <input name="card_name" type="text" value="<%= card_name %>"/>
          <label for="card_password">Password:</label>
          <input name="card_password" type="password" />
          <a data-rel="back" data-icon="back" class="ui-btn">Discard changes</a>
          <button name="submit" class="ui-btn">Save changes</button>
          <button name="delete_card" class="ui-btn">Delete this card</button>
        </form>
      </div>
  '''

  # Deferred service callbacks may number more than one;
  # we will collect them in an array.
  deferreds = []


  # ---
  # Define the login window plugin.
  $.fn.manage_account= ->
    return @ if @plugin()
    $manage_account = @plugin('manage_account')
    if $(".card-list").length > 0
      console.log("card-list exists")
    else
      @html(content).trigger 'create'

      # Upon the plugin's initial use, we build the content of the login page.
      @find('.content').html(content).trigger('refresh')
      tpl_manage_account()

    $list = $('.card-list', @)
    if window.accounts?
      for card, i in window.accounts
        $list.append $item = $ (tpl_item)
          card_index: i
          card_name: card.name
          card_id: card.id
          card_password: card.password
          card_oid: card._id

    $('.card-list').listview("refresh")
    $('.popup').popup()

    # Upon the user submitting the form,
    # ie, clicking the submit button or pressing the enter key in input boxes,
    @on 'click', 'a.card_index', ->
      data = $(this).data()
      card = window.accounts[data.cardIndex]

      # Try to make a service call with the credentials to try to create a session.
      # The attempt aborts if the credentials are not valid (eg, blank text)
      eg.openils 'auth.session.create',
        username: card.id
        password: card.password
        type: 'opac'
        org: 1 # TODO: remove hardcode
      , (resp) ->

        # We should also call any deferred service callbacks.
        while deferreds.length > 0
          deferreds.pop().call()

        # We should also notify other plugins that a login has occurred
        # with the given username.
        $().publish 'session.login', [card.name]
        $('#manage_account').hide()
        $('body').pagecontainer('change', '#main', {'transition': 'slide'})
        $('#main').show()
        $('#manage_account').hide()
        return
      return false

    @on 'click', 'a.back', ->
      $('#manage_account').hide()
      $('body').pagecontainer('change', '#main', {'transition': 'slide'})
      return false

    $('body').on 'submit', 'form.edit_card', ->
      $.post '/edit_account',
        oid: $("input[name=card_oid]", this).val()
        id: $("input[name=card_id]", this).val()
        name: $("input[name=card_name]", this).val()
        password: $("input[name=card_password]", this).val()
        (data) ->
          $('body').pagecontainer('change', '#manage_account')
          if data.message?
            $().publish 'notice', [data.message] 
      return false

    # Delete this card from the account.
    $('body').on 'click', 'button[name="delete_card"]', ->
      oid = $('input[name="card_oid"]', $(this).parent() ).val()
      $.get('/remove_account/' + oid)
        .success (response) ->
          $('#' + oid).remove()
          $('.popup').popup('close')
        .done (response) ->
          if response.message?
            $().publish 'notice', [response.message]
      return false

    # Bind click event to form card-list since form doesn't
    # exist yet.
    $('body').on 'submit', 'form.add_card', ->
      id = $('input[name="card_id"]', this).val()
      name = $('input[name="card_name"]', this).val()
      password = $('input[name="card_password"]', this).val()
      
      eg.openils 'auth.session.create',
        username: id
        password: password
        type: 'opac'
        org: 1 # TODO: remove hardcode
      , (resp) ->
        # If we get a succesful response, create the account.
        $.post '/add_account',
          id: id
          name: name
          password: password
          (data) ->
            $().publish 'session.login', [name]

            window.accounts.push {'id': id, 'password': password, 'name': name}
            $list = $('.card-list')
            $list.append $item = $ (tpl_item)
              card_index: window.accounts.length - 1
              card_name: name
              card_id: id
              card_password: password
              card_oid: data.account._id

            $('.card-list').listview("refresh")
            $('.popup').popup()
            $('.popup').popup('close')

      return false

    @subscribe 'session.login', ->
      $('.manage_account').manage_account()
      return false

    @subscribe 'session.logout', ->
      $('.manage_account').empty()
      return false

)(jQuery)
