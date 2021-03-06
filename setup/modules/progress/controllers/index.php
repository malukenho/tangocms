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

	class Progress_controller_index extends Zula_ControllerBase {

		/**
		 * Displays a simple progress list to show the user how far
		 * they are within the install/upgrade
		 *
		 * @return string
		 */
		public function indexSection() {
			$reqCntrlr = $this->_dispatcher->getDispatchData();
			if ( $reqCntrlr['module'] == 'install' ) {
				$this->setTitle( t('Installation progress') );
				$curStage = $_SESSION['installStage'];
				// Build the view
				$view = $this->loadView( 'installation.html' );
				$stages = array(
								t('Pre-installation checks'),
								t('SQL details'),
								t('First user'),
								t('Module installation'),
								t('Basic configuration'),
								t('Installation complete!'),
								);
			} else if ( $reqCntrlr['module'] == 'upgrade' ) {
				$this->setTitle( t('Upgrade progress') );
				$curStage = $_SESSION['upgradeStage'];
				// Build the view
				$view = $this->loadView( 'upgrade.html' );
				$stages = array(
								t('Version check'),
								t('Security check'),
								t('Pre-upgrade checks'),
								t('Perform upgrades'),
								t('Upgrade complete!'),
								);
			} else {
				return false;
			}
			$view->assign( array(
								'stages' 	=> $stages,
								'curStage'	=> $curStage,
								));
			return $view->getOutput();
		}

	}

?>
