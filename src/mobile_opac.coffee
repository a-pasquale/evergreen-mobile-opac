# mobile_opac.coffee
#
# Entry way to the mobile OPAC application.


Deferred.define()

# For debugging: catch errors thrown by Deferred callbacks and show them as alert messages.
#Deferred.onerror = (e) -> alert e + "\n" + JSON.stringify e, null, '  '

# Define the base file path for modules
jMod.config { path: 'js' }

# Customize layout and behaviour of jQuery.blockUI plugin.
jQuery.extend $.blockUI.defaults,
	message: "Error. Reload the page."
	applyPlatformOpacityRules: false
# Styles for jQuery.blockUI are defined in CSS files.
jQuery.blockUI.defaults.css = {}
jQuery.blockUI.defaults.overlayCSS = {}
jQuery.blockUI.defaults.overlayCSS.opacity = 0.6
jQuery.blockUI.defaults.overlayCSS['-ms-filter'] = 'progid:DXImageTransform.Microsoft.Alpha(Opacity=60)'
jQuery.blockUI.defaults.overlayCSS.filter = 'alpha(opacity=60)'
jQuery.blockUI.defaults.growlCSS.opacity = 0.9
jQuery.blockUI.defaults.growlCSS['-ms-filter'] = 'progid:DXImageTransform.Microsoft.Alpha(Opacity=90)'
jQuery.blockUI.defaults.growlCSS.filter = 'alpha(opacity=90)'
# FIXME: if external growlCSS is used, we get layout problem.
#jQuery.blockUI.defaults.growlCSS = {}

# Define some custom jQuery Mobile settings
#
jQuery.mobile.selectmenu.prototype.options.hidePlaceholderMenuItems = false
# Disable jQM's ajax mechanism since we are depending on the one in jQuery
jQuery.mobile.ajaxEnabled = false


# Do a one-time parse of any parameters in the query string.
# Make it available in window.query object.
( (q) ->
	return unless q.length
	query = {}
	d = (x) -> decodeURIComponent x.replace /\+/g, ' '
	r = /([^&=]+)=?([^&]*)/g
	while x = r.exec q
		query[d x[1]] = d x[2]
	window['query'] = query
)(window.location.search.substring(1))


module 'mobile_opac', imports(
	'messages'
	'load_spinner'
	'login_bar'
), ->

	jQuery ($) ->

		# Upon startup, hide account summary lines
		$('.account_summary').hide()

		# Upon user login, show account summary lines
		# and dynamically load and apply account summary plugin.
		$('#account_summary').subscribe 'login_event', ->
			$('.account_summary', @).show()
			thunk imports('account.summary'), => @acct_summary() unless @plugin()
			return false

		# Upon starting an OPAC search for first time,
		# dynamically load search bar and result summary plugins.
		$('#opac_search').one 'click', ->
			thunk imports('opac.search_bar'), -> $('#search_bar').search_bar(window.settings)
			thunk imports('opac.search_result'), -> $('#result_summary').result_summary()
			return # Allow click event to bubble up to accordion link.

		# Prepare the following containers for immediate use.
		#
		# The login bar enables user to log in and out.
		$('#login_bar').login_bar()
		#
		# The following interactive panes rely on jQuery.blockUI.
		#
		# Displays error messages and notices.
		$('#messages').messages()
		# Indicates data loading is occurring between client and server.
		$('body').load_spinner()
		return
