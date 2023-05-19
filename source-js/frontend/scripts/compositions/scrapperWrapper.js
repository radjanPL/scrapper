import {el} from 'redom';
import {SetAllPages} from './../components/scrapperApi.js';
import ScrapperButton from './../components/scrapperButton.js';
import {ScrapperData} from './../components/scrapperData.js';
import ScrapperState from './../components/scrapperStates.js';

export default class ScrapperWrapper{
    
    constructor(){
        this.handleScrapperBlog = this.handleScrapperBlog.bind(this);
        this.el = <ScrapperButton />
    }

    update = () => {
        
        /*
            *Parent button :)
        */

        this.el.el.addEventListener('click',  this.handleScrapperBlog);
    }

    handleScrapperBlog = async () => {
        let allNamePageLength, counterSrapperState = 0;
        this.handleSetButtonSpinner();
        const scrapperState = new ScrapperState();
        await this.handleGetAllNamePage().then(allNamePages => {
            allNamePageLength = allNamePages.length;
            if(allNamePages.length === 0 || allNamePages === null){
                this.handleSetButtonText();
                return true;
            }
            allNamePages.map(element => {
                ScrapperData(element.page_name + '/').then(resultBody => {
                    if(resultBody !== null){
                        scrapperState.setState(element.id, resultBody);
                    }
                }).then(() => {
                    counterSrapperState++;
                    if(allNamePageLength === counterSrapperState){
                        const states = scrapperState.getAllStates();
                        SetAllPages(states).then(result => {
                            if(result.success !== true) {
                                console.log('scrapper code is not working');
                            }
                            this.handleSetButtonText();
                        });
                    }
                })
            })
        })
    }

    handleGetAllNamePage = async () => {
        const allNamePages = []
        const checkBoxPages = document.getElementsByClassName('checkbox-page');
        for(let i = 0; i < checkBoxPages.length; i++){
          let element = checkBoxPages[i];
          if(element.checked){
            allNamePages.push({
              id : element.dataset.id,
              page_name : element.dataset.url
            });
          }
        }
        return allNamePages;
    }

    handleSetButtonSpinner = () => {
        this.el.el.toggleAttribute('disabled', true);
        this.el.el.lastChild.classList.remove('start-scrapper__text');
        return this.el.el.lastChild.classList.add('start-scrapper__spinner');
    }

    handleSetButtonText = () => {
        this.el.el.toggleAttribute('disabled', false);
        this.el.el.lastChild.classList.remove('start-scrapper__spinner');
        return this.el.el.lastChild.classList.add('start-scrapper__text');
    }
}