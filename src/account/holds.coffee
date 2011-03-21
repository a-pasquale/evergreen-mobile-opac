# holds.coffee
#
# The list_holds plugin lists a user's holds. It listens on the 'userid'
# channel, stores the id, and displays the holds when it's refreshed. The
# account_holds plugin waits for a refresh event and publishes the userid of
# the currently logged in user before triggering the list_holds plugin inside it.

module 'account.account_holds', imports('eg.eg_api', 'plugin'), (eg) ->
	$.fn.account_holds = ->
		@append $('<div>').holds()
		@refresh ->
			@publish 'userid', [eg.auth.session.user.id] if eg.auth.session?.user?
			return false


module 'account.holds', imports(
	'eg.eg_api'
	'eg.fieldmapper'
	'template'
	'plugin'
), (eg, fm, _) ->

	tpl_hold_form = '''
	<form>
		<div class="hold_list" />
		<input type="submit" class="cancel" name="some" value="Cancel selected holds" />
		<input type="submit" class="cancel" name="all" value="Cancel all" />
		<input type="submit" class="suspend" name="some" value="Suspend selected holds" />
		<input type="submit" class="suspend" name="all" value="Suspend all" />
		<input type="submit" class="resume" name="some" value="Activate selected holds" />
		<input type="submit" class="resume" name="all" value="Activate all" />
	</form>
	'''
	tpl_hold_item = _.template '''
	<div class="my_hold" id="hold_id_<%= hold_id %>">
		<input type="checkbox" name="hold_id" value="<%= hold_id %>" />
		<span class="info_line" />
		<div class="status_line" />
	</div>
	'''
	tpl_info_line = _.template '''
	<span class="title"> <%= title %> </span>
	<span class="author"> <%= author %> </span>
	<span class="types"> <%= types %> </span>
	'''
	tpl_status_line = (o) ->
		a = if o.status is 'Ready for Pickup'
			b = '''
			<span><strong><%= status %></strong> at <%= pickup %></span>
			'''
			c = if o.hold.shelf_time
					'''
					<span>Expires on <strong><%= shelf %></strong></span>
					'''
				else
					''
			b + c
		else
			b = if o.queue_position and o.potential_copies
					'''
					<span>Position <%= posn %> of <%= total %></span>
					'''
				else
					''
			c = if o.potential_copies is 1
					'''
					<span><%= avail %> copy available</span>
					'''
				else if o.potential_copies > 1
					'''
					<span><%= avail %> copies available</span>
					'''
				else
					''
			d = '''
				<span>Pick up at <%= pickup %></span>
				<span>Expires on <%= expire %></span>
				'''
			b + c + d
		_.template a

	pad = (x) -> if x < 10 then '0' + x else x
	datestamp = (x) ->
		"#{pad x.getMonth() + 1}/#{pad x.getDate()}/#{x.getFullYear()}"

	$.fn.holds = ->

		$plugin = @

		# List of current holds for logged-in user.
		holds = []

		# Use ajax to cancel a hold given its transaction id.
		cancel = (hold) ->
			eg.openils 'circ.hold.cancel', hold, (status) ->
				if status is 1
					#$().publish 'notice', ['Hold cancelled']
				else
					$().publish 'prompt', ['Hold was not cancelled', status]

		# Use ajax to update a hold given its transaction record.
		update = (hold) ->
			hold_id = hold.id
			eg.openils 'circ.hold.update', hold, (id) ->
				if id is hold_id
					# FIXME: the same hold id is returned.
					# We could avoid refreshing holds list, just update individual status lines.
					return id
				else
					# FIXME: is there a server error message generated by eg_api layer?
					$().publish 'prompt', ['Hold was not updated', id]
					return

		# Refresh summary line and details list.
		refresh = ->
			$plugin.ajaxStop ->
				$(@).unbind('ajaxStop').refresh().publish 'holds_summary'
				return false


		@plugin('acct_holds')

		.subscribe 'userid', (id) ->
			@refresh() if @is ':visible'
			return false

		.subscribe 'logout_event', ->
			@empty()
			return false

		.refresh ->
			@empty().append $ tpl_hold_form
			$list = $('.hold_list', @)

			# Hide action buttons until they are needed.
			$cancel_some = $('.cancel[name="some"]', @).hide()
			$cancel_all = $('.cancel[name="all"]', @).hide()
			$suspend_some = $('.suspend[name="some"]', @).hide()
			$suspend_all = $('.suspend[name="all"]', @).hide()
			$resume_some = $('.resume[name="some"]', @).hide()
			$resume_all = $('.resume[name="all"]', @).hide()
			# Show action buttons as necessary.
			show_buttons = (frozen) ->
				if $cancel_all.is ':visible'
					$cancel_some.show()
				else
					$cancel_all.show()
				if frozen
					if $resume_all.is ':visible'
						$resume_some.show()
					else
						$resume_all.show()
				else
					if $suspend_all.is ':visible'
						$suspend_some.show()
					else
						$suspend_all.show()
				return

			eg.openils 'circ.hold.details.retrieve.authoritative', 0, (o) =>
				if o.ilsevent? and o.ilsevent is '5000'

					# Same sequence as full OPAC for open-ils v1.6.
					# However, suffers from database replication error.
					$list.parallel 'holds list',
						ahrs: eg.openils 'circ.holds.retrieve'
						ouTree: eg.openils 'actor.org_tree.retrieve'
					, (x) =>
						for hold in x.ahrs
							((hold) ->
								id = hold.id
								$list.append tpl_hold_item { hold_id: id }
								$("#hold_id_#{id}").parallel 'holds details',
									mvr: eg.openils 'search.biblio.record.mods_slim.retrieve', hold.target
									hqs: eg.openils 'circ.hold.queue_stats.retrieve', id
								, (o) ->
									o.hold = hold
									o.status = o.hqs.status
									o.queue_position = o.hqs.queue_position
									o.total_holds = o.hqs.total_holds
									o.potential_copies = o.hqs.potential_copies

									holds.push o.hold
									$('.info_line', @).append tpl_info_line
										title: o.mvr.title if o.mvr.title
										author: "#{o.mvr.author}" if o.mvr.author
										types: "#{(o.mvr.types_of_resource).join ', '}" if o.mvr.types_of_resource
									$('.status_line', @).append (tpl_status_line o)
										status: o.status if o.status
										posn:	o.queue_position
										total:	o.total_holds
										avail:	o.potential_copies
										pickup: "#{x.ouTree[o.hold.pickup_lib].name}" if o.hold.pickup_lib
										expire: if o.hold.expire_time then "#{datestamp o.hold.expire_time}" else ''
										shelf: if o.hold.shelf_time then "#{datestamp o.hold.shelf_time}" else ''
									@addClass if o.hold.frozen then 'inactive' else 'active'
									show_buttons o.hold.frozen
								)(hold)
				else

					# A good sequence for open-ils v2.0
					# which does not show the database replication error.
					$list.parallel 'holds list',
						ids: eg.openils 'circ.holds.id_list.retrieve.authoritative'
						ouTree: eg.openils 'actor.org_tree.retrieve'
					, (x) =>
						for id in x.ids
							$list.append tpl_hold_item { hold_id: id }
							$("#hold_id_#{id}").openils 'holds details', 'circ.hold.details.retrieve.authoritative', id, (o) ->

								# Accumulate holds object in a list.
								# Useful for updating as the updated object needs to be returned to the server.
								holds.push o.hold

								$('.info_line', @).append tpl_info_line
									title: o.mvr.title if o.mvr.title
									author: "#{o.mvr.author}" if o.mvr.author
									types: "#{(o.mvr.types_of_resource).join ', '}" if o.mvr.types_of_resource
								$('.status_line', @).append (tpl_status_line o)
									status: o.status if o.status
									posn:	o.queue_position
									total:	o.total_holds
									avail:	o.potential_copies
									pickup: "#{x.ouTree[o.hold.pickup_lib].name}" if o.hold.pickup_lib
									expire: if o.hold.expire_time then "#{datestamp o.hold.expire_time}" else ''
									shelf: if o.hold.shelf_time then "#{datestamp o.hold.shelf_time}" else ''
								@addClass if o.hold.frozen then 'inactive' else 'active'
								show_buttons o.hold.frozen

			return false

		@delegate '.cancel[name=some]', 'click', ->
			xids = $(@).parent().serializeArray()
			if xids.length
				cancel xid.value for xid in xids
				refresh()
			else
				$(@).publish 'notice', ['Nothing was done because no holds were selected.']
			return false

		@delegate '.cancel[name=all]', 'click', ->
			$xs = $(@).parent().find('input:checkbox')
			if $xs.length
				$xs.each -> cancel $(@).val()
				refresh()
			else
				$(@).publish 'notice', ['Nothing was done because no holds were selected.']
			return false

		@delegate '.suspend[name=some]', 'click', update_some = ->
			suspend = $(@).hasClass 'suspend'
			xids = $(@).parent().serializeArray()
			if xids.length
				for xid in xids
					for hold in holds when hold.id is parseInt xid.value
						hold.frozen = suspend
						update hold
						break
				refresh()
			else
				$(@).publish 'notice', ['Nothing was done because no holds were selected.']
			return false

		@delegate '.suspend[name=all]', 'click', update_all = ->
			suspend = $(@).hasClass 'suspend' # suspend or resume?
			$form = $(@).parent()
			if suspend
				$xs = $('.my_hold.active', $form).find 'input:checkbox'
			else
				$xs = $('.my_hold.inactive', $form).find 'input:checkbox'
			if $xs.length
				$xs.each ->
					for hold in holds when hold.id is parseInt $(@).val()
						hold.frozen = suspend
						update hold
						break
				refresh()
			else
				$(@).publish 'notice', if suspend then ['Nothing was done because no active holds were found to suspend.'] else ['Nothing was done because no suspended holds were found to activate.']
			return false

		@delegate '.resume[name=some]', 'click', update_some
		@delegate '.resume[name=all]', 'click', update_all
