const ShellParams = require("shellparams");
const settings = require("./libs/settings");
const jsht = require("./libs/jsht");
const fs = require('fs');
const path = require('path');
const ioUtils = require("./libs/ioUtils");
const readlineSync = require('readline-sync');

const JSHT_TEMPLATE_FOLDER = ".jshtTemplates";

ShellParams.create()
.parameters( "-help", showHelp )
.parameters( "help", showHelp )
.parameters( "-?", showHelp )
.parameters( "?", showHelp )
.parameters( "config", "template", "location", setTemplateLocation )
.parameters( "-n", createNewTemplateLocally )
.parameters( "-new", createNewTemplateLocally )
.parameters( "-n", "-g", createNewTemplateLocallyGlobally )
.parameters( "-new", "-g", createNewTemplateLocallyGlobally )
.default( executeTemplate );

function createNewTemplateLocally(...relativePathFile){
    createNewTemplate(false, relativePathFile);
}

function createNewTemplateLocallyGlobally(...relativePathFile){
    createNewTemplate(true, relativePathFile);
}

function createNewTemplate(isGlobally, arrRelativePath){
    let rootPath = isGlobally ? settings.getGlobalTemplateLocation() : ".";
    rootPath += "/" + JSHT_TEMPLATE_FOLDER;

    let fileTemplate = convertRelativeToEndingJSAbsPath(rootPath + "/" + arrRelativePath.join("/"));

    if(fs.existsSync(fileTemplate))
    if(!readlineSync.keyInYN('File ' + fileTemplate + " already exists, wish to overwrite it?"))
       return;
    
    try{
        ioUtils.saveFullPath(fileTemplate, generateNewFileTemplateContent());
        console.log("New template created at:");
        console.log(fileTemplate);
    }catch(e){
        console.log("Error creating new template");
        console.log(e);
    }
}

function executeTemplate(...args){
    let executeTemplateResut = processExecuteTemplateArgs(args);

    switch(executeTemplateResut.status){
        case executeTemplateResut.StatusType.NO_ARGS :
            console.log("Invalid arguments, try \"jsht -help\" to see options");
        break;

        case executeTemplateResut.StatusType.TEMPLATE_FILE_NOT_FOUND :
            console.log("Template not found at locations:");
            console.log("Locally: " + executeTemplateResut.templatePathLocally);
            console.log("Globally: " + executeTemplateResut.templatePathGlobally);
        break;

        case executeTemplateResut.StatusType.EXEC_TEMPLATE_LOCALLY :
        case executeTemplateResut.StatusType.EXEC_TEMPLATE_GLOBALLY :
            let nodeModuleFolderPath = executeTemplateResut.templateFolderRootPath + "/node_modules";

            jsht.execTemplateByFilePath(executeTemplateResut.templatePath, 
                                       executeTemplateResut.inputArgs, 
                                       executeTemplateResut.templateNamedArgs,
                                       nodeModuleFolderPath,
                                       executeTemplateResut.options);
        break;
    }
    
}

