export const ScrapperData = async (link) => {
    const response = await fetch(`${process.env.BASE_URI}${link}`, {
        method: 'GET',
        mode : 'cors'
    });
    const textHtml = await response.text();
    return htmlParserMainBody(textHtml);
}

const htmlParserMainBody = (textHtml) => {
    const mainRegex = /<main .*?>([\s\S]*)<\/main>/;
    const mainString = mainRegex.exec(textHtml);
    if(mainString !== null && typeof mainString !== 'undefined' && mainString[1] !== null && typeof mainString[1] !== 'undefined' && mainString[1].length > 0) {
        const mainHtml = stringMainToHtmlEl(mainString[1]);
        
        /*
            Remove all scripts
        */

        const mainScripts = mainHtml.getElementsByTagName('script');
        let counterScript = mainScripts.length;
        while(counterScript--) {
            mainScripts[counterScript].parentNode.removeChild(mainScripts[counterScript]);
        }

        /*
            Remove all iframe
        */
    
        const mainIframes = mainHtml.getElementsByTagName('iframe');
        let counterIframe = mainIframes.length;
        while(counterIframe--){
            mainIframes[counterIframe].parentNode.removeChild(mainIframes[counterIframe]);
        }

        /*
            Remove all images
        */
        
        const mainImages = mainHtml.getElementsByTagName('img');
        let counterImages = mainImages.length;
        while(counterImages--){
            mainImages[counterImages].parentNode.removeChild(mainImages[counterImages]);
        }

        if(mainHtml?.firstElementChild?.firstElementChild?.classList.contains('entry-header')){
            mainHtml.firstElementChild.removeChild(mainHtml.firstElementChild.firstElementChild);
        }
        if(mainHtml?.firstElementChild?.firstElementChild?.lastElementChild?.classList.contains('b-share-calltoaction')){
            mainHtml.firstElementChild.firstElementChild.removeChild(mainHtml.firstElementChild.firstElementChild.lastElementChild);
        }
        return mainHtml.outerHTML;
    }
    else {
        return null;
    }
}

const stringMainToHtmlEl = (mainHtml) => {
    const objDomParser = new DOMParser();
    const domParser = objDomParser.parseFromString(mainHtml, 'text/html');
    return domParser.body.childNodes[0];
}