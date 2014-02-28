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
<form name="signup" class="signup" method="post" action="/signup">
  <div data-role="fieldcontain">
    <label for="first_name">Your first name:</label>
    <input name="first_name" id="first_name" type="text" />
  </div>
  <div data-role="fieldcontain">
    <label for="last_name">Your last name:</label>
    <input name="last_name" id="last_name" type="text" />
  </div>
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
      <button type="submit" class="submit">Create account</button>
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
  $.fn.account_signup = ->
    return @ if @plugin()

    $account_signup = @plugin('account_signup')

    # Upon the plugin's initial use, we build the content of the signup page.
    @find('.content').html(content).trigger('refresh')


    # Upon the user submitting the form,
    # ie, clicking the submit button or pressing the enter key in input boxes,
    @on 'submit', 'form[name="signup"]', ->
      $.ajax
        url: '/signup'
        type: 'POST'
        data:
          firstName: $('form.signup input[name="first_name"]').val()
          lastName: $('form.signup input[name="last_name"]').val()
          email: $('form.signup input[name="email"]').val()
          password: $('form.signup input[name="password"]').val()
        success: (data) ->
            console.log("account successfully created")
            $('form.signup input').val('').end()

            # We will also load and apply the account summary plugin
            # if it hasn't been applied before.
            require ['manage_account'], =>
              $('#card_list').manage_account()

            $.mobile.changePage("#manage_account")
            return
        error: (data) ->
          console.log("there was an error")
          console.log(data)
          $().publish 'notice', [data.responseText]
      return false

    # Upon the user cancelling the form,
    # ie, clicking the cancel button or pressing the escape key in input boxes,
    # we close the login page and empty its content.
    .on 'click', 'button[type=reset]', cancel = =>
      $.mobile.changePage("/")
      @find('input[name=email]').val('').end()
      @find('input[name=password]').val('').end()
      # We should also empty the list of deferments.
      deferreds = []
      return false
    .on 'keyup', 'input', (e) =>
      switch e.keyCode
        when 27 then cancel.call @
      return false

)(jQuery)
