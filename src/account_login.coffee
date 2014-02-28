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
#
if not accounts?
    accounts = []

define [
  'eg/eg_api'
  'plugin'
], (eg) -> (($) ->

  # ---
  # Define the content of the form for inputting user credentials,
  # specifically username and password.
  content = '''
<form name="login" method="post" action="/login">
  <div data-role="fieldcontain">
    <label for="email">Email:</label>
    <input name="email" id="email" type="text" />
  </div>
  <div data-role="fieldcontain">
    <label for="password">Password:</label>
    <input name="password" id="password" type="password" />
  </div>
  <div class="ui-grid-a">
    <div class="ui-block-a">
      <button type="reset">Cancel</button>
    </div>
    <div class="ui-block-b">
      <button type="submit" class="submit">Log in</button>
    </div>
  </div>
</form>
<a href="/auth/facebook">Login with Facebook</a>
  '''

  # Deferred service callbacks may number more than one;
  # we will collect them in an array.
  deferreds = []


  # ---
  # Define the login window plugin.
  $.fn.account_login= ->
    return @ if @plugin()

    $account_login = @plugin('account_login')

    # Upon the plugin's initial use, we build the content of the login page.
    @find('.content').html(content).trigger('refresh')
    #.html(content {}).trigger('create')


    # Upon the user submitting the form,
    # ie, clicking the submit button or pressing the enter key in input boxes,
    @on 'submit', 'form[name="login"]', ->
      console.log($('form input[name="email"]').val())
      console.log("password:")
      console.log($('form input[name="password"]').val())

      $.ajax
        url: '/login'
        type: 'POST'
        data:
          email: $('form input[name="email"]').val()
          password: $('form input[name="password"]').val()
        success: (data) ->
          if data.message?
            $().publish 'notice', [data.message]
          else
            accounts = data.user.accounts
            if accounts[0]?
              console.log("accounts exists")
              username = data.user.accounts[0].id
              password = data.user.accounts[0].password
              name = data.user.accounts[0].name

              # Try to make a service call with the credentials to try to create a session.
              # The attempt aborts if the credentials are not valid (eg, blank text)
              eg.openils 'auth.session.create',
                username: username
                password: password
                type: 'opac'
                org: 1 # TODO: remove hardcode
              , (resp) ->
                # Upon success, we close the login page and empty its input fields.
                $('input[name="password"]').val('').end()

                # We should also call any deferred service callbacks.
                while deferreds.length > 0
                  deferreds.pop().call()

                # We should also notify other plugins that a login has occurred
                # with the given username.
                $().publish 'session.login', [name]
                $("body").pagecontainer("change", "#main")
                return
              error: (data) ->
                console.log("error creating openils session.")
                response = JSON.parse(data.responseText)
                $().publish 'notice', [response.message]
            else 
              console.log("no accounts yet")
              $('.manage_account', @).show()
              # We will also load and apply the account summary plugin
              # if it hasn't been applied before.
              require ['manage_account'], =>
                $('#card_list').manage_account()

              $("body").pagecontainer("change", "#manage_account")

      return false

    # Upon the user cancelling the form,
    # ie, clicking the cancel button or pressing the escape key in input boxes,
    # we close the login page and empty its content.
    .on 'click', 'button[type=reset]', cancel = =>
      $.mobile.changePage("/")
      @find('input[name=email]').val('').end()
      #@find('input[name=password]').val('').end()
      # We should also empty the list of deferments.
      deferreds = []
      return false
    .on 'keyup', 'input', (e) =>
      switch e.keyCode
        when 27 then cancel.call @
      return false

    # Upon the plugin being notified that a login is required,
    # we open the login page.
    $account_login.subscribe 'session.required', (d) ->
      $.mobile.changePage $(@)
      # We should also add any deferred service callback to our list.
      deferreds.push d
      return false
)(jQuery)
