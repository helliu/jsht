const ___fs = require('fs');
const ___path = require('path');
const ___readlineSync = require('readline-sync');
const ___ioUtils = require("./ioUtils");

class Jsht{
    execTemplateByFilePath(filePath, inputArgs, namedArgs, nodeModuleFolderPath, options){
        let content = ___fs.readFileSync(filePath, "utf8");
        let templateFileName = ___path.basename(filePath);
        let templateName = ___path.parse(templateFileName).name;
        let outputDir = process.cwd();
        let outputFile = ___path.resolve(outputDir + "/" + templateFileName);
        let templatePath = ___path.isAbsolute(filePath) ? filePath : ___path.resolve(filePath);
        let templateDir = ___path.dirname(templatePath);
        
        let templateResult = this.processTemplate(content, templateName, templatePath, templateDir, outputDir, outputFile, inputArgs, namedArgs, nodeModuleFolderPath, options.overwriteExistingFiles);

        if(options.outputJSCode){
            console.log("JS Code: ");
            console.log(templateResult.generatedJSCode);
        }

        if(!templateResult.executionOk){
            console.log("Error creating file from template: " + filePath);
            console.log(templateResult.errorMessage);
            return;
        }

        outputFile = templateResult.outputFilePath;
        
        if(options.outputTemplate){
            console.log("Template File: ");
            console.log(templateResult.generatedTemplate);
        }

        if(outputFile && outputFile.trim()){
            if(!___path.isAbsolute(outputFile)){
                outputFile = outputFile.trim();

                outputFile = outputDir + "/" + outputFile;
            }

            outputFile = ___path.resolve(outputFile);

            if(___fs.existsSync(outputFile) && !options.overwriteExistingFiles)
            if(!___readlineSync.keyInYN('File ' + outputFile + " already exists, wish to overwrite it?"))
                return;
            
            ___ioUtils.saveFullPath(outputFile, templateResult.generatedTemplate);
            console.log("Created file: " + outputFile + " from template: " + templatePath);
        }
    }

    processTemplate(templateContent, templateName, templatePath, templateDir, outputDir, outputFile, inputArgs, namedArgs, nodeModuleFolderPath, overwriteExistingFiles){
        let templateResult = { executionOk: false, templateSource: "", generatedJSCode: "", generatedTemplate: "", outputFilePath: null, errorMessage: null  }

        templateResult.templateSource = templateContent;

        try{
            templateResult.generatedJSCode = this.generateJSCodeFromTemplate(templateContent, templateName, templatePath, templateDir, outputDir, outputFile, inputArgs, namedArgs, nodeModuleFolderPath, overwriteExistingFiles);

            let executionResult = eval(templateResult.generatedJSCode);

            templateResult.generatedTemplate = executionResult.value;
            templateResult.outputFilePath = executionResult.outputFile;
            templateResult.executionOk = true;
        }catch(e){
            templateResult.executionOk = false;
            templateResult.errorMessage = e;
        }

        return templateResult;
    }

