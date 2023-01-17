# jsht

Program to generate templates files using NodeJS code, using tags <# #> and <#= #> to print values.<br />
With all capabilities NodeJS has to offer.

## Prerequisites
NodeJS installed.

## Installing
```
npm i -g jsht
```

## Getting Started

**1 - Create new template:**
<br />
<sub>Template file will be created at **current dir/.jshtTemplates/create/class.js**</sup>
<br/>

```
jsht -n create class
```
**2 - Edit new template**
<br />
**<sub>current dir/.jshtTemplates/create/class.js</sub>**
```js
<#
    //any NodeJS here
    var className = "HelloWorld";
#>

class <#=className#>{

}
```
**3 - Execute template**
```
jsht create class
```
Will generate
```js


class HelloWorld{

}
```

## Examples
**Create new template file**
```
jsht -n create class
```
New template file will be created at **current dir/.jshtTemplates/create/class.js**.


**Execute template file**
```
jsht create class
```
Execute template file: **current dir/.jshtTemplates/create/class.js**.


**Hello World**
```js
<#
    //any NodeJS here
    var className = "HelloWorld";
#>

class <#=className#>{

}
```
Will generate
```js


class HelloWorld{

}
```


**Print text**
```js
print text: <#
    printText("printed text");
#>

short form: <#="printed text"#>
```
Will generate
```js
print text: printed text

short form: printed text
```


**IF**
```js
<#if(5 > 6){#>
    var biggerVar;
<#}else{#>
    var smallerVar;
<#}#>
```
Will generate
```js

var smallerVar;

```


**FOR**
```js
<#for(var i = 0; i < 10; i++){#>
   let var<#=i#>;
<#}#>
```
Will generate
```js

   let var0;

   let var1;

   let var2;

   let var3;

   let var4;

   let var5;

   let var6;

   let var7;

   let var8;

   let var9;
```


**Location variables**
```js
Outputfile: <#=outputFile#>
Outputfile directory: <#=currentDir#>
Template name: <#=templateName#>
Template path: <#=templatePath#>
Template path directory: <#=templateDir#>
```
Will generate
```js
Outputfile: <YOUR_LOCATION>/class.js
Outputfile directory: <YOUR_LOCATION>
Template name: class
Template path: <YOUR_LOCATION>/.jshtTemplates/create/class.js
Template path directory: <YOUR_LOCATION>/.jshtTemplates/create
```


**Change output Name**
```js
<#
    outputFile = "myNewFile.js";
#>
```


**Change output location**
```js
<#
    outputFile = "../class.js";
#>
```


**not generating output location**
```js
<#
    outputFile = "";
#>
```
or
```js
<#
    outputFile = null;
#>
```


**Overwite file without asking**
-rf option overwrite existing files without asking.
Example
```
jsht create class -rf
```

**Output generated template in console**\
-outputTemplate \
Example
```
jsht create class -outputTemplate
```

**Output generated JS Code in console for debug**\
-outputJSCode \
Example
```
jsht create class -outputJSCode
```


**Create global template**
<br />
A global template can executed in any folder/path.
To creat global template instead local template add "-g" after "-n":
```
jsht -n -g create class
```
First jsht will look for the template at **"./.jshtTemplates"** folder, if not found it will look search in the global template path.

**Global template path**
<br />
Get
```
jsht config template location
```
Set
```
jsht config template location C:/Desenv/Templates
```


**Require Modules**
<br />
Install your modules at **".jshtTemplates"** folder, to see where **".jshtTemplates"** is, execute command **"jsht config template location"**.
<br />
Any module installed at your **".jshtTemplates"** folder will be accessible by require method in your template.


**Require Files**
<br />
A js file can be called using require, by the relative path of the template file.<br />
Example:
```
require("./folder/fileToBeCalled");
```

**Call Template from template**
```
callTemplate("./otherTemplate.js", [], []);
```
or through command:
```
execShell("jsht otherTemplate");
```
The second parameter is an array of input arguments. The third parameter is an arrays of named arguments.

**Build in functions**
- **execShell** - execute command in the system \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**params:** \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**command** - command to be executed \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**path** - optional, folder to execute the command, if not provided it will be executed on the current folder. \
**Example:**
```
execShell("ls");
execShell("cd ..");
```


**Input Args**
<br />
Aditional parameters will became arguments inside the template:
```
jsht create class MyClassName calculateAge
```

```js
class <#=inputArgs[0]#>{
     <#=inputArgs[1]#>(){

	 }
}
```

**Named Args**
<br />
Passing named parameters.
```
jsht create class -methodName calculateAge -className MyClassName
```

```js
class <#=namedArgs["className"]#>{
     <#=namedArgs["methodName"]#>(){
		 
	 }
}
```