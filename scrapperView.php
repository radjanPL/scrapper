<?php

class scrapperView extends WP_List_Table {
    
    public function get_columns(){
        return [
            'cb' => '<input type="checkbox" />',
            'id' => 'Id',
            'page_title' => 'Page Title',
            'page_name'=> 'Page Name'
        ];
    }

    public function get_items(array $slugsValue = null){
        $pages = get_pages(['post_type' => 'page', 'post_status' => 'publish']);
        $subFolderSite = $this->get_sub_folder_site();
        $pagesParsed = [];
        foreach($pages as $page){
            $pageTemplateSlug = preg_replace('/\\.[^.\\s]{3,4}$/', '', get_page_template_slug($page->ID));
            if((int)strlen($pageTemplateSlug) > 0 && in_array($pageTemplateSlug, $slugsValue)){
                $pagesParsed[] = [
                    'id' => $page->ID,
                    'page_name' => $page->post_name,
                    'page_title' => $page->post_title,
                    'page_dir' => $subFolderSite.'/'.$page->post_name
                ];
            }
        }
        return $pagesParsed;
    }

    public function get_sortable_columns(){
        return [
            'id' => ['id', false],
            'page_name' => ['page_name', false],
            'page_title'=> ['page_title', false]
        ];
    }

    public function get_sub_folder_site(){
        return site_url('', 'relative');
    }

    public function prepare_items(string $slugsValue = null){
        $slugsArray = $this->get_array_from_slugs_string($slugsValue);
        $items = $this->get_items($slugsArray);
        $currentPage = $this->get_pagenum();
        $totalItems = count($items);
        $perPage = 25;

        $this->set_pagination_args([
            'total_items' => $totalItems,
            'per_page'    => $perPage
        ]);

        usort($items, array(&$this, 'usort_reorder'));

        $this->_column_headers = [$this->get_columns(), [], $this->get_sortable_columns()];
        $this->items = array_slice($items ,(($currentPage - 1) * $perPage), $perPage);
    }

    public function column_default(array $item = null, string $columnName = null){
        switch($columnName) { 
            case 'id':
            case 'page_name':
            case 'page_title':
            return $item[$columnName];
            default:
                return print_r($item, true);
        }
    }

    public function column_cb($item) {
        return '<input type="checkbox" class="checkbox-page" data-id="'.$item['id'].'" data-url="'.$item['page_dir'].'"/>';
    }

    public function usort_reorder(array $cmpA = null, array $cmpB = null) {
        $orderby = (!empty( $_GET['orderby'])) ? $_GET['orderby'] : 'id';
        $order = (!empty($_GET['order'])) ? $_GET['order'] : 'asc';
        $result = strcmp($cmpA[$orderby], $cmpB[$orderby]);
        return ($order === 'asc') ? $result : -$result;
    }
    
    private function get_array_from_slugs_string(string $slugsValue = null){
        $explodedSlugsValue = [];
        foreach(explode(',', $slugsValue) as $item){
            $explodedSlugsValue[] = trim($item);
        }
        return $explodedSlugsValue;
    }
}

class scrapperOtions{
    
    private $_slugOption = 'scrapper_slugs_value';

    public function add_slugs(string $slugsValue = null){
        if(empty($slugsValue)){
            return $this->remove_slugs();
        }

        else if(empty($this->get_slugs())){
            return $this->add_new_slugs($slugsValue);
        }

        else{
            return $this->update_slugs($slugsValue);
        }
    }

    public function get_slugs(){
        return get_option($this->_slugOption);
    }

    private function add_new_slugs(string $slugsValue = null){
        return add_option($this->_slugOption, $slugsValue);
    } 

    private function remove_slugs(){
        return delete_option($this->_slugOption);
    }

    private function update_slugs(string $slugsValue = null){
        return update_option($this->_slugOption, $slugsValue);
    }
}

$objScrapperAlgoliaView = new scrapperView();
$objScrapperOtions = new scrapperOtions();

if(isset($_POST['slugs_value']) && isset($_POST['submit'])){
    $objScrapperOtions->add_slugs(trim($_POST['slugs_value']));   
}

$slugValue = $objScrapperOtions->get_slugs(); 
?>

<div class="wrap">
    <h2>Scrapper</h2>
    <div id="container-scrapper">
        <div class="notice notice-info is-dismissible">
            <p>
                <b>Enter slugs, separating them with a comma</b>
            </p>
        </div>
        <form method="POST" action="">
        <table class="form-table">
            <tbody>
                <tr>
                    <th scope="row">
                        <label for="slugs_value">
                            Slugs
                        </label>
                    </th>
                    <td>
                        <input type="text" name="slugs_value" id="slugs_value" class="regular-text code" style="width:100%" value="<?= $slugValue ?>"/>
                    </td>
                </tr>
        </table>
        <p class="submit">
            <input type="submit" name="submit" id="submit" class="button button-primary" value="Save"/>
        </p>
        </form>
        <hr />
        <?php
            $objScrapperAlgoliaView->prepare_items($slugValue);
            $objScrapperAlgoliaView->display();
        ?>
        <div id="wrapper-scrapper" class="wrapper-scrapper"/>
    </div>
</div>