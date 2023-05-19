<?php

class scrapperApi{

    public function setAllPages(WP_REST_Request $request){
        $pages = $request->get_param('params');
        foreach($pages as $pageKey => $pageValue){
            $post = get_post($pageKey);
            $post->post_content = $pageValue;
            wp_update_post($post);
        }
        return [
            'success' => true
        ];
    }
}

class permissionScrapper extends WP_REST_Controller {
    public function checkPermission(WP_REST_Request $request) : bool {
        if(is_user_logged_in() && current_user_can('administrator')){
            return true;
        }
        return false;
    }
}

add_action('rest_api_init', function () {
    
    /**
        * Route set all pages
    */

    register_rest_route('scrapper/v1/main', '/setAllPages', [
        'methods' => 'POST',
        'permission_callback' => [new permissionScrapper, 'checkPermission'],
        'callback' => [new scrapperApi, 'setAllPages']
    ]);
});