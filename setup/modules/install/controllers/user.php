<?php

/**
 * Zula Framework Module
 *
 * @patches submit all patches to patches@tangocms.org
 *
 * @author Evangelos Foutras
 * @author Alex Cartwright
 * @author Robert Clipsham
 * @copyright Copyright (C) 2007, 2008, 2009, 2010 Alex Cartwright
 * @license http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html GNU/LGPL 2.1
 * @package Zula_Setup
 */

	class Install_controller_user extends Zula_ControllerBase {

		/**
		 * Add the first user which will be created in the special
		 * 'root' group.
		 *
		 * @return bool|string
		 */
		public function indexSection() {
			$this->setTitle( t('First user') );
			/**
			 * Make sure user is not skipping a head
			 */
			if ( !isset( $_SESSION['installStage'] ) || $_SESSION['installStage'] !== 4 ) {
				return zula_redirect( $this->_router->makeUrl('install', 'security') );
			}
			$form = new View_Form( 'user.html', 'install' );
			$form->addElement( 'username', null, t('Username'), array(new Validator_Alphanumeric('_-'), new Validator_Length(2, 32)) );
			$form->addElement( 'password', null, t('Password'), array(new Validator_Length(4, 32), new Validator_Confirm('password2', Validator_Confirm::_POST)) );
			$form->addElement( 'email', null, t('Email'), array(new Validator_Email, new Validator_Confirm('email2', Validator_Confirm::_POST)) );
			if ( $form->hasInput() && $form->isValid() ) {
				$fd = $form->getValues();
				if ( $fd['username'] == 'guest' ) {
					$this->_event->error( t('Username of "guest" is invalid') );
				} else {
					$pdoSt = $this->_sql->prepare( 'UPDATE {SQL_PREFIX}users
													SET
														username = :username,
														password = :password,
														joined = UTC_TIMESTAMP(),
														email = :email
													WHERE id = 2' );
					$pdoSt->execute( array(
											':username'	=> $fd['username'],
											':password'	=> zula_hash( $fd['password'] ),
											':email'	=> $fd['email'],
											));
					// Set the contact form email to be the same as the initial user
					try {
						$pdoSt->closeCursor();
						$pdoSt = $this->_sql->prepare( 'UPDATE {SQL_PREFIX}mod_contact SET email = ?' );
						$pdoSt->execute( array($fd['email']) );
						$pdoSt->closeCursor();
					} catch ( Exception $e ) {
					}
					++$_SESSION['installStage'];
					return zula_redirect( $this->_router->makeUrl('install', 'settings') );
				}
			}
			/**
			 * Update the config.ini.php file with a new random
			 * salt that will be used for this installation.
			 */
			$configIni = Registry::get( 'config_ini' );
			try {
				$configIni->update( 'hashing/salt', zula_make_salt() );
				$configIni->writeIni();
			} catch ( Exception $e ) {
				$this->_log->message( 'salt could not be set "'.$e->getMessage().'", reverting to default salt.', Log::L_WARNING );
			}
			return $form->getOutput();
		}

	}

?>
