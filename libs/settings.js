const { exception } = require('console');
const fs = require('fs');
const PATH_SETTINGS_FILE = "./.settings";
const DEFAULT_GLOBAL_TEMPLATE_LOCATION = require('os').homedir();

class Settings{
    getGlobalTemplateLocation(){
        let settings = this.loadSettings();

        if(settings.globalTemplateLocation)
            return settings.globalTemplateLocation;
        else
            return DEFAULT_GLOBAL_TEMPLATE_LOCATION;
    }

    setGlobalTemplateLocation(value){
        if(!fs.existsSync(value))
           throw "Path does not exist: " + value;
        
        if(!fs.lstatSync(value).isDirectory())
            throw "Path is not a folder: " + value;


        let settings = this.loadSettings();

        settings.globalTemplateLocation = value;

        this.saveSettings(settings);
    }

    loadSettings(){
        if(!fs.existsSync(PATH_SETTINGS_FILE))
           return {};

        let fileContent = fs.readFileSync(PATH_SETTINGS_FILE);
        let objSettings = JSON.parse(fileContent);

        return objSettings;
    }

    saveSettings(objSettins){
        if(fs.existsSync(PATH_SETTINGS_FILE))
           fs.rmSync(PATH_SETTINGS_FILE);

        let fileContent = JSON.stringify(objSettins);
        
        fs.writeFileSync(PATH_SETTINGS_FILE, fileContent);
    }
}


let settings = new Settings();
module.exports = settings;