# We define a custom jQuery plugin to define an interactive login bar.  The
# plugin will show a button to either log in or log out and will indicate who
# is currently logged in.  The plugin will respond to click events from the
# user, and will subscribe to custom login and logout events.

define [
  'template'
  'plugin'
], (_) -> (($) ->

  # Define the HTML template for the login button.
  tpl_login = _.template '''
    <h1>CWMars</h1>
    <div data-role="navbar">
      <ul>
        <li><a data-icon="plus" class="signup">Sign up</a></li>
        <li><a data-icon="forward" class="login">Login</a></li>
      </ul>
    </div>

  '''

  # Define the HTML template for the logout button.
  # The template also indicates who is currently logged in.
  tpl_logout = _.template '''
    <h1>CWMars</h1>
    <div data-role="navbar">
      <ul>
        <li>
          <a class="manage_account_link" href="#manage_account" data-icon="gear">
            Manage Cards
          </a>
        </li>
        <li>
          <a data-icon="back" class="logout">
            Logout
          </a>
      </ul>
    <div>You are currently logged in as <%= username %></div>
  '''

  # Define the plugin for the login bar.
  $.fn.login_bar = ->

    @plugin('login_bar')

    # Upon the plugin's initial use, we create the login button.
    .html(tpl_login {}).trigger('create')

    # Upon the user clicking the login button,
    # we show a login window.
    .on 'click', '.login', ->
      # > The login window is defined as a separate jQuery plugin module.
      # Since the user may not log in at all during an OPAC session,
      # we import the module on demand.
      #
      # > FIXME: this plugin is referencing the login window, which is
      # another plugin, by its id, but for better maintainability, a
      # plugin should not know another plugin's id.
      require ['account_login'], -> 
        $('body').pagecontainer('change', '#account_login', {'transition': 'slide'}).account_login()
      return false

    .on 'click', '.signup', ->
      require ['account_signup'], -> 
        $('body').pagecontainer('change', '#account_signup', {'transition': 'slide'}).account_signup()
      return false

    # Upon the start of a session,
    # we show the logout button with the username as the login status.
    .subscribe 'session.login', (un) ->
      $(@).html(tpl_logout username: un).trigger 'create'
      return false

    # Upon the user clicking the logout button,
    # we try to delete the user session by making the relevant service call.
    .on 'click', '.logout', ->
      # A service call requires the Evergreen API module, which is imported upon demand.
      require ['eg/eg_api'], (eg) -> eg.openils 'auth.session.delete'
      console.log("logging out")
      console.log(window.accounts)
      window.accounts = []
      return false

    # Upon the end of a session,
    # we show the login button again.
    .subscribe 'session.logout', ->
      $(@).html(tpl_login {}).trigger 'create'
      return false
)(jQuery)
