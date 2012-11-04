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

	class Install_controller_checks extends Zula_ControllerBase {

		/**
		 * Check the environment the installer is running in to
		 * ensure all required PHP extensions exist and the needed
		 * files/directories are writable
		 *
		 * @return bool|string
		 */
		public function indexSection() {
			$this->setTitle( t('Pre-installation checks') );
			if (
				$this->_zula->getMode() != 'cli' &&
				(!isset( $_SESSION['installStage'] ) || $_SESSION['installStage'] !== 2)
			) {
				return zula_redirect( $this->_router->makeUrl('install', 'security') );
			}
			$checks = array(
						'exts'	=> array(
										'title'	=> t('Required PHP extensions'),
										'passed'=> false,
										'values'=> array(
														'ctype', 'date', 'dom', 'filter', 'hash', 'pdo',
														'pcre', 'session', 'json',
														)
										),
						'optExts' => array(
										'title'	=> t('Optional PHP extensions'),
										'passed'=> true,
										'values'=> array('gd', 'FileInfo')
										),
                        'sqlExts' => array( 'title' => t('PHP Drivers'),
                                            'passed' => false,
                                            'values' => array('pdo_mysql', 'pdo_sqlsrv')
                                            ),
						'files'	=> array(
										'title'	=> t('Writable files'),
										'passed'=> false,
										'values'=> array(
														$this->_zula->getDir( 'config' ).'/config.ini.php',
														$this->_zula->getDir( 'config' ).'/layouts/admin-default.xml',
														$this->_zula->getDir( 'config' ).'/layouts/main-default.xml',
														$this->_zula->getDir( 'config' ).'/layouts/fpsc-admin.xml',
														$this->_zula->getDir( 'config' ).'/layouts/fpsc-main.xml',
														)
										),
						'dirs'	=> array(
										'title'	=> t('Writable directories'),
										'passed'=> false,
										'values'=> array(
														$this->_zula->getDir( 'config' ).'/layouts',
														$this->_zula->getDir( 'logs' ),
														$this->_zula->getDir( 'tmp' ),
														$this->_zula->getDir( 'uploads' ),
														$this->_zula->getDir( 'locale' ),
														)
										),
					);
			// Run the various checks
			$passed = true;
			foreach( $checks as $name=>$details ) {
				$results = array();
				foreach( $details['values'] as $val ) {
					switch( $name ) {
						case 'exts':
						case 'optExts':
                        case 'sqlExts':
							$results[ $val ] = extension_loaded( $val );
							break;

						case 'files':
						case 'dirs':
							$results[ $val ] = zula_is_writable( $val );
					}
				}
                if ( $name == 'sqlExts' && in_array( true, $results, true ) ) {
                    $passed = true;
                    $checks[ $name ]['passed'] = true;
                } else if ( $name != 'optExts' && in_array( false, $results, true ) ) {
					$passed = false;
					$checks[ $name ]['passed'] = false;
				} else {
					$checks[ $name ]['passed'] = true;
				}
				$checks[ $name ]['values'] = $results;
			}
			if ( $passed ) {
				if ( isset( $_SESSION['installStage'] ) ) {
					++$_SESSION['installStage'];
				}
				$this->_event->success( t('Pre-installation checks were successful') );
				return zula_redirect( $this->_router->makeUrl('install', 'sql') );
			} else {
				if ( $this->_zula->getMode() == 'cli' ) {
					$this->_zula->setExitCode( 3 );
				}
				$this->_event->error( t('Sorry, your server environment does not meet our requirements') );
				$view = $this->loadView( 'checks'.($this->_zula->getMode() == 'cli' ? '-cli.txt' : '.html') );
				$view->assign( array(
									'checks'	=> $checks,
									'passed'	=> $passed,
									));
				return $view->getOutput();
			}
		}

	}

?>
