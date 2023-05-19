import {el, mount} from 'redom';
import './index.scss';
import ScrapperWrapper from './scripts/compositions/scrapperWrapper.js';

class Index{

    constructor(){
        this.scrapperWrapper = <ScrapperWrapper />;
        
        this.el = 
            <div className="container-scrapper-wrapper">
                {this.scrapperWrapper}
            </div>;
        
        this.scrapperWrapper.update();
    }

}

window.addEventListener('load', () => {
    const widgetWrapper = document.getElementById('container-scrapper');
    if(typeof widgetWrapper !== 'undefined' && widgetWrapper !== null){
        mount(widgetWrapper, <Index />);
    }else{
        console.log('#container-scrapper is not found');
    }
});