    generateJSCodeFromTemplate(templateContent, templateName, templatePath, templateDir, outputDir, outputFile, inputArgs, namedArgs, nodeModuleFolderPath, overwriteExistingFiles){
        let templateParts = _JshtInternal.divideInTemplateParts(templateContent);
        let inputArgsJSON = JSON.stringify(inputArgs).replace(/\"/g, '\\"');
        let namedArgsJSON = JSON.stringify(namedArgs).replace(/\"/g, '\\"');
        outputFile = outputFile.replace(/\\/g, '/');
        outputDir = outputDir.replace(/\\/g, '/');
        templatePath = templatePath.replace(/\\/g, '/');
        templateDir = templateDir.replace(/\\/g, '/');
        nodeModuleFolderPath = nodeModuleFolderPath != null ? nodeModuleFolderPath.replace(/\\/g, '/') : nodeModuleFolderPath;
        let formattedNodeModuleFolderPath = nodeModuleFolderPath == null ? null : "\"" + nodeModuleFolderPath + "\"";

        let jsCode =  String.raw`
    var ___this = this;
    (function(){ 
        var ____jsTemplateResu = {};
        ____jsTemplateResu.value = "";
        function printText(text){
            ____jsTemplateResu.value += text;
        }
        var outputFile = "${outputFile}";
        var currentDir = "${outputDir}";
        var templateName = "${templateName}";
        var templatePath = "${templatePath}";
        var templateDir = "${templateDir}";
        var inputArgs = JSON.parse("${inputArgsJSON}");
        var namedArgs = JSON.parse("${namedArgsJSON}");
        var overwriteExistingFiles = ${overwriteExistingFiles};
        var ___nodeModuleFolderPath = ${formattedNodeModuleFolderPath};
        global['___countRequire'] = global['___countRequire'] ? global['___countRequire']++ : 1;
        global['___originalRequire'] = global['___originalRequire'] ? global['___originalRequire'] : require;
        require = function(requirePath){
           try{
               if(___nodeModuleFolderPath)
                   return global['___originalRequire'](___nodeModuleFolderPath + '/' + requirePath);
           }catch(e){}
           try{
               return global['___originalRequire'](requirePath);
           }catch(e){}
           return global['___originalRequire'](templateDir + '/' + requirePath);
        };
 
        function callTemplate(template, inputParamsTemplate, namedParamsTemplate){ 
           if(!___path.isAbsolute(template)) 
              template = ___path.resolve(templateDir + '/' + template); 
        
           ___this.execTemplateByFilePath(template, inputParamsTemplate, namedParamsTemplate, ___nodeModuleFolderPath, overwriteExistingFiles); 
        }
        
        function execShell(command, path){
            var shell = require('child_process');
            let resultShell = "";
            
            if(path){
                resultShell = shell.execSync(command, {cwd: path}).toString();
            }else{
                resultShell = shell.execSync(command).toString();
            }
            
            console.log(resultShell);
        }`;

        for(let i = 0; i < templateParts.length; i++)
            jsCode += templateParts[i].jsExpression;

        jsCode += `
    ____jsTemplateResu.outputFile = outputFile;

       if(--global['___countRequire'] <= 0){
           require = global['___originalRequire'];
       }

        return ____jsTemplateResu;
    })();`;

        return jsCode;
    }
}

class _JshtInternal{
    static divideInTemplateParts(templateContent){
        let templateParts = [];
        
        let arrSplitedValues = _JshtInternal.splitWithContetParts(templateContent, /(<#.*?#>)/gs);

        for(let i = 0; i < arrSplitedValues.length; i++){
            let processedPart = _JshtInternal.processTemplatePart(arrSplitedValues[i]);
            templateParts.push(processedPart);
        }

        return templateParts;
    }

    /**
     * Will split the content, but will also bring the separtor expression, in the order it was found.
     * For example:
     * 
     * splitWithContetParts:
     * splitWithContetParts("a-b-c-d", /-/g) -> ["a", "-", "b", "-", "c", "-", "d"]
     * 
     * regular split:
     * "a-b-c-d".split("-") -> ["a", "b", "c", "d"]
     * 
     * @param {*} regexExpression 
     * @param {*} content 
     */
    static splitWithContetParts(content, regexExpression){
         let uniqueChar = _JshtInternal.findUniqueCharInContent(content);

         content = content.replace(regexExpression, uniqueChar + "$1" + uniqueChar);

         return content.split(uniqueChar);
    }

    static findUniqueCharInContent(content){
        let uniqueChar = "&&&";
        let foundUniqueChar = false;

        do{
            if(content.indexOf(uniqueChar) > -1)
                uniqueChar += generateRandomChar();
            else
                foundUniqueChar = true;
        }while(!foundUniqueChar);

        return uniqueChar;
    }

    static generateRandomChar(){
        return Math.random().toString(36)[2];
    }

    static processTemplatePart(rawTemplatePart){
        let templatePart = { PartType:{ PRINT_EXPRESSION:0, EXEC_JS_EXPRESSION:1, PRINT_TEXT:1 } };

        templatePart.raw = rawTemplatePart;

        if(rawTemplatePart.startsWith("<#=")){
            templatePart.type = templatePart.PartType.PRINT_EXPRESSION;
            
            //removes "<#=" and "#>"
            let expressionWithouDelimeters = rawTemplatePart.substring(3, rawTemplatePart.length - 2);
            templatePart.jsExpression = "printText(" + expressionWithouDelimeters + ");";
        }else if(rawTemplatePart.startsWith("<#")){
            templatePart.type = templatePart.PartType.EXEC_JS_EXPRESSION;

            //removes "<#" and "#>"
            let expressionWithouDelimeters = rawTemplatePart.substring(2, rawTemplatePart.length - 2);
            templatePart.jsExpression = expressionWithouDelimeters;
        }else{
            templatePart.type = templatePart.PartType.PRINT_TEXT;
            rawTemplatePart = _JshtInternal.sanitizeTemplateStringInput(rawTemplatePart);
            templatePart.jsExpression = "printText(`" + rawTemplatePart + "`);";
        }

        return templatePart;
    }

    static sanitizeTemplateStringInput(value){
       value = value.replace(/\\(?!(`|\`|\$\{|\$\{))/g, "\\\\"); //negative look forward for `|\`|\$
       value = value.replace(/\\\`/g, "\\\\`");
       value = value.replace(/`/g, "\\`");
       value = value.replace(/\\\$\{/g, "\\\\\$\{");
       value = value.replace(/\$\{/g, "\\\$\{");

       return value;
    }
}


let jsht = new Jsht();
module.exports = jsht;