function processExecuteTemplateArgs(args){
    let executeTemplateResut = { StatusType:{NO_ARGS: 0, EXEC_TEMPLATE_LOCALLY: 1, EXEC_TEMPLATE_GLOBALLY: 2, TEMPLATE_FILE_NOT_FOUND: 3} };
    
    if(args.length < 1){
        executeTemplateResut.status = executeTemplateResut.StatusType.NO_ARGS;
        return executeTemplateResut;
    }    

    executeTemplateResut.templateNamedArgs = extractNamedArgs(args, true);
    executeTemplateResut.options = {overwriteExistingFiles: false, outputTemplate: false, outputJSCode: false};
    
    if(executeTemplateResut.templateNamedArgs && executeTemplateResut.templateNamedArgs["rf"]){
        executeTemplateResut.options.overwriteExistingFiles = true;
        delete executeTemplateResut.templateNamedArgs["rf"];
    }
    
    if(executeTemplateResut.templateNamedArgs && executeTemplateResut.templateNamedArgs["outputTemplate"]){
        executeTemplateResut.options.outputTemplate = true;
        delete executeTemplateResut.templateNamedArgs["outputTemplate"];
    }
    
    if(executeTemplateResut.templateNamedArgs && executeTemplateResut.templateNamedArgs["outputJSCode"]){
        executeTemplateResut.options.outputJSCode = true;
        delete executeTemplateResut.templateNamedArgs["outputJSCode"];
    }
    
    executeTemplateResut.inputArgs = [];
    while(args.length > 0){
       executeTemplateResut.templatePathLocally = convertRelativeToEndingJSAbsPath("./" + JSHT_TEMPLATE_FOLDER + "/" + args.join("/"));
       executeTemplateResut.templatePathGlobally = convertRelativeToEndingJSAbsPath(settings.getGlobalTemplateLocation() + "/" + JSHT_TEMPLATE_FOLDER + "/" + args.join("/"));

       
       if(fs.existsSync(executeTemplateResut.templatePathLocally)){
           executeTemplateResut.status = executeTemplateResut.StatusType.EXEC_TEMPLATE_LOCALLY;
           executeTemplateResut.templatePath = executeTemplateResut.templatePathLocally;
           executeTemplateResut.templateFolderRootPath = path.resolve("./" + JSHT_TEMPLATE_FOLDER);
           return executeTemplateResut;
       }

       if(fs.existsSync(executeTemplateResut.templatePathGlobally)){
           executeTemplateResut.status = executeTemplateResut.StatusType.EXEC_TEMPLATE_GLOBALLY;
           executeTemplateResut.templatePath = executeTemplateResut.templatePathGlobally;
           executeTemplateResut.templateFolderRootPath = path.resolve(settings.getGlobalTemplateLocation() + "/" + JSHT_TEMPLATE_FOLDER);
           return executeTemplateResut;
       }

       executeTemplateResut.inputArgs.unshift(args.pop());
    }

    executeTemplateResut.status = executeTemplateResut.StatusType.TEMPLATE_FILE_NOT_FOUND;
    return executeTemplateResut;
}

/**
 * Inside array of args, will look for
 * -<nameVar> <value>
 * Example:
 * jsht myTemplate -name Ana -age 30 -safeMode
 * will return { name: "Ana", age: 30, safeMode: true} 
 * @param {*} args 
 */
function extractNamedArgs(args, removeArgs){
    let templateArgs = {};
    let foundAny = false;
    let argsIndexToBeRemoved = [];

    for(let i = 0; i < args.length; i++){
        if(typeof args[i] == "string" && args[i].startsWith("-") && i < args.length){
            let nextIndex = i + 1;
            let paramName = args[i].substring(1);
            argsIndexToBeRemoved.push(i);

            if(nextIndex < args.length && !(typeof args[nextIndex] == "string" && args[nextIndex].startsWith("-"))){
                 templateArgs[paramName] = args[i + 1];
                 argsIndexToBeRemoved.push(nextIndex);
                 i++;
            }else{
                 templateArgs[paramName] = true;
            }
            
            foundAny = true;
        }
    }

    if(removeArgs && foundAny && argsIndexToBeRemoved.length > 0){
        for(let i = argsIndexToBeRemoved.length - 1; i >= 0; i--){
            let index = argsIndexToBeRemoved[i];
            args.splice(index, 1);
        }
    }

    if(foundAny)
        return templateArgs;
    else
        return null;
}

function setTemplateLocation(newValue){
    try{
      if(newValue){
         settings.setGlobalTemplateLocation(newValue);
         console.log("new globally template location set at: " + newValue);
      }else{
         console.log("Local: " + path.resolve("./"));
         console.log("Global: " + settings.getGlobalTemplateLocation());
         console.log("First jsht will look for the template inside " + JSHT_TEMPLATE_FOLDER + " at local folder, if not found it will look for template inside " + JSHT_TEMPLATE_FOLDER + " at global folder.");
      }
     }catch(e){
         console.log(e);
     }
}

function convertRelativeToEndingJSAbsPath(filePath){
    filePath = filePath.toLocaleLowerCase().trim().endsWith(".js") ? filePath : filePath + ".js";
    filePath  = path.resolve(filePath);

    return filePath;
}

function showHelp(){
    let helpText = `
#create new template locally
> jsht -n myNewTemplate
or
> jsht -new myNewTemplate

#execute template
> jsht <TEMPLATE_NAME>
example
> jsht myNewTemplate

#-rf options overwrite generated file without asking
> jsht <TEMPLATE_NAME> -rf
example
> jsht myNewTemplate -rf

#create new template globally
> jsht -n -g myNewTemplate
or
> jsht -new -g myNewTemplate

#set global location for templates, by default is ~
> config template location <new global template location>

#get global location for templates
> config template location
`;
    
    console.log(helpText);
}

function generateNewFileTemplateContent(){
    return `<#
    //any NodeJS here
    var className = "HelloWorld";
#>

class <#=className#>{

}`;
}