<?php

defined('ABSPATH') or die('Direct script access disallowed.');

/**
    * @scrapper
    * Plugin Name: Scrapper
    * Description: The module allow scrapping all custom page
    * Version: 1.0.0
    * Requires at least: 5.2
    * Requires PHP: 7.2
    * Author: RadJan Deligo
*/


class scrapper{

    public function __construct(){
        $this->initFunctions();
    }

    public function initScrapperView(){
        return require_once(plugin_dir_path( __FILE__ ).'scrapperView.php');
    }

    public function initMenuOption(){
        return add_menu_page('Scrapper ', 'Scrapper', 'manage_options', 'Scrapper', [$this, 'initScrapperView']);
    }

    private function initFunctions(){
        $this->initRequired();
        $this->initRegisterAction();
        $this->initRegisterScripts();
    }

    private function initRequired(){
        require_once(ABSPATH.'wp-admin/includes/upgrade.php');
        require_once(ABSPATH.'wp-includes/pluggable.php');
        require_once(plugin_dir_path( __FILE__ ).'scrapperApi.php');
    }

    private function initRegisterScripts(){
        if(is_admin()){
            wp_enqueue_script('scrapper', '/wp-content/plugins/scrapper/assets/js/scrapper.js', false, '1.0.0');
            wp_localize_script('scrapper', 'scrapperSettings', [
                'nonce' => wp_create_nonce('wp_rest'),
            ]);
        }
    }

    private function initRegisterAction(){
        return add_action('admin_menu', [$this, 'initMenuOption']);
    }
}

new scrapper();