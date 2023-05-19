export default class ScrapperState{
    
    constructor(){
        this.states = {};
    }
    
    setState = (key, value) => {
        return this.states[key] = value;
    }

    getAllStates = () => {
        return this.states;
    }

    getGurrentState = (key) => {
        if(this.states[key] !== null && typeof this.states[key] !==  'undefined'){
            return this.states[key];
        }else{
            return null;
        }
    }
}