<?php

/**
 * Zula Framework Module
 *
 * @patches submit all patches to patches@tangocms.org
 *
 * @author Alex Cartwright
 * @copyright Copyright (C) 2009, 2010 Alex Cartwright
 * @license http://www.gnu.org/licenses/old-licenses/gpl-2.0.html GNU/GPL 2
 * @package TangoCMS_Poll
 */

	abstract class PollBase extends Zula_ControllerBase {

		/**
		 * Checks if the current user has voted from the provided votes
		 *
		 * @param array $votes
		 * @return bool|int
		 */
		protected function hasUserVoted( array $votes ) {
			foreach( $votes as $oid ) {
				foreach( $oid as $vote ) {
					if (
						zula_ip2long( zula_get_client_ip() ) == $vote['ip'] ||
						($vote['uid'] != Ugmanager::_GUEST_ID && $vote['uid'] == $this->_session->getUserId())
					) {
						return (int) $vote['option_id'];
					}
				}
			}
			return false;
		}

		/**
		 * Checks if a poll is closed. If is not closed and the duration has ran out
		 * then close the poll automatically.
		 *
		 * @param array &$poll
		 * @return bool
		 */
		protected function isClosed( &$poll ) {
			if ( $poll['status'] == 'closed' ) {
				return true;
			} else if ( $poll['duration'] > 0 && new DateTime( $poll['end_date'] ) <= new DateTime ) {
				$this->_model()->closePoll( $poll['id'] );
				$poll['status'] = 'closed';
				return true;
			}
			return false;
		}

	}

